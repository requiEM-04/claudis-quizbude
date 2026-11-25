import { LAENDER } from './laender.js?v=0.7.0';
import { WISSEN, WISSEN_THEMEN } from './wissen.js?v=0.7.0';
import { EMOJI, EMOJI_THEMEN } from './emoji.js?v=0.7.0';
import { kanon } from './kanon.js?v=0.7.0';
import { LAND, AUSWAHL, pruefe, mischen, flaggeUrl, abgleichen } from './abgleich.js?v=0.7.0';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zahl = n => n.toLocaleString('de-DE');

// Umrisse sind groß, die kommen erst, wenn sie gebraucht werden
let UMRISSE = null;
let umrisseLaeuft = null;
export function umrisseLaden() {
  if (UMRISSE) return Promise.resolve(UMRISSE);
  umrisseLaeuft ||= import('./umrisse.js?v=0.7.0').then(m => { UMRISSE = m.UMRISSE; return UMRISSE; });
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

function stadtPruefen(text, l) {
  return abgleichen(text, l.stadtAntworten, a => {
    const andere = LAENDER.find(x => x.code !== l.code && x.stadtAntworten?.includes(a));
    return !!andere;
  });
}

export const KATEGORIEN = {
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

export const KATEGORIE_REIHE = ['flaggen', 'umrisse', 'hauptstaedte', 'groesser', 'wissen', 'emoji', 'gemischt'];
export const ARTEN = ['flaggen', 'umrisse', 'hauptstaedte', 'groesser', 'wissen', 'emoji'];

// Eine einzelne Frage für den Sprint. Länder-Kategorien fangen leicht an und werden mit jedem Treffer schwerer.
export function sprintFrage(kategorie, stand, benutzt) {
  const k = kategorie === 'gemischt' ? ARTEN[Math.floor(Math.random() * ARTEN.length)] : kategorie;
  const kat = KATEGORIEN[k];
  const leicht = kat.land && (stand < 8 || (stand < 16 && Math.random() < 0.5));
  const id = x => `${k}:${x.code ?? x.n}`;
  let pool = kat.pool(leicht ? 'bekannt' : kat.land ? 'alle' : 'alle').filter(x => !benutzt.has(id(x)));
  if (!pool.length) pool = kat.pool('alle').filter(x => !benutzt.has(id(x)));
  if (!pool.length) { for (const b of [...benutzt]) if (b.startsWith(k + ':')) benutzt.delete(b); pool = kat.pool('alle'); }
  const x = pool[Math.floor(Math.random() * pool.length)];
  benutzt.add(id(x));
  return kat.frage(x, !kat.tippen || kategorie === 'gemischt');
}

export function fragenBauen({ kategorie = 'flaggen', auswahl, runden, modus }) {
  if (kategorie === 'gemischt') {
    const arten = ['flaggen', 'umrisse', 'hauptstaedte', 'groesser', 'wissen', 'emoji'];
    const vorrat = Object.fromEntries(arten.map(k => [k, mischen(KATEGORIEN[k].pool(k === 'wissen' || k === 'emoji' ? 'alle' : auswahl))]));
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
  return pool.slice(0, Math.min(runden, pool.length)).map(x => kat.frage(x, mitOptionen));
}

export const kategorieVon = f => KATEGORIEN[f.k];
export const pruefeFrage = (f, text) => kategorieVon(f).pruefe(text, f);
export const richtigeWahl = (f, key) => kategorieVon(f).richtig(key, f);
export const optionSchluessel = f => (kategorieVon(f).schluessel ? kategorieVon(f).schluessel(f) : f.o);

export function fragenVorladen(fragen) {
  const bilder = new Set();
  let umrisse = false;
  for (const f of fragen) {
    if (['flaggen', 'umrisse', 'hauptstaedte'].includes(f.k)) bilder.add(f.c);
    if (f.k === 'groesser') { bilder.add(f.c); bilder.add(f.d); }
    if (f.k === 'umrisse') umrisse = true;
  }
  for (const c of bilder) { const img = new Image(); img.src = flaggeUrl(c); }
  return umrisse ? umrisseLaden() : Promise.resolve();
}

export { kanon };
