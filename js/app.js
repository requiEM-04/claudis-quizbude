import { VERSION } from './config.js?v=0.5.2';
import {
  online, nameFehler, registrieren, anmelden, abmelden, sitzungHolen, profilLaden, profilSpeichern,
  bestenliste, letzteSpiele, sprintEintragen, sprintBestenliste, rangVon, spielerAnzahl, spieleVon, sb,
} from './server.js?v=0.5.2';
import { lobbyStart, lobbyAbo, lobbyStopp } from './lobby.js?v=0.5.2';
import { Raum, codeNeu, STANDARD } from './raum.js?v=0.5.2';
import { LAND, pruefe, flaggeUrl } from './abgleich.js?v=0.5.2';
import {
  KATEGORIEN, KATEGORIE_REIHE, RAUM_REIHE, SPIEL_NAME, kategorieVon, optionSchluessel, richtigeWahl, umrisseDa, umrisseLaden,
  sprintFrage, pruefeFrage, fragenVorladen, kanon,
} from './kategorien.js?v=0.5.2';
import { LAENDER } from './laender.js?v=0.5.2';
import { auswahlfeld } from './auswahlfeld.js?v=0.5.2';
import { KATEGORIE_SYMBOL } from './symbole.js?v=0.5.2';
import { snakeZeichnen, SCHLANGEN_FARBEN, SNAKE_DAUER } from './snake.js?v=0.5.2';
import { KURVEN_FARBEN } from './kurve.js?v=0.5.2';
import { konfetti } from './konfetti.js?v=0.5.2';

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
  falsch: ['Schon mal aus- und wieder eingeschaltet?', 'Nee, andere Baustelle.', 'Leider nein.', 'Das war nix.'],
  knapp: ['Fast! Tippfehler?', 'Ganz warm.', 'So gut wie. Nochmal genauer.'],
};

let ich = null;
let raum = null;
let sprint = null;
let neuErstellt = null;
let besteSpalte = 'siege';
let lobbyAus = null;

// ---------- Kleinkram ----------
let aktuellerScreen = null;
function zeige(name) {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 's-' + name; });
  if (aktuellerScreen !== name) { aktuellerScreen = name; scrollTo(0, 0); } // neue Seite beginnt oben
}

