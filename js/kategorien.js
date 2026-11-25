import { LAENDER } from './laender.js?v=0.11.2';
import { WISSEN, WISSEN_THEMEN } from './wissen.js?v=0.11.2';
import { EMOJI, EMOJI_THEMEN } from './emoji.js?v=0.11.2';
import { kanon } from './kanon.js?v=0.11.2';
import { LAND, AUSWAHL, pruefe, mischen, flaggeUrl, abgleichen } from './abgleich.js?v=0.11.2';
import { karteLaden } from './weltkarte.js?v=0.11.2';
import { GRENZEN } from './grenzen.js?v=0.11.2';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zahl = n => n.toLocaleString('de-DE');

// Umrisse sind groß, die kommen erst, wenn sie gebraucht werden
let UMRISSE = null;
let umrisseLaeuft = null;
export function umrisseLaden() {
  if (UMRISSE) return Promise.resolve(UMRISSE);
  umrisseLaeuft ||= import('./umrisse.js?v=0.11.2').then(m => { UMRISSE = m.UMRISSE; return UMRISSE; });
  return umrisseLaeuft;
}
export const umrisseDa = () => !!UMRISSE;

const LAENDER_AUSWAHL = Object.fromEntries(Object.entries(AUSWAHL).map(([k, a]) => [k, a.name]));
const laenderPool = (auswahl, extra = () => true) => LAENDER.filter(l => (AUSWAHL[auswahl] || AUSWAHL.bekannt).filter(l) && extra(l));

// drei falsche Länder, bevorzugt aus derselben Ecke der Welt
function nachbarn(l, passt = () => true, anzahl = 3) {
  const nah = mischen(LAENDER.filter(x => x.code !== l.code && x.region === l.region && passt(x)));
  const fern = mischen(LAENDER.filter(x => x.code !== l.code && x.region !== l.region && passt(x)));
  return nah.concat(fern).slice(0, anzahl);
}

// Nachbarn: jedes Nachbarland zählt; ein anderes echtes Land ist sofort falsch (kein „knapp“)
function nachbarPruefen(text, f) {
  const nb = GRENZEN[f.c] || [];
  return abgleichen(text, nb.flatMap(n => LAND[n].antworten), k => LAENDER.some(x => !nb.includes(x.code) && x.antworten.includes(k)));
}
const nachbarListe = c => (GRENZEN[c] || []).map(n => LAND[n].name).sort((a, b) => a.localeCompare(b, 'de')).join(', ');

// Buchstabensalat: Buchstaben jedes Worts mischen, Leerzeichen und Bindestriche bleiben stehen, nie die richtige Reihenfolge
function salat(name) {
  return name.split(/(\s+|-)/).map(teil => {
    if (/^(\s+|-)$/.test(teil) || teil.length < 2) return teil.toUpperCase();
    const b = [...teil.toUpperCase()];
    if (new Set(b).size === 1) return b.join('');
    for (let v = 0; v < 12; v++) { const m = mischen(b).join(''); if (m !== b.join('')) return m; }
    return b.reverse().join('');
  }).join('');
}
const buchstabenZahl = n => n.replace(/[^\p{L}]/gu, '').length;
// drei falsche Länder mit ähnlich langem Namen (sonst verrät die Länge die Antwort)
function aehnlichLang(l) {
  const n = buchstabenZahl(l.name);
  const nah = mischen(LAENDER.filter(x => x.code !== l.code && Math.abs(buchstabenZahl(x.name) - n) <= 1 && (!l.bekannt || x.bekannt)));
  return nah.concat(nachbarn(l).filter(x => !nah.includes(x))).slice(0, 3);
}

function stadtPruefen(text, l) {
  return abgleichen(text, l.stadtAntworten, a => {
    const andere = LAENDER.find(x => x.code !== l.code && x.stadtAntworten?.includes(a));
    return !!andere;
  });
}

