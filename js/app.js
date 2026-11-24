import { VERSION } from './config.js?v=0.2.0';
import {
  online, nameFehler, registrieren, anmelden, abmelden, sitzungHolen, profilLaden,
  bestenliste, letzteSpiele, sprintEintragen, sb,
} from './server.js?v=0.2.0';
import { lobbyStart, lobbyAbo, lobbyStopp } from './lobby.js?v=0.2.0';
import { Raum, codeNeu } from './raum.js?v=0.2.0';
import { LAND, AUSWAHL, pruefe, flaggeUrl } from './abgleich.js?v=0.2.0';
import { LAENDER } from './laender.js?v=0.2.0';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zufall = a => a[Math.floor(Math.random() * a.length)];

const AVATARE = ['🦊', '🐸', '🐼', '🦉', '🐙', '🦖', '🐝', '🐧', '🐢', '🦁', '🐨', '🐳', '🦜', '🍕', '☕', '🥨', '🔧', '🚧'];
const FARBEN = ['#CDB68C', '#8FB3A2', '#9AAFC7', '#C79A9A', '#B3A3C9', '#C8A68A'];

const SPRUCH = {
  hallo: [
    'Hey {name}, Kaffee steht, Flaggen auch.',
    '{name}, Pause ist Quizzeit.',
    'Na {name}, wer holt sich heute die Krone?',
    '{name}, kurz abschalten. Hirn bleibt an.',
    'Schön, dass du da bist, {name}. Die Flaggen hängen schon.',
  ],
  richtig: ['Ticket geschlossen.', 'Sauber!', 'Zack, drin.', 'Läuft bei dir.', 'Schneller als jeder Neustart.', 'Das sitzt.'],
  falsch: ['Schon mal aus- und wieder eingeschaltet?', 'Nee, andere Baustelle.', 'Leider nein.', 'Knapp vorbei ist auch daneben.'],
  knapp: ['Fast! Tippfehler?', 'Ganz warm.', 'So gut wie. Nochmal genauer.'],
};

let ich = null;
let raum = null;
let sprint = null;
let neuErstellt = null;
let besteSpalte = 'siege';
let lobbyAus = null;