// kleine Effekte
function pulsen(el, klasse = 'puls') {
  el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse);
}
function plusEins(ziel, text = '+1') {
  const s = document.createElement('span');
  s.className = 'plus-eins'; s.textContent = text;
  ziel.append(s);
  setTimeout(() => s.remove(), 900);
}
function hochzaehlen(el, bis, vorlage = n => String(n), dauer = 650) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || bis <= 0) { el.textContent = vorlage(bis); return; }
  const start = performance.now();
  const schritt = jetzt => {
    const t = Math.min(1, (jetzt - start) / dauer);
    el.textContent = vorlage(Math.round(bis * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(schritt);
  };
  requestAnimationFrame(schritt);
}

// Größer oder kleiner: beide Flächen aufdecken, größeres Land mit ✓, eigene falsche Wahl mit ✗
function duellAufdecken(box, f, gewaehlt) {
  box.classList.add('aufgedeckt');
  box.querySelectorAll('button').forEach(b => {
    b.disabled = true;
    const gross = richtigeWahl(f, b.dataset.c);
    b.classList.toggle('gewinner', gross);
    if (gewaehlt != null && b.dataset.c === gewaehlt) b.classList.add(gross ? 'richtig' : 'falsch');
    const urteil = b.querySelector('.duell-urteil');
    if (urteil) urteil.textContent = gross ? '✓ größer' : gewaehlt === b.dataset.c ? '✗ kleiner' : 'kleiner';
  });
}
const groessererName = f => LAND[LAND[f.c].flaeche >= LAND[f.d].flaeche ? f.c : f.d].name;

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

// ---------- Navigation ----------
// Die Bude ist Ebene 0, die Reiter unten (Sprint, Lernen, Profil) und Räume Ebene 1,
// ein laufender Sprint Ebene 2 über seiner Auswahl. Jeder Eintrag merkt sich, woher er kam.
// Darum führt die Zurück-Taste (Browser oder Maus) genauso zurück wie „Raus".
const tiefe = () => history.state?.qbTiefe ?? 0;
const tiefeVon = ziel => (ziel === '#/' ? 0 : /^#\/sprint\/[a-z]+$/.test(ziel) ? 2 : 1);

function navigieren(ziel) {
  const jetzt = location.hash || '#/';
  if (ziel === jetzt) return;
  if (history.state?.vorher === ziel) { history.back(); return; } // popstate ruft dann route()
  if (ziel === '#/') {
    if (tiefe() > 0) { history.go(-tiefe()); return; }
    history.replaceState({ qbTiefe: 0 }, '', '#/');
  } else if (tiefeVon(ziel) > tiefe()) {
    history.pushState({ qbTiefe: tiefe() + 1, vorher: jetzt }, '', ziel);
  } else {
    history.replaceState({ ...history.state, qbTiefe: tiefe() }, '', ziel);
  }
  route();
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigieren(a.getAttribute('href'));
});

// Klasse nach dem Wackeln wieder weg: sonst wackelt das Feld erneut, sobald es nach dem Ausblenden wieder sichtbar wird
function wackeln(el) {
  el.classList.remove('wackeln'); void el.offsetWidth; el.classList.add('wackeln');
  el.addEventListener('animationend', () => el.classList.remove('wackeln'), { once: true });
}
const pause = ms => new Promise(r => setTimeout(r, ms));

// ---------- Anmelden ----------
let anmeldeModus = 'anmelden';
const auswahl = { avatar: zufall(AVATARE), farbe: zufall(FARBEN) };

// Avatar- und Farbwahl (beim Registrieren und im Profil)
function wahlBauen(avatarEl, farbEl, zustand) {
  avatarEl.innerHTML = AVATARE.map(a => `<button type="button" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join('');
  farbEl.innerHTML = FARBEN.map(f => `<button type="button" data-f="${f}" style="background:${f}" aria-label="Farbe ${f}"></button>`).join('');
  const markieren = () => {
    avatarEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === zustand.avatar));
    farbEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === zustand.farbe));
  };
  avatarEl.onclick = e => { const b = e.target.closest('button'); if (b) { zustand.avatar = b.dataset.a; markieren(); } };
  farbEl.onclick = e => { const b = e.target.closest('button'); if (b) { zustand.farbe = b.dataset.f; markieren(); } };
  markieren();
  return markieren;
}

function anmeldenAufbauen() {
  wahlBauen($('avatar-wahl'), $('farb-wahl'), auswahl);

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
      gast = false;
      try { localStorage.removeItem(GAST); } catch { /* egal */ }
      route(true);
    } catch (err) {
      fehler.textContent = err.message;
    } finally {
      knopf.disabled = false;
    }
  };

  $('gast-los').onclick = () => {
    gast = true;
    try { localStorage.setItem(GAST, '1'); } catch { /* egal */ }
    navigieren('#/sprint');
  };
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
}

async function profilHolen(user) {
  const p = await profilLaden(user.id);
  if (!p) throw new Error('Zu deinem Konto fehlt das Profil. Melde dich nochmal an.');
  ich = p;
  chipZeichnen();
  lobbyStart();
}

const AUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

// Als Gast: ohne Konto, nur Sprint und Lernen, Rekorde auf dem Gerät
const GAST = 'quizbude.gast';
let gast = (() => { try { return localStorage.getItem(GAST) === '1'; } catch { return false; } })();

function chipZeichnen() {
  const chip = $('profil-chip');
  $('dock').hidden = !ich && !gast;
  document.querySelector('.dock-link[data-nav=bude]').hidden = !ich;
  if (!ich) {
    chip.innerHTML = gast ? `<span class="dock-gast">${avatarHtml({ avatar: '👤', farbe: '#353B3F' })}Gast</span><a class="knopf zweit klein" href="#/">Anmelden</a>` : '';
    return;
  }
  const aufProfil = (location.hash || '#/') === '#/profil';
  chip.innerHTML = `<a class="dock-ich${aufProfil ? ' aktiv' : ''}" href="#/profil" title="Mein Profil">${avatarHtml(ich)}<span class="dock-name">${esc(ich.name)}</span></a><button class="dock-aus" id="abmelden" title="Abmelden" aria-label="Abmelden">${AUS_ICON}</button>`;
  $('abmelden').onclick = async () => {
    if (raum) { raum.verlassen(); raum = null; }
    lobbyStopp();
    await abmelden();
    ich = null; chipZeichnen();
    history.replaceState({ qbTiefe: 0 }, '', '#/');
    route(true);
  };
}

// ---------- Bude ----------
function budeZeigen() {
  zeige('bude');
  faecherFuellen();
  kachelnZeichnen();
  $('bude-claudi').textContent = zufall(SPRUCH.hallo).replace('{name}', ich.name);
  if (lobbyAus) lobbyAus();
  lobbyAus = lobbyAbo(raeumeZeichnen);
  bestenLaden();
  letzteLaden();
}

function raeumeZeichnen(raeume) {
  const liste = $('raum-liste');
  if (!raeume.length) {
    liste.innerHTML = '<li class="leer">Gerade ist kein Raum offen. Neue Räume sind erst geschlossen, der Gastgeber kann sie im Warteraum unter „Raum“ öffnen.</li>';
    return;
  }
  liste.innerHTML = raeume.map(r => `
    <li>
      <span class="code">${esc(r.code)}</span>
      <span class="info"><strong>Raum von ${esc(r.host)}</strong>
        <span>${esc(r.kategorie || 'Flaggen')}${r.auswahl ? ` (${esc(r.auswahl)})` : ''}, ${r.spieler === 1 ? '1 Person' : `${r.spieler} Leute`}, ${r.phase === 'warten' || r.phase === 'ende' ? 'wartet auf den Start' : 'spielt gerade'}</span></span>
      <a class="knopf haupt klein" href="#/raum/${esc(r.code)}">Rein da</a>
    </li>`).join('');
}

const SPALTE = {
  siege: n => `${n} ${n === 1 ? 'Sieg' : 'Siege'}`,
  punkte: n => `${n.toLocaleString('de-DE')} Pkt.`,
  sprint: n => `${n} richtig`,
};

async function bestenLaden() {
  const ol = $('besten-liste');
  try {
    const sprintModus = besteSpalte === 'sprint';
    document.querySelector('.besten-kategorie').hidden = !sprintModus;
    const daten = sprintModus ? await sprintBestenliste($('besten-kategorie').value) : await bestenliste(besteSpalte);
    ol.innerHTML = daten.length
      ? daten.map(p => `<li>${avatarHtml(p)}<a href="#/profil/${esc(p.id)}">${esc(p.name)}</a><span class="wert">${SPALTE[besteSpalte](sprintModus ? p.wert : p[besteSpalte])}</span></li>`).join('')
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
      const kat = s.kategorie === 'spiele' ? SPIEL_NAME[s.auswahl] || 'Spiele' : KATEGORIEN[s.kategorie]?.name;
      const wo = kat ? ` bei ${esc(kat)}` : '';
      const text = sp.length > 1
        ? `${esc(erster.avatar)} ${esc(erster.name)} gewinnt${wo} mit ${erster.pkt} Punkten gegen ${sp.length - 1 === 1 ? '1 andere Person' : `${sp.length - 1} andere`}`
        : `${esc(erster.avatar)} ${esc(erster.name)} hat${wo} allein ${erster.pkt} Punkte geholt`;
      const w = wann(s.am);
      return `<li>${text}, ${w}${w.endsWith('.') ? '' : '.'}</li>`;
    }).join('') : '<li>Noch kein Spiel. Das ändert sich gleich.</li>';
  } catch (e) {
    ul.innerHTML = `<li>${esc(e.message)}</li>`;
  }
}

function budeAufbauen() {
  $('raum-neu').onclick = () => raumAufmachen('gemischt');
  kachelnZeichnen();
  $('kachel-raster').onclick = e => {
    const b = e.target.closest('.kachel');
    if (b) raumAufmachen(b.dataset.k);
  };
  $('sprint-kacheln').onclick = e => {
    const b = e.target.closest('.kachel');
    if (b) navigieren('#/sprint/' + b.dataset.k);
  };
  $('beitreten-form').onsubmit = e => {
    e.preventDefault();
    const c = $('code-eingabe').value.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) { toast('Der Code hat 4 Buchstaben, zum Beispiel KXQB.'); return; }
    $('code-eingabe').value = '';
    navigieren('#/raum/' + c);
  };
  $('besten-kategorie').innerHTML = KATEGORIE_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
  bestenFeld = auswahlfeld($('besten-kategorie'), { symbol: v => KATEGORIE_SYMBOL[v] });
  $('besten-kategorie').onchange = () => bestenLaden();
  document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      besteSpalte = b.dataset.spalte;
      document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b); });
      bestenLaden();
    };
  });
}

function sprintRekord(k) {
  if (!ich) {
    try { return Number(localStorage.getItem('quizbude.sprint.gast.' + k) || 0); } catch { return 0; }
  }
  return ich.rekorde?.[k] ?? (k === 'flaggen' ? ich.sprint_rekord || 0 : 0);
}

function kachelnHtml(mitRekord) {
  return (mitRekord ? KATEGORIE_REIHE : RAUM_REIHE).map(k => {
    const rekord = mitRekord ? sprintRekord(k) : 0;
    return `
    <button class="kachel${mitRekord ? ' sprint-karte' : ''}" data-k="${k}">
      <span class="kachel-bild" aria-hidden="true">${kachelBild(k)}</span>
      <span class="kachel-name">${esc(KATEGORIEN[k].name).replace('Allgemeinwissen', 'Allgemein&shy;wissen')}</span>
      <span class="kachel-text">${esc(KATEGORIEN[k].text)}</span>
      ${mitRekord ? `<span class="sk-rekord${rekord ? '' : ' leer'}"><b>${rekord || '–'}</b><small>${rekord ? 'dein Rekord' : 'noch kein Rekord'}</small></span>` : ''}
    </button>`;
  }).join('');
}

function kachelnZeichnen() {
  $('kachel-raster').innerHTML = kachelnHtml(false);
}

function sprintWahlZeigen() {
  zeige('sprintwahl');
  $('sprint-kacheln').innerHTML = kachelnHtml(true);
}

function kachelBild(k) {
  const f = c => `<img src="${flaggeUrl(c)}" alt="">`;
  switch (k) {
    case 'flaggen': return `<span class="kb-faecher">${f('JP')}${f('BR')}${f('SE')}</span>`;
    case 'umrisse': return '<img class="kb-umriss" src="bilder/umriss-vorschau.svg" alt="">';
    case 'hauptstaedte': return '<span class="kb-text">Wien?</span>';
    case 'groesser': return `<span class="kb-duell">${f('CA')}<b>oder</b>${f('BR')}</span>`;
    case 'wissen': return '<span class="kb-text kb-gross">?</span>';
    case 'emoji': return '<span class="kb-emoji">🦁👑</span>';
    case 'spiele': return '<svg class="kb-snake" viewBox="0 0 92 60" aria-hidden="true"><path d="M8 48H40V20H70V30" fill="none" stroke="#CDB68C" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="66.5" cy="22" r="1.8" fill="#16191B"/><circle cx="73.5" cy="22" r="1.8" fill="#16191B"/><circle cx="70" cy="48" r="6" fill="#CF8E8E"/></svg>';
    default: return '<span class="kb-emoji">🎲</span>';
  }
}

function raumAufmachen(kategorie) {
  const code = codeNeu();
  const kat = KATEGORIEN[kategorie];
  neuErstellt = { code, einst: { ...STANDARD, kategorie, auswahl: kat.standard, zeit: kat.zeit, modus: kat.tippen ? 'tippen' : 'auswahl' } };
  navigieren('#/raum/' + code);
}

// ---------- Nachschlagen ----------
const REGIONEN = { alle: 'Alle', europa: 'Europa', afrika: 'Afrika', asien: 'Asien', amerika: 'Amerika', ozeanien: 'Ozeanien' };
let lernenArt = 'flaggen';
let lernenRegion = 'alle';
let UMRISSE_LERNEN = null;
// Im Hauptstadt-Quiz bewusst ausgelassen (gleichnamig oder umstritten), zum Nachlesen aber trotzdem da
const STADT_NACHLESEN = {
  BZ: 'Belmopan', DJ: 'Dschibuti', GT: 'Guatemala-Stadt', KW: 'Kuwait-Stadt', LU: 'Luxemburg', MX: 'Mexiko-Stadt',
  MC: 'Monaco', PA: 'Panama-Stadt', SM: 'San Marino', SG: 'Singapur', VA: 'Vatikanstadt',
  IL: 'Jerusalem (international umstritten)', PS: 'Ramallah (Regierungssitz, umstritten)',
};
const stadtVon = l => l.stadt || STADT_NACHLESEN[l.code] || '';

const umrissSvg = (code, klasse = '') => UMRISSE_LERNEN?.[code]
  ? `<svg class="${klasse}" viewBox="0 0 100 100" aria-hidden="true"><path d="${UMRISSE_LERNEN[code]}" fill-rule="evenodd"/></svg>` : '';

function lernenAufbauen() {
  $('lernen-region').innerHTML = Object.entries(REGIONEN).map(([k, n]) => `<button class="chip" data-r="${k}" aria-pressed="${k === 'alle'}">${n}</button>`).join('');
  $('lernen-region').onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    lernenRegion = b.dataset.r;
    document.querySelectorAll('#lernen-region .chip').forEach(x => x.setAttribute('aria-pressed', x === b));
    lernenZeichnen();
  };
  document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      lernenArt = b.dataset.art;
      document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b); });
      lernenZeigen();
    };
  });
  $('lernen-suche').oninput = () => lernenZeichnen();
  $('lernen-raster').onclick = e => { const b = e.target.closest('.lern-karte'); if (b) lernenDetail(b.dataset.c); };
  $('lernen-zu').onclick = () => $('lernen-detail').close();
  $('lernen-detail').onclick = e => { if (e.target === $('lernen-detail')) $('lernen-detail').close(); };
}

function lernenZeigen() {
  zeige('lernen');
  if (!UMRISSE_LERNEN) umrisseLaden().then(u => { UMRISSE_LERNEN = u; if (!$('s-lernen').hidden) lernenZeichnen(); });
  lernenZeichnen();
}

function lernenZeichnen() {
  const q = kanon($('lernen-suche').value);
  let liste = LAENDER.filter(l => lernenRegion === 'alle' || l.region === lernenRegion);
  if (lernenArt === 'umrisse') liste = liste.filter(l => l.umriss);
  if (q) liste = liste.filter(l => l.antworten.some(a => a.includes(q)) || (l.stadtAntworten || []).some(a => a.includes(q)) || kanon(stadtVon(l)).includes(q));
  $('lernen-anzahl').textContent = liste.length === 1 ? '1 Land' : `${liste.length} Länder`;
  $('lernen-raster').innerHTML = liste.length ? liste.map(l => `
    <li><button class="lern-karte" data-c="${l.code}">
      <span class="lern-bild">${lernenArt === 'umrisse' ? umrissSvg(l.code) : `<img src="${flaggeUrl(l.code)}" alt="" loading="lazy">`}</span>
      <span class="lern-name">${esc(l.name)}</span>
      ${stadtVon(l) ? `<span class="lern-stadt">${esc(stadtVon(l).replace(/ \(.*\)$/, ''))}</span>` : ''}
    </button></li>`).join('') : '<li class="leer">Nichts gefunden. Probier einen anderen Namen.</li>';
}

function lernenDetail(code) {
  const l = LAND[code];
  $('lernen-detail-inhalt').innerHTML = `
    <div class="detail-bilder"><img src="${flaggeUrl(code)}" alt="Flagge von ${esc(l.name)}">${umrissSvg(code)}</div>
    <h2>${esc(l.name)}</h2>
    <dl class="detail-daten">
      ${stadtVon(l) ? `<dt>Hauptstadt</dt><dd>${esc(stadtVon(l))}${l.stadtAuch ? `<span class="detail-auch">zählt auch: ${l.stadtAuch.map(esc).join(', ')}</span>` : ''}</dd>` : ''}
      <dt>Fläche</dt><dd>${l.flaeche.toLocaleString('de-DE')} km²</dd>
      <dt>Kontinent</dt><dd>${REGIONEN[l.region] || '–'}</dd>
      ${l.auch ? `<dt>Zählt auch</dt><dd>${l.auch.map(esc).join(', ')}</dd>` : ''}
    </dl>
    <p class="detail-fuss">Kleine Tippfehler zählen beim Raten trotzdem.</p>`;
  $('lernen-detail').showModal();
}

// ---------- Profil ----------
const profilWahl = { avatar: '', farbe: '' };
let profilMarkieren = null;
let profilAbruf = 0;

function datum(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}
const prozent = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function profilAufbauen() {
  profilMarkieren = wahlBauen($('profil-avatar-wahl'), $('profil-farb-wahl'), profilWahl);
  $('profil-bearbeiten').onclick = () => {
    profilWahl.avatar = ich.avatar; profilWahl.farbe = farbe(ich.farbe);
    profilMarkieren();
    $('profil-editor').hidden = false;
  };
  $('profil-abbrechen').onclick = () => { $('profil-editor').hidden = true; };
  $('profil-speichern').onclick = async () => {
    try {
      await profilSpeichern(ich.id, { avatar: profilWahl.avatar, farbe: profilWahl.farbe });
      ich = { ...ich, avatar: profilWahl.avatar, farbe: profilWahl.farbe };
      chipZeichnen();
      $('profil-editor').hidden = true;
      $('profil-avatar').outerHTML = avatarHtml(ich).replace('class="avatar"', 'class="avatar riesig" id="profil-avatar"');
      toast('Avatar gespeichert.');
    } catch (e) { toast(e.message); }
  };
}

async function profilZeigen(id) {
  zeige('profil');
  const eigenes = !id || id === ich.id;
  const abruf = ++profilAbruf;
  $('profil-editor').hidden = true;
  $('profil-bearbeiten').hidden = !eigenes;
  $('profil-werte').innerHTML = '';
  for (const el of ['profil-raenge', 'profil-rekorde', 'profil-kategorien', 'profil-spiele']) $(el).innerHTML = '<li class="leer">Wird geladen …</li>';
  let p;
  try { p = await profilLaden(eigenes ? ich.id : id); } catch (e) { toast(e.message); return; }
  if (abruf !== profilAbruf) return;
  if (!p) { $('profil-name').textContent = 'Profil nicht gefunden'; $('profil-seit').textContent = ''; return; }
  if (eigenes) { ich = { ...ich, ...p }; chipZeichnen(); }

  $('profil-avatar').outerHTML = avatarHtml(p).replace('class="avatar"', 'class="avatar riesig" id="profil-avatar"');
  $('profil-name').textContent = p.name;
  $('profil-seit').textContent = `Dabei seit ${datum(p.erstellt)}, zuletzt aktiv ${wann(p.zuletzt)}`;

  const schnitt = p.spiele ? Math.round(p.punkte / p.spiele) : 0;
  const werte = [
    ['Spiele', p.spiele], ['Siege', p.siege, true], ['Siegquote', `${prozent(p.siege, p.spiele)}<small>%</small>`], ['Punkte', p.punkte.toLocaleString('de-DE')],
    ['Ø Punkte pro Spiel', schnitt], ['Richtige Antworten', p.richtig],
    ['Bester Sprint', Math.max(0, p.sprint_rekord || 0, ...Object.values(p.rekorde || {})), true], ['Sprints gespielt', p.sprints],
  ];
  $('profil-werte').innerHTML = werte.map(([dt, dd, hervor]) => `<div${hervor ? ' class="hervor"' : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`).join('');

  try {
    const [rSiege, rPunkte, alle, spiele] = await Promise.all([
      rangVon('siege', p.siege), rangVon('punkte', p.punkte), spielerAnzahl(), spieleVon(p.name),
    ]);
    if (abruf !== profilAbruf) return;
    const rang = (r, leer) => r ? `<span class="${r === 1 ? 'platz-1' : ''}">Platz ${r}</span> <span class="neben">von ${alle}</span>` : `<span class="neben">${leer}</span>`;
    $('profil-raenge').innerHTML = [
      ['Siege', rang(rSiege, 'noch kein Sieg')], ['Punkte', rang(rPunkte, 'noch keine Punkte')],
    ].map(([n, w]) => `<li><span>${n}</span><span>${w}</span></li>`).join('');
    const rekorde = { ...(p.sprint_rekord ? { flaggen: p.sprint_rekord } : {}), ...(p.rekorde || {}) };
    const mitRekord = KATEGORIE_REIHE.filter(k => rekorde[k] > 0);
    $('profil-rekorde').innerHTML = mitRekord.length
      ? mitRekord.map(k => `<li><span>${esc(KATEGORIEN[k].name)}</span><span><b>${rekorde[k]}</b> <span class="neben">richtig in 60 s</span></span></li>`).join('')
      : '<li class="leer">Noch kein Sprint gespielt.</li>';

    // Spiele dieses Profils auswerten
    const meine = spiele.map(sp => {
      const liste = sp.spieler || [];
      const platz = liste.findIndex(x => x.name === p.name) + 1;
      return { ...sp, platz, von: liste.length, pkt: liste[platz - 1]?.pkt ?? 0 };
    }).filter(x => x.platz > 0);
    const proKat = new Map();
    for (const g of meine) {
      const k = g.kategorie || 'flaggen';
      const e = proKat.get(k) || { n: 0, siege: 0, pkt: 0 };
      e.n++; e.pkt += g.pkt; if (g.platz === 1 && g.von > 1) e.siege++;
      proKat.set(k, e);
    }
    const kats = [...proKat].sort((a, b) => b[1].n - a[1].n);
    $('profil-kategorien').innerHTML = kats.length ? kats.map(([k, e], i) => `
      <li><span>${esc(KATEGORIEN[k]?.name || k)}${i === 0 && kats.length > 1 ? ' <span class="neben">(am liebsten)</span>' : ''}</span>
        <span class="neben">${e.n} ${e.n === 1 ? 'Spiel' : 'Spiele'}, ${e.siege} ${e.siege === 1 ? 'Sieg' : 'Siege'}, Ø ${Math.round(e.pkt / e.n)} Punkte</span></li>`).join('')
      : '<li class="leer">Noch keine Raum-Spiele.</li>';
    $('profil-spiele').innerHTML = meine.length ? meine.slice(0, 10).map(g => `
      <li><span${g.platz === 1 && g.von > 1 ? ' class="platz-1"' : ''}>${g.von > 1 ? `Platz ${g.platz} von ${g.von}` : 'Allein gespielt'}</span>
        <span class="neben">${esc(KATEGORIEN[g.kategorie]?.name || 'Flaggen')}, ${g.pkt} Punkte, ${wann(g.am)}</span></li>`).join('')
      : '<li class="leer">Noch keine Raum-Spiele. Mach einen Raum auf!</li>';
  } catch (e) {
    $('profil-spiele').innerHTML = `<li class="leer">${esc(e.message)}</li>`;
  }
}

// ---------- Raum ----------
let gezeichnet = { idx: -2, phase: '' };
let einstFelder = [];
let bestenFeld = null;
let spielFokus = null;

async function raumBetreten(code) {
  if (raum && raum.code === code) { raumZeichnen(); return; }
  zeige('raum');
  gezeichnet = { idx: -2, phase: '' };
  $('chat-liste').innerHTML = '';
  $('spieler-liste').innerHTML = '';
  const alsHost = neuErstellt?.code === code;
  raum = new Raum(code, ich, () => raumZeichnen(), alsHost);
  raum.spielBild = r => { if (r === raum) spielZeichnen(r); };
  if (alsHost) raum.einst = neuErstellt.einst;
  neuErstellt = null;
  raumZeichnen();
  try {
    await raum.betreten(alsHost);
  } catch (e) {
    toast(e.message);
    navigieren('#/');
  }
}

function raumAufbauen() {
  $('einst-kategorie').innerHTML = RAUM_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
  einstFelder = [...document.querySelectorAll('#einst select')]
    .map(sel => auswahlfeld(sel, sel.dataset.e === 'kategorie' ? { symbol: v => KATEGORIE_SYMBOL[v] } : {}));
  document.querySelectorAll('#einst select').forEach(s => {
    s.onchange = () => {
      if (!raum) return;
      if (s.dataset.e === 'kategorie') {
        const kat = KATEGORIEN[s.value];
        raum.einstellen({ kategorie: s.value, auswahl: kat.standard, zeit: kat.zeit, modus: kat.tippen ? 'tippen' : 'auswahl' });
        return;
      }
      const wert = ['runden', 'zeit'].includes(s.dataset.e) ? Number(s.value) : s.value;
      raum.einstellen({ [s.dataset.e]: wert });
    };
  });
  $('los').onclick = () => raum?.starten();
  $('nochmal').onclick = () => raum?.nochmal();
  $('andere-kategorie').onclick = () => raum?.zurueckInDenWarteraum();
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
    const f = raum.frage;
    const r = raum.waehlen(b.dataset.c);
    const rm = $('rueckmeldung');
    if (r !== 'zu' && f?.k === 'groesser') {
      duellAufdecken($('optionen'), f, b.dataset.c);
      rm.className = 'rueckmeldung ' + (r === 'richtig' ? 'gut' : 'schlecht');
      rm.textContent = `${r === 'richtig' ? 'Richtig' : 'Falsch'}, ${groessererName(f)} ist größer.`;
      return;
    }
    if (r === 'richtig') { b.classList.add('richtig'); rm.className = 'rueckmeldung gut'; rm.textContent = zufall(SPRUCH.richtig); }
    if (r === 'falsch') { b.classList.add('falsch'); rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); }
    if (r !== 'zu') document.querySelectorAll('#optionen button').forEach(x => { x.disabled = true; });
  };
  $('chat-form').onsubmit = e => {
    e.preventDefault();
    if (!raum) return;
    const r = raum.chatten($('chat-eingabe').value);
    if (r === 'hass') { toast('Nicht gesendet. So etwas gibt es hier nicht.'); return; }
    if (r === 'grob') { toast('Nicht gesendet. Der Chat ist eingeschränkt.'); return; }
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
  $('raum-runde').textContent = r.phase === 'frage' || r.phase === 'aufloesung' ? `Frage ${r.idx + 1} von ${n}`
    : r.phase === 'ende' ? 'Fertig' : r.phase === 'countdown' ? 'Gleich geht\'s los' : r.phase === 'spiel' ? (SPIEL_NAME[r.einst.auswahl] || 'Spiel') : 'Warteraum';

  const spielfeld = r.istSpiel && (r.phase === 'countdown' || r.phase === 'spiel');
  const sichtbar = spielfeld ? 'p-spiel' : { warten: 'p-warten', countdown: 'p-countdown', frage: 'p-frage', aufloesung: 'p-frage', ende: 'p-ende' }[r.phase];
  for (const id of ['p-warten', 'p-countdown', 'p-frage', 'p-spiel', 'p-ende']) $(id).hidden = id !== sichtbar;
  const istKurve = r.istSpiel && r.einst.auswahl === 'kurve';
  $('zeitleiste').hidden = !(r.phase === 'frage' || r.phase === 'aufloesung' || (r.phase === 'spiel' && !istKurve));
  $('spiel-hilfe').textContent = istKurve
    ? 'Lenken mit ← → oder A D, am Handy links oder rechts aufs Feld drücken und halten. Durch die Lücken in den Linien kommt man durch. Grüne Kreise helfen dir, rote treffen die anderen, sandfarbene alle.'
    : 'Lenken mit den Pfeiltasten oder W A S D, am Handy durch Wischen. Fahr nicht in die Wand oder in eine Schlange, rote Punkte machen dich länger.';
  if (spielfeld && istKurve) {
    if (spielFokus !== r.spielId) { spielFokus = r.spielId; document.activeElement?.blur?.(); }
    kurveSchleifeStarten();
  }
  if (spielfeld && !istKurve) {
    if (spielFokus !== r.spielId) { spielFokus = r.spielId; document.activeElement?.blur?.(); } // Pfeiltasten sollen lenken, nicht im Chat landen
    spielZeichnen(r);
  }

  const hostName = r.spieler.get(r.hostId)?.name || r.bekannt.get(r.hostId)?.name;

  if (r.phase === 'warten') {
    const kat = KATEGORIEN[r.einst.kategorie] || KATEGORIEN.flaggen;
    const auswahlHtml = Object.entries(kat.auswahlen).map(([k, name]) => {
      const anzahl = kat.pool ? kat.pool(k).length : 0;
      return `<option value="${k}">${esc(name)}${anzahl ? ` (${anzahl})` : ''}</option>`;
    }).join('');
    if ($('einst-auswahl').dataset.fuer !== r.einst.kategorie) { $('einst-auswahl').innerHTML = auswahlHtml; $('einst-auswahl').dataset.fuer = r.einst.kategorie; }
    document.querySelectorAll('#einst select').forEach(s => { s.value = String(r.einst[s.dataset.e] ?? STANDARD[s.dataset.e] ?? ''); s.disabled = !r.binHost; });
    if (!kat.tippen) { $('einst-modus').value = 'auswahl'; $('einst-modus').disabled = true; }
    // Bei Spielen gibt es keine Fragen: Antworten, Runden und Zeit ausblenden
    for (const e of ['modus', 'runden', 'zeit']) document.querySelector(`#einst [data-e=${e}]`).closest('label').hidden = !!kat.spiel;
    $('einst-auswahl-titel').textContent = kat.spiel ? 'Spiel' : 'Auswahl';
    einstFelder.forEach(f => f.aktualisieren());
    $('los').hidden = !r.binHost;
    const genug = r.startBereit;
    $('los').disabled = !genug;
    const wieviele = r.spieler.size === 1 ? 'bist nur du' : `seid ihr ${r.spieler.size}`;
    const [min, max] = r.spielerSpanne;
    $('los-hinweis').textContent = genug ? '' : kat.spiel
      ? `${SPIEL_NAME[r.einst.auswahl] || 'Das Spiel'} spielt ihr ${min === max ? `genau zu ${min === 2 ? 'zweit' : min}` : `mit ${min} bis ${max} Leuten`}. Gerade ${wieviele} im Raum.`
      : r.binHost
        ? 'Starten geht ab 2 Leuten. Klick oben auf den Code und schick den Link rum.'
        : 'Es geht los, sobald genug Leute da sind.';
    $('warten-text').textContent = !r.hostId ? 'Verbinde mit dem Raum …'
      : r.binHost ? 'Stell ein und leg los, sobald alle da sind. Klick auf den Code oben, dann ist der Einladungslink kopiert.'
        : `${hostName || 'Der Gastgeber'} stellt ein und startet gleich.`;
  }

  if (r.phase === 'frage' || r.phase === 'aufloesung') {
    const f = r.frage;
    const kat = kategorieVon(f);
    const eingabe = $('rate-eingabe');
    if (gezeichnet.idx !== r.idx || gezeichnet.umriss !== umrisseDa()) {
      $('frage-hinweis').textContent = kat.hinweis(f);
      $('frage-bild').innerHTML = kat.bild(f);
      $('frage-bild').dataset.art = f.k;
      gezeichnet.umriss = umrisseDa();
    }
    if (gezeichnet.idx !== r.idx) {
      eingabe.value = ''; eingabe.disabled = false; eingabe.classList.remove('richtig');
      eingabe.placeholder = f.k === 'hauptstaedte' ? 'Welche Stadt?' : 'Welches Land?';
      $('rueckmeldung').textContent = ''; $('rueckmeldung').className = 'rueckmeldung';
      $('frage-info').innerHTML = '';
      $('optionen').className = 'optionen' + (kat.optionKlasse ? ' ' + kat.optionKlasse : '');
      $('optionen').innerHTML = f.o ? optionSchluessel(f).map(k => `<button type="button" data-c="${esc(k)}">${kat.option(k, f)}</button>`).join('') : '';
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
      $('aufgeloest').textContent = kat.loesung(f);
      $('frage-info').innerHTML = (kat.nachher ? kat.nachher(f) : '') + esc(kat.info ? kat.info(f) : '');
      if (f.k === 'groesser') duellAufdecken($('optionen'), f, null);
      else document.querySelectorAll('#optionen button').forEach(b => {
        b.disabled = true;
        if (richtigeWahl(f, b.dataset.c)) b.classList.add('richtig');
      });
      const finder = [...r.geloest].sort((a, b) => a[1].rang - b[1].rang)
        .map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} (+${g.pkt})`);
      $('rueckmeldung').className = 'rueckmeldung';
      $('rueckmeldung').textContent = finder.length ? `Gefunden: ${finder.join(', ')}` : 'Keiner hatte es.';
      gezeichnet.phase = 'aufloesung-' + r.idx;
    }
    if (r.phase === 'frage') $('aufgeloest').textContent = '';
    $('rate-form').hidden = !!f.o || r.phase === 'aufloesung';
    gezeichnet.idx = r.idx;
  } else {
    gezeichnet.idx = -2;
  }

  if (r.phase === 'ende') {
    const liste = r.ergebnis || [];
    $('ende-titel').textContent = !r.istSpiel ? 'Endstand' : r.unentschieden ? 'Unentschieden' : `${liste[0]?.name || '?'} gewinnt`;
    if (gezeichnet.ende !== r.spielId) {
      gezeichnet.ende = r.spielId;
      $('podest').innerHTML = liste.map((e, i) => `<li style="--i:${i}"${e.id === r.ich.id ? ' class="ich"' : ''}><span class="platz">${i + 1}.</span>${avatarHtml(e)}<span class="podest-name">${i === 0 && !r.unentschieden ? '<span class="krone" aria-hidden="true">👑</span>' : ''}${esc(e.name)}</span><span class="wert" data-pkt="${e.pkt}">0</span></li>`).join('');
      $('podest').querySelectorAll('.wert').forEach((w, i) => setTimeout(() => hochzaehlen(w, Number(w.dataset.pkt)), 250 + i * 140));
      // Konfetti je nach eigenem Platz (bei mehreren Leuten)
      const platz = liste.findIndex(e => e.id === r.ich.id);
      if (liste.length >= 2 && platz >= 0 && platz <= 2 && !(r.unentschieden && platz === 0) && (liste[platz].pkt > 0)) setTimeout(() => konfetti(3 - platz), 350);
    }
    $('nochmal').hidden = !r.binHost;
    $('andere-kategorie').hidden = !r.binHost;
    $('ende-text').textContent = r.binHost
      ? (r.spieler.size < 2 ? 'Du bist gerade allein im Raum. Nochmal bringt dich in den Warteraum.' : '')
      : `${hostName || 'Der Gastgeber'} entscheidet, wie es weitergeht: nochmal oder andere Kategorie.`;
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
    : m.daneben
      ? `<li class="daneben"><span class="daneben-x" aria-label="falsch">✗</span><b>${esc(m.name)}</b> <span class="daneben-text">${esc(m.text)}</span></li>`
      : `<li><b>${esc(m.avatar || '')} ${esc(m.name)}:</b> ${esc(m.text)}</li>`).join('');
  if (unten) cl.scrollTop = cl.scrollHeight;
}

// ---------- Spielfeld ----------
function spielZeichnen(r) {
  if (!r.snake) return;
  snakeZeichnen($('spiel-feld'), r.snake, r.ich.id);
  $('spiel-info').innerHTML = r.snake.schlangen.map((s, i) => {
    const wer = r.bekannt.get(s.id);
    return `<span class="wer${s.lebt ? '' : ' raus'}" style="--f:${SCHLANGEN_FARBEN[i]}"><span class="punkt"></span>${esc(wer?.name || '?')}${s.id === r.ich.id ? ' (du)' : ''} <small>${s.pkt} gefressen</small></span>`;
  }).join('');
  if (r.phase === 'spiel') {
    const sek = Math.ceil(r.snakeRest / 1000);
    $('raum-runde').textContent = `${SPIEL_NAME[r.einst.auswahl] || 'Spiel'} · ${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')}`;
    const fl = $('zeitleiste-fuellung');
    fl.style.transition = 'none'; fl.style.width = `${(r.snakeRest / SNAKE_DAUER) * 100}%`;
  }
}

// ---------- Kurvenkampf zeichnen ----------
const FARBNAME = ['sandfarbene', 'grüne', 'rosa', 'blaue', 'lila', 'orange'];
let kurveLaeuft = false;
let kurveInfo = '';
function kurveSchleifeStarten() {
  if (kurveLaeuft) return;
  kurveLaeuft = true;
  const schritt = () => {
    const r = raum;
    if (!r || !r.kurvenBild || !(r.phase === 'spiel' || r.phase === 'countdown') || $('s-raum').hidden) { kurveLaeuft = false; return; }
    const ids = r.kurveIds || [];
    const name = id => r.bekannt.get(id)?.name || '?';
    r.kurvenBild.zeichnen($('spiel-feld'), name, ids.indexOf(r.ich.id));
    const lage = r.kurvenBild.lage;
    const info = ids.map((id, i) => `<span class="wer" style="--f:${KURVEN_FARBEN[i]}"><span class="punkt"></span>${esc(name(id))}${id === r.ich.id ? ' (du)' : ''} <small>${lage?.punkte?.[i] ?? 0}</small></span>`).join('')
      + (lage ? `<span class="wer"><small>Ziel ${lage.ziel}</small></span>` : '');
    if (info !== kurveInfo) { kurveInfo = info; $('spiel-info').innerHTML = info; }
    if (lage && r.phase === 'spiel') $('raum-runde').textContent = `Kurvenkampf · Runde ${lage.runde}`;
    requestAnimationFrame(schritt);
  };
  requestAnimationFrame(schritt);
}

// Kurvenkampf lenken: Taste gedrückt halten
const kurveTasten = { l: false, r: false };
function kurveTaste(e, unten) {
  if (!raum || !raum.istSpiel || raum.einst.auswahl !== 'kurve' || (raum.phase !== 'spiel' && raum.phase !== 'countdown') || $('s-raum').hidden) return;
  if (e.target?.id === 'chat-eingabe' || e.altKey || e.ctrlKey || e.metaKey) return;
  const taste = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const seite = taste === 'ArrowLeft' || taste === 'a' ? 'l' : taste === 'ArrowRight' || taste === 'd' ? 'r' : null;
  if (!seite) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (kurveTasten[seite] === unten) return; // gehaltene Taste wiederholt sich, nur Änderungen schicken
  kurveTasten[seite] = unten;
  raum.kurveLenken(kurveTasten.l, kurveTasten.r);
}
document.addEventListener('keydown', e => kurveTaste(e, true), true);
document.addEventListener('keyup', e => kurveTaste(e, false), true);
window.addEventListener('blur', () => { if (kurveTasten.l || kurveTasten.r) { kurveTasten.l = kurveTasten.r = false; raum?.kurveLenken(false, false); } });

// Handy: linke oder rechte Hälfte des Feldes drücken und halten
{
  const feld = () => $('spiel-feld');
  const halten = new Map();
  const melden = () => { const s = [...halten.values()]; raum?.kurveLenken(s.includes('l'), s.includes('r')); };
  document.addEventListener('pointerdown', e => {
    if (e.target !== feld() || raum?.einst.auswahl !== 'kurve') return;
    const box = feld().getBoundingClientRect();
    halten.set(e.pointerId, e.clientX - box.left < box.width / 2 ? 'l' : 'r'); melden();
  });
  const los = e => { if (halten.delete(e.pointerId)) melden(); };
  document.addEventListener('pointerup', los); document.addEventListener('pointercancel', los);
}

// Wischen auf dem Spielfeld (Handy, Snake)
{
  let start = null;
  const feld = () => $('spiel-feld');
  document.addEventListener('pointerdown', e => { if (e.target === feld()) start = [e.clientX, e.clientY]; });
  document.addEventListener('pointerup', e => {
    if (!start || !raum || raum.einst.auswahl === 'kurve') { start = null; return; }
    const dx = e.clientX - start[0], dy = e.clientY - start[1];
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    raum.lenken(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'u' : 'o'));
  });
}

// ---------- Neue Version: von selbst neu laden, aber nur in einem ruhigen Moment ----------
// Ruhig heißt: kein Sprint und kein laufendes Spiel, nichts halb Getipptes, kein offenes Fenster.
// Vorher merken wir uns, wo man war (Adresse, Raum, Chat, Filter, Scrollstand).
let neueVersion = null;
const ZURUECK = 'quizbude.zurueck';
const VERSUCH = 'quizbude.update';

async function versionPruefen() {
  if (!neueVersion) {
    try {
      const antwort = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (antwort.ok) {
        const { version } = await antwort.json();
        if (version && version !== VERSION) neueVersion = version;
      }
    } catch { /* offline, dann eben beim nächsten Mal */ }
  }
  updateWennRuhig();
}

function ruhigGenug() {
  if (sprint) return false;
  if (raum && raum.phase !== 'warten') return false;
  if ($('lernen-detail').open || !$('profil-editor').hidden) return false;
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value.trim() && a.id !== 'lernen-suche') return false;
  if (!$('s-anmelden').hidden && [...document.querySelectorAll('#anmelde-form input')].some(i => i.value)) return false;
  return true;
}

function zustandMerken() {
  raum?.merken();
  try {
    sessionStorage.setItem(ZURUECK, JSON.stringify({
      scroll: Math.round(scrollY), hash: location.hash || '#/',
      lernen: { art: lernenArt, region: lernenRegion, suche: $('lernen-suche').value },
      besten: { spalte: besteSpalte, kategorie: $('besten-kategorie').value },
    }));
  } catch { /* egal */ }
}

function updateWennRuhig() {
  if (!neueVersion || !ruhigGenug()) return;
  let versuch = null;
  try { versuch = JSON.parse(sessionStorage.getItem(VERSUCH) || 'null'); } catch { /* egal */ }
  const zahl = versuch?.ziel === neueVersion ? versuch.zahl : 0;
  if (zahl >= 2) return; // zweimal versucht und immer noch alt: lieber in Ruhe lassen als ständig neu laden
  try { sessionStorage.setItem(VERSUCH, JSON.stringify({ ziel: neueVersion, zahl: zahl + 1 })); } catch { /* egal */ }
  zustandMerken();
  neueVersion = null;
  toast('Neue Version da, lade kurz neu …');
  setTimeout(() => {
    if (zahl === 0) { location.reload(); return; }
    // Beim zweiten Versuch am Zwischenspeicher vorbei
    const u = new URL(location.href); u.searchParams.set('neu', versuch.ziel);
    location.replace(u.toString());
  }, 700);
}

function zustandWiederherstellen() {
  const u = new URL(location.href);
  if (u.searchParams.has('neu')) { u.searchParams.delete('neu'); history.replaceState(history.state, '', u.toString()); }
  let z = null;
  try { z = JSON.parse(sessionStorage.getItem(ZURUECK) || 'null'); sessionStorage.removeItem(ZURUECK); } catch { /* egal */ }
  if (!z) return;
  if (z.lernen) {
    lernenArt = z.lernen.art === 'umrisse' ? 'umrisse' : 'flaggen';
    lernenRegion = z.lernen.region in REGIONEN ? z.lernen.region : 'alle';
    $('lernen-suche').value = z.lernen.suche || '';
    document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x.dataset.art === lernenArt); x.setAttribute('aria-selected', x.dataset.art === lernenArt); });
    document.querySelectorAll('#lernen-region .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.r === lernenRegion));
  }
  if (z.besten) {
    besteSpalte = ['siege', 'punkte', 'sprint'].includes(z.besten.spalte) ? z.besten.spalte : 'siege';
    document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x.dataset.spalte === besteSpalte); x.setAttribute('aria-selected', x.dataset.spalte === besteSpalte); });
    if (z.besten.kategorie && KATEGORIEN[z.besten.kategorie]) { $('besten-kategorie').value = z.besten.kategorie; bestenFeld?.aktualisieren(); }
  }
  if (z.hash === (location.hash || '#/') && z.scroll) setTimeout(() => scrollTo(0, z.scroll), 400);
}

