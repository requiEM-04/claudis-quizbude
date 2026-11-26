// Ruhm wie ein Kartenspiel: Die Ränge sind die Kartenfarben in Skat-Reihenfolge Karo < Herz < Pik < Kreuz,
// in jeder Farbe geht es von Bube über Dame und König bis zum Ass. Ganz oben steht der Joker.
// Der Ruhm selbst wird auf dem Server aus der Statistik berechnet (siehe werkzeuge/schema.sql).

import { FIGUREN, KREISE, RINGE, bildEintrag, bildFreiAb } from './figuren.js?v=0.15.1';

export const SCHWELLEN = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 8000];

export const RAENGE = [
  { id: 'karo', name: 'Karo', rot: true, farbe: '#E39A63', hell: '#F7C9A2', dunkel: '#94532A', titel: 'Flaggenflüsterer', effekt: 'Kupferfunken', rahmen: 'Kupferrand', hintergrund: 'Spieltisch' },
  { id: 'herz', name: 'Herz', rot: true, farbe: '#F0A9C3', hell: '#FCDCE7', dunkel: '#A45A79', titel: 'Grenzgänger', effekt: 'Kartenwirbel', rahmen: 'Herzecken', hintergrund: 'Roter Samt' },
  { id: 'pik', name: 'Pik', rot: false, farbe: '#CFE6F3', hell: '#FFFFFF', dunkel: '#6F8A9B', titel: 'Lebendes Lexikon', effekt: 'Funkelglanz', rahmen: 'Pik-Ecken', hintergrund: 'Mitternacht' },
  { id: 'kreuz', name: 'Kreuz', rot: false, farbe: '#EBC660', hell: '#FDEBB0', dunkel: '#9E7520', titel: 'Wandelnder Atlas', effekt: 'Lichtstrahlen', rahmen: 'Goldkrone', hintergrund: 'Goldbrokat' },
  { id: 'joker', name: 'Joker', rot: false, farbe: '#C9A8FF', hell: '#FFFFFF', dunkel: '#7B5BC4', titel: 'Quizgott', effekt: 'Holo', rahmen: 'Regenbogen', hintergrund: 'Schillernde Nacht' },
];
export const rangVonId = id => RAENGE.find(r => r.id === id);

// Stufen innerhalb einer Farbe
export const BILDER = [
  { id: 'bube', name: 'Bube', kurz: 'B' },
  { id: 'dame', name: 'Dame', kurz: 'D' },
  { id: 'koenig', name: 'König', kurz: 'K' },
  { id: 'ass', name: 'Ass', kurz: 'A' },
];

// Was gibt es, und ab welcher Stufe innerhalb der Farbe (0 = Bube … 3 = Ass)?
export const ARTEN = [
  { id: 'farbe', name: 'Namensfarbe', ab: 0 },
  { id: 'titel', name: 'Titel', ab: 1 },
  { id: 'effekt', name: 'Karten-Effekt', ab: 2 },
  { id: 'rahmen', name: 'Rahmen', ab: 3 },
  { id: 'hintergrund', name: 'Hintergrund', ab: 3 },
];
export const JOKER = 16;

export function stufeVon(ruhm) {
  let i = 0;
  while (i + 1 < SCHWELLEN.length && (ruhm || 0) >= SCHWELLEN[i + 1]) i++;
  return i;
}

export function stufeInfo(i) {
  const joker = i >= JOKER;
  const rang = RAENGE[joker ? 4 : Math.floor(i / 4)];
  const bild = joker ? null : BILDER[i % 4];
  return { i, rang, bild, name: joker ? 'Joker' : `${rang.name}-${bild.name}`, ab: SCHWELLEN[i], bis: SCHWELLEN[i + 1] ?? null };
}

export function ruhmInfo(ruhm = 0) {
  const s = stufeInfo(stufeVon(ruhm));
  return { ...s, ruhm, anteil: s.bis ? (ruhm - s.ab) / (s.bis - s.ab) : 1, fehlt: s.bis ? s.bis - ruhm : 0 };
}

export function freiAb(art, rangId) {
  if (rangId === 'joker') return JOKER;
  const i = RAENGE.findIndex(r => r.id === rangId);
  return i < 0 ? Infinity : i * 4 + ARTEN.find(a => a.id === art).ab;
}