// ---------- Kleinkram ----------
function zeige(name) {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 's-' + name; });
}

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function farbe(f) { return /^#[0-9a-fA-F]{6}$/.test(f || '') ? f : FARBEN[0]; }
function avatarHtml(p) {
  return `<span class="avatar" style="background:${farbe(p?.farbe)}">${esc(p?.avatar || '🙂')}</span>`;
}

function wann(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.round(min / 60);
  if (std < 24) return `vor ${std} Std.`;
  const tage = Math.round(std / 24);
  return tage === 1 ? 'gestern' : `vor ${tage} Tagen`;
}

function wackeln(el) {
  el.classList.remove('wackeln'); void el.offsetWidth; el.classList.add('wackeln');
}

// ---------- Anmelden ----------
let anmeldeModus = 'anmelden';
const auswahl = { avatar: zufall(AVATARE), farbe: zufall(FARBEN) };

function anmeldenAufbauen() {
  $('avatar-wahl').innerHTML = AVATARE.map(a => `<button type="button" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join('');
  $('farb-wahl').innerHTML = FARBEN.map(f => `<button type="button" data-f="${f}" style="background:${f}" aria-label="Farbe ${f}"></button>`).join('');
  const markieren = () => {
    document.querySelectorAll('#avatar-wahl button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === auswahl.avatar));
    document.querySelectorAll('#farb-wahl button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === auswahl.farbe));
  };
  $('avatar-wahl').onclick = e => { const b = e.target.closest('button'); if (b) { auswahl.avatar = b.dataset.a; markieren(); } };
  $('farb-wahl').onclick = e => { const b = e.target.closest('button'); if (b) { auswahl.farbe = b.dataset.f; markieren(); } };
  markieren();

  document.querySelectorAll('#s-anmelden .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      anmeldeModus = b.dataset.modus;
      document.querySelectorAll('#s-anmelden .umschalter-knopf').forEach(x => {
        x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b);
      });
      const neu = anmeldeModus === 'neu';
      document.querySelector('.nur-neu').hidden = !neu;
      $('anmelde-knopf').textContent = neu ? 'Konto anlegen' : 'Anmelden';
      document.querySelector('#anmelde-form [name=passwort]').autocomplete = neu ? 'new-password' : 'current-password';
      $('anmelden-claudi').textContent = neu ? 'Such dir einen Avatar aus. Ein Passwort ab 4 Zeichen reicht.' : 'Claudi hat die Flaggen schon aufgehängt.';
      $('anmelde-fehler').textContent = '';
    };
  });

  $('anmelde-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const passwort = f.passwort.value;
    const fehler = $('anmelde-fehler');
    fehler.textContent = '';
    const nf = nameFehler(name);
    if (nf) { fehler.textContent = nf; return; }
    if (passwort.length < 4) { fehler.textContent = 'Das Passwort braucht mindestens 4 Zeichen.'; return; }
    const knopf = $('anmelde-knopf');
    knopf.disabled = true;
    try {
      const user = anmeldeModus === 'neu'
        ? await registrieren(name, passwort, auswahl.avatar, auswahl.farbe)
        : await anmelden(name, passwort);
      await profilHolen(user);
      f.passwort.value = '';
      route();
    } catch (err) {
      fehler.textContent = err.message;
    } finally {
      knopf.disabled = false;
    }
  };

  $('gast-sprint').onclick = () => { location.hash = '#/sprint'; };
}

// Drei Flaggen als Fächer, bei jedem Besuch andere
function faecherFuellen() {
  const pool = LAENDER.filter(l => l.bekannt);
  const drei = [];
  while (drei.length < 3) { const c = zufall(pool).code; if (!drei.includes(c)) drei.push(c); }
  const lage = [{ x: '-34%', y: '6%', dreh: '-11deg' }, { x: '0%', y: '-6%', dreh: '2deg' }, { x: '34%', y: '8%', dreh: '13deg' }];
  document.querySelectorAll('[data-faecher]').forEach(f => {
    if (f.closest('.screen')?.hidden) return;
    f.innerHTML = drei.map((c, i) => `<img src="${flaggeUrl(c)}" alt="" style="--i:${i};--x:${lage[i].x};--y:${lage[i].y};--dreh:${lage[i].dreh}">`).join('');
  });
}

function anmeldenZeigen() {
  zeige('anmelden');
  faecherFuellen();
  const ohneServer = !online();
  $('anmelde-form').hidden = ohneServer;
  document.querySelector('#s-anmelden .umschalter').hidden = ohneServer;
  $('offline-hinweis').hidden = !ohneServer;
  $('gast-sprint').hidden = !ohneServer;
}

async function profilHolen(user) {
  const p = await profilLaden(user.id);
  if (!p) throw new Error('Zu deinem Konto fehlt das Profil. Melde dich nochmal an.');
  ich = p;
  chipZeichnen();
  lobbyStart();
}

const AUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

function chipZeichnen() {
  const chip = $('profil-chip');
  $('dock').hidden = !ich;
  if (!ich) { chip.innerHTML = ''; return; }
  chip.innerHTML = `${avatarHtml(ich)}<span class="dock-name">${esc(ich.name)}</span><button class="dock-aus" id="abmelden" title="Abmelden" aria-label="Abmelden">${AUS_ICON}</button>`;
  $('abmelden').onclick = async () => {
    if (raum) { raum.verlassen(); raum = null; }
    lobbyStopp();
    await abmelden();
    ich = null; chipZeichnen();
    location.hash = '#/';
    route();
  };
}

// ---------- Bude ----------
function budeZeigen() {
  zeige('bude');
  faecherFuellen();
  $('bude-claudi').textContent = zufall(SPRUCH.hallo).replace('{name}', ich.name);
  if (lobbyAus) lobbyAus();
  lobbyAus = lobbyAbo(raeumeZeichnen);
  bestenLaden();
  letzteLaden();
}

function raeumeZeichnen(raeume) {
  const liste = $('raum-liste');
  if (!raeume.length) {
    liste.innerHTML = '<li class="leer">Gerade ist kein Raum offen. Mach einen auf, dann sehen ihn die anderen hier.</li>';
    return;
  }
  liste.innerHTML = raeume.map(r => `
    <li>
      <span class="code">${esc(r.code)}</span>
      <span class="info"><strong>Raum von ${esc(r.host)}</strong>
        <span>${r.spieler === 1 ? '1 Person' : `${r.spieler} Leute`}, ${esc(r.auswahl)}, ${r.phase === 'warten' || r.phase === 'ende' ? 'wartet auf den Start' : 'spielt gerade'}</span></span>
      <a class="knopf haupt klein" href="#/raum/${esc(r.code)}">Rein da</a>
    </li>`).join('');
}

const SPALTE = {
  siege: n => `${n} ${n === 1 ? 'Sieg' : 'Siege'}`,
  punkte: n => `${n.toLocaleString('de-DE')} Pkt.`,
  sprint_rekord: n => `${n} Flaggen`,
};

async function bestenLaden() {
  const ol = $('besten-liste');
  try {
    const daten = await bestenliste(besteSpalte);
    ol.innerHTML = daten.length
      ? daten.map(p => `<li>${avatarHtml(p)}<span>${esc(p.name)}</span><span class="wert">${SPALTE[besteSpalte](p[besteSpalte])}</span></li>`).join('')
      : '<li class="leer">Hier steht noch keiner. Spiel eine Runde, dann bist du der Erste.</li>';
  } catch (e) {
    ol.innerHTML = `<li class="leer">${esc(e.message)}</li>`;
  }
}

async function letzteLaden() {
  const ul = $('letzte-liste');
  try {
    const spiele = await letzteSpiele();
    ul.innerHTML = spiele.length ? spiele.map(s => {
      const sp = s.spieler || [];
      const erster = sp[0];
      if (!erster) return '';
      const text = sp.length > 1
        ? `${esc(erster.avatar)} ${esc(erster.name)} gewinnt mit ${erster.pkt} Punkten gegen ${sp.length - 1 === 1 ? '1 andere Person' : `${sp.length - 1} andere`}`
        : `${esc(erster.avatar)} ${esc(erster.name)} hat allein ${erster.pkt} Punkte geholt`;
      const w = wann(s.am);
      return `<li>${text}, ${w}${w.endsWith('.') ? '' : '.'}</li>`;
    }).join('') : '<li>Noch kein Spiel. Das ändert sich gleich.</li>';
  } catch (e) {
    ul.innerHTML = `<li>${esc(e.message)}</li>`;
  }
}

function budeAufbauen() {
  $('raum-neu').onclick = () => { const c = codeNeu(); neuErstellt = c; location.hash = '#/raum/' + c; };
  $('beitreten-form').onsubmit = e => {
    e.preventDefault();
    const c = $('code-eingabe').value.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) { toast('Der Code hat 4 Buchstaben, zum Beispiel KXQB.'); return; }
    $('code-eingabe').value = '';
    location.hash = '#/raum/' + c;
  };
  $('sprint-start').onclick = () => { location.hash = '#/sprint'; };
  document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      besteSpalte = b.dataset.spalte;
      document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b); });
      bestenLaden();
    };
  });
}

// ---------- Raum ----------
let gezeichnet = { idx: -2, phase: '' };

async function raumBetreten(code) {
  if (raum && raum.code === code) { raumZeichnen(); return; }
  zeige('raum');
  gezeichnet = { idx: -2, phase: '' };
  $('chat-liste').innerHTML = '';
  $('spieler-liste').innerHTML = '';
  const alsHost = neuErstellt === code;
  neuErstellt = null;
  raum = new Raum(code, ich, () => raumZeichnen());
  raumZeichnen();
  try {
    await raum.betreten(alsHost);
  } catch (e) {
    toast(e.message);
    location.hash = '#/';
  }
}

function raumAufbauen() {
  $('einst-auswahl').innerHTML = Object.entries(AUSWAHL)
    .map(([k, a]) => `<option value="${k}">${a.name} (${LAENDER.filter(a.filter).length})</option>`).join('');
  document.querySelectorAll('#einst select').forEach(s => {
    s.onchange = () => {
      const wert = ['runden', 'zeit'].includes(s.dataset.e) ? Number(s.value) : s.value;
      raum?.einstellen({ [s.dataset.e]: wert });
    };
  });
  $('los').onclick = () => raum?.starten();
  $('nochmal').onclick = () => raum?.nochmal();
  $('raum-code').onclick = async () => {
    const url = `${location.origin}${location.pathname}#/raum/${raum.code}`;
    try { await navigator.clipboard.writeText(url); toast('Einladungslink kopiert.'); } catch { toast(url); }
  };
  $('rate-form').onsubmit = e => {
    e.preventDefault();
    const eingabe = $('rate-eingabe');
    if (!raum || !eingabe.value.trim()) return;
    const r = raum.raten(eingabe.value);
    const rm = $('rueckmeldung');
    if (r === 'richtig') {
      eingabe.classList.add('richtig'); eingabe.disabled = true;
      rm.className = 'rueckmeldung gut'; rm.textContent = zufall(SPRUCH.richtig);
    } else if (r === 'knapp') {
      rm.className = 'rueckmeldung'; rm.textContent = zufall(SPRUCH.knapp); wackeln(eingabe);
    } else if (r === 'falsch') {
      rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); wackeln(eingabe); eingabe.select();
    }
  };
  $('optionen').onclick = e => {
    const b = e.target.closest('button');
    if (!b || !raum) return;
    const r = raum.waehlen(b.dataset.c);
    const rm = $('rueckmeldung');
    if (r === 'richtig') { b.classList.add('richtig'); rm.className = 'rueckmeldung gut'; rm.textContent = zufall(SPRUCH.richtig); }
    if (r === 'falsch') { b.classList.add('falsch'); rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); }
    if (r !== 'zu') document.querySelectorAll('#optionen button').forEach(x => { x.disabled = true; });
  };
  $('chat-form').onsubmit = e => {
    e.preventDefault();
    raum?.chatten($('chat-eingabe').value);
    $('chat-eingabe').value = '';
  };
}