window.addEventListener('pagehide', () => zustandMerken());
document.addEventListener('visibilitychange', () => { if (!document.hidden) versionPruefen(); });
setInterval(versionPruefen, 60000);
setInterval(updateWennRuhig, 3000); // falls die neue Version schon bekannt ist und es gerade ruhig wird

// Countdown und knapp werdende Zeit
setInterval(() => {
  if (raum && raum.phase === 'countdown') {
    const z = String(Math.max(1, Math.ceil((raum.countdownEnde - performance.now()) / 1000)));
    if ($('countdown').textContent !== z) { $('countdown').textContent = z; pulsen($('countdown')); }
  }
  // Während gespielt wird, verschwindet die Leiste unten (verdeckt sonst auf kleinen Bildschirmen die Antworten)
  const spielt = (sprint && !$('s-sprint').hidden && (sprint.laeuft || !sprint.ende))
    || (raum && !$('s-raum').hidden && ['countdown', 'frage', 'aufloesung', 'spiel'].includes(raum.phase));
  document.body.classList.toggle('spielt', !!spielt);
  const spielCountdown = raum && raum.istSpiel && raum.phase === 'countdown';
  $('spiel-countdown').hidden = !spielCountdown;
  if (spielCountdown) {
    const zahl = Math.max(1, Math.ceil((raum.countdownEnde - performance.now()) / 1000));
    let text;
    if (raum.einst.auswahl === 'kurve') {
      const i = (raum.kurveIds || []).indexOf(raum.ich.id);
      text = i >= 0 ? `Du bist die <b style="color:${KURVEN_FARBEN[i]}">${FARBNAME[i]}</b> Linie.` : 'Du schaust zu.';
    } else {
      const i = raum.snake?.schlangen.findIndex(s => s.id === raum.ich.id) ?? -1;
      text = i === 0 ? 'Du bist die sandfarbene Schlange links.' : i === 1 ? 'Du bist die grüne Schlange rechts.' : 'Du schaust zu.';
    }
    const neu = `<span>${zahl}<small>${text}</small></span>`;
    if ($('spiel-countdown').innerHTML !== neu) { $('spiel-countdown').innerHTML = neu; pulsen($('spiel-countdown').firstElementChild); }
  }
  if (raum && raum.phase === 'frage') {
    const rest = raum.dauer - (performance.now() - raum.start);
    $('zeitleiste-fuellung').classList.toggle('knapp', rest < raum.dauer * 0.3);
  }
  if (sprint && sprint.laeuft) sprintTick();
}, 100);