export const KATEGORIEN = {
  // Weltkarte: Land (Flagge + Name oben) oder Hauptstadt auf der Karte finden, Doppelklick setzt den Pin
  karte: {
    name: 'Weltkarte', text: 'Länder und Hauptstädte auf der Karte finden', tippen: false, karte: true, zeit: 20, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a),
    // ziel: 'land' | 'stadt' | 'beides' (Raum-Einstellung), im Sprint gemischt
    frage: (l, _mitOptionen, ziel = 'beides') => {
      const stadt = l.stadt && (ziel === 'stadt' || (ziel !== 'land' && Math.random() < .45));
      return { k: 'karte', c: l.code, t: stadt ? 'stadt' : 'land' };
    },
    hinweis: f => f.t === 'stadt' ? 'Wo liegt diese Hauptstadt? Doppelklick setzt deinen Pin.' : 'Wo liegt dieses Land? Doppelklick setzt deinen Pin.',
    bild: f => f.t === 'stadt'
      ? `<div class="wk-frage"><span class="wk-gross">${esc(LAND[f.c].stadt)}</span><span class="wk-klein"><img src="${flaggeUrl(f.c)}" alt="">Hauptstadt von ${esc(LAND[f.c].name)}</span></div>`
      : `<div class="wk-frage"><img class="wk-flagge" src="${flaggeUrl(f.c)}" alt=""><span class="wk-gross">${esc(LAND[f.c].name)}</span></div>`,
    option: () => '',
    pruefe: () => 'falsch',
    richtig: () => false,
    loesung: f => f.t === 'stadt' ? `${LAND[f.c].stadt} (${LAND[f.c].name})` : LAND[f.c].name,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${f.t === 'stadt' ? `<b>${esc(LAND[f.c].stadt)}</b>` : esc(LAND[f.c].name)}</span>`,
  },

  flaggen: {
    name: 'Flaggen', text: 'Land an der Flagge erkennen', tippen: true, zeit: 15, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'alle',
    pool: a => laenderPool(a),
    frage: (l, mitOptionen) => ({ k: 'flaggen', c: l.code, ...(mitOptionen && { o: mischen([l.code, ...nachbarn(l).map(x => x.code)]) }) }),
    hinweis: () => 'Welches Land ist das?',
    bild: f => `<img class="bild-flagge" src="${flaggeUrl(f.c)}" alt="Flagge, welches Land ist das?" draggable="false">`,
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => pruefe(text, f.c),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].name,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}</span>`,
  },

  umrisse: {
    name: 'Umrisse', text: 'Land an seiner Form erkennen', tippen: true, zeit: 15, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a, l => l.umriss),
    frage: (l, mitOptionen) => ({ k: 'umrisse', c: l.code, ...(mitOptionen && { o: mischen([l.code, ...nachbarn(l, x => x.umriss).map(x => x.code)]) }) }),
    hinweis: () => 'Welches Land hat diese Form?',
    bild: f => UMRISSE
      ? `<svg class="bild-umriss" viewBox="0 0 100 100" role="img" aria-label="Umriss eines Landes"><path d="${UMRISSE[f.c]}" fill-rule="evenodd"/></svg>`
      : '<div class="bild-laden">Umriss wird geladen …</div>',
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => pruefe(text, f.c),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].name,
    nachher: f => `<img class="info-flagge" src="${flaggeUrl(f.c)}" alt="">`,
    kurz: f => `${UMRISSE ? `<svg class="kurz-umriss" viewBox="0 0 100 100" aria-hidden="true"><path d="${UMRISSE[f.c]}" fill-rule="evenodd"/></svg>` : ''}<span>${esc(LAND[f.c].name)}</span>`,
  },

  hauptstaedte: {
    name: 'Hauptstädte', text: 'Wie heißt die Hauptstadt?', tippen: true, zeit: 15, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a, l => l.stadt),
    frage: (l, mitOptionen) => ({ k: 'hauptstaedte', c: l.code, ...(mitOptionen && { o: mischen([l.code, ...nachbarn(l, x => x.stadt).map(x => x.code)]) }) }),
    hinweis: () => 'Wie heißt die Hauptstadt?',
    bild: f => `<div class="bild-land"><img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}</span></div>`,
    option: (key) => esc(LAND[key].stadt),
    pruefe: (text, f) => stadtPruefen(text, LAND[f.c]),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].stadt,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}: <b>${esc(LAND[f.c].stadt)}</b></span>`,
  },

  // Hauptstädte rückwärts: Stadt ist gegeben, das Land wird geraten (im Raum und im Sprint als Richtung von „Hauptstädte“)
  stadtland: {
    name: 'Hauptstadt → Land', text: 'Zu welchem Land gehört die Hauptstadt?', tippen: true, zeit: 15, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a, l => l.stadt),
    frage: (l, mitOptionen) => ({ k: 'stadtland', c: l.code, ...(mitOptionen && { o: mischen([l.code, ...nachbarn(l, x => x.stadt).map(x => x.code)]) }) }),
    hinweis: () => 'Zu welchem Land gehört diese Hauptstadt?',
    bild: f => `<div class="bild-land bild-stadt"><span class="stadt-name">${esc(LAND[f.c].stadt)}</span></div>`,
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => pruefe(text, f.c),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].name,
    nachher: f => `<img class="info-flagge" src="${flaggeUrl(f.c)}" alt="">`,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span><b>${esc(LAND[f.c].stadt)}</b>: ${esc(LAND[f.c].name)}</span>`,
  },

  // Nachbarn: Land ist gegeben, ein Nachbarland nennen (tippen: jedes zählt) oder das eine richtige auswählen
  nachbarn: {
    name: 'Nachbarn', text: 'Welche Länder grenzen aneinander?', tippen: true, zeit: 15, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a, l => GRENZEN[l.code]),
    frage: (l, mitOptionen) => {
      if (!mitOptionen) return { k: 'nachbarn', c: l.code };
      const nb = GRENZEN[l.code], richtig = nb[Math.floor(Math.random() * nb.length)];
      const keinNachbar = x => x.code !== l.code && !nb.includes(x.code);
      const falsch = mischen(LAENDER.filter(x => keinNachbar(x) && x.region === l.region && (!l.bekannt || x.bekannt)))
        .concat(mischen(LAENDER.filter(x => keinNachbar(x) && x.region === l.region))).concat(mischen(LAENDER.filter(keinNachbar)));
      const drei = [...new Set(falsch.map(x => x.code))].slice(0, 3);
      return { k: 'nachbarn', c: l.code, o: mischen([richtig, ...drei]) };
    },
    hinweis: f => f.o ? 'Welches Land grenzt daran?' : 'Nenne ein Nachbarland. Jedes zählt.',
    bild: f => `<div class="bild-land bild-nachbarn"><img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}</span><small>${GRENZEN[f.c].length === 1 ? 'hat 1 Nachbarland' : `hat ${GRENZEN[f.c].length} Nachbarländer`}</small></div>`,
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => nachbarPruefen(text, f),
    richtig: (key, f) => GRENZEN[f.c].includes(key),
    loesung: f => nachbarListe(f.c),
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}: <b>${esc(nachbarListe(f.c))}</b></span>`,
  },

  // Buchstabensalat: Ländername mit gemischten Buchstaben; der Gastgeber mischt, alle sehen denselben Salat
  buchstaben: {
    name: 'Buchstabensalat', text: 'Ländernamen aus gemischten Buchstaben', tippen: true, zeit: 20, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a, l => buchstabenZahl(l.name) >= 4 && buchstabenZahl(l.name) <= 20),
    frage: (l, mitOptionen) => ({ k: 'buchstaben', c: l.code, s: salat(l.name), ...(mitOptionen && { o: mischen([l.code, ...aehnlichLang(l).map(x => x.code)]) }) }),
    hinweis: () => 'Welches Land steckt in den Buchstaben?',
    bild: f => `<div class="bild-salat" aria-label="Gemischte Buchstaben: ${esc(f.s)}">${f.s.split(/(\s+)/).filter(w => w.trim()).map((w, wi, alle) => `<span class="salat-wort">${[...w].map((ch, i) => `<b style="--i:${alle.slice(0, wi).reduce((n, x) => n + x.length, 0) + i}">${esc(ch)}</b>`).join('')}</span>`).join('')}</div>`,
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => pruefe(text, f.c),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].name,
    nachher: f => `<img class="info-flagge" src="${flaggeUrl(f.c)}" alt="">`,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${esc(f.s)}: <b>${esc(LAND[f.c].name)}</b></span>`,
  },

  groesser: {
    name: 'Größer oder kleiner', text: 'Welches Land ist größer?', tippen: false, zeit: 10, land: true,
    auswahlen: LAENDER_AUSWAHL, standard: 'bekannt',
    pool: a => laenderPool(a),
    // zwei Länder, die sich deutlich genug unterscheiden
    frage: (l) => {
      const pool = mischen(LAENDER.filter(x => x.code !== l.code && x.flaeche > 0 && (l.bekannt ? x.bekannt : true)));
      const b = pool.find(x => Math.max(x.flaeche, l.flaeche) / Math.min(x.flaeche, l.flaeche) > 1.25) || pool[0];
      return { k: 'groesser', c: l.code, d: b.code, o: mischen([l.code, b.code]) };
    },
    hinweis: () => 'Welches Land hat die größere Fläche?',
    bild: () => '',
    // Fläche und Balken sind schon da, aber unsichtbar, bis aufgedeckt wird
    option: (key, f) => {
      const max = Math.max(LAND[f.c].flaeche, LAND[f.d].flaeche);
      const anteil = Math.max(2, Math.round(LAND[key].flaeche / max * 100));
      return `<img src="${flaggeUrl(key)}" alt=""><span class="duell-name">${esc(LAND[key].name)}</span>`
        + `<span class="duell-zahl">${zahl(LAND[key].flaeche)} km²</span>`
        + `<span class="duell-balken" aria-hidden="true"><i style="--anteil:${anteil}%"></i></span>`
        + '<span class="duell-urteil"></span>';
    },
    optionKlasse: 'duell',
    pruefe: () => 'falsch',
    richtig: (key, f) => key === groesseres(f),
    loesung: f => `${LAND[groesseres(f)].name} ist größer`,
    info: f => { const [g, k] = groesseres(f) === f.c ? [f.c, f.d] : [f.d, f.c]; return `${LAND[g].name} hat ${zahl(LAND[g].flaeche)} km², ${LAND[k].name} ${zahl(LAND[k].flaeche)} km².`; },
    kurz: f => { const g = groesseres(f), k = g === f.c ? f.d : f.c; return `<span><b>${esc(LAND[g].name)}</b> ist größer als ${esc(LAND[k].name)}</span>`; },
  },

  wissen: {
    name: 'Allgemeinwissen', text: 'Geschichte, Natur, Sport, IT und mehr', tippen: false, zeit: 20,
    auswahlen: { alle: 'Alle Themen', ...WISSEN_THEMEN }, standard: 'alle',
    pool: a => WISSEN.map((q, n) => ({ ...q, n })).filter(q => a === 'alle' || q.t === a),
    frage: q => ({ k: 'wissen', n: q.n, o: mischen([q.a, ...q.x]) }),
    hinweis: f => WISSEN_THEMEN[WISSEN[f.n].t],
    bild: f => `<p class="bild-frage">${esc(WISSEN[f.n].f)}</p>`,
    option: (key, f) => esc(f.o[Number(key)]),
    schluessel: f => f.o.map((_, i) => String(i)),
    pruefe: () => 'falsch',
    richtig: (key, f) => f.o[Number(key)] === WISSEN[f.n].a,
    loesung: f => WISSEN[f.n].a,
    info: f => WISSEN[f.n].i || '',
    kurz: f => `<span class="kurz-frage">${esc(WISSEN[f.n].f)}</span><b>${esc(WISSEN[f.n].a)}</b>`,
  },

  emoji: {
    name: 'Emoji-Rätsel', text: 'Film, Wort oder Sprichwort erraten', tippen: false, zeit: 20,
    auswahlen: { alle: 'Alles gemischt', ...EMOJI_THEMEN }, standard: 'alle',
    pool: a => EMOJI.map((q, n) => ({ ...q, n })).filter(q => a === 'alle' || q.t === a),
    frage: q => {
      const falsch = mischen(EMOJI.filter(x => x.t === q.t && x.a !== q.a)).slice(0, 3).map(x => x.a);
      return { k: 'emoji', n: q.n, o: mischen([q.a, ...falsch]) };
    },
    hinweis: f => ({ filme: 'Welcher Film?', woerter: 'Welches Wort?', sprueche: 'Welches Sprichwort oder welche Redewendung?' }[EMOJI[f.n].t]),
    bild: f => `<p class="bild-emoji">${EMOJI[f.n].e}</p>`,
    option: (key, f) => esc(f.o[Number(key)]),
    schluessel: f => f.o.map((_, i) => String(i)),
    pruefe: () => 'falsch',
    richtig: (key, f) => f.o[Number(key)] === EMOJI[f.n].a,
    loesung: f => EMOJI[f.n].a,
    kurz: f => `<span class="kurz-emoji">${EMOJI[f.n].e}</span><b>${esc(EMOJI[f.n].a)}</b>`,
  },

  gemischt: {
    name: 'Gemischt', text: 'Von allem etwas', tippen: false, zeit: 20,
    auswahlen: { bekannt: 'Leicht', alle: 'Schwer' }, standard: 'bekannt',
  },

};

