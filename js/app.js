import { VERSION } from './config.js?v=0.9.4';
import {
  online, nameFehler, registrieren, anmelden, abmelden, sitzungHolen, profilLaden, profilSpeichern,
  bestenliste, spieleSeit, alleProfile, sprintEintragen, sprintBestenliste, rangVon, spielerAnzahl, spieleVon, sb,
  adminAnmelden, istAdminName, konfigLaden, adminEinrichten, einrichtungOffen,
} from './server.js?v=0.9.4';
import { lobbyStart, lobbyAbo, lobbyStopp } from './lobby.js?v=0.9.4';
import { Raum, codeNeu, STANDARD, TIPPFEHLER_ABZUG } from './raum.js?v=0.9.4';
import { LAND, pruefe, flaggeUrl } from './abgleich.js?v=0.9.4';
import {
  KATEGORIEN, KATEGORIE_REIHE, SPRINT_REIHE, kategorieVon, optionSchluessel, richtigeWahl, umrisseDa, umrisseLaden,
  sprintFrage, pruefeFrage, fragenVorladen, kanon,
} from './kategorien.js?v=0.9.4';
import { LAENDER } from './laender.js?v=0.9.4';
import { auswahlfeld } from './auswahlfeld.js?v=0.9.4';
import { KATEGORIE_SYMBOL } from './symbole.js?v=0.9.4';
import { konfetti } from './konfetti.js?v=0.9.4';
import { karteBauen, karteLaden, auswerten } from './weltkarte.js?v=0.9.4';
import {
  RAENGE, BILDER, ARTEN, JOKER, ruhmInfo, stufeVon, stufeInfo, wappen, effektHtml, rahmenDeko, stilVon, istFrei, freiAb, neuFrei,
  belohnungName, rangVonId, symbol, symbolSvg, SCHWELLEN,
} from './ruhm.js?v=0.9.4';

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
let besteSpalte = 'punkte';
let lobbyAus = null;

// ---------- Kleinkram ----------
let aktuellerScreen = null;
function zeige(name) {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 's-' + name; });
  if (name !== 'raum' && name !== 'sprint') document.body.classList.remove('kartenmodus');
  if (aktuellerScreen !== name) { aktuellerScreen = name; scrollTo(0, 0); } // neue Seite beginnt oben
  ruhmMiniZeichnen();
}

// Ruhm-Leiste oben in Bude, Sprint und Lernen: aktuelle Karte, Balken, was bis zur nächsten fehlt
function ruhmMiniZeichnen() {
  const el = $('ruhm-mini');
  if (!el) return;
  el.hidden = !ich;
  if (!ich) return;
  const info = ruhmInfo(ich.ruhm || 0), zahl = n => n.toLocaleString('de-DE');
  const rest = info.bis ? `noch ${zahl(info.fehlt)} bis ${stufeInfo(info.i + 1).name}` : 'ganz oben';
  el.style.setProperty('--rang', info.rang.farbe);
  el.style.setProperty('--anteil', info.anteil.toFixed(3));
  el.title = `${info.name}, ${zahl(info.ruhm)} Ruhm: ${rest}`;
  el.setAttribute('aria-label', `Ruhm: ${info.name}, ${rest}. Zum Profil`);
  // senkrechte Säule in der Leiste links, füllt sich von unten nach oben (am Handy: dünne Linie über der Leiste)
  el.innerHTML = `${wappen(info.ruhm, { groesse: 26, titel: false })}
    <span class="rm-saeule" aria-hidden="true"><i></i></span>
    <span class="rm-zahl">${zahl(info.ruhm)}</span>
    <span class="rm-rest">${rest}</span>`;
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

// ---------- Ruhm im Alltag: Namensfarbe, Titel, Wappen am Avatar, Hintergrund ----------
const hatRuhm = p => p && !p.gast && typeof p.ruhm === 'number';
const nameKlasse = p => { const f = hatRuhm(p) && stilVon(p).farbe; return f ? ` nf-${f}` : ''; };
const titelVon = p => { const t = hatRuhm(p) && stilVon(p).titel; return t ? { text: rangVonId(t).titel, rang: t } : null; };
const avatarMitWappen = (p, g = 15) => hatRuhm(p) ? `<span class="mit-wappen">${avatarHtml(p)}${wappen(p.ruhm, { groesse: g })}</span>` : avatarHtml(p);
function hintergrundSetzen() {
  const hg = ich ? stilVon(ich).hintergrund : '';
  if (hg) document.body.dataset.hg = hg; else delete document.body.dataset.hg;
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

// Interne Links ohne href: Chrome zeigt dann unten links keine Adresse an
function linksZaehmen(wurzel) {
  const liste = wurzel.matches?.('a[href^="#/"]') ? [wurzel] : wurzel.querySelectorAll?.('a[href^="#/"]') || [];
  for (const a of liste) {
    a.dataset.ziel = a.getAttribute('href');
    a.removeAttribute('href');
    a.setAttribute('role', 'link');
    if (!a.hasAttribute('tabindex')) a.tabIndex = 0;
  }
}
linksZaehmen(document.body);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) linksZaehmen(n); })
  .observe(document.body, { childList: true, subtree: true });

function linkFolgen(a) {
  // Klick aufs Logo: Seite frisch laden (außer mitten im Raum oder Sprint)
  if (a.classList.contains('dock-marke') && !raum && !sprint) {
    a.classList.add('dreht');
    setTimeout(() => { history.replaceState({ qbTiefe: 0 }, '', '#/'); location.reload(); }, 380);
    return;
  }
  navigieren(a.dataset.ziel);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-ziel]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  linkFolgen(a);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const a = e.target.closest?.('a[data-ziel]');
  if (a) { e.preventDefault(); linkFolgen(a); }
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

let adminPwErst = null; // erste Eingabe beim Festlegen des Admin-Passworts
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

  // Hinweis, wenn die Feststelltaste an ist
  const pw = $('anmelde-form').passwort;
  const feststell = e => { if (e.getModifierState) $('feststell-hinweis').hidden = !e.getModifierState('CapsLock'); };
  pw.addEventListener('keydown', feststell); pw.addEventListener('keyup', feststell);
  pw.addEventListener('blur', () => { $('feststell-hinweis').hidden = true; });
  $('anmelde-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const passwort = f.passwort.value;
    const fehler = $('anmelde-fehler');
    fehler.textContent = '';
    const neu = anmeldeModus === 'neu';
    const nf = nameFehler(name, neu);
    if (nf) { fehler.textContent = nf; return; }
    if (passwort.length < 4) { fehler.textContent = 'Das Passwort braucht mindestens 4 Zeichen.'; return; }
    const knopf = $('anmelde-knopf');
    knopf.disabled = true;
    // „admin“ führt in den Admin-Bereich, das normale Konto bleibt dabei angemeldet
    if (!neu && istAdminName(name)) {
      fehler.classList.remove('info');
      try {
        // Beim allerersten Mal legst du das Admin-Passwort selbst fest, zur Sicherheit zweimal eingeben
        if (einrichtungOffen(await konfigLaden())) {
          if (adminPwErst === null) {
            adminPwErst = passwort; f.passwort.value = ''; f.passwort.focus();
            fehler.classList.add('info');
            fehler.textContent = 'Du legst gerade dein Admin-Passwort fest. Gib es zur Bestätigung nochmal ein.';
            return;
          }
          if (adminPwErst !== passwort) {
            adminPwErst = null; f.passwort.value = '';
            throw new Error('Die beiden Eingaben waren nicht gleich. Gib das Passwort nochmal zweimal ein.');
          }
          await adminEinrichten(passwort);
          adminPwErst = null;
        }
        await adminAnmelden(passwort); f.passwort.value = ''; location.href = 'admin.html';
      }
      catch (err) { fehler.textContent = err.message; }
      finally { knopf.disabled = false; }
      return;
    }
    adminPwErst = null;
    try {
      if (neu && (await konfigLaden()).neue_konten?.an === false) throw new Error('Gerade können keine neuen Konten angelegt werden.');
      const user = anmeldeModus === 'neu'
        ? await registrieren(name, passwort, auswahl.avatar, auswahl.farbe)
        : await anmelden(name, passwort);
      await profilHolen(user);
      f.passwort.value = '';
      gast = false;
      try { localStorage.removeItem(GAST); } catch { /* egal */ }
      if (location.hash === '#/anmelden') history.replaceState({ qbTiefe: 0 }, '', '#/');
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
    lobbyStart();
    history.replaceState({ qbTiefe: 0 }, '', '#/');
    route(true);
  };
}