// ---------- Sprint (allein, jede Kategorie) ----------
const SPRINT_MS = 60000;
const SPRINT_STRAFE = 2000;  // Überspringen
const SPRINT_FALSCH = 5000;  // falsch geklickt (nur bei Auswahl-Fragen)
const SPRINT_COUNTDOWN = 2;  // Sekunden vor der ersten Frage

async function sprintStart(kategorie = 'flaggen') {
  if (!KATEGORIEN[kategorie]) kategorie = 'flaggen';
  zeige('sprint');
  const s = { kategorie, punkte: 0, ende: 0, benutzt: new Set(), verpasst: [], laeuft: false, vorrat: [], frage: null };
  sprint = s;
  $('sp-laeuft').hidden = false; $('sp-ende').hidden = true;
  $('sprint-punkte').textContent = '0';
  $('sprint-zeit').textContent = '60 s';
  $('sprint-leiste').style.width = '100%';
  $('sprint-rueck').textContent = ''; $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-optionen').innerHTML = '';
  $('sprint-form').hidden = true; $('sprint-skip').hidden = true;
  $('sprint-eingabe').classList.remove('wackeln', 'richtig');
  $('sprint-hinweis').textContent = `${KATEGORIEN[kategorie].name}: gleich geht's los`;
  $('sprint-bild').innerHTML = `<p class="countdown" id="sprint-countdown">${SPRINT_COUNTDOWN}</p>`;
  // Während des Countdowns schon Umrisse und die ersten Bilder laden
  const laden = kategorie === 'umrisse' || kategorie === 'gemischt' ? umrisseLaden() : Promise.resolve();
  laden.then(() => { if (sprint === s) while (s.vorrat.length < 2) sprintZiehen(); });
  for (let i = SPRINT_COUNTDOWN; i >= 1; i--) {
    if (sprint !== s) return;
    $('sprint-countdown').textContent = i;
    pulsen($('sprint-countdown'));
    await pause(1000);
  }
  await laden;
  if (sprint !== s) return;
  $('sprint-skip').hidden = false;
  s.ende = performance.now() + SPRINT_MS;
  s.laeuft = true;
  sprintNaechste();
}