const groesseres = f => (LAND[f.c].flaeche >= LAND[f.d].flaeche ? f.c : f.d);

// Emoji-Rätsel ist vorerst raus (wird inhaltlich überarbeitet), die Weltkarte steht direkt nach Flaggen
export const KATEGORIE_REIHE = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'nachbarn', 'buchstaben', 'groesser', 'wissen', 'gemischt'];
export const ARTEN = ['flaggen', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben', 'groesser', 'wissen'];
// Kategorien mit Sprint-Rekord und eigener Sprint-Bestenliste (Hauptstädte gibt es in zwei Richtungen)
// Nachbarn und Buchstabensalat kommen in den Sprint, sobald der Server sie kennt (Migration 010)
export const SPRINT_REIHE = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'groesser', 'wissen', 'gemischt'];

// Eine einzelne Frage für den Sprint. Länder-Kategorien fangen leicht an und werden mit jedem Treffer schwerer.
export function sprintFrage(kategorie, stand, benutzt, region = null) {
  const k = kategorie === 'gemischt' ? ARTEN[Math.floor(Math.random() * ARTEN.length)] : kategorie;
  const kat = KATEGORIEN[k];
  const leicht = kat.land && (stand < 8 || (stand < 16 && Math.random() < 0.5));
  const id = x => `${k}:${x.code ?? x.n}`;
  // mit Region (Übung): nur Länder dieser Region, sonst erst bekannte, dann alle
  let pool = (kat.land && region ? kat.pool(region) : kat.pool(leicht ? 'bekannt' : 'alle')).filter(x => !benutzt.has(id(x)));
  if (!pool.length && kat.land && region) { for (const b of [...benutzt]) if (b.startsWith(k + ':')) benutzt.delete(b); pool = kat.pool(region); }
  if (!pool.length) pool = kat.pool('alle').filter(x => !benutzt.has(id(x)));
  if (!pool.length) { for (const b of [...benutzt]) if (b.startsWith(k + ':')) benutzt.delete(b); pool = kat.pool('alle'); }
  const x = pool[Math.floor(Math.random() * pool.length)];
  benutzt.add(id(x));
  return kat.frage(x, !kat.tippen || kategorie === 'gemischt');
}

