import { LAENDER } from './laender.js?v=0.14.1';
import { WISSEN, WISSEN_THEMEN } from './wissen.js?v=0.14.1';
import { EMOJI, EMOJI_THEMEN } from './emoji.js?v=0.14.1';
import { kanon } from './kanon.js?v=0.14.1';
import { LAND, AUSWAHL, pruefe, mischen, flaggeUrl, abgleichen } from './abgleich.js?v=0.14.1';
import { karteLaden, ringeAlle } from './weltkarte.js?v=0.14.1';
import { nachbarKarte } from './nachbarkarte.js?v=0.14.1';
import { GRENZEN } from './grenzen.js?v=0.14.1';
import { KENNZEICHEN } from './kennzeichen.js?v=0.14.1';
import { SCHAETZEN, SCHAETZ_THEMEN } from './schaetzen.js?v=0.14.1';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zahl = n => n.toLocaleString('de-DE');

// Umrisse sind groß, die kommen erst, wenn sie gebraucht werden
let UMRISSE = null;
let umrisseLaeuft = null;
export function umrisseLaden() {
  if (UMRISSE) return Promise.resolve(UMRISSE);
  umrisseLaeuft ||= import('./umrisse.js?v=0.14.1').then(m => { UMRISSE = m.UMRISSE; return UMRISSE; });
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
// leicht: der erste Buchstabe jedes Worts bleibt vorne; schwer: alle Wörter landen in einem einzigen Haufen
function durcheinander(b) {
  if (new Set(b).size <= 1) return b.join('');
  for (let v = 0; v < 12; v++) { const m = mischen(b).join(''); if (m !== b.join('')) return m; }
  return b.slice().reverse().join('');
}
function salat(name, stufe = 'mittel') {
  if (stufe === 'schwer') return durcheinander([...name.toUpperCase().replace(/[\s-]+/g, '')]);
  return name.split(/(\s+|-)/).map(teil => {
    if (/^(\s+|-)$/.test(teil) || teil.length < 2) return teil.toUpperCase();
    const b = [...teil.toUpperCase()];
    const vorne = stufe === 'leicht' ? b.shift() : '';
    return vorne + durcheinander(b);
  }).join('');
}
// Wie schwer ist ein Name zum Entwirren? Länge, Zahl der Wörter und seltene Buchstaben
const SELTEN = /[ÄÖÜYJQXZC]/g;
function salatStufe(name) {
  const n = name.replace(/[^\p{L}]/gu, '').length, woerter = name.split(/[\s-]+/).length, selten = (name.toUpperCase().match(SELTEN) || []).length;
  if (n <= 7 && woerter === 1 && selten <= 1) return 'leicht';
  if (n >= 10 || woerter >= 2 || selten >= 2) return 'schwer';
  return 'mittel';
}
// Punktwerte wie bei deutschen Buchstabenspielen, nur als Zierde auf den Steinen
const STEIN_WERT = { A: 1, B: 3, C: 4, D: 1, E: 1, F: 4, G: 2, H: 2, I: 1, J: 6, K: 4, L: 2, M: 3, N: 1, O: 2, P: 4, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 6, W: 3, X: 8, Y: 10, Z: 3, Ä: 6, Ö: 8, Ü: 6 };
const buchstabenZahl = n => n.replace(/[^\p{L}]/gu, '').length;
// drei falsche Länder mit ähnlich langem Namen (sonst verrät die Länge die Antwort)
function aehnlichLang(l) {
  const n = buchstabenZahl(l.name);
  const nah = mischen(LAENDER.filter(x => x.code !== l.code && Math.abs(buchstabenZahl(x.name) - n) <= 1 && (!l.bekannt || x.bekannt)));
  return nah.concat(nachbarn(l).filter(x => !nah.includes(x))).slice(0, 3);
}

// ---------- Autokennzeichen ----------
const KFZ = KENNZEICHEN.map(([code, ort, haupt]) => ({ code, ort, haupt: !!haupt }));
const KFZ_ORT = Object.fromEntries(KFZ.map(x => [x.code, x.ort]));
const KFZ_CODES = {}; // Ort -> alle Kürzel, Hauptkennzeichen zuerst
for (const x of KFZ) (KFZ_CODES[x.ort] ||= [])[x.haupt ? 'unshift' : 'push'](x.code);
const ortGrund = o => o.replace(/^(Region|Städteregion|Regionalverband|Rhein-Kreis|Landkreis|Kreis)\s+/, '').replace(/\s*\(.*\)$/, '').replace(/\s+(a\.|i\.|am|an der).*$/, '').trim();
const GRUND_ZAHL = {};
for (const o of Object.keys(KFZ_CODES)) GRUND_ZAHL[kanon(ortGrund(o))] = (GRUND_ZAHL[kanon(ortGrund(o))] || 0) + 1;
const ORT_ANTWORTEN = Object.fromEntries(Object.keys(KFZ_CODES).map(o => {
  const a = new Set([kanon(o)]);
  const g = kanon(ortGrund(o));
  if (GRUND_ZAHL[g] === 1) a.add(g);
  if (/kreis$/.test(g) && g.length > 9) a.add(g.replace(/-?kreis$/, ''));
  return [o, [...a]];
}));
const ALLE_ORTE = new Map(Object.entries(ORT_ANTWORTEN).flatMap(([o, as]) => as.map(a => [a, o])));
// Rest des Schilds, nur Deko: aus dem Kürzel abgeleitet, damit alle im Raum dasselbe sehen
function schildRest(code) {
  let h = 7; for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  const B = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  return `${B[h % B.length]}${B[(h >> 3) % B.length]} ${1 + (h % 9)}${(h >> 2) % 10}${(h >> 5) % 10}`;
}
// ähnliche Kürzel aus anderen Kreisen als falsche Antworten (gleicher Anfangsbuchstabe zuerst)
function kfzFalsche(x, anzahl, nurHaupt) {
  const fremd = KFZ.filter(y => y.ort !== x.ort && (!nurHaupt || y.haupt));
  const nah = mischen(fremd.filter(y => y.code[0] === x.code[0]));
  const rest = mischen(fremd.filter(y => y.code[0] !== x.code[0]));
  const aus = [], orte = new Set([x.ort]);
  for (const y of nah.concat(rest)) { if (orte.has(y.ort)) continue; orte.add(y.ort); aus.push(y.code); if (aus.length === anzahl) break; }
  return aus;
}
export const schildHtml = (code, klein = false) => `<span class="kfz${klein ? ' klein' : ''}" aria-label="Kennzeichen ${esc(code)}"><span class="kfz-eu" aria-hidden="true"><svg viewBox="-10 -10 20 20">${Array.from({ length: 12 }, (_, i) => `<circle cx="${(Math.cos(i * Math.PI / 6) * 6.6).toFixed(2)}" cy="${(Math.sin(i * Math.PI / 6) * 6.6).toFixed(2)}" r="1.7"/>`).join('')}</svg><b>D</b></span><span class="kfz-text">${esc(code)}</span>${klein ? '' : `<span class="kfz-siegel" aria-hidden="true"><i></i><i></i></span><span class="kfz-text">${code === 'QB' ? 'Z 26' : schildRest(code)}</span>`}</span>`;

// ---------- Schätzfragen ----------
// Zahl aus der Eingabe lesen: 1.234, 1,5, 2 Mio, 3,5 Mrd, 10k
export function zahlLesen(text) {
  let t = String(text ?? '').toLowerCase().replace(/\s+/g, '').replace(/[’'_]/g, '');
  let faktor = 1;
  const m = t.match(/(milliarden|milliarde|mrd|millionen|million|mio|tausend|tsd|k)\.?$/);
  if (m) { faktor = { milliarden: 1e9, milliarde: 1e9, mrd: 1e9, millionen: 1e6, million: 1e6, mio: 1e6, tausend: 1e3, tsd: 1e3, k: 1e3 }[m[1]]; t = t.slice(0, m.index); }
  t = t.replace(/[^0-9.,-]/g, '');
  if (!/\d/.test(t)) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n * faktor : null;
}
export const zahlText = n => (Math.abs(n) >= 1e9 && n % 1e8 === 0 ? `${(n / 1e9).toLocaleString('de-DE')} Mrd.` : Math.abs(n) >= 1e6 && n % 1e5 === 0 && n % 1e6 !== 0 ? `${(n / 1e6).toLocaleString('de-DE')} Mio.` : n.toLocaleString('de-DE', { maximumFractionDigits: 2 }));
// Wertung: wer näher dran ist, bekommt mehr; Treffer heißt höchstens 10 % daneben (bzw. ein Zehntel des Spielraums)
export function schaetzWertung(f, wert) {
  const q = SCHAETZEN[f.n];
  if (wert == null || !Number.isFinite(wert)) return null;
  let nah;
  if (q.s) nah = Math.max(0, 1 - Math.abs(wert - q.a) / q.s);
  else if (wert <= 0) nah = 0;
  else nah = Math.max(0, 1 - Math.abs(Math.log(wert / q.a)) / Math.log(3));
  const treffer = q.s ? Math.abs(wert - q.a) <= q.s * 0.1 : wert > 0 && Math.abs(Math.log(wert / q.a)) <= Math.log(1.1);
  const prozent = q.s ? null : Math.round((wert - q.a) / q.a * 100);
  return { pkt: Math.round(150 * nah), treffer, nah, abweichung: q.s ? `${wert > q.a ? '+' : ''}${(wert - q.a).toLocaleString('de-DE', { maximumFractionDigits: 2 })}` : `${prozent > 0 ? '+' : ''}${prozent.toLocaleString('de-DE')} %` };
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
    varianten: { titel: 'Flagge', werte: { normal: 'Ganz zeigen', aufdecken: 'Stück für Stück aufdecken' }, standard: 'normal', kurz: { aufdecken: 'Aufdecken' } },
    pool: a => laenderPool(a),
    frage: (l, mitOptionen, _ziel, opt = {}) => ({ k: 'flaggen', c: l.code, ...(mitOptionen && { o: mischen([l.code, ...nachbarn(l).map(x => x.code)]) }), ...(opt.v === 'aufdecken' && { v: 'auf', z: Math.max(5, Math.round((opt.zeit || 15) * 0.75)) }) }),
    hinweis: f => f.v === 'auf' ? 'Welches Land ist das? Je früher, desto mehr Punkte.' : 'Welches Land ist das?',
    bild: f => f.v === 'auf' ? aufdeckenHtml(f) : `<img class="bild-flagge" src="${flaggeUrl(f.c)}" alt="Flagge, welches Land ist das?" draggable="false">`,
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
    varianten: { titel: 'Schwierigkeit', werte: { leicht: 'Leicht, mit Karte', schwer: 'Schwer, ohne Karte' }, standard: 'leicht', kurz: { schwer: 'ohne Karte' } },
    pool: a => laenderPool(a, l => GRENZEN[l.code]),
    frage: (l, mitOptionen, _ziel, opt = {}) => {
      const v = opt.v === 'schwer' ? { v: 'schwer' } : {};
      if (!mitOptionen) return { k: 'nachbarn', c: l.code, ...v };
      const nb = GRENZEN[l.code], richtig = nb[Math.floor(Math.random() * nb.length)];
      const keinNachbar = x => x.code !== l.code && !nb.includes(x.code);
      const falsch = mischen(LAENDER.filter(x => keinNachbar(x) && x.region === l.region && (!l.bekannt || x.bekannt)))
        .concat(mischen(LAENDER.filter(x => keinNachbar(x) && x.region === l.region))).concat(mischen(LAENDER.filter(keinNachbar)));
      const drei = [...new Set(falsch.map(x => x.code))].slice(0, 3);
      return { k: 'nachbarn', c: l.code, o: mischen([richtig, ...drei]), ...v };
    },
    hinweis: f => f.o ? 'Welches Land grenzt daran?' : 'Nenne ein Nachbarland. Jedes zählt.',
    bild: f => {
      const n = GRENZEN[f.c].length, zahlText = n === 1 ? '1 Nachbarland' : `${n} Nachbarländer`, ringe = f.v === 'schwer' ? null : ringeAlle();
      if (!ringe) return `<div class="bild-land bild-nachbarn"><img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}</span><small>${zahlText}</small></div>`;
      return `<div class="bild-nachbarn mit-karte">${nachbarKarte(f.c, ringe, GRENZEN, { klasse: 'nk-karte', label: `Karte: ${esc(LAND[f.c].name)} und Umgebung` })}`
        + `<div class="nk-name"><img src="${flaggeUrl(f.c)}" alt=""><span>${esc(LAND[f.c].name)}</span></div><small class="nk-zahl">${zahlText}</small></div>`;
    },
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
    varianten: { titel: 'Schwierigkeit', werte: { leicht: 'Leicht: kurze Namen, erster Buchstabe steht', mittel: 'Mittel: alle Namen', schwer: 'Schwer: lange Namen, alles in einem Haufen' }, standard: 'mittel', kurz: { leicht: 'Leicht', schwer: 'Schwer' } },
    pool: (a, v) => {
      const basis = laenderPool(a, l => buchstabenZahl(l.name) >= 4 && buchstabenZahl(l.name) <= 20);
      if (v !== 'leicht' && v !== 'schwer') return basis;
      const passend = basis.filter(l => v === 'leicht' ? salatStufe(l.name) === 'leicht' : salatStufe(l.name) !== 'leicht');
      return passend.length >= 6 ? passend : basis; // kleine Auswahl: lieber alle als zu wenige
    },
    frage: (l, mitOptionen, _ziel, opt = {}) => {
      const v = opt.v === 'leicht' || opt.v === 'schwer' ? opt.v : 'mittel';
      return { k: 'buchstaben', c: l.code, s: salat(l.name, v), ...(v !== 'mittel' && { v }), ...(mitOptionen && { o: mischen([l.code, ...aehnlichLang(l).map(x => x.code)]) }) };
    },
    hinweis: f => f.v === 'leicht' ? 'Welches Land ist das? Der erste Buchstabe steht schon vorne.' : f.v === 'schwer' ? 'Alle Wörter durcheinander: welches Land ist das?' : 'Welches Land steckt in den Buchstaben?',
    bild: f => {
      let i = 0;
      const stein = (ch, j) => { const n = i++; return `<b${f.v === 'leicht' && j === 0 ? ' class="anfang"' : ''} style="--i:${n};--r:${((n * 37) % 7 - 3) * .7}deg">${esc(ch)}<sub>${STEIN_WERT[ch.toUpperCase()] ?? 1}</sub></b>`; };
      return `<div class="bild-salat${f.v ? ' salat-' + f.v : ''}" aria-label="Gemischte Buchstaben: ${esc(f.s)}">${f.s.split(/\s+/).filter(Boolean).map(w => `<span class="salat-wort">${[...w].map(stein).join('')}</span>`).join('')}</div>`;
    },
    option: (key) => esc(LAND[key].name),
    pruefe: (text, f) => pruefe(text, f.c),
    richtig: (key, f) => key === f.c,
    loesung: f => LAND[f.c].name,
    nachher: f => `<img class="info-flagge" src="${flaggeUrl(f.c)}" alt="">`,
    kurz: f => `<img src="${flaggeUrl(f.c)}" alt=""><span>${esc(f.s)}: <b>${esc(LAND[f.c].name)}</b></span>`,
  },

  kennzeichen: {
    name: 'Autokennzeichen', text: 'Woher kommt das Kennzeichen?', tippen: true, zeit: 15, stufig: true,
    auswahlen: { bekannt: 'Hauptkennzeichen der Kreise', alle: 'Alle, auch Altkennzeichen' }, standard: 'bekannt',
    varianten: { titel: 'Richtung', werte: { kuerzel: 'Kürzel gegeben, Ort raten', ort: 'Ort gegeben, Kürzel raten', beides: 'Gemischt' }, standard: 'kuerzel', kurz: { ort: 'Ort → Kürzel', beides: 'gemischt' } },
    pool: a => KFZ.filter(x => a === 'alle' || x.haupt),
    frage: (x, mitOptionen, _ziel, opt = {}) => {
      const v = opt.v || 'beides', r = v === 'beides' ? (Math.random() < 0.5 ? 'kuerzel' : 'ort') : v;
      return { k: 'kennzeichen', c: x.code, r, ...(mitOptionen && { o: mischen([x.code, ...kfzFalsche(x, 3, x.haupt)]) }) };
    },
    hinweis: f => f.r === 'ort' ? 'Welches Kennzeichen gehört zu diesem Ort?' : 'Woher kommt dieses Kennzeichen?',
    bild: f => f.r === 'ort'
      ? `<div class="ortsschild"><span>${esc(KFZ_ORT[f.c])}</span></div>`
      : `<div class="bild-kfz">${schildHtml(f.c)}</div>`,
    option: (key, f) => f.r === 'ort' ? `<span class="kfz-option">${esc(key)}</span>` : esc(KFZ_ORT[key]),
    pruefe: (text, f) => f.r === 'ort'
      ? abgleichen(text, KFZ_CODES[KFZ_ORT[f.c]].map(kanon), k => KFZ.some(x => x.ort !== KFZ_ORT[f.c] && kanon(x.code) === k))
      : abgleichen(text, ORT_ANTWORTEN[KFZ_ORT[f.c]], k => ALLE_ORTE.has(k) && ALLE_ORTE.get(k) !== KFZ_ORT[f.c]),
    richtig: (key, f) => KFZ_ORT[key] === KFZ_ORT[f.c],
    loesung: f => f.r === 'ort' ? KFZ_CODES[KFZ_ORT[f.c]].join(', ') : KFZ_ORT[f.c],
    info: f => { const andere = KFZ_CODES[KFZ_ORT[f.c]].filter(c => c !== f.c); return f.r === 'ort' ? `Kennzeichen für ${KFZ_ORT[f.c]}` : andere.length ? `Dort gibt es auch: ${andere.join(', ')}` : ''; },
    kurz: f => `${schildHtml(f.c, true)}<span>${esc(KFZ_ORT[f.c])}</span>`,
  },

  schaetzen: {
    name: 'Schätzfragen', text: 'Wer liegt am nächsten dran?', tippen: true, zahl: true, zeit: 20,
    auswahlen: { alle: 'Alle Themen', ...SCHAETZ_THEMEN }, standard: 'alle',
    pool: a => SCHAETZEN.map((q, n) => ({ ...q, n })).filter(q => a === 'alle' || q.t === a),
    frage: q => ({ k: 'schaetzen', n: q.n }),
    hinweis: f => `${SCHAETZ_THEMEN[SCHAETZEN[f.n].t]}: schätz so genau wie möglich`,
    bild: f => `<div class="bild-schaetzen"><p class="bild-frage">${esc(SCHAETZEN[f.n].f)}</p><span class="schaetz-einheit">Antwort in ${esc(SCHAETZEN[f.n].e)}</span></div>`,
    option: () => '',
    pruefe: () => 'falsch',
    richtig: () => false,
    loesung: f => `${zahlText(SCHAETZEN[f.n].a)} ${SCHAETZEN[f.n].e}`,
    info: f => SCHAETZEN[f.n].i || '',
    kurz: f => `<span class="kurz-frage">${esc(SCHAETZEN[f.n].f)}</span><b>${zahlText(SCHAETZEN[f.n].a)} ${esc(SCHAETZEN[f.n].e)}</b>`,
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

// Flagge unter 30 Kärtchen, die nacheinander verschwinden; Reihenfolge aus dem Ländercode, damit alle dasselbe sehen
function aufdeckenHtml(f) {
  const n = 30, reihe = [...Array(n).keys()];
  let h = 17; for (const ch of f.c) h = (h * 131 + ch.charCodeAt(0)) % 2147483647;
  for (let i = n - 1; i > 0; i--) { h = (h * 48271) % 2147483647; const j = h % (i + 1); [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
  const takt = f.z / n;
  return `<div class="bild-aufdecken" style="--z:${f.z}s"><img class="bild-flagge" src="${flaggeUrl(f.c)}" alt="Flagge, wird Stück für Stück aufgedeckt" draggable="false"><span class="ad-decke" aria-hidden="true">${reihe.map(r => `<i style="--t:${(r * takt).toFixed(2)}s"></i>`).join('')}</span></div>`;
}

const groesseres = f => (LAND[f.c].flaeche >= LAND[f.d].flaeche ? f.c : f.d);

// Emoji-Rätsel ist vorerst raus (wird inhaltlich überarbeitet), die Weltkarte steht direkt nach Flaggen
export const KATEGORIE_REIHE = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'nachbarn', 'buchstaben', 'kennzeichen', 'groesser', 'schaetzen', 'wissen', 'gemischt'];
// Was in „Gemischt“ vorkommen kann; ohne eigene Auswahl alle
export const ARTEN = ['flaggen', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben', 'kennzeichen', 'groesser', 'schaetzen', 'wissen'];
export const gemischtArten = arten => { const a = (Array.isArray(arten) ? arten : ARTEN).filter(k => ARTEN.includes(k)); return a.length ? a : ARTEN; };
export const alleArten = arten => gemischtArten(arten).length === ARTEN.length;
// Kategorien mit Sprint-Rekord und eigener Sprint-Bestenliste (Hauptstädte gibt es in zwei Richtungen)
export const SPRINT_REIHE = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben', 'kennzeichen', 'groesser', 'schaetzen', 'wissen', 'gemischt'];
// gewählte Variante einer Kategorie, sonst die Standardvariante
export const varianteVon = (kat, v) => (kat?.varianten ? (v in kat.varianten.werte ? v : kat.varianten.standard) : null);

// Eine einzelne Frage für den Sprint. Länder-Kategorien fangen leicht an und werden mit jedem Treffer schwerer.
export function sprintFrage(kategorie, stand, benutzt, region = null, opt = {}) {
  const arten = gemischtArten(opt.arten);
  const k = kategorie === 'gemischt' ? arten[Math.floor(Math.random() * arten.length)] : kategorie;
  const kat = KATEGORIEN[k];
  const v = kategorie === 'gemischt' ? null : varianteVon(kat, opt.variante);
  const leicht = (kat.land || kat.stufig) && (stand < 8 || (stand < 16 && Math.random() < 0.5));
  const id = x => `${k}:${x.code ?? x.n}`;
  // mit Region (Übung): nur Länder dieser Region, sonst erst bekannte, dann alle
  let pool = (kat.land && region ? kat.pool(region, v) : kat.pool(leicht ? 'bekannt' : 'alle', v)).filter(x => !benutzt.has(id(x)));
  if (!pool.length && kat.land && region) { for (const b of [...benutzt]) if (b.startsWith(k + ':')) benutzt.delete(b); pool = kat.pool(region, v); }
  if (!pool.length) pool = kat.pool('alle', v).filter(x => !benutzt.has(id(x)));
  if (!pool.length) { for (const b of [...benutzt]) if (b.startsWith(k + ':')) benutzt.delete(b); pool = kat.pool('alle', v); }
  const x = pool[Math.floor(Math.random() * pool.length)];
  benutzt.add(id(x));
  return kat.frage(x, !kat.tippen || kategorie === 'gemischt', undefined, { v: v ?? undefined, zeit: 8 });
}

export function fragenBauen({ kategorie = 'flaggen', auswahl, runden, modus, ziel, variante, arten: gewaehlt, zeit }) {
  if (kategorie === 'gemischt') {
    const arten = gemischtArten(gewaehlt);
    const vorrat = Object.fromEntries(arten.map(k => [k, mischen(KATEGORIEN[k].pool(auswahl in KATEGORIEN[k].auswahlen ? auswahl : KATEGORIEN[k].standard))]));
    const fragen = [];
    let letzte = '';
    for (let i = 0; i < runden; i++) {
      const moeglich = arten.filter(k => vorrat[k].length && k !== letzte);
      if (!moeglich.length) break;
      const k = moeglich[Math.floor(Math.random() * moeglich.length)];
      fragen.push(KATEGORIEN[k].frage(vorrat[k].pop(), true, undefined, { zeit }));
      letzte = k;
    }
    return fragen;
  }
  const kat = KATEGORIEN[kategorie];
  const v = varianteVon(kat, variante);
  const pool = mischen(kat.pool(auswahl in kat.auswahlen ? auswahl : kat.standard, v));
  const mitOptionen = !kat.zahl && (!kat.tippen || modus === 'auswahl');
  return pool.slice(0, Math.min(runden, pool.length)).map(x => kat.frage(x, mitOptionen, ziel, { v: v ?? undefined, zeit }));
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
  const karte = fragen.some(f => f.k === 'karte' || f.k === 'nachbarn');
  for (const c of bilder) { const img = new Image(); img.src = flaggeUrl(c); }
  return Promise.all([umrisse ? umrisseLaden() : null, karte ? karteLaden() : null]);
}

export { kanon };