function sprintZiehen() {
  const s = sprint;
  const f = sprintFrage(s.kategorie, s.punkte + s.vorrat.length, s.benutzt);
  fragenVorladen([f]); // Bilder schon mal laden, damit es ohne Warten weitergeht
  s.vorrat.push(f);
}

function sprintNaechste() {
  const s = sprint;
  while (s.vorrat.length < 2) sprintZiehen();
  const f = s.vorrat.shift();
  sprintZiehen();
  s.frage = f;
  s.versucht = false;
  const kat = kategorieVon(f);
  $('sprint-hinweis').textContent = kat.hinweis(f);
  $('sprint-bild').innerHTML = kat.bild(f); // jedes Mal neue Elemente, nie ein altes Bild
  const eingabe = $('sprint-eingabe');
  $('sprint-form').hidden = !!f.o;
  $('sprint-optionen').className = 'optionen' + (kat.optionKlasse ? ' ' + kat.optionKlasse : '');
  $('sprint-optionen').innerHTML = f.o ? optionSchluessel(f).map(k => `<button type="button" data-c="${esc(k)}">${kat.option(k, f)}</button>`).join('') : '';
  eingabe.value = '';
  eingabe.placeholder = f.k === 'hauptstaedte' ? 'Welche Stadt?' : 'Welches Land?';
  if (!f.o) setTimeout(() => eingabe.focus(), 20);
}