// Sonder-Freischaltungen, die nicht am Ruhm hängen (Winter 2026). Ob jemand sie wirklich hat, prüft der Server beim Speichern.
// Winterquest: jeden Tag drei Aufgaben (Tabelle winter_aufgaben), jede bringt Schneeflocken (leicht 8, mittel 10, schwer 12).
// Bei 100, 200 und 300 Schneeflocken wird je eine Belohnung frei. quest = { flocken, heute: [{ nr, stufe, typ, ziel, kategorie, flocken, wert }] }
const WINTER_AB = new Date('2026-12-01T00:00:00+01:00'), WINTER_BIS = new Date('2027-01-01T00:00:00+01:00');
export const WINTERQUEST = {
  ab: WINTER_AB, bis: WINTER_BIS, proTag: 30,
  stufen: [
    { id: 1, name: 'Erster Schnee', ziel: 100, art: 'rahmen', belohnung: 'eis' },
    { id: 2, name: 'Schneegestöber', ziel: 200, art: 'effekt', belohnung: 'schnee' },
    { id: 3, name: 'Heilige Nacht', ziel: 300, art: 'hintergrund', belohnung: 'weihnacht' },
  ],
};
export const questGeschafft = q => WINTERQUEST.stufen.filter(s => (q?.flocken || 0) >= s.ziel).length;
export const SONDER = {
  hintergrund: [
    { id: 'winter', hintergrund: 'Winterzauber', farbe: '#CFE3EE', hinweis: 'Ab 1. Dezember für alle, die bis Ende Dezember dabei sind',
      frei: p => new Date() >= WINTER_AB && (!p?.erstellt || new Date(p.erstellt) < WINTER_BIS) },
    { id: 'weihnacht', hintergrund: 'Weihnachtsnacht', farbe: '#F2C35B', hinweis: 'Belohnung der Winterquest, Stufe 3', frei: (p, q) => questGeschafft(q) >= 3 },
  ],
  rahmen: [{ id: 'eis', rahmen: 'Eiskristall', farbe: '#BFE3F5', hinweis: 'Belohnung der Winterquest, Stufe 1', frei: (p, q) => questGeschafft(q) >= 1 }],
  effekt: [{ id: 'schnee', effekt: 'Schneegestöber', farbe: '#E6F2FA', hinweis: 'Belohnung der Winterquest, Stufe 2', frei: (p, q) => questGeschafft(q) >= 2 }],
};
export const sonderVon = (art, id) => (SONDER[art] || []).find(s => s.id === id);
export const sonderFrei = (art, id, p, q) => !!sonderVon(art, id)?.frei(p, q);
export const istFrei = (art, rangId, ruhm) => stufeVon(ruhm) >= freiAb(art, rangId);

// Was wird mit Stufe i neu frei?
export function neuFrei(i) {
  const bild = [['ring', RINGE], ['kreis', KREISE], ['figur', FIGUREN]].flatMap(([art, liste]) => liste.filter(e => e.rang && bildFreiAb(art, e) === i).map(e => ({ art, rang: e.rang, id: e.id })));
  if (i >= JOKER) return [...ARTEN.map(a => ({ art: a.id, rang: 'joker' })), ...bild];
  const rang = RAENGE[Math.floor(i / 4)].id;
  return [...ARTEN.filter(a => a.ab === i % 4).map(a => ({ art: a.id, rang })), ...bild];
}

// Profilbild (Figur, bewegter Kreis, Rand). Ruhm-Stücke prüfen wir hier, Medaillen-Stücke prüft der Server beim Speichern.
export const BILD_ARTEN = ['figur', 'kreis', 'ring'];
export function bildVon(p) {
  const st = p?.stil || {}, aus = {}, stufe = stufeVon(p?.ruhm || 0);
  for (const art of BILD_ARTEN) {
    const e = bildEintrag(art, st[art]);
    if (e && (!e.rang || stufe >= bildFreiAb(art, e))) aus[art] = e.id;
  }
  return aus;
}

// Gewählter Stil eines Spielers; nur was wirklich freigeschaltet ist, zählt
export function stilVon(p) {
  const st = p?.stil || {}, aus = {};
  for (const a of ARTEN) {
    const v = st[a.id];
    // Sonderstücke prüft der Server beim Speichern, hier reicht, dass es sie gibt
    if (v && (istFrei(a.id, v, p.ruhm || 0) || sonderVon(a.id, v))) aus[a.id] = v;
  }
  return aus;
}

// Bestes Freigeschaltetes je Art (für „alles anlegen“)
export function bestesFrei(ruhm) {
  const aus = {};
  for (const a of ARTEN) {
    const frei = RAENGE.filter(r => istFrei(a.id, r.id, ruhm));
    if (frei.length) aus[a.id] = frei[frei.length - 1].id;
  }
  return aus;
}