// Drei Flaggen als Fächer, bei jedem Besuch andere
function faecherFuellen() {
  const pool = LAENDER.filter(l => l.bekannt);
  const drei = [];
  while (drei.length < 3) { const c = zufall(pool).code; if (!drei.includes(c)) drei.push(c); }
  // Grundlage plus Auffächern beim Drüberfahren (--sx/--sy/--sdreh kommen obendrauf)
  const lage = [
    { x: '-34%', y: '6%', dreh: '-11deg', sx: '-24%', sy: '6%', sdreh: '-8deg' },
    { x: '0%', y: '-6%', dreh: '2deg', sx: '0%', sy: '-8%', sdreh: '0deg' },
    { x: '34%', y: '8%', dreh: '13deg', sx: '24%', sy: '6%', sdreh: '8deg' },
  ];
  document.querySelectorAll('[data-faecher]').forEach(f => {
    if (f.closest('.screen')?.hidden) return;
    f.innerHTML = drei.map((c, i) => { const l = lage[i]; return `<img src="${flaggeUrl(c)}" alt="" draggable="false" style="--i:${i};--x:${l.x};--y:${l.y};--dreh:${l.dreh};--sx:${l.sx};--sy:${l.sy};--sdreh:${l.sdreh}">`; }).join('');
    // Klick mischt neue Flaggen
    f.onclick = () => { f.classList.remove('neu'); faecherFuellen(); void f.offsetWidth; f.classList.add('neu'); };
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
  const gesperrt = p.gesperrt_bis && new Date(p.gesperrt_bis) > new Date();
  if (p.deaktiviert || gesperrt) {
    await abmelden();
    const bis = gesperrt && new Date(p.gesperrt_bis).getFullYear() < 9000
      ? ` bis ${new Date(p.gesperrt_bis).toLocaleString('de-DE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} Uhr` : '';
    const e = new Error(p.deaktiviert ? 'Dieses Konto ist deaktiviert.' : `Dein Konto ist gesperrt${bis || ' (ohne Enddatum)'}.${p.sperr_grund ? ' Grund: ' + p.sperr_grund : ''}`);
    e.sichtbar = true;
    throw e;
  }
  ich = p;
  chipZeichnen();
  lobbyStart();
  setTimeout(ruhmPruefen, 900);
}

const AUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

// Als Gast: ohne Konto, nur Sprint und Lernen, Rekorde auf dem Gerät
const GAST = 'quizbude.gast';
let gast = (() => { try { return localStorage.getItem(GAST) === '1'; } catch { return false; } })();

// Als Gast in Räumen: jeder Tab bekommt eine eigene Gast-Kennung und einen Namen wie „Gast 42“
function gastIch() {
  let g = null;
  try { g = JSON.parse(sessionStorage.getItem('quizbude.gastIch') || 'null'); } catch { /* egal */ }
  if (!g) {
    g = { id: 'gast-' + crypto.randomUUID(), name: 'Gast ' + (10 + Math.floor(Math.random() * 90)), avatar: '👤', farbe: '#6F777A', gast: true };
    try { sessionStorage.setItem('quizbude.gastIch', JSON.stringify(g)); } catch { /* egal */ }
  }
  return g;
}
const mitspieler = () => ich || gastIch();

function chipZeichnen() {
  hintergrundSetzen();
  ruhmMiniZeichnen();
  const chip = $('profil-chip');
  $('dock').hidden = !ich && !gast;
  if (!ich) {
    chip.innerHTML = gast ? `<span class="dock-gast">${avatarHtml({ avatar: '👤', farbe: '#353B3F' })}<span class="dock-name">${esc(gastIch().name)}</span></span><a class="knopf zweit klein" href="#/anmelden">Anmelden</a>` : '';
    return;
  }
  const aufProfil = (location.hash || '#/') === '#/profil';
  chip.innerHTML = `<a class="dock-ich${aufProfil ? ' aktiv' : ''}" href="#/profil" title="Mein Profil">${avatarHtml(ich)}<span class="dock-name${nameKlasse(ich)}">${esc(ich.name)}</span></a><button class="dock-aus" id="abmelden" title="Abmelden" aria-label="Abmelden">${AUS_ICON}</button>`;
  $('abmelden').onclick = async () => {
    if (raum) { raum.verlassen(); raum = null; }
    lobbyStopp();
    await abmelden();
    // nach dem Abmelden auf die Anmeldeseite, nicht als Gast weiter
    gast = false;
    try { localStorage.removeItem(GAST); } catch { /* egal */ }
    ich = null; chipZeichnen();
    history.replaceState({ qbTiefe: 0 }, '', '#/anmelden');
    route(true);
  };
}

// ---------- Bude ----------
function budeZeigen() {
  zeige('bude');
  faecherFuellen();
  kachelnZeichnen();
  $('bude-claudi').textContent = zufall(SPRUCH.hallo).replace('{name}', mitspieler().name);
  if (lobbyAus) lobbyAus();
  lobbyAus = lobbyAbo(raeumeZeichnen);
  bestenLaden();
}

function raeumeZeichnen(raeume) {
  const liste = $('raum-liste');
  if (!raeume.length) {
    liste.innerHTML = '<li class="leer">Gerade ist kein Raum offen. Mach einen auf, dann taucht er hier für alle auf.</li>';
    return;
  }
  liste.innerHTML = raeume.map(r => {
    const katKey = Object.keys(KATEGORIEN).find(k => KATEGORIEN[k].name === r.kategorie) || 'flaggen';
    const wartet = r.phase === 'warten' || r.phase === 'ende';
    return `
    <li class="raum-zeile">
      <span class="code">${esc(r.code)}</span>
      <span class="info">
        <strong>Raum von ${esc(r.host)}</strong>
        <span class="raum-kat"><span class="raum-symbol" aria-hidden="true">${KATEGORIE_SYMBOL[katKey] || ''}</span>${esc(r.kategorie || 'Flaggen')}${r.auswahl ? `, ${esc(r.auswahl)}` : ''}</span>
        <span class="raum-status${wartet ? ' wartet' : ''}">${r.spieler === 1 ? '1 Person' : `${r.spieler} Leute`}, ${wartet ? 'wartet auf den Start' : 'spielt gerade'}</span>
      </span>
      <a class="knopf haupt klein" href="#/raum/${esc(r.code)}">${wartet ? 'Rein da' : 'Zuschauen'}</a>
    </li>`;
  }).join('');
}

// Siegertreppchen: Plätze 1–3 auf Stufen (2 links, 1 Mitte, 3 rechts), ab Platz 4 eine ruhige Liste
const FUNKEN = [0, 60, 120, 180, 240, 300];
function treppeHtml(liste, ichId, mitKrone) {
  const DAUER = { 1: [700, 1050], 2: [420, 770], 3: [140, 490] }; // [Stufe, Kopf] in ms – erst Platz 3, dann 2, dann 1
  const oben = liste.slice(0, 3).map((e, i) => {
    const platz = i + 1, [ds, dk] = DAUER[platz];
    const krone = platz === 1 && mitKrone && e.pkt > 0;
    return `<div class="stufe s${platz}${e.id === ichId ? ' ich' : ''}" style="--ds:${ds}ms;--dk:${dk}ms">
      <div class="t-kopf">
        ${platz === 1 ? '<span class="t-strahlen" aria-hidden="true"></span>' : ''}
        ${krone ? `<span class="t-krone" aria-hidden="true">👑${FUNKEN.map(w => `<i class="funke" style="--w:${w}deg"></i>`).join('')}</span>` : ''}
        ${avatarHtml(e)}
        ${hatRuhm(e) ? `<span class="t-wappen">${wappen(e.ruhm, { groesse: platz === 1 ? 24 : 20 })}</span>` : ''}
      </div>
      <div class="t-name"><span class="${nameKlasse(e).trim()}">${esc(e.name)}</span>${e.id === ichId ? '<span class="du">du</span>' : ''}</div>
      ${titelVon(e) ? `<div class="t-titel titel-zeile nf-${titelVon(e).rang}">${esc(titelVon(e).text)}</div>` : ''}
      <div class="t-wert wert" data-pkt="${e.pkt}" data-ab="${dk + 250}">0</div>
      <div class="t-block"><span>${platz}</span></div>
    </div>`;
  }).join('');
  const rest = liste.slice(3).map((e, i) => `<li class="${e.id === ichId ? 'ich' : ''}" style="--i:${i}"><span class="platz">${i + 4}</span>${avatarMitWappen(e, 13)}<span class="podest-name"><span class="${nameKlasse(e).trim()}">${esc(e.name)}</span>${e.id === ichId ? '<span class="du">du</span>' : ''}</span><span class="wert" data-pkt="${e.pkt}" data-ab="${1300 + i * 120}">0</span></li>`).join('');
  return `<div class="treppe">${oben}</div>${rest ? `<ol class="rest">${rest}</ol>` : ''}`;
}

const SPALTE = {
  siege: n => [n, n === 1 ? 'Sieg' : 'Siege'],
  punkte: n => [n.toLocaleString('de-DE'), 'Pkt.'],
  sprint: n => [n, 'richtig'],
};
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ERSTE_SAISON = [2026, 10]; // November 2026 (Monat ab 0)

// Saisons von der ersten bis heute, neueste zuerst, dazu „Allzeit“
function saisonOptionen() {
  const jetzt = new Date(), aus = [];
  for (let j = jetzt.getFullYear(), m = jetzt.getMonth(); j > ERSTE_SAISON[0] || (j === ERSTE_SAISON[0] && m >= ERSTE_SAISON[1]); m--) {
    if (m < 0) { m = 11; j--; continue; }
    aus.push({ wert: `${j}-${m}`, name: `Saison ${MONATE[m]}${j !== jetzt.getFullYear() ? ' ' + j : ''}` });
    if (aus.length > 24) break;
  }
  aus.push({ wert: 'allzeit', name: 'Allzeit' });
  return aus;
}
const saisonGrenzen = wert => { const [j, m] = wert.split('-').map(Number); return [new Date(j, m, 1), new Date(j, m + 1, 1)]; };

// Saisonwertung: Punkte und Siege aus allen Raum-Spielen des Monats (Gäste zählen nicht)
async function saisonWertung(von, bis) {
  const [spiele, profile] = await Promise.all([spieleSeit(von), alleProfile()]);
  const proName = new Map(profile.map(p => [p.name.toLowerCase(), p]));
  const summe = new Map();
  let anzahl = 0;
  for (const s of spiele) {
    if (new Date(s.am) >= bis || s.kategorie === 'spiele') continue;
    anzahl++;
    const sp = s.spieler || [];
    sp.forEach((e, i) => {
      const p = proName.get(String(e.name || '').toLowerCase());
      if (!p) return;
      const z = summe.get(p.id) || { ...p, punkte: 0, siege: 0, spiele: 0 };
      z.punkte += e.pkt || 0; z.spiele++;
      if (i === 0 && sp.length > 1 && e.pkt > 0) z.siege++;
      summe.set(p.id, z);
    });
  }
  return { liste: [...summe.values()], anzahl };
}

// Saison-Abzeichen: kleine Medaillen-Karte mit Platz und Monat
const MEDAILLE = { 1: ['#FDEBB0', '#E2C487', '#9E7520'], 2: ['#F4F7F9', '#C3CACF', '#6E777D'], 3: ['#F3CDA9', '#C99A6E', '#7D5634'] };
function abzeichenSvg(platz, monat) {
  const [h, m, d] = MEDAILLE[platz];
  return `<svg viewBox="0 0 40 48" aria-hidden="true"><defs><linearGradient id="qba-${platz}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${h}"/><stop offset=".5" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
    <rect x="4" y="3" width="32" height="42" rx="5" fill="#22262A" stroke="url(#qba-${platz})" stroke-width="2.4"/>
    <rect x="7.5" y="6.5" width="25" height="35" rx="2.5" fill="none" stroke="${m}" stroke-opacity=".4" stroke-width=".7"/>
    ${platz === 1 ? `<path d="M13 9.5 15 6l3 2.4L20 5l2 3.4L25 6l2 3.5Z" fill="url(#qba-1)"/>` : symbol(platz === 2 ? 'herz' : 'karo', 16, 6.5, 8, m)}
    <text x="20" y="29" text-anchor="middle" font-size="15" font-weight="800" fill="url(#qba-${platz})" font-family="var(--display, sans-serif)">${platz}</text>
    <text x="20" y="38.5" text-anchor="middle" font-size="6" font-weight="700" fill="${m}" font-family="var(--schrift, sans-serif)">${monat}</text>
  </svg>`;
}
function saisonKopf(von, bis, laeuft) {
  const ende = new Date(bis - 1);
  const tage = Math.ceil((bis - new Date()) / 86400000);
  const monat = `${String(von.getMonth() + 1).padStart(2, '0')}/${String(von.getFullYear()).slice(2)}`;
  $('besten-saison-ende').textContent = laeuft
    ? `Läuft bis ${ende.getDate()}.${ende.getMonth() + 1}., ${tage <= 1 ? 'endet heute Nacht' : `noch ${tage} Tage`}`
    : `Beendet am ${ende.getDate()}.${ende.getMonth() + 1}.${ende.getFullYear()}`;
  $('besten-saison-ende').hidden = false;
  $('besten-abzeichen').innerHTML = [1, 2, 3].map(pl => `<figure title="Abzeichen für Platz ${pl}">${abzeichenSvg(pl, monat)}<figcaption>Platz ${pl}</figcaption></figure>`).join('');
  $('besten-abzeichen').hidden = false;
}

let bestenUhr = null;
async function bestenLaden() {
  const ol = $('besten-liste'), ichBox = $('besten-ich'), fuss = $('besten-fuss');
  const spalte = besteSpalte, zeit = $('besten-zeit').value || saisonOptionen()[0].wert;
  document.querySelector('.besten-kategorie').hidden = spalte !== 'sprint';
  clearInterval(bestenUhr);
  bestenUhr = setInterval(() => { if (!$('s-bude').hidden && !document.hidden) bestenLaden(); }, 30000); // frisch halten
  try {
    let liste, unter = () => '', fussText = '';
    if (zeit === 'allzeit') {
      if (spalte === 'sprint') liste = await sprintBestenliste($('besten-kategorie').value, null);
      else { liste = (await bestenliste(spalte)).map(p => ({ ...p, wert: p[spalte] })); unter = p => `${p.spiele} ${p.spiele === 1 ? 'Spiel' : 'Spiele'}`; }
      fussText = spalte === 'sprint' ? 'Beste 60-Sekunden-Sprints aller Zeiten.' : 'Alles seit dem Start der Quizbude.';
    } else {
      const [von, bis] = saisonGrenzen(zeit);
      const laeuft = bis > new Date();
      if (spalte === 'sprint') {
        liste = await sprintBestenliste($('besten-kategorie').value, von.toISOString());
        fussText = 'Bester Sprint dieser Saison.';
      } else {
        const w = await saisonWertung(von, bis);
        liste = w.liste.map(p => ({ ...p, wert: p[spalte] })).filter(p => p.wert > 0).sort((a, b) => b.wert - a.wert || b.punkte - a.punkte);
        unter = p => spalte === 'punkte' ? `${p.siege} ${p.siege === 1 ? 'Sieg' : 'Siege'} in ${p.spiele}` : `${p.punkte.toLocaleString('de-DE')} Pkt.`;
        fussText = `${w.anzahl} ${w.anzahl === 1 ? 'Spiel' : 'Spiele'} in dieser Saison`;
      }
      if (!fussText.endsWith('.')) fussText += '.';
      if (laeuft) fussText += ' Die Top 3 am Monatsende bekommen das Abzeichen der Saison.';
      saisonKopf(von, bis, laeuft);
    }
    if (zeit === 'allzeit') { $('besten-saison-ende').hidden = true; $('besten-abzeichen').hidden = true; }
    if (besteSpalte !== spalte) return; // inzwischen anderer Reiter
    const feld = (p, platz) => {
      const [zahl, einheit] = SPALTE[spalte](p.wert);
      const titel = titelVon(p), rahmen = hatRuhm(p) && stilVon(p).rahmen;
      return `<li class="besten-feld${platz <= 3 ? ` top p${platz}` : ''}${ich && p.id === ich.id ? ' ich' : ''}${rahmen ? ` lr-${rahmen}` : ''}" style="--i:${platz - 1}">
        <a href="#/profil/${esc(p.id)}">
          <span class="rang">${platz}</span>
          <span class="bf-avatar">${platz === 1 ? '<span class="krone" aria-hidden="true">👑</span>' : ''}${avatarMitWappen(p, 14)}</span>
          <span class="bf-mitte"><span class="bf-name${nameKlasse(p)}">${esc(p.name)}</span>${titel ? `<span class="bf-titel titel-zeile nf-${titel.rang}">${esc(titel.text)}</span>` : ''}</span>
          <span class="bf-wert">${zahl}<small>${einheit}</small></span>
        </a></li>`;
    };
    ol.innerHTML = liste.length ? liste.slice(0, 15).map((p, i) => feld(p, i + 1)).join('')
      : `<li class="leer">${zeit === 'allzeit' ? 'Hier steht noch keiner. Spiel eine Runde, dann bist du der Erste.' : 'In dieser Saison steht hier noch keiner. Platz 1 ist frei.'}</li>`;
    // eigener Platz, wenn man nicht in den Top 15 steht
    ichBox.hidden = true;
    if (ich && !liste.slice(0, 15).some(p => p.id === ich.id)) {
      let platz = null, wert = 0;
      const i = liste.findIndex(p => p.id === ich.id);
      if (i >= 0) { platz = i + 1; wert = liste[i].wert; }
      else if (zeit === 'allzeit' && spalte !== 'sprint') { wert = ich[spalte] || 0; platz = await rangVon(spalte, wert); }
      else if (zeit === 'allzeit') wert = sprintRekord($('besten-kategorie').value);
      const [zahl, einheit] = SPALTE[spalte](wert);
      ichBox.innerHTML = `<span class="rang">${platz ?? '–'}</span>${avatarMitWappen(ich, 14)}<span class="bf-name${nameKlasse(ich)}">Du</span><span class="bf-wert">${wert ? `${zahl}<small>${einheit}</small>` : '<small>noch nichts</small>'}</span>`;
      ichBox.hidden = false;
    }
    fuss.textContent = fussText;
  } catch (e) {
    ol.innerHTML = `<li class="leer">${esc(e.message)}</li>`;
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
    if (b) navigieren('#/sprint/' + sprintKat(b.dataset.k));
  };
  $('beitreten-form').onsubmit = e => {
    e.preventDefault();
    const c = $('code-eingabe').value.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) { toast('Der Code hat 4 Buchstaben, zum Beispiel KXQB.'); return; }
    $('code-eingabe').value = '';
    navigieren('#/raum/' + c);
  };
  $('besten-kategorie').innerHTML = SPRINT_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
  bestenFeld = auswahlfeld($('besten-kategorie'), { symbol: v => KATEGORIE_SYMBOL[v] });
  $('besten-zeit').innerHTML = saisonOptionen().map(o => `<option value="${o.wert}">${esc(o.name)}</option>`).join('');
  zeitFeld = auswahlfeld($('besten-zeit'));
  $('besten-zeit').onchange = () => bestenLaden();
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
  return KATEGORIE_REIHE.map(k => {
    const kk = mitRekord ? sprintKat(k) : k; // im Sprint: Hauptstädte in der gewählten Richtung
    const rekord = mitRekord ? sprintRekord(kk) : 0;
    return `
    <button class="kachel${mitRekord ? ' sprint-karte' : ''}" data-k="${k}">
      <span class="kachel-bild" aria-hidden="true">${kachelBild(k)}</span>
      <span class="kachel-name">${esc(KATEGORIEN[k].name).replace('Allgemeinwissen', 'Allgemein&shy;wissen')}</span>
      <span class="kachel-text">${esc(KATEGORIEN[kk].text)}</span>
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
  sprintRegionZeichnen();
  sprintSaisonLaden();
}

// Unter den Kacheln: Top 3 der Saison je Kategorie, dazu der eigene Platz
let sprintSaisonAbruf = 0;
async function sprintSaisonLaden() {
  const abruf = ++sprintSaisonAbruf;
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const ende = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const tage = Math.ceil((new Date(start.getFullYear(), start.getMonth() + 1, 1) - new Date()) / 86400000);
  $('sprint-saison-info').textContent = `Saison ${MONATE[start.getMonth()]}, läuft bis ${ende.getDate()}.${ende.getMonth() + 1}., noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'}`;
  const box = $('sprint-saison');
  if (!box.children.length) box.innerHTML = SPRINT_REIHE.map(() => '<div class="ss-karte laedt"></div>').join('');
  let listen;
  try { listen = await Promise.all(SPRINT_REIHE.map(k => sprintBestenliste(k, start.toISOString()).catch(() => []))); } catch { return; }
  if (abruf !== sprintSaisonAbruf) return;
  box.innerHTML = SPRINT_REIHE.map((k, ki) => {
    const l = listen[ki], i = ich ? l.findIndex(p => p.id === ich.id) : -1;
    const zeile = (p, platz) => `<li class="${platz <= 3 ? `p${platz}` : ''}${ich && p.id === ich.id ? ' ich' : ''}"><span class="ss-platz">${platz}</span>${avatarMitWappen(p, 12)}<span class="ss-name${nameKlasse(p)}">${esc(p.name)}</span><b>${p.wert}</b></li>`;
    return `<a class="ss-karte" href="#/sprint/${k}">
      <span class="ss-titel"><span class="raum-symbol" aria-hidden="true">${KATEGORIE_SYMBOL[k] || ''}</span>${esc(KATEGORIEN[k].name)}</span>
      ${l.length ? `<ol>${l.slice(0, 3).map((p, j) => zeile(p, j + 1)).join('')}${i >= 3 ? zeile(l[i], i + 1) : ''}</ol>` : '<p class="ss-leer">Noch kein Sprint diese Saison. Platz 1 ist frei.</p>'}
    </a>`;
  }).join('');
}

// ---------- Weltkarte: je eine Karte für Raum und Sprint, einmal gebaut ----------
const KARTEN = {};
const kartenPin = {};
function weltkarte(id) {
  if (!KARTEN[id]) KARTEN[id] = karteBauen($(id), (lon, lat) => kartenPin[id]?.(lon, lat));
  return KARTEN[id];
}
const kartenmodus = an => document.body.classList.toggle('kartenmodus', !!an);
const kmText = a => a.km === 0 ? 'Getroffen!' : `${a.km.toLocaleString('de-DE')} km daneben`;

function kachelBild(k) {
  const f = c => `<img src="${flaggeUrl(c)}" alt="">`;
  switch (k) {
    case 'flaggen': return `<span class="kb-faecher">${f('JP')}${f('BR')}${f('SE')}</span>`;
    case 'karte': return '<img class="kb-karte" src="bilder/weltkarte-vorschau.svg" alt="">';
    case 'umrisse': return '<img class="kb-umriss" src="bilder/umriss-vorschau.svg" alt="">';
    case 'hauptstaedte': return '<span class="kb-text">Wien?</span>';
    case 'groesser': return `<span class="kb-duell">${f('CA')}<b>oder</b>${f('BR')}</span>`;
    case 'wissen': return '<span class="kb-text kb-gross">?</span>';
    case 'emoji': return '<span class="kb-emoji">🦁👑</span>';
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
      <span class="lern-bild">${lernenArt === 'umrisse' ? umrissSvg(l.code) : `<img src="${flaggeUrl(l.code)}" alt="" loading="lazy" decoding="async">`}</span>
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
    <p class="detail-fuss">Kleine Tippfehler zählen beim Raten trotzdem, kosten im Raum aber 10 Punkte je Fehler.</p>`;
  $('lernen-detail').showModal();
}

// ---------- Spielerkarte, Anpassen, Ruhmesweg ----------
// Kopf rechts: Name (in Namensfarbe), Titel, seit wann dabei, Rang mit Fortschritt
let profilP = null; // gerade angezeigtes Profil
function karteZeichnen(p) {
  profilP = p;
  const info = ruhmInfo(p.ruhm || 0), st = stilVon(p), zahl = n => n.toLocaleString('de-DE');
  $('profil-name').className = st.farbe ? `nf-${st.farbe}` : '';
  const t = titelVon(p);
  $('profil-titel').textContent = t ? t.text : '';
  $('profil-titel').className = 'karten-titel' + (t ? ` nf-${t.rang}` : '');
  $('profil-titel').hidden = !t;
  $('profil-ruhm').style.setProperty('--rang', info.rang.farbe);
  $('profil-ruhm').innerHTML = `${wappen(info.ruhm, { groesse: 46 })}
    <div class="pr-mitte">
      <div class="pr-zeile"><b class="nf-${info.rang.id}">${info.name}</b><span>${info.bis ? `noch <b>${zahl(info.fehlt)}</b> bis ${stufeInfo(info.i + 1).name}` : 'ganz oben angekommen'}</span></div>
      <div class="ruhm-balken" style="--anteil:${info.anteil.toFixed(3)}"><i></i></div>
    </div>
    <div class="pr-zahl"><b>${zahl(info.ruhm)}</b><small>Ruhm</small></div>`;
  hochkarteZeichnen();
}

// ---------- Anpassen: Spielerkarte im Hochformat als Live-Vorschau, rechts Reiter mit Kacheln ----------
let anpassenArt = 'farbe';
let vorschauStil = null; // beim Drüberfahren: so würde es aussehen
let auswahlStil = null;  // angetippt, aber noch nicht angelegt

function hochkarteHtml(p, st) {
  const info = ruhmInfo(p.ruhm || 0), zahl = n => (n || 0).toLocaleString('de-DE');
  const titel = st.titel ? rangVonId(st.titel).titel : '';
  const sprint = Math.max(0, p.sprint_rekord || 0, ...Object.values(p.rekorde || {}));
  return `<div class="hochkarte${st.rahmen ? ` rahmen-${st.rahmen}` : ''}" style="--rang:${info.rang.farbe}">
    <div class="hk-flaeche${st.hintergrund ? ` hgf-${st.hintergrund}` : ''}"></div>
    ${effektHtml(st.effekt)}${rahmenDeko(st.rahmen)}
    <span class="hk-ecke lo">${wappen(p.ruhm, { groesse: 30 })}</span>
    <span class="hk-ecke ru">${wappen(p.ruhm, { groesse: 30 })}</span>
    <div class="hk-inhalt">
      <span class="hk-avatar">${avatarHtml(p)}</span>
      <b class="hk-name${st.farbe ? ` nf-${st.farbe}` : ''}">${esc(p.name)}</b>
      ${titel ? `<span class="hk-titel nf-${st.titel}">${esc(titel)}</span>` : '<span class="hk-titel leer">kein Titel</span>'}
      <span class="hk-rang"><b class="nf-${info.rang.id}">${info.name}</b>, ${zahl(info.ruhm)} Ruhm</span>
      <span class="hk-werte"><span><b>${zahl(p.spiele)}</b>Spiele</span><span><b>${zahl(p.siege)}</b>Siege</span><span><b>${sprint}</b>Sprint</span></span>
    </div>
  </div>`;
}
const stilGleich = (a, b) => ARTEN.every(x => (a[x.id] || '') === (b[x.id] || ''));
const stilAllesFrei = st => ARTEN.every(x => !st[x.id] || istFrei(x.id, st[x.id], ich.ruhm || 0));
function hochkarteZeichnen() {
  const p = profilP && ich && profilP.id === ich.id ? { ...profilP, ...ich } : profilP;
  if (!p || !$('hochkarte')) return;
  const eigen = ich && p.id === ich.id;
  $('hochkarte').innerHTML = hochkarteHtml(p, (eigen && vorschauStil) || stilVon(p));
}

const ART_NAME = { farbe: 'Namensfarbe', titel: 'Titel', effekt: 'Effekt', rahmen: 'Rahmen', hintergrund: 'Hintergrund' };
function kachelProbe(art, r) {
  if (!r) return '<span class="sk-probe keiner">–</span>';
  if (art === 'farbe') return `<span class="sk-probe text nf-${r.id}">Aa</span>`;
  if (art === 'titel') return `<span class="sk-probe text klein nf-${r.id}">„…“</span>`;
  if (art === 'effekt') return `<span class="sk-probe effekt-probe">${effektHtml(r.id)}</span>`;
  if (art === 'rahmen') return `<span class="sk-probe rahmen-probe ra-${r.id}"></span>`;
  return `<span class="sk-probe hgp-${r.id}"></span>`;
}
function kachelName(art, r) {
  if (art === 'farbe') return `<span class="nf-${r.id}">${esc(ich.name)}</span>`;
  if (art === 'titel') return `<span class="nf-${r.id}">${esc(r.titel)}</span>`;
  return esc(r[art === 'effekt' ? 'effekt' : art === 'rahmen' ? 'rahmen' : 'hintergrund']);
}
function anpassenZeichnen() {
  const st = stilVon(ich), wahl = st, ruhm = ich.ruhm || 0, zahl = n => n.toLocaleString('de-DE');
  $('anpassen-reiter').innerHTML = ARTEN.map(a => {
    const anzahl = RAENGE.filter(r => istFrei(a.id, r.id, ruhm)).length;
    return `<button role="tab" class="umschalter-knopf${a.id === anpassenArt ? ' aktiv' : ''}" aria-selected="${a.id === anpassenArt}" data-art="${a.id}">${ART_NAME[a.id]} <small>${anzahl}/5</small></button>`;
  }).join('');
  const art = anpassenArt;
  const keiner = `<button class="stil-kachel${!wahl[art] ? ' gewaehlt' : ''}${!st[art] ? ' an' : ''}" data-rang="" aria-pressed="${!wahl[art]}">${kachelProbe(art, null)}<span class="sk-text"><b>Keiner</b><small>${!st[art] ? 'angelegt' : 'nichts anzeigen'}</small></span></button>`;
  $('stil-kacheln').innerHTML = keiner + RAENGE.map(r => {
    const frei = istFrei(art, r.id, ruhm), an = st[art] === r.id, gewaehlt = wahl[art] === r.id;
    const ab = freiAb(art, r.id), abName = stufeInfo(ab).name, noetig = SCHWELLEN[ab];
    const unten = an ? '<small class="sk-an">angelegt</small>'
      : frei ? `<small>${abName}, frei</small>`
      : `<small>ab ${abName}</small><span class="ruhm-balken" style="--rang:${r.farbe};--anteil:${Math.min(1, ruhm / noetig).toFixed(3)}"><i></i></span><small>${zahl(ruhm)} / ${zahl(noetig)} Ruhm</small>`;
    return `<button class="stil-kachel${gewaehlt ? ' gewaehlt' : ''}${an ? ' an' : ''}${frei ? '' : ' gesperrt'}" data-rang="${r.id}" aria-pressed="${gewaehlt}">${kachelProbe(art, r)}<span class="sk-text"><b>${kachelName(art, r)}</b>${unten}</span>${frei ? '' : '<span class="sk-schloss" aria-hidden="true">🔒</span>'}</button>`;
  }).join('');
  hochkarteZeichnen();
}
async function stilAnlegen(neu, meldung = 'Angelegt.') {
  const stil = Object.fromEntries(Object.entries(neu).filter(([, v]) => v));
  try {
    await profilSpeichern(ich.id, { stil });
    ich = { ...ich, stil };
    chipZeichnen();
    if (!$('s-profil').hidden && profilP?.id === ich.id) { karteZeichnen({ ...profilP, ...ich }); anpassenZeichnen(); ruhmeswegZeichnen(); }
    if (!$('s-bude').hidden) bestenLaden();
    toast(meldung);
  } catch (e) { toast(e.message); }
}
// Ruhmesweg als Tabelle: Zeilen sind die Kartenfarben (Ränge), Spalten Bube bis Ass, jede Stufe schaltet eine Sache frei
const FREI_NACH_STUFE = ['Namensfarbe', 'Titel', 'Karten-Effekt', 'Rahmen + Hintergrund'];
function ruhmeswegZeichnen() {
  const jetzt = stufeVon(ich.ruhm || 0), zahl = n => n.toLocaleString('de-DE');
  const zustand = i => i < jetzt ? 'erreicht' : i === jetzt ? 'aktuell' : 'gesperrt';
  const belohnung = (r, f) => [esc(r.name), `„${esc(r.titel)}“`, esc(r.effekt), `${esc(r.rahmen)}, ${esc(r.hintergrund)}`][f];
  const kopf = `<div class="rw-ecke"></div>${BILDER.map((b, f) => `<div class="rw-kopf"><b>${b.name}</b><small>${FREI_NACH_STUFE[f]}</small></div>`).join('')}`;
  const zeilen = RAENGE.slice(0, 4).map((r, ri) => `<div class="rw-rang nf-${r.id}"><span class="rw-farbe ${r.rot ? 'rot' : ''}">${symbolSvg(r.id)}</span>${r.name}</div>${[0, 1, 2, 3].map(f => {
    const i = ri * 4 + f;
    return `<div class="rw-zelle ${zustand(i)}" style="--rang:${r.farbe}">${wappen(0, { stufe: i, groesse: 28 })}<span><b>${zahl(SCHWELLEN[i])}</b><small>${belohnung(r, f)}</small></span>${i === jetzt ? '<i class="rw-du">du</i>' : ''}</div>`;
  }).join('')}`).join('');
  const joker = RAENGE[4];
  const jz = `<div class="rw-rang nf-joker">Joker</div><div class="rw-zelle rw-joker ${zustand(JOKER)}" style="--rang:${joker.farbe}">${wappen(0, { stufe: JOKER, groesse: 28 })}<span><b>${zahl(SCHWELLEN[JOKER])}</b><small>Alles im Joker-Stil: schillernder Name, „${esc(joker.titel)}“, Holo-Effekt, Regenbogenrahmen und Hintergrund</small></span>${jetzt === JOKER ? '<i class="rw-du">du</i>' : ''}</div>`;
  $('ruhmesweg').innerHTML = kopf + zeilen + jz;
}

// ---------- Ruhm nach Spiel und Sprint, Aufstieg ----------
const RUHM_STUFE = id => 'quizbude.ruhmStufe.' + id;
async function ruhmNachladen(vorher) {
  if (!ich || !online()) return null;
  let p = null;
  for (let versuch = 0; versuch < 3; versuch++) {
    try { p = await profilLaden(ich.id); } catch { return null; }
    if (!p || p.ruhm !== vorher) break;
    await new Promise(r => setTimeout(r, 1200));
  }
  if (!p || !ich || p.id !== ich.id) return null;
  ich = { ...ich, ...p };
  ruhmMiniZeichnen();
  return (p.ruhm || 0) - vorher;
}
// Stufe mit der zuletzt gesehenen vergleichen; beim ersten Mal (nachgerechneter Ruhm) einmalig zeigen
function ruhmPruefen() {
  if (!ich || ich.gast) return;
  // nie mitten ins Spiel: während Frage, Countdown oder Sprint später nochmal schauen
  if ((raum && ['countdown', 'frage', 'aufloesung'].includes(raum.phase)) || sprint?.laeuft) { setTimeout(ruhmPruefen, 4000); return; }
  const jetzt = stufeVon(ich.ruhm || 0);
  let alt = null;
  try { alt = localStorage.getItem(RUHM_STUFE(ich.id)); localStorage.setItem(RUHM_STUFE(ich.id), jetzt); } catch { return; }
  if (alt === null) { if ((ich.ruhm || 0) > 0) aufstiegZeigen(-1, jetzt, true); return; }
  if (jetzt > Number(alt)) aufstiegZeigen(Number(alt), jetzt, false);
}
function aufstiegZeigen(alt, neu, erstesMal) {
  const dlg = $('aufstieg');
  if (dlg.open || !ich) return;
  const s = stufeInfo(neu);
  const neues = [];
  for (let i = Math.max(0, alt + 1); i <= neu; i++) neues.push(...neuFrei(i));
  const zeigen = neues.slice(-4);
  $('aufstieg-inhalt').style.setProperty('--rang', s.rang.farbe);
  $('aufstieg-inhalt').innerHTML = `
    <div class="aufstieg-buehne">${wappen(ich.ruhm, { groesse: 112, stufe: neu })}</div>
    <p class="ueber">${erstesMal ? 'Ruhm ist da. Alles Bisherige zählt mit.' : 'Aufstieg!'}</p>
    <h2 id="aufstieg-titel" class="nf-${s.rang.id}">${s.name}</h2>
    <p class="ruhm-zahl">${(ich.ruhm || 0).toLocaleString('de-DE')} Ruhm</p>
    ${zeigen.length ? `<ul class="aufstieg-neu">${zeigen.map((n, i) => `<li style="--i:${i}"><span class="nf-${n.rang}">${esc(belohnungName(n.art, n.rang))}</span><small>neu</small></li>`).join('')}</ul>` : ''}
    ${neues.length > zeigen.length ? `<p class="unterzeile">und ${neues.length - zeigen.length} weitere im Profil</p>` : ''}
    <div class="zeile mitte">${neues.length ? '<button class="knopf haupt" id="aufstieg-ansehen">Im Profil ansehen</button>' : ''}<button class="knopf zweit" id="aufstieg-weiter">Weiter</button></div>`;
  dlg.showModal();
  setTimeout(() => konfetti(neu >= JOKER ? 3 : 2), 650);
  $('aufstieg-weiter').onclick = () => dlg.close();
  const ansehen = $('aufstieg-ansehen');
  if (ansehen) ansehen.onclick = () => {
    dlg.close();
    anpassenArt = neues[neues.length - 1]?.art || 'farbe';
    navigieren('#/profil');
    setTimeout(() => $('anpassen')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600);
  };
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
  $('profil-reiter').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) profilTab(b.dataset.tab); };
  $('anpassen-reiter').onclick = e => {
    const b = e.target.closest('[data-art]');
    if (!b) return;
    anpassenArt = b.dataset.art; vorschauStil = null;
    anpassenZeichnen();
  };
  // Klick legt Freigeschaltetes sofort an; Gesperrtes bleibt eine Probe auf der Karte
  $('stil-kacheln').onclick = e => {
    const b = e.target.closest('.stil-kachel');
    if (!b) return;
    if (b.classList.contains('gesperrt')) { toast(`Noch gesperrt, frei ab ${stufeInfo(freiAb(anpassenArt, b.dataset.rang)).name}.`); return; }
    if (b.getAttribute('aria-pressed') === 'true') return;
    vorschauStil = null;
    stilAnlegen({ ...stilVon(ich), [anpassenArt]: b.dataset.rang }, 'Angelegt.');
  };
  $('profil-speichern').onclick = async () => {
    try {
      await profilSpeichern(ich.id, { avatar: profilWahl.avatar, farbe: profilWahl.farbe });
      ich = { ...ich, avatar: profilWahl.avatar, farbe: profilWahl.farbe };
      chipZeichnen();
      $('profil-editor').hidden = true;
      hochkarteZeichnen();
      toast('Avatar gespeichert.');
    } catch (e) { toast(e.message); }
  };
}

let profilTabJetzt = 'uebersicht';
function profilTab(t) {
  profilTabJetzt = t;
  document.querySelectorAll('#profil-reiter [data-tab]').forEach(b => { const an = b.dataset.tab === t; b.classList.toggle('aktiv', an); b.setAttribute('aria-selected', an); });
  document.querySelectorAll('.profil-tab').forEach(d => { d.hidden = d.dataset.tab !== t; });
  if (t !== 'anpassen' && vorschauStil) { vorschauStil = null; hochkarteZeichnen(); }
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

  $('profil-name').textContent = p.name;
  $('profil-seit').textContent = `Dabei seit ${datum(p.erstellt)}, zuletzt aktiv ${wann(p.zuletzt)}`;
  vorschauStil = null;
  karteZeichnen(p);
  // Anpassen und Ruhmesweg gibt es nur im eigenen Profil
  $('profil-reiter').hidden = !eigenes;
  profilTab(eigenes ? profilTabJetzt : 'uebersicht');
  if (eigenes) { anpassenZeichnen(); ruhmeswegZeichnen(); }

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
    const mitRekord = SPRINT_REIHE.filter(k => rekorde[k] > 0);
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
let zeitFeld = null;

async function raumBetreten(code) {
  if (raum && raum.code === code) { raumZeichnen(); return; }
  zeige('raum');
  gezeichnet = { idx: -2, phase: '' };
  $('chat-liste').innerHTML = '';
  $('spieler-liste').innerHTML = '';
  const alsHost = neuErstellt?.code === code;
  raum = new Raum(code, mitspieler(), () => raumZeichnen(), alsHost);
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
  $('einst-kategorie').innerHTML = KATEGORIE_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
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
      if (s.dataset.e === 'richtung') { raum.einstellen({ kategorie: s.value === 'stadt' ? 'stadtland' : 'hauptstaedte' }); return; }
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
      const f = raum.tippfehler || 0;
      rm.className = 'rueckmeldung gut';
      rm.textContent = f ? `Richtig, aber ${f === 1 ? '1 Tippfehler' : `${f} Tippfehler`}: −${f * TIPPFEHLER_ABZUG} Punkte.` : zufall(SPRUCH.richtig);
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
    : r.phase === 'ende' ? 'Fertig' : r.phase === 'countdown' ? 'Gleich geht\'s los' : 'Warteraum';

  const sichtbar = { warten: 'p-warten', countdown: 'p-countdown', frage: 'p-frage', aufloesung: 'p-frage', ende: 'p-ende' }[r.phase];
  for (const id of ['p-warten', 'p-countdown', 'p-frage', 'p-ende']) $(id).hidden = id !== sichtbar;
  $('zeitleiste').hidden = !(r.phase === 'frage' || r.phase === 'aufloesung');
  const hostName = r.spieler.get(r.hostId)?.name || r.bekannt.get(r.hostId)?.name;

  if (r.phase === 'warten') {
    const kat = KATEGORIEN[r.einst.kategorie] || KATEGORIEN.flaggen;
    const auswahlHtml = Object.entries(kat.auswahlen).map(([k, name]) => {
      const anzahl = kat.pool ? kat.pool(k).length : 0;
      return `<option value="${k}">${esc(name)}${anzahl ? ` (${anzahl})` : ''}</option>`;
    }).join('');
    if ($('einst-auswahl').dataset.fuer !== r.einst.kategorie) { $('einst-auswahl').innerHTML = auswahlHtml; $('einst-auswahl').dataset.fuer = r.einst.kategorie; }
    document.querySelectorAll('#einst select').forEach(s => { s.value = String(r.einst[s.dataset.e] ?? STANDARD[s.dataset.e] ?? ''); s.disabled = !r.binHost; });
    // Hauptstädte gibt es in zwei Richtungen; in der Kategorie-Liste steht nur „Hauptstädte“
    const stadtKat = ['hauptstaedte', 'stadtland'].includes(r.einst.kategorie);
    if (r.einst.kategorie === 'stadtland') $('einst-kategorie').value = 'hauptstaedte';
    document.querySelector('.einst-richtung').hidden = !stadtKat;
    document.querySelector('.einst-ziel').hidden = r.einst.kategorie !== 'karte';
    document.querySelector('.einst-modus').hidden = r.einst.kategorie === 'karte';
    $('einst-richtung').value = r.einst.kategorie === 'stadtland' ? 'stadt' : 'land';
    if (!kat.tippen) { $('einst-modus').value = 'auswahl'; $('einst-modus').disabled = true; }
    einstFelder.forEach(f => f.aktualisieren());
    $('los').hidden = !r.binHost;
    const genug = r.startBereit;
    $('los').disabled = !genug;
    $('los-hinweis').textContent = genug ? '' : r.binHost
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
    const istKarte = f.k === 'karte';
    kartenmodus(istKarte);
    $('raum-weltkarte').hidden = !istKarte;
    if (istKarte && gezeichnet.idx !== r.idx) {
      const idx = r.idx;
      kartenPin['raum-weltkarte'] = (lon, lat) => {
        const a = raum?.pinSetzen(lon, lat);
        if (!a) return;
        weltkarte('raum-weltkarte').pin(lon, lat); weltkarte('raum-weltkarte').sperren();
        $('rueckmeldung').className = 'rueckmeldung ' + (a.treffer ? 'gut' : '');
        $('rueckmeldung').textContent = `${kmText(a)} +${a.pkt}. Warte auf die anderen …`;
      };
      karteLaden().then(() => { if (raum && raum.idx === idx) weltkarte('raum-weltkarte').neu(raum.einst.auswahl); });
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
    if (r.meinStatus === 'geloest' && istKarte && r.phase === 'frage') {
      const mein = r.geloest.get(r.ich.id);
      $('rueckmeldung').className = 'rueckmeldung' + (mein?.treffer ? ' gut' : '');
      $('rueckmeldung').textContent = `${kmText(mein || { km: 0 })} +${mein?.pkt ?? 0}. Warte auf die anderen …`;
    } else if (r.meinStatus === 'geloest' && !istKarte) {
      const mein = r.geloest.get(r.ich.id);
      eingabe.disabled = true; eingabe.classList.add('richtig');
      $('rueckmeldung').className = 'rueckmeldung gut';
      $('rueckmeldung').textContent = `Richtig! +${mein?.pkt ?? ''}${mein?.rang === 1 ? ', als Erstes' : ''}${mein?.abzug ? ` (−${mein.abzug} für Tippfehler)` : ''}`;
    }
    if (r.phase === 'aufloesung' && gezeichnet.phase !== 'aufloesung-' + r.idx) {
      const fl = $('zeitleiste-fuellung');
      fl.style.transition = 'none'; fl.style.width = '0%';
      eingabe.disabled = true;
      $('aufgeloest').textContent = kat.loesung(f);
      $('frage-info').innerHTML = (kat.nachher ? kat.nachher(f) : '') + esc(kat.info ? kat.info(f) : '');
      if (istKarte) {
        const pins = [...r.geloest].filter(([, g]) => g.lon != null).map(([id, g]) => {
          const p = r.spieler.get(id) || r.bekannt.get(id) || {};
          return { lon: g.lon, lat: g.lat, name: id === r.ich.id ? 'Du' : p.name, farbe: id === r.ich.id ? 'var(--sand)' : farbe(p.farbe) };
        });
        karteLaden().then(() => weltkarte('raum-weltkarte').loesung(f.c, f.t, pins));
      }
      if (f.k === 'groesser') duellAufdecken($('optionen'), f, null);
      else document.querySelectorAll('#optionen button').forEach(b => {
        b.disabled = true;
        if (richtigeWahl(f, b.dataset.c)) b.classList.add('richtig');
      });
      const finder = istKarte
        ? [...r.geloest].sort((a, b) => b[1].pkt - a[1].pkt).map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} ${g.km ? `${g.km.toLocaleString('de-DE')} km` : 'drin'} (+${g.pkt})`)
        : [...r.geloest].sort((a, b) => a[1].rang - b[1].rang).map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} (+${g.pkt})`);
      $('rueckmeldung').className = 'rueckmeldung';
      $('rueckmeldung').textContent = finder.length ? `${istKarte ? 'Pins' : 'Gefunden'}: ${finder.join(', ')}` : istKarte ? 'Keiner hat einen Pin gesetzt.' : 'Keiner hatte es.';
      gezeichnet.phase = 'aufloesung-' + r.idx;
    }
    if (r.phase === 'frage') $('aufgeloest').textContent = '';
    $('rate-form').hidden = !!f.o || istKarte || r.phase === 'aufloesung';
    gezeichnet.idx = r.idx;
  } else {
    kartenmodus(false); $('raum-weltkarte').hidden = true;
    gezeichnet.idx = -2;
  }

  if (r.phase === 'ende') {
    const liste = r.ergebnis || [];
    $('ende-titel').textContent = 'Endstand';
    if (gezeichnet.ende !== r.spielId) {
      gezeichnet.ende = r.spielId;
      $('podest').innerHTML = treppeHtml(liste, r.ich.id, !r.unentschieden);
      $('ende-ruhm').hidden = true;
      if (ich && liste.some(e => e.id === ich.id)) {
        const vorher = ich.ruhm || 0, spielId = r.spielId;
        setTimeout(async () => {
          const plus = await ruhmNachladen(vorher);
          if (plus == null || plus <= 0 || gezeichnet.ende !== spielId) return;
          const mein = liste.find(e => e.id === ich.id);
          const sieg = !r.unentschieden && liste.length >= 2 && liste[0].id === ich.id && (mein?.pkt || 0) > 0;
          const t = r.meineTreffer || 0;
          ruhmAufschluesseln($('ende-ruhm'), vorher, [['Mitgespielt', 10], [`${t} richtig`, t * 3], sieg ? ['Sieg', 20] : null], plus);
          setTimeout(ruhmPruefen, 2800);
        }, 1600);
      }
      $('podest').querySelectorAll('.wert').forEach(w => setTimeout(() => hochzaehlen(w, Number(w.dataset.pkt)), Number(w.dataset.ab || 300)));
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
    return `<li>${avatarMitWappen(p, 13)}<span class="name"><span class="${nameKlasse(p).trim()}">${esc(p.name)}</span>${p.id === r.hostId ? '<span class="host">Gastgeber</span>' : ''}</span>${status}<span class="wert">${r.punkte.get(p.id) || 0}</span></li>`;
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

// ---------- Neue Version: von selbst neu laden, aber nur in einem ruhigen Moment ----------
// Ruhig heißt: kein Sprint und kein laufendes Spiel, nichts halb Getipptes, kein offenes Fenster.
// Vorher merken wir uns, wo man war (Adresse, Raum, Chat, Filter, Scrollstand).
let neueVersion = null;
const ZURUECK = 'quizbude.zurueck';
const VERSUCH = 'quizbude.update';

// Nachricht an alle (kommt aus dem Admin-Bereich), lässt sich wegklicken
async function nachrichtPruefen() {
  if (!online()) return;
  const n = (await konfigLaden()).nachricht;
  const el = $('nachricht');
  let weg = null; try { weg = localStorage.getItem('quizbude.nachricht.weg'); } catch { /* egal */ }
  const zeigen = !!(n?.an && n.text && n.text !== weg);
  if (zeigen) $('nachricht-text').textContent = n.text;
  el.hidden = !zeigen;
  $('nachricht-zu').onclick = () => { el.hidden = true; try { localStorage.setItem('quizbude.nachricht.weg', n?.text || ''); } catch { /* egal */ } };
}

async function versionPruefen() {
  nachrichtPruefen();
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
    || (raum && !$('s-raum').hidden && ['countdown', 'frage', 'aufloesung'].includes(raum.phase));
  document.body.classList.toggle('spielt', !!spielt);
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
  const region = REGION_KATEGORIEN.includes(kategorie) && sprintRegion !== 'alle' ? sprintRegion : null;
  const s = { kategorie, region, punkte: 0, ende: 0, benutzt: new Set(), verpasst: [], richtige: [], serie: 0, besteSerie: 0, laeuft: false, vorrat: [], frage: null };
  sprint = s;
  $('sp-laeuft').hidden = false; $('sp-ende').hidden = true;
  $('sprint-punkte').textContent = '0';
  $('sprint-zeit').textContent = '60 s';
  $('sprint-leiste').style.width = '100%';
  $('sprint-rueck').textContent = ''; $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-optionen').innerHTML = '';
  $('sprint-form').hidden = true; $('sprint-skip').hidden = true;
  $('sprint-eingabe').classList.remove('wackeln', 'richtig');
  $('sprint-hinweis').textContent = `${KATEGORIEN[kategorie].name}${region ? ` (${REGIONEN_SPRINT[region]}, Übung)` : ''}: gleich geht's los`;
  $('sprint-bild').innerHTML = `<p class="countdown" id="sprint-countdown">${SPRINT_COUNTDOWN}</p>`;
  // Während des Countdowns schon Umrisse und die ersten Bilder laden
  const laden = kategorie === 'umrisse' || kategorie === 'gemischt' ? umrisseLaden() : kategorie === 'karte' ? karteLaden() : Promise.resolve();
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
  const f = sprintFrage(s.kategorie, s.punkte + s.vorrat.length, s.benutzt, s.region);
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
  const istKarte = f.k === 'karte';
  kartenmodus(istKarte);
  $('sprint-weltkarte').hidden = !istKarte;
  if (istKarte) {
    kartenPin['sprint-weltkarte'] = (lon, lat) => sprintPin(lon, lat);
    weltkarte('sprint-weltkarte').neu(s.region);
  }
  const eingabe = $('sprint-eingabe');
  $('sprint-form').hidden = !!f.o || istKarte;
  $('sprint-optionen').className = 'optionen' + (kat.optionKlasse ? ' ' + kat.optionKlasse : '');
  $('sprint-optionen').innerHTML = f.o ? optionSchluessel(f).map(k => `<button type="button" data-c="${esc(k)}">${kat.option(k, f)}</button>`).join('') : '';
  eingabe.value = '';
  eingabe.placeholder = f.k === 'hauptstaedte' ? 'Welche Stadt?' : 'Welches Land?';
  if (!f.o && !istKarte) setTimeout(() => eingabe.focus(), 20);
}

// Weltkarte im Sprint: Treffer = im Land bzw. Hauptstadt höchstens 150 km daneben; Auflösung kurz zeigen, Uhr steht so lange
function sprintPin(lon, lat) {
  const s = sprint;
  if (!s?.laeuft || s.frage?.k !== 'karte' || s.pauseSeit) return;
  const f = s.frage, a = auswerten(f.c, f.t, lon, lat), k = weltkarte('sprint-weltkarte');
  s.pauseSeit = performance.now();
  k.loesung(f.c, f.t, [{ lon, lat, name: 'Du', farbe: 'var(--sand)' }]);
  const rm = $('sprint-rueck');
  if (a.treffer) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = a.km ? `${kmText(a)}, zählt!` : 'Getroffen!'; }
  else { s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = `${kmText(a)}. Das war ${kategorieVon(f).loesung(f)}.`; }
  setTimeout(() => {
    if (sprint !== s || !s.laeuft) return;
    s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
    if (s.frage === f) sprintNaechste();
  }, a.treffer ? 1200 : 2200);
}

function punktePop() {
  $('sprint-punkte').textContent = sprint.punkte;
  pulsen($('sprint-punkte').parentElement, 'pop');
  plusEins($('sprint-punkte').parentElement);
}

function trefferMerken(s) {
  s.richtige.push(s.frage);
  s.serie++; s.besteSerie = Math.max(s.besteSerie, s.serie);
}
function sprintTreffer() {
  trefferMerken(sprint);
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
  kartenmodus(false); $('sprint-weltkarte').hidden = true;
  $('sprint-kat').textContent = `${kat.name}${s.region ? `, ${REGIONEN_SPRINT[s.region]} (Übung)` : ''}`;
  hochzaehlen($('sprint-ergebnis'), s.punkte, n => n);
  // Listen: richtig und ausgelassen
  $('sprint-richtig').innerHTML = s.richtige.map(f => `<li>${kategorieVon(f).kurz(f)}</li>`).join('');
  $('sprint-richtig-zahl').textContent = s.richtige.length;
  $('sprint-richtig-bereich').hidden = !s.richtige.length;
  $('sprint-verpasst').innerHTML = s.verpasst.map(f => `<li>${kategorieVon(f).kurz(f)}</li>`).join('');
  $('sprint-verpasst-zahl').textContent = s.verpasst.length;
  $('sprint-verpasst-bereich').hidden = !s.verpasst.length;
  const alt = s.region ? 0 : sprintRekord(s.kategorie);
  const neuerRekord = !s.region && s.punkte > alt && s.punkte > 0;
  // Werte
  const wert = (zahl, text) => `<div><b>${zahl}</b><span>${text}</span></div>`;
  const werteZeichnen = platz => {
    $('sprint-werte').innerHTML = wert(s.punkte ? `${(60 / s.punkte).toLocaleString('de-DE', { maximumFractionDigits: 1 })} s` : '–', 'pro Treffer')
      + wert(s.besteSerie, 'beste Serie') + wert(s.verpasst.length, 'ausgelassen')
      + wert(s.region ? 'Übung' : !ich ? '–' : platz ?? '…', s.region ? 'zählt nicht' : !ich ? 'nur mit Konto' : 'Saisonplatz');
  };
  werteZeichnen(null);
  // Vergleich mit dem Rekord
  const max = Math.max(s.punkte, alt, 1);
  $('sprint-vergleich').hidden = !!s.region;
  $('sprint-vergleich').innerHTML = s.region ? '' : `
    <div class="sv-zeile${neuerRekord ? ' neu' : ''}"><span>Jetzt</span><span class="sv-balken"><i style="--w:${(s.punkte / max).toFixed(3)}"></i></span><b>${s.punkte}</b></div>
    <div class="sv-zeile alt"><span>${neuerRekord ? 'Alter Rekord' : 'Rekord'}</span><span class="sv-balken"><i style="--w:${(alt / max).toFixed(3)}"></i></span><b>${alt || '–'}</b></div>`;
  const rekordText = $('sprint-rekord');
  rekordText.classList.toggle('rekord-neu', neuerRekord);
  rekordText.textContent = s.region ? 'Übungsrunde mit Region: Rekorde und Ruhm gibt es mit „Alle“.'
    : neuerRekord ? (alt ? `Neuer Rekord! ${s.punkte - alt} mehr als vorher.` : 'Dein erster Rekord steht.')
    : alt - s.punkte <= 2 && s.punkte ? `Knapp! Nur ${alt - s.punkte || 'null'} unter deinem Rekord.` : `Noch ${alt - s.punkte} bis zu deinem Rekord.`;
  if (neuerRekord) setTimeout(() => konfetti(alt ? 3 : 2), 500);
  $('sprint-ruhm').hidden = true;
  if (s.region) return;
  if (ich && online()) {
    const vorher = ich.ruhm || 0;
    const neu = await sprintEintragen(s.punkte, s.kategorie);
    if (typeof neu === 'number') ich.rekorde = { ...(ich.rekorde || {}), [s.kategorie]: neu };
    ruhmNachladen(vorher).then(plus => {
      if (plus == null || plus <= 0 || sprint !== s) return;
      ruhmAufschluesseln($('sprint-ruhm'), vorher, [['Sprint gespielt', 4], [`${s.punkte} ${s.punkte === 1 ? 'Treffer' : 'Treffer'}`, s.punkte], neuerRekord && alt ? ['Rekord verbessert', s.punkte - alt] : neuerRekord ? ['Erster Rekord', s.punkte] : null], plus);
      setTimeout(ruhmPruefen, 2600);
    });
    // Saisonplatz in dieser Kategorie
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    sprintBestenliste(s.kategorie, start.toISOString()).then(l => {
      if (sprint !== s) return;
      const i = l.findIndex(p => p.id === ich.id);
      werteZeichnen(i >= 0 ? `#${i + 1}` : 'ab 16');
    }).catch(() => werteZeichnen('–'));
  } else if (s.punkte > alt) {
    try { localStorage.setItem('quizbude.sprint.gast.' + s.kategorie, s.punkte); } catch { /* egal */ }
  }
}

// Ruhm-Zuwachs Posten für Posten, Summe zählt hoch, Balken füllt sich (bei Aufstieg erst voll, dann neue Karte)
function ruhmAufschluesseln(box, vorher, posten, gesamt) {
  const liste = posten.filter(p => p && p[1] > 0);
  const summe = liste.reduce((s, p) => s + p[1], 0);
  if (summe !== gesamt) liste.push(['Sonstiges', gesamt - summe]); // falls der Server anders gerechnet hat
  const alt = ruhmInfo(vorher), neu = ruhmInfo(vorher + gesamt), aufstieg = neu.i > alt.i;
  const text = i => i.bis ? `noch ${i.fehlt.toLocaleString('de-DE')} bis ${stufeInfo(i.i + 1).name}` : 'Joker erreicht';
  box.style.setProperty('--rang', alt.rang.farbe);
  box.innerHTML = `
    <div class="rp-kopf">${wappen(vorher, { groesse: 26 })}<b class="rp-summe">+0</b><span>Ruhm</span></div>
    <ul class="rp-posten">${liste.map(([n, w], i) => `<li style="--i:${i}"><span>${esc(n)}</span><b>+${w}</b></li>`).join('')}</ul>
    <div class="rp-leiste"><span class="ruhm-balken"><i style="--anteil:${alt.anteil.toFixed(3)}"></i></span><small class="rp-text">${text(alt)}</small></div>`;
  box.hidden = false;
  const verz = 250 + liste.length * 260;
  setTimeout(() => hochzaehlen(box.querySelector('.rp-summe'), gesamt, n => `+${n}`), 300);
  const balken = box.querySelector('.ruhm-balken i');
  setTimeout(() => {
    if (!aufstieg) { balken.style.setProperty('--anteil', neu.anteil.toFixed(3)); box.querySelector('.rp-text').textContent = text(neu); return; }
    balken.style.setProperty('--anteil', 1);
    setTimeout(() => {
      box.style.setProperty('--rang', neu.rang.farbe);
      box.querySelector('.rp-kopf .wappen').outerHTML = wappen(vorher + gesamt, { groesse: 26 });
      balken.style.transition = 'none'; balken.style.setProperty('--anteil', 0); void balken.offsetWidth; balken.style.transition = '';
      balken.style.setProperty('--anteil', neu.anteil.toFixed(3));
      box.querySelector('.rp-text').textContent = `Neu: ${neu.name}! ${text(neu)}`;
      box.classList.add('aufstieg');
    }, 950);
  }, verz);
}

// Region für Sprints in Flaggen, Umrisse, Hauptstädte (Übung)
const REGION_KATEGORIEN = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland'];
let sprintRichtung = (() => { try { return localStorage.getItem('quizbude.sprintRichtung') === 'stadt' ? 'stadt' : 'land'; } catch { return 'land'; } })();
const sprintKat = k => (k === 'hauptstaedte' && sprintRichtung === 'stadt' ? 'stadtland' : k);
const REGIONEN_SPRINT = { alle: 'Alle', europa: 'Europa', afrika: 'Afrika', asien: 'Asien', amerika: 'Amerika', ozeanien: 'Ozeanien' };
let sprintRegion = (() => { try { return localStorage.getItem('quizbude.sprintRegion') || 'alle'; } catch { return 'alle'; } })();
if (!REGIONEN_SPRINT[sprintRegion]) sprintRegion = 'alle';
function sprintRegionZeichnen() {
  $('sprint-richtung').innerHTML = [['land', 'Land → Stadt'], ['stadt', 'Stadt → Land']].map(([k, n]) => `<button type="button" role="radio" class="umschalter-knopf${k === sprintRichtung ? ' aktiv' : ''}" aria-checked="${k === sprintRichtung}" data-ri="${k}">${n}</button>`).join('');
  $('sprint-region').innerHTML = Object.entries(REGIONEN_SPRINT).map(([k, n]) => `<button type="button" role="radio" class="umschalter-knopf${k === sprintRegion ? ' aktiv' : ''}" aria-checked="${k === sprintRegion}" data-r="${k}">${n}</button>`).join('');
  document.querySelectorAll('#sprint-kacheln .kachel').forEach(el => el.classList.toggle('mit-region', sprintRegion !== 'alle' && REGION_KATEGORIEN.includes(el.dataset.k)));
}

function sprintAufbauen() {
  sprintRegionZeichnen();
  $('sprint-region').onclick = e => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    sprintRegion = b.dataset.r;
    try { localStorage.setItem('quizbude.sprintRegion', sprintRegion); } catch { /* egal */ }
    sprintRegionZeichnen();
  };
  $('sprint-richtung').onclick = e => {
    const b = e.target.closest('[data-ri]');
    if (!b) return;
    sprintRichtung = b.dataset.ri;
    try { localStorage.setItem('quizbude.sprintRichtung', sprintRichtung); } catch { /* egal */ }
    $('sprint-kacheln').innerHTML = kachelnHtml(true);
    sprintRegionZeichnen();
  };
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
      if (ok) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = `Richtig, ${groessererName(f)} ist größer.`; }
      else { s.ende -= SPRINT_FALSCH; s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = `Falsch, ${groessererName(f)} ist größer. Minus 5 Sekunden.`; }
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
    s.verpasst.push(f); s.serie = 0;
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
  s.verpasst.push(s.frage); s.serie = 0;
  s.ende -= SPRINT_STRAFE;
  $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-rueck').textContent = `Das war ${kategorieVon(s.frage).loesung(s.frage)}.`;
  sprintNaechste();
}