function punktePop() {
  $('sprint-punkte').textContent = sprint.punkte;
  pulsen($('sprint-punkte').parentElement, 'pop');
  plusEins($('sprint-punkte').parentElement);
}

function sprintTreffer() {
  sprint.punkte++;
  punktePop();
  $('sprint-rueck').className = 'rueckmeldung gut'; $('sprint-rueck').textContent = zufall(SPRUCH.richtig);
  sprintNaechste();
}

function sprintTick() {
  const rest = Math.max(0, sprint.ende - (sprint.pauseSeit || performance.now())); // während einer Auflösung steht die Uhr
  $('sprint-zeit').textContent = `${Math.ceil(rest / 1000)} s`;
  const fl = $('sprint-leiste');
  fl.style.width = `${(rest / SPRINT_MS) * 100}%`;
  fl.classList.toggle('knapp', rest < 10000);
  if (rest <= 0) sprintEnde();
}

async function sprintEnde() {
  const s = sprint;
  s.laeuft = false;
  // Die Frage beim Abpfiff zählt nur als ausgelassen, wenn man schon etwas versucht oder eingetippt hatte
  if (s.frage && !s.verpasst.includes(s.frage) && (s.versucht || (!s.frage.o && $('sprint-eingabe').value.trim()))) s.verpasst.push(s.frage);
  const kat = KATEGORIEN[s.kategorie];
  $('sp-laeuft').hidden = true; $('sp-ende').hidden = false;
  hochzaehlen($('sprint-ergebnis'), s.punkte, n => `${n} richtig in 60 Sekunden`);
  $('sprint-verpasst').innerHTML = s.verpasst.map(f => `<li>${kategorieVon(f).kurz(f)}</li>`).join('');
  $('sprint-verpasst-titel').hidden = !s.verpasst.length;
  const rekordText = $('sprint-rekord');
  rekordText.textContent = kat.name;
  const alt = sprintRekord(s.kategorie);
  if (ich && online()) {
    const neu = await sprintEintragen(s.punkte, s.kategorie);
    if (typeof neu === 'number') ich.rekorde = { ...(ich.rekorde || {}), [s.kategorie]: neu };
  } else if (s.punkte > alt) {
    try { localStorage.setItem('quizbude.sprint.gast.' + s.kategorie, s.punkte); } catch { /* egal */ }
  }
  if (sprint !== s) return;
  rekordText.textContent = `${kat.name}: ` + (s.punkte > alt ? (alt ? `Neuer Rekord! Vorher waren es ${alt}.` : 'Dein erster Rekord steht.') : `Dein Rekord: ${alt}.`);
  rekordText.classList.toggle('rekord-neu', s.punkte > alt && s.punkte > 0);
  if (s.punkte > alt && s.punkte > 0) setTimeout(() => konfetti(alt ? 3 : 2), 300);
}