export const belohnungName = (art, rangId, id) => {
  if (art === 'figur' || art === 'kreis' || art === 'ring') {
    const e = bildEintrag(art, id) || [FIGUREN, KREISE, RINGE][['figur', 'kreis', 'ring'].indexOf(art)].find(x => x.rang === rangId);
    return `${art === 'figur' ? 'Figur' : art === 'kreis' ? 'Bildhintergrund' : 'Bildrand'} ${e?.name || ''}`;
  }
  const r = rangVonId(rangId);
  if (art === 'farbe') return `Namensfarbe ${r.name}`;  // z. B. „Namensfarbe Herz“
  if (art === 'titel') return `Titel „${r.titel}“`;
  if (art === 'effekt') return `Effekt ${r.effekt}`;
  if (art === 'rahmen') return `Rahmen ${r.rahmen}`;
  return `Hintergrund ${r.hintergrund}`;
};

// ---------- Wappen: eine kleine Spielkarte ----------
const SYMBOL = {
  karo: '<path d="M12 1.5 20.5 12 12 22.5 3.5 12Z"/>',
  herz: '<path d="M12 21.6s-8.7-5.4-10.3-10.5C.6 7.3 3 3.5 6.9 3.5c2.3 0 3.9 1.3 5.1 3.1 1.2-1.8 2.8-3.1 5.1-3.1 3.9 0 6.3 3.8 5.2 7.6C20.7 16.2 12 21.6 12 21.6Z"/>',
  pik: '<path d="M12 1.6C9.5 5.6 2.5 9.4 2.5 14.3a4.7 4.7 0 0 0 8.1 3.2l-1.3 4.9h5.4l-1.3-4.9a4.7 4.7 0 0 0 8.1-3.2c0-4.9-7-8.7-9.5-12.7Z"/>',
  kreuz: '<circle cx="12" cy="6.6" r="4.7"/><circle cx="6.5" cy="13.4" r="4.7"/><circle cx="17.5" cy="13.4" r="4.7"/><path d="M10.6 12h2.8l1.4 10.4H9.2Z"/>',
  stern: '<path d="m12 1.5 3 6.7 7.3.7-5.5 4.8 1.6 7.1L12 17l-6.4 3.8 1.6-7.1-5.5-4.8 7.3-.7Z"/>',
};
export const symbol = (id, x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${(s / 24).toFixed(3)})" fill="${fill}">${SYMBOL[id]}</g>`;
export const symbolSvg = (id, klasse = '') => `<svg class="kf-symbol ${klasse}" viewBox="0 0 24 24" aria-hidden="true">${symbol(id, 0, 0, 24, 'currentColor')}</svg>`;

// Figuren für die Bildkarten (eigene, schlichte Zeichnungen): Bube mit Federhut, Dame mit Diadem, König mit Krone und Bart, Joker mit Narrenkappe
function figur(id, tinte, kfId) {
  const gold = '#D7A63A', haut = '#F3D9BD';
  const brust = kfId ? symbol(kfId, 19, 36, 6, '#FBF6EA') : '';
  const schultern = `<path d="M14 45.4c0-7.4 3.5-11.4 8-11.4s8 4 8 11.4Z" fill="${tinte}"/>`;
  const kopf = `<circle cx="22" cy="27" r="5.2" fill="${haut}" stroke="${tinte}" stroke-width=".9"/>`;
  if (id === 'koenig') return `${schultern}${brust}${kopf}
    <path d="M17.4 29.4c.6 3.6 2.4 5.3 4.6 5.3s4-1.7 4.6-5.3c-1.4 1-3 1.4-4.6 1.4s-3.2-.4-4.6-1.4Z" fill="${tinte}"/>
    <path d="M16.2 22.6 15.6 15.4l3.3 2.8L22 13.2l3.1 5 3.3-2.8-.6 7.2Z" fill="${gold}" stroke="#7A5A17" stroke-width=".6"/>`;
  if (id === 'dame') return `<path d="M15.4 31.8c-.8-5.6.3-11 6.6-11.2 6.3.2 7.4 5.6 6.6 11.2-1.6-.6-2.2-2.4-2.4-4.2H17.8c-.2 1.8-.8 3.6-2.4 4.2Z" fill="${tinte}"/>${schultern}${brust}${kopf}
    <path d="M17.2 22.6c1.4-1.7 3-2.5 4.8-2.5s3.4.8 4.8 2.5l-1.2-3-1.8 1.4L22 18l-1.8 3-1.8-1.4Z" fill="${gold}" stroke="#7A5A17" stroke-width=".5"/>`;
  if (id === 'bube') return `${schultern}${brust}${kopf}
    <path d="M15.6 24.2c0-3.6 2.8-5.6 6.6-5.6s6.4 1.8 6.6 4.4c-2.2-.8-4.4-1.1-6.6-1.1s-4.4.7-6.6 2.3Z" fill="${tinte}"/>
    <path d="M27.4 19.6c2.4-3.4 5-4.6 7.2-4.4-1.4 1.6-3.4 3.6-6.2 5.6Z" fill="${gold}"/>`;
  // Joker: Narrenkappe mit drei Schellen
  return `${schultern}${kopf}
    <path d="M16.4 24.6c-1.6-3.4-3.8-5.4-6.4-6 2.6-1.4 6.2-.6 8.8 2.4.6-3.6 2-6.2 3.2-7.4 1.2 1.2 2.6 3.8 3.2 7.4 2.6-3 6.2-3.8 8.8-2.4-2.6.6-4.8 2.6-6.4 6Z" fill="${tinte}"/>
    <circle cx="10" cy="18.6" r="1.5" fill="${gold}"/><circle cx="22" cy="12.8" r="1.5" fill="${gold}"/><circle cx="34" cy="18.6" r="1.5" fill="${gold}"/>`;
}