export function fragenBauen({ kategorie = 'flaggen', auswahl, runden, modus, ziel }) {
  if (kategorie === 'gemischt') {
    const arten = ['flaggen', 'umrisse', 'hauptstaedte', 'nachbarn', 'buchstaben', 'groesser', 'wissen'];
    const vorrat = Object.fromEntries(arten.map(k => [k, mischen(KATEGORIEN[k].pool(k === 'wissen' ? 'alle' : auswahl))]));
    const fragen = [];
    let letzte = '';
    for (let i = 0; i < runden; i++) {
      const moeglich = arten.filter(k => vorrat[k].length && k !== letzte);
      if (!moeglich.length) break;
      const k = moeglich[Math.floor(Math.random() * moeglich.length)];
      fragen.push(KATEGORIEN[k].frage(vorrat[k].pop(), true));
      letzte = k;
    }
    return fragen;
  }
  const kat = KATEGORIEN[kategorie];
  const pool = mischen(kat.pool(auswahl in kat.auswahlen ? auswahl : kat.standard));
  const mitOptionen = !kat.tippen || modus === 'auswahl';
  return pool.slice(0, Math.min(runden, pool.length)).map(x => kat.frage(x, mitOptionen, ziel));
}

export const kategorieVon = f => KATEGORIEN[f.k];
export const pruefeFrage = (f, text) => kategorieVon(f).pruefe(text, f);
export const richtigeWahl = (f, key) => kategorieVon(f).richtig(key, f);
export const optionSchluessel = f => (kategorieVon(f).schluessel ? kategorieVon(f).schluessel(f) : f.o);

export function fragenVorladen(fragen) {
  const bilder = new Set();
  let umrisse = false;
  for (const f of fragen) {
    if (['flaggen', 'umrisse', 'hauptstaedte', 'karte', 'stadtland', 'nachbarn', 'buchstaben'].includes(f.k)) bilder.add(f.c);
    if (f.k === 'groesser') { bilder.add(f.c); bilder.add(f.d); }
    if (f.k === 'umrisse') umrisse = true;
  }
  for (const c of bilder) { const img = new Image(); img.src = flaggeUrl(c); }
  return Promise.all([umrisse ? umrisseLaden() : null, fragen.some(f => f.k === 'karte') ? karteLaden() : null]);
}

export { kanon };