function sprintAufbauen() {
  $('sprint-form').onsubmit = e => {
    e.preventDefault();
    if (!sprint?.laeuft || !sprint.frage || sprint.frage.o) return;
    const eingabe = $('sprint-eingabe');
    const r = pruefeFrage(sprint.frage, eingabe.value);
    const rm = $('sprint-rueck');
    if (r === 'richtig') sprintTreffer();
    else if (r === 'knapp') { rm.className = 'rueckmeldung'; rm.textContent = zufall(SPRUCH.knapp); wackeln(eingabe); }
    else if (r === 'falsch') { sprint.versucht = true; rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); wackeln(eingabe); eingabe.select(); }
  };
  $('sprint-optionen').onclick = e => {
    const b = e.target.closest('button');
    const s = sprint;
    if (!b || !s?.laeuft || !s.frage?.o || b.disabled || s.pauseSeit) return;
    const f = s.frage;
    if (f.k === 'groesser') {
      // Auflösung zeigen, die Uhr steht so lange
      const ok = richtigeWahl(f, b.dataset.c);
      s.pauseSeit = performance.now();
      duellAufdecken($('sprint-optionen'), f, b.dataset.c);
      const rm = $('sprint-rueck');
      if (ok) { s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = `Richtig, ${groessererName(f)} ist größer.`; }
      else { s.ende -= SPRINT_FALSCH; s.verpasst.push(f); rm.className = 'rueckmeldung schlecht'; rm.textContent = `Falsch, ${groessererName(f)} ist größer. Minus 5 Sekunden.`; }
      setTimeout(() => {
        if (sprint !== s || !s.laeuft) return;
        s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
        if (s.frage === f) sprintNaechste();
      }, ok ? 1300 : 1900);
      return;
    }
    if (richtigeWahl(f, b.dataset.c)) { sprintTreffer(); return; }
    // falsch: richtige Antwort kurz zeigen, Zeit abziehen, weiter
    s.ende -= SPRINT_FALSCH;
    s.verpasst.push(f);
    document.querySelectorAll('#sprint-optionen button').forEach(x => {
      x.disabled = true;
      if (richtigeWahl(f, x.dataset.c)) x.classList.add('richtig');
    });
    b.classList.add('falsch');
    $('sprint-rueck').className = 'rueckmeldung schlecht'; $('sprint-rueck').textContent = `${zufall(SPRUCH.falsch)} Minus 5 Sekunden.`;
    setTimeout(() => { if (sprint === s && s.laeuft && s.frage === f) sprintNaechste(); }, 800);
  };
  $('sprint-skip').onclick = () => sprintUeberspringen();
  $('sprint-nochmal').onclick = () => sprintStart(sprint?.kategorie);
}