function zeitleisteStarten(fuellung, restMs, gesamtMs) {
  fuellung.style.transition = 'none';
  fuellung.style.width = `${Math.max(0, restMs / gesamtMs) * 100}%`;
  fuellung.classList.remove('knapp');
  void fuellung.offsetWidth;
  fuellung.style.transition = `width ${restMs}ms linear`;
  fuellung.style.width = '0%';
}

function raumZeichnen() {
  if (!raum) return;
  const r = raum;
  $('raum-code').textContent = r.code;
  const n = r.fragen.length;
  $('raum-runde').textContent = r.phase === 'frage' || r.phase === 'aufloesung' ? `Flagge ${r.idx + 1} von ${n}`
    : r.phase === 'ende' ? 'Fertig' : r.phase === 'countdown' ? 'Gleich geht\'s los' : 'Warteraum';

  const sichtbar = { warten: 'p-warten', countdown: 'p-countdown', frage: 'p-frage', aufloesung: 'p-frage', ende: 'p-ende' }[r.phase];
  for (const id of ['p-warten', 'p-countdown', 'p-frage', 'p-ende']) $(id).hidden = id !== sichtbar;
  $('zeitleiste').hidden = !(r.phase === 'frage' || r.phase === 'aufloesung');

  const hostName = r.spieler.get(r.hostId)?.name || r.bekannt.get(r.hostId)?.name;

  if (r.phase === 'warten') {
    document.querySelectorAll('#einst select').forEach(s => { s.value = String(r.einst[s.dataset.e]); s.disabled = !r.binHost; });
    $('los').hidden = !r.binHost;
    $('warten-text').textContent = !r.hostId ? 'Verbinde mit dem Raum …'
      : r.binHost ? 'Stell ein und leg los, sobald alle da sind. Klick auf den Code oben, dann ist der Einladungslink kopiert.'
        : `${hostName || 'Der Gastgeber'} stellt ein und startet gleich.`;
  }

  if (r.phase === 'frage' || r.phase === 'aufloesung') {
    const f = r.frage;
    const eingabe = $('rate-eingabe');
    if (gezeichnet.idx !== r.idx) {
      $('flagge').src = flaggeUrl(f.c);
      eingabe.value = ''; eingabe.disabled = false; eingabe.classList.remove('richtig');
      $('rueckmeldung').textContent = ''; $('rueckmeldung').className = 'rueckmeldung';
      $('rate-form').hidden = r.einst.modus === 'auswahl';
      $('optionen').innerHTML = f.o ? f.o.map(c => `<button type="button" data-c="${c}">${esc(LAND[c].name)}</button>`).join('') : '';
      if (r.phase === 'frage') {
        zeitleisteStarten($('zeitleiste-fuellung'), Math.max(0, r.dauer - (performance.now() - r.start)), r.dauer);
        if (!f.o) setTimeout(() => eingabe.focus(), 30);
      }
    }
    if (r.meinStatus === 'geloest') {
      const mein = r.geloest.get(r.ich.id);
      eingabe.disabled = true; eingabe.classList.add('richtig');
      $('rueckmeldung').className = 'rueckmeldung gut';
      $('rueckmeldung').textContent = `Richtig! +${mein?.pkt ?? ''}${mein?.rang === 1 ? ', als Erstes' : ''}`;
    }
    if (r.phase === 'aufloesung' && gezeichnet.phase !== 'aufloesung-' + r.idx) {
      const fl = $('zeitleiste-fuellung');
      fl.style.transition = 'none'; fl.style.width = '0%';
      eingabe.disabled = true;
      $('aufgeloest').textContent = LAND[f.c].name;
      document.querySelectorAll('#optionen button').forEach(b => {
        b.disabled = true;
        if (b.dataset.c === f.c) b.classList.add('richtig');
      });
      const finder = [...r.geloest].sort((a, b) => a[1].rang - b[1].rang)
        .map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} (+${g.pkt})`);
      $('rueckmeldung').className = 'rueckmeldung';
      $('rueckmeldung').textContent = finder.length ? `Gefunden: ${finder.join(', ')}` : 'Keiner hatte es.';
      gezeichnet.phase = 'aufloesung-' + r.idx;
    }
    if (r.phase === 'frage') $('aufgeloest').textContent = '';
    $('rate-form').hidden = r.einst.modus === 'auswahl' || r.phase === 'aufloesung';
    gezeichnet.idx = r.idx;
  } else {
    gezeichnet.idx = -2;
  }

  if (r.phase === 'ende') {
    const liste = r.ergebnis || [];
    $('podest').innerHTML = liste.map((e, i) => `<li><span class="platz">${i + 1}.</span>${avatarHtml(e)}<span>${esc(e.name)}</span><span class="wert">${e.pkt}</span></li>`).join('');
    $('nochmal').hidden = !r.binHost;
    $('ende-text').textContent = r.binHost ? '' : `${hostName || 'Der Gastgeber'} kann eine neue Runde starten.`;
  }

  // Spielerliste
  const leute = [...r.spieler.values()].sort((a, b) => (r.punkte.get(b.id) || 0) - (r.punkte.get(a.id) || 0));
  $('spieler-liste').innerHTML = leute.map(p => {
    const status = r.phase === 'frage' || r.phase === 'aufloesung'
      ? (r.geloest.has(p.id) ? '<span class="status ok" title="Gefunden">✓</span>' : r.gesperrt.has(p.id) ? '<span class="status nein" title="Daneben">✗</span>' : '<span class="status"></span>')
      : '<span class="status"></span>';
    return `<li>${avatarHtml(p)}<span class="name">${esc(p.name)}${p.id === r.hostId ? '<span class="host">Gastgeber</span>' : ''}</span>${status}<span class="wert">${r.punkte.get(p.id) || 0}</span></li>`;
  }).join('');

  // Chat
  const cl = $('chat-liste');
  const unten = cl.scrollHeight - cl.scrollTop - cl.clientHeight < 40;
  cl.innerHTML = r.chat.map(m => m.system
    ? `<li class="system">${esc(m.text)}</li>`
    : `<li><b>${esc(m.avatar || '')} ${esc(m.name)}:</b> ${esc(m.text)}</li>`).join('');
  if (unten) cl.scrollTop = cl.scrollHeight;
}

// Countdown und knapp werdende Zeit
setInterval(() => {
  if (raum && raum.phase === 'countdown') {
    $('countdown').textContent = Math.max(1, Math.ceil((raum.countdownEnde - performance.now()) / 1000));
  }
  if (raum && raum.phase === 'frage') {
    const rest = raum.dauer - (performance.now() - raum.start);
    $('zeitleiste-fuellung').classList.toggle('knapp', rest < raum.dauer * 0.3);
  }
  if (sprint && sprint.laeuft) sprintTick();
}, 100);

// ---------- Flaggen-Sprint ----------
const SPRINT_MS = 60000;

function sprintStart() {
  zeige('sprint');
  sprint = { punkte: 0, ende: performance.now() + SPRINT_MS, benutzt: new Set(), verpasst: [], aktuell: null, laeuft: true };
  $('sp-laeuft').hidden = false; $('sp-ende').hidden = true;
  $('sprint-punkte').textContent = '0';
  $('sprint-rueck').textContent = '';
  sprintNaechste();
  setTimeout(() => $('sprint-eingabe').focus(), 30);
}

function sprintNaechste() {
  const s = sprint;
  // erst bekannte Flaggen, dann wird's gemischt, ab 16 Treffern kommt alles
  const nurBekannt = s.punkte < 8 || (s.punkte < 16 && Math.random() < 0.5);
  let pool = LAENDER.filter(l => !s.benutzt.has(l.code) && (!nurBekannt || l.bekannt));
  if (!pool.length) pool = LAENDER.filter(l => !s.benutzt.has(l.code));
  s.aktuell = zufall(pool).code;
  s.benutzt.add(s.aktuell);
  $('sprint-flagge').src = flaggeUrl(s.aktuell);
  $('sprint-eingabe').value = '';
}

function sprintTick() {
  const rest = Math.max(0, sprint.ende - performance.now());
  $('sprint-zeit').textContent = `${Math.ceil(rest / 1000)} s`;
  const fl = $('sprint-leiste');
  fl.style.width = `${(rest / SPRINT_MS) * 100}%`;
  fl.classList.toggle('knapp', rest < 10000);
  if (rest <= 0) sprintEnde();
}

async function sprintEnde() {
  const s = sprint;
  s.laeuft = false;
  if (s.aktuell) s.verpasst.push(s.aktuell);
  $('sp-laeuft').hidden = true; $('sp-ende').hidden = false;
  $('sprint-ergebnis').textContent = s.punkte === 1 ? '1 Flagge in 60 Sekunden' : `${s.punkte} Flaggen in 60 Sekunden`;
  $('sprint-verpasst').innerHTML = s.verpasst.map(c => `<li><img src="${flaggeUrl(c)}" alt=""><span>${esc(LAND[c].name)}</span></li>`).join('');
  $('sprint-verpasst-titel').hidden = !s.verpasst.length;
  const rekordText = $('sprint-rekord');
  rekordText.textContent = '';
  if (ich && online()) {
    const alt = ich.sprint_rekord || 0;
    const neu = await sprintEintragen(s.punkte);
    if (typeof neu === 'number') ich.sprint_rekord = neu;
    rekordText.textContent = s.punkte > alt ? (alt ? `Neuer Rekord! Vorher waren es ${alt}.` : 'Dein erster Rekord steht.') : `Dein Rekord: ${alt}.`;
  } else {
    let alt = 0;
    try { alt = Number(localStorage.getItem('quizbude.sprint.gast') || 0); } catch { /* egal */ }
    if (s.punkte > alt) { try { localStorage.setItem('quizbude.sprint.gast', s.punkte); } catch { /* egal */ } }
    rekordText.textContent = s.punkte > alt ? 'Neuer Rekord auf diesem Gerät.' : `Rekord auf diesem Gerät: ${alt}.`;
  }
}

function sprintAufbauen() {
  $('sprint-form').onsubmit = e => {
    e.preventDefault();
    if (!sprint?.laeuft) return;
    const eingabe = $('sprint-eingabe');
    const r = pruefe(eingabe.value, sprint.aktuell);
    const rm = $('sprint-rueck');
    if (r === 'richtig') {
      sprint.punkte++;
      $('sprint-punkte').textContent = sprint.punkte;
      rm.className = 'rueckmeldung gut'; rm.textContent = zufall(SPRUCH.richtig);
      sprintNaechste();
    } else if (r === 'knapp') {
      rm.className = 'rueckmeldung'; rm.textContent = zufall(SPRUCH.knapp); wackeln(eingabe);
    } else if (r === 'falsch') {
      rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); wackeln(eingabe); eingabe.select();
    }
  };
  $('sprint-skip').onclick = () => {
    if (!sprint?.laeuft) return;
    sprint.verpasst.push(sprint.aktuell);
    sprint.ende -= 2000;
    $('sprint-rueck').className = 'rueckmeldung';
    $('sprint-rueck').textContent = `Das war ${LAND[sprint.aktuell].name}.`;
    sprintNaechste();
    $('sprint-eingabe').focus();
  };
  $('sprint-nochmal').onclick = () => sprintStart();
}

// ---------- Weiche ----------
function route() {
  const h = location.hash || '#/';
  const nav = h === '#/sprint' ? 'sprint' : h.startsWith('#/raum/') ? '' : 'bude';
  document.querySelectorAll('.dock-link').forEach(a => a.classList.toggle('aktiv', a.dataset.nav === nav));
  if (raum && h !== '#/raum/' + raum.code) { raum.verlassen(); raum = null; }
  if (sprint && h !== '#/sprint') { sprint.laeuft = false; sprint = null; }
  if (h !== '#/' && lobbyAus) { lobbyAus(); lobbyAus = null; }
  if (h === '#/sprint') return sprintStart();
  if (!ich) return anmeldenZeigen();
  const m = h.match(/^#\/raum\/([A-Za-z]{4})$/);
  if (m) {
    const code = m[1].toUpperCase();
    if (m[1] !== code) { location.hash = '#/raum/' + code; return; }
    return raumBetreten(code);
  }
  return budeZeigen();
}

async function los() {
  $('version').textContent = VERSION;
  anmeldenAufbauen();
  budeAufbauen();
  raumAufbauen();
  sprintAufbauen();
  window.addEventListener('hashchange', route);
  if (online()) {
    try {
      const user = await sitzungHolen();
      if (user) await profilHolen(user);
    } catch (e) {
      console.warn('[Quizbude] Sitzung nicht wiederhergestellt', e);
    }
    sb.auth.onAuthStateChange(ereignis => {
      if (ereignis === 'SIGNED_OUT' && ich) { ich = null; chipZeichnen(); route(); }
    });
  }
  route();
}

// Für die Fehlersuche in der Konsole: quizbude.raum
window.quizbude = { get raum() { return raum; } };

los();