// Tastenkürzel: Pfeil rechts oder Alt+D = überspringen, 1–4 = Antwort wählen
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
  // Antworten: 1–4 oder A–D (Buchstaben nur, wenn man nicht gerade in ein Feld tippt)
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const taste = e.key.toLowerCase();
  const nr = /^[1-4]$/.test(taste) && !(tippt && ziel.id === 'chat-eingabe') ? Number(taste)
    : /^[a-d]$/.test(taste) && !tippt ? 'abcd'.indexOf(taste) + 1 : 0;
  if (nr) {
    const knoepfe = [...document.querySelectorAll(imSprint ? '#sprint-optionen button' : '#optionen button')];
    const k = knoepfe[nr - 1];
    if (k && !k.disabled) { e.preventDefault(); k.click(); }
  }
});

// ---------- Tastenliste ----------
document.addEventListener('click', e => { if (e.target.closest('.tasten-knopf')) $('tasten-dialog').showModal(); });
$('tasten-zu').onclick = () => $('tasten-dialog').close();
$('tasten-dialog').onclick = e => { if (e.target === $('tasten-dialog')) $('tasten-dialog').close(); };
document.addEventListener('keydown', e => {
  const tippt = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  if (e.key === '?' && !tippt && !$('tasten-dialog').open) { e.preventDefault(); $('tasten-dialog').showModal(); }
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
  if (h === '#/anmelden') return anmeldenZeigen();
  if (!ich && !gast) return anmeldenZeigen();
  if (!ich && h.startsWith('#/profil')) return anmeldenZeigen(); // Profil gibt es nur mit Konto
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
      if (!ich && gast) lobbyStart(); // Gäste sehen die offenen Räume auch
    } catch (e) {
      console.warn('[Quizbude] Sitzung nicht wiederhergestellt', e);
      if (e.sichtbar) setTimeout(() => { $('anmelde-fehler').textContent = e.message; }, 50);
    }
    nachrichtPruefen();
    sb.auth.onAuthStateChange(ereignis => {
      if (ereignis === 'SIGNED_OUT' && ich) { ich = null; chipZeichnen(); route(true); }
    });
  }
  route(true);
  setTimeout(versionPruefen, 4000);
}

// Für die Fehlersuche in der Konsole: quizbude.raum
// Bilder und Links nicht wegziehen lassen
document.addEventListener('dragstart', e => { if (e.target.closest?.('img, svg, a')) e.preventDefault(); });

window.quizbude = { get raum() { return raum; }, get sprint() { return sprint; }, versionPruefen };

los();