export function wappen(ruhm, { groesse = 28, stufe = null, titel = true } = {}) {
  const s = stufeInfo(stufe ?? stufeVon(ruhm || 0));
  const r = s.rang, joker = !s.bild, id = r.id, bild = joker ? 'joker' : s.bild.id;
  const sym = joker ? 'stern' : r.id;
  const tinte = joker ? `url(#qbw-tinte)` : (r.rot ? '#C8333F' : '#1D2125');
  const flaeche = joker ? 'url(#qbw-holo)' : '#FBF6EA';
  const defs = `<defs>
    <linearGradient id="qbw-rand-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r.hell}"/><stop offset=".45" stop-color="${r.farbe}"/><stop offset="1" stop-color="${r.dunkel}"/></linearGradient>
    ${joker ? `<linearGradient id="qbw-holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD9E6"/><stop offset=".25" stop-color="#FFF1C2"/><stop offset=".5" stop-color="#D3FBE6"/><stop offset=".75" stop-color="#D2E7FF"/><stop offset="1" stop-color="#EBDCFF"/></linearGradient>
    <linearGradient id="qbw-tinte" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0457B"/><stop offset=".5" stop-color="#7A4DE0"/><stop offset="1" stop-color="#1E8FD6"/></linearGradient>` : ''}
  </defs>`;
  const ecke = `<text x="8.6" y="15.2" font-size="9" font-weight="800" fill="${tinte}" font-family="var(--display, sans-serif)">${joker ? 'J' : s.bild.kurz}</text>${symbol(sym, 7.2, 16.4, 6.4, tinte)}`;
  const deko = bild === 'ass' ? `<path d="m38.5 1 1.3 3.6 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3Z" fill="#fff" class="wappen-funkel"/>`
    : joker ? `<path d="m39 1 1.4 3.7 3.8 1.4-3.8 1.4L39 11.3l-1.4-3.8-3.8-1.4 3.8-1.4Z" fill="#FFE9A8" class="wappen-funkel"/>` : '';
  const hoehe = Math.round(groesse * 58 / 44);
  return `<svg class="wappen wappen-${id} wappen-${bild}" width="${groesse}" height="${hoehe}" viewBox="0 0 44 58" role="img" aria-label="${s.name}">${titel ? `<title>${s.name}</title>` : ''}${defs}
    <rect x="5" y="5.5" width="34" height="48" rx="5" fill="rgba(0,0,0,.35)" transform="translate(1.2 1.6)"/>
    <rect x="5" y="5.5" width="34" height="48" rx="5" fill="${flaeche}" stroke="url(#qbw-rand-${id})" stroke-width="2.6"/>
    <rect x="8.2" y="8.7" width="27.6" height="41.6" rx="2.6" fill="none" stroke="${r.farbe}" stroke-opacity=".45" stroke-width=".7"/>
    ${ecke}<g transform="rotate(180 22 29.5)">${ecke}</g>
    ${bild === 'ass' ? symbol(sym, 12.5, 20, 19, tinte) : figur(bild, tinte, joker ? null : r.id)}
    ${deko}
  </svg>`;
}

// ---------- Karten-Effekte (Spielerkarte) ----------
// deterministisch verteilt, damit die Karte bei jedem Zeichnen gleich aussieht
const verteilt = (n, f) => Array.from({ length: n }, (_, i) => f(i, ((i * 37) % 100) / 100, ((i * 61 + 17) % 100) / 100));
export function effektHtml(rangId) {
  if (!rangId) return '';
  let innen = '';
  if (rangId === 'karo') innen = verteilt(11, (i, a, b) => `<i style="--x:${a * 100}%;--t:${(2.4 + b * 2.6).toFixed(2)}s;--d:${(-b * 4).toFixed(2)}s;--g:${(3 + (i % 3)).toFixed(0)}px"></i>`).join('');
  if (rangId === 'herz') innen = verteilt(7, (i, a, b) => `<i style="--x:${a * 92}%;--t:${(7 + b * 5).toFixed(2)}s;--d:${(-b * 10).toFixed(2)}s;--r:${(a * 80 - 40).toFixed(0)}deg">${symbolSvg(['herz', 'karo', 'pik', 'kreuz'][i % 4], i % 4 < 2 ? 'rot' : 'schwarz')}</i>`).join('');
  if (rangId === 'kreuz') innen = '<b class="strahlen"></b><b class="schein"></b>';
  if (rangId === 'pik') innen = '<b class="glanz"></b>' + verteilt(7, (i, a, b) => `<i style="--x:${6 + a * 88}%;--y:${8 + b * 84}%;--t:${(2 + b * 2).toFixed(2)}s;--d:${(-a * 3).toFixed(2)}s">${symbolSvg('stern')}</i>`).join('');
  if (rangId === 'schnee') innen = verteilt(12, (i, a, b) => `<i style="--x:${a * 100}%;--t:${(5 + b * 5).toFixed(2)}s;--d:${(-b * 9).toFixed(2)}s;--g:${(3 + (i % 3) * 1.5).toFixed(1)}px;--w:${(a * 30 - 15).toFixed(0)}px"${i % 3 === 0 ? ` class="kristall">${flockeSvg('', 2)}` : '>'}</i>`).join('');
  if (rangId === 'joker') innen = '<b class="holo"></b><b class="glanz"></b>' + verteilt(6, (i, a, b) => `<i style="--x:${a * 94}%;--y:${b * 90}%;--t:${(2.5 + b * 2).toFixed(2)}s;--d:${(-a * 3).toFixed(2)}s">${symbolSvg(['stern', 'herz', 'karo', 'pik', 'kreuz'][i % 5])}</i>`).join('');
  return `<div class="effekt e-${rangId}" aria-hidden="true">${innen}</div>`;
}

// Schneeflocke mit sechs verästelten Armen
export const flockeSvg = (klasse = '', breite = 1.6) => `<svg class="${klasse}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${breite}" stroke-linecap="round" aria-hidden="true"><path d="M12 12L12 2M12 6.6L14.76 4.29M12 6.6L9.24 4.29M12 4L13.69 2.59M12 4L10.31 2.59M12 12L20.66 7M16.68 9.3L20.06 10.53M16.68 9.3L17.3 5.75M18.93 8L21 8.75M18.93 8L19.31 5.83M12 12L20.66 17M16.68 14.7L17.3 18.25M16.68 14.7L20.06 13.47M18.93 16L19.31 18.17M18.93 16L21 15.25M12 12L12 22M12 17.4L9.24 19.71M12 17.4L14.76 19.71M12 20L10.31 21.41M12 20L13.69 21.41M12 12L3.34 17M7.32 14.7L3.94 13.47M7.32 14.7L6.7 18.25M5.07 16L3 15.25M5.07 16L4.69 18.17M12 12L3.34 7M7.32 9.3L6.7 5.75M7.32 9.3L3.94 10.53M5.07 8L4.69 5.83M5.07 8L3 8.75"/></svg>`;

// Verzierungen für den Kartenrahmen
export function rahmenDeko(rangId) {
  if (rangId === 'herz') return `<div class="rahmen-deko" aria-hidden="true">${['lo', 'ro', 'lu', 'ru'].map(p => `<span class="${p}">${symbolSvg('herz')}</span>`).join('')}</div>`;
  if (rangId === 'pik') return `<div class="rahmen-deko" aria-hidden="true">${['lo', 'ro', 'lu', 'ru'].map(p => `<span class="${p}">${symbolSvg('pik')}</span>`).join('')}</div>`;
  if (rangId === 'eis') return `<div class="rahmen-deko" aria-hidden="true">${['lo', 'ro', 'lu', 'ru'].map(p => `<span class="${p}">${flockeSvg('kf-symbol', 1.5)}</span>`).join('')}</div>`;
  if (rangId === 'kreuz') return `<div class="rahmen-deko" aria-hidden="true"><span class="krone"><svg viewBox="0 0 30 16"><path d="M2 15 0 3l7.5 5L15 0l7.5 8L30 3l-2 12Z" fill="currentColor"/></svg></span></div>`;
  return '';
}