function sprintUeberspringen() {
  const s = sprint;
  if (!s?.laeuft || !s.frage || s.pauseSeit) return;
  s.verpasst.push(s.frage);
  s.ende -= SPRINT_STRAFE;
  $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-rueck').textContent = `Das war ${kategorieVon(s.frage).loesung(s.frage)}.`;
  sprintNaechste();
}

// Tastenkürzel: Pfeil rechts oder Alt+D = überspringen, 1–4 = Antwort wählen
// Snake lenken: Pfeiltasten oder WASD (nicht, solange man im Chat tippt)
const LENKTASTE = { ArrowUp: 'o', ArrowDown: 'u', ArrowLeft: 'l', ArrowRight: 'r', w: 'o', s: 'u', a: 'l', d: 'r' };
document.addEventListener('keydown', e => {
  if (!raum || !raum.istSpiel || raum.einst.auswahl !== 'snake' || (raum.phase !== 'spiel' && raum.phase !== 'countdown') || $('s-raum').hidden) return;
  if (e.target?.id === 'chat-eingabe' || e.altKey || e.ctrlKey || e.metaKey) return;
  const r = LENKTASTE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!r) return;
  e.preventDefault();
  raum.lenken(r);
}, true);

document.addEventListener('keydown', e => {
  const imSprint = sprint?.laeuft && !$('s-sprint').hidden;
  const imRaum = raum && raum.phase === 'frage' && !$('s-raum').hidden;
  if (!imSprint && !imRaum) return;
  const ziel = e.target;
  const tippt = ziel instanceof HTMLInputElement || ziel instanceof HTMLTextAreaElement;
  if (imSprint) {
    if (e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); sprintUeberspringen(); return; }
    if (e.key === 'ArrowRight' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      const amEnde = !tippt || ziel.id !== 'sprint-eingabe' || (ziel.selectionStart === ziel.value.length && ziel.selectionEnd === ziel.value.length);
      if (amEnde) { e.preventDefault(); sprintUeberspringen(); }
      return;
    }
  }
  if (/^[1-4]$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey && !(tippt && ziel.id === 'chat-eingabe')) {
    const knoepfe = [...document.querySelectorAll(imSprint ? '#sprint-optionen button' : '#optionen button')];
    const k = knoepfe[Number(e.key) - 1];
    if (k && !k.disabled) { e.preventDefault(); k.click(); }
  }
});

// ---------- Weiche ----------
let geroutet = null;

function route(erzwingen = false) {
  const h = location.hash || '#/';
  if (!erzwingen && h === geroutet) return; // popstate und hashchange kommen oft beide
  geroutet = h;
  const nav = h === '#/lernen' ? 'lernen' : h.startsWith('#/sprint') ? 'sprint' : h.startsWith('#/raum/') || h.startsWith('#/profil') ? '' : 'bude';
  document.querySelectorAll('.dock-link').forEach(a => a.classList.toggle('aktiv', a.dataset.nav === nav));
  if (raum && h !== '#/raum/' + raum.code) { raum.verlassen(); raum = null; }
  if (sprint && !/^#\/sprint\/[a-z]+$/.test(h)) { sprint.laeuft = false; sprint = null; }
  if (h !== '#/' && lobbyAus) { lobbyAus(); lobbyAus = null; }
  if (!$('s-lernen').hidden && h !== '#/lernen' && $('lernen-detail').open) $('lernen-detail').close();
  chipZeichnen();
  if (h === '#/lernen') return lernenZeigen();
  if (h === '#/sprint') return sprintWahlZeigen();
  const sm = h.match(/^#\/sprint\/([a-z]+)$/);
  if (sm) return sprintStart(sm[1]);
  if (!ich) return anmeldenZeigen();
  chipZeichnen();
  const pm = h.match(/^#\/profil(?:\/([0-9a-f-]{36}))?$/);
  if (pm) return profilZeigen(pm[1]);
  const m = h.match(/^#\/raum\/([A-Za-z]{4})$/);
  if (m) {
    const code = m[1].toUpperCase();
    if (m[1] !== code) { history.replaceState(history.state, '', '#/raum/' + code); return route(true); }
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
  profilAufbauen();
  lernenAufbauen();
  zustandWiederherstellen();
  // Direktlink (z. B. Einladung in einen Raum): die Bude kommt darunter, damit „Zurück" dorthin führt
  const start = location.hash || '#/';
  if (history.state?.qbTiefe == null) {
    if (start !== '#/') { history.replaceState({ qbTiefe: 0 }, '', '#/'); history.pushState({ qbTiefe: 1, vorher: '#/' }, '', start); }
    else history.replaceState({ qbTiefe: 0 }, '', '#/');
  }
  window.addEventListener('popstate', () => route());
  window.addEventListener('hashchange', () => route());
  if (online()) {
    try {
      const user = await sitzungHolen();
      if (user) await profilHolen(user);
    } catch (e) {
      console.warn('[Quizbude] Sitzung nicht wiederhergestellt', e);
    }
    sb.auth.onAuthStateChange(ereignis => {
      if (ereignis === 'SIGNED_OUT' && ich) { ich = null; chipZeichnen(); route(true); }
    });
  }
  route(true);
  setTimeout(versionPruefen, 4000);
}

// Für die Fehlersuche in der Konsole: quizbude.raum
window.quizbude = { get raum() { return raum; }, get sprint() { return sprint; }, versionPruefen };

los();
