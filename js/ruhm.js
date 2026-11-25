// Ruhm: Ränge wie Spielkarten (Bube, Dame, König, Ass), die Stufen sind die Kartenfarben
// in Skat-Reihenfolge Karo < Herz < Pik < Kreuz. Ganz oben steht der Joker.
// Der Ruhm selbst wird auf dem Server aus der Statistik berechnet (siehe werkzeuge/schema.sql).

export const SCHWELLEN = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 8000];

export const RAENGE = [
  { id: 'bube', name: 'Bube', kurz: 'B', farbe: '#E39A63', hell: '#F7C9A2', dunkel: '#94532A', titel: 'Gute Karten', effekt: 'Kupferfunken', rahmen: 'Kupferrand', hintergrund: 'Spieltisch' },
  { id: 'dame', name: 'Dame', kurz: 'D', farbe: '#F0A9C3', hell: '#FCDCE7', dunkel: '#A45A79', titel: 'Pokerface', effekt: 'Kartenwirbel', rahmen: 'Herzecken', hintergrund: 'Roter Samt' },
  { id: 'koenig', name: 'König', kurz: 'K', farbe: '#EBC660', hell: '#FDEBB0', dunkel: '#9E7520', titel: 'Sticht alles', effekt: 'Lichtstrahlen', rahmen: 'Goldkrone', hintergrund: 'Goldbrokat' },
  { id: 'ass', name: 'Ass', kurz: 'A', farbe: '#CFE6F3', hell: '#FFFFFF', dunkel: '#6F8A9B', titel: 'Ass im Ärmel', effekt: 'Funkelglanz', rahmen: 'Pik-Ecken', hintergrund: 'Mitternacht' },
  { id: 'joker', name: 'Joker', kurz: '★', farbe: '#C9A8FF', hell: '#FFFFFF', dunkel: '#7B5BC4', titel: 'Unberechenbar', effekt: 'Holo', rahmen: 'Regenbogen', hintergrund: 'Schillernde Nacht' },
];
export const rangVonId = id => RAENGE.find(r => r.id === id);

export const KARTENFARBEN = [
  { id: 'karo', name: 'Karo', rot: true },
  { id: 'herz', name: 'Herz', rot: true },
  { id: 'pik', name: 'Pik', rot: false },
  { id: 'kreuz', name: 'Kreuz', rot: false },
];

// Was gibt es, und ab welcher Kartenfarbe des Rangs (0 = Karo … 3 = Kreuz)?
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
  const kf = joker ? null : KARTENFARBEN[i % 4];
  return { i, rang, kf, name: joker ? 'Joker' : `${kf.name}-${rang.name}`, ab: SCHWELLEN[i], bis: SCHWELLEN[i + 1] ?? null };
}

export function ruhmInfo(ruhm = 0) {
  const s = stufeInfo(stufeVon(ruhm));
  return { ...s, ruhm, anteil: s.bis ? (ruhm - s.ab) / (s.bis - s.ab) : 1, fehlt: s.bis ? s.bis - ruhm : 0 };
}

export function freiAb(art, rangId) {
  if (rangId === 'joker') return JOKER;
  return RAENGE.findIndex(r => r.id === rangId) * 4 + ARTEN.find(a => a.id === art).ab;
}
export const istFrei = (art, rangId, ruhm) => stufeVon(ruhm) >= freiAb(art, rangId);

// Was wird mit Stufe i neu frei?
export function neuFrei(i) {
  if (i >= JOKER) return ARTEN.map(a => ({ art: a.id, rang: 'joker' }));
  const rang = RAENGE[Math.floor(i / 4)].id;
  return ARTEN.filter(a => a.ab === i % 4).map(a => ({ art: a.id, rang }));
}

// Gewählter Stil eines Spielers; nur was wirklich freigeschaltet ist, zählt
export function stilVon(p) {
  const st = p?.stil || {}, aus = {};
  for (const a of ARTEN) if (st[a.id] && istFrei(a.id, st[a.id], p.ruhm || 0)) aus[a.id] = st[a.id];
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

export const belohnungName = (art, rangId) => {
  const r = rangVonId(rangId);
  if (art === 'farbe') return `Namensfarbe ${r.name}`;
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

export function wappen(ruhm, { groesse = 28, stufe = null, titel = true } = {}) {
  const s = stufeInfo(stufe ?? stufeVon(ruhm || 0));
  const r = s.rang, joker = !s.kf, id = r.id;
  const sym = joker ? 'stern' : s.kf.id;
  const tinte = joker ? `url(#qbw-tinte)` : (s.kf.rot ? '#C8333F' : '#1D2125');
  const flaeche = joker ? 'url(#qbw-holo)' : '#FBF6EA';
  const defs = `<defs>
    <linearGradient id="qbw-rand-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r.hell}"/><stop offset=".45" stop-color="${r.farbe}"/><stop offset="1" stop-color="${r.dunkel}"/></linearGradient>
    ${joker ? `<linearGradient id="qbw-holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD9E6"/><stop offset=".25" stop-color="#FFF1C2"/><stop offset=".5" stop-color="#D3FBE6"/><stop offset=".75" stop-color="#D2E7FF"/><stop offset="1" stop-color="#EBDCFF"/></linearGradient>
    <linearGradient id="qbw-tinte" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0457B"/><stop offset=".5" stop-color="#7A4DE0"/><stop offset="1" stop-color="#1E8FD6"/></linearGradient>` : ''}
  </defs>`;
  const ecke = `<text x="8.6" y="15.2" font-size="9" font-weight="800" fill="${tinte}" font-family="var(--display, sans-serif)">${joker ? 'J' : r.kurz}</text>${symbol(sym, 7.2, 16.4, 6.4, tinte)}`;
  const deko = id === 'koenig'
    ? `<path d="M14.5 6.2 16.6 1.6l3.4 2.8L22 .6l2 3.8 3.4-2.8 2.1 4.6Z" fill="url(#qbw-rand-${id})" stroke="#6E5214" stroke-width=".5"/>`
    : id === 'ass' ? `<path d="m38.5 1 1.3 3.6 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3Z" fill="#fff" class="wappen-funkel"/>`
    : joker ? `<path d="m39 1 1.4 3.7 3.8 1.4-3.8 1.4L39 11.3l-1.4-3.8-3.8-1.4 3.8-1.4Z" fill="#FFE9A8" class="wappen-funkel"/>` : '';
  const hoehe = Math.round(groesse * 58 / 44);
  return `<svg class="wappen wappen-${id}" width="${groesse}" height="${hoehe}" viewBox="0 0 44 58" role="img" aria-label="${s.name}">${titel ? `<title>${s.name}</title>` : ''}${defs}
    <rect x="5" y="5.5" width="34" height="48" rx="5" fill="rgba(0,0,0,.35)" transform="translate(1.2 1.6)"/>
    <rect x="5" y="5.5" width="34" height="48" rx="5" fill="${flaeche}" stroke="url(#qbw-rand-${id})" stroke-width="2.6"/>
    <rect x="8.2" y="8.7" width="27.6" height="41.6" rx="2.6" fill="none" stroke="${r.farbe}" stroke-opacity=".45" stroke-width=".7"/>
    ${ecke}<g transform="rotate(180 22 29.5)">${ecke}</g>
    ${symbol(sym, 12.5, 20, 19, tinte)}
    ${deko}
  </svg>`;
}

// ---------- Karten-Effekte (Spielerkarte) ----------
// deterministisch verteilt, damit die Karte bei jedem Zeichnen gleich aussieht
const verteilt = (n, f) => Array.from({ length: n }, (_, i) => f(i, ((i * 37) % 100) / 100, ((i * 61 + 17) % 100) / 100));
export function effektHtml(rangId) {
  if (!rangId) return '';
  let innen = '';
  if (rangId === 'bube') innen = verteilt(16, (i, a, b) => `<i style="--x:${a * 100}%;--t:${(2.4 + b * 2.6).toFixed(2)}s;--d:${(-b * 4).toFixed(2)}s;--g:${(3 + (i % 3)).toFixed(0)}px"></i>`).join('');
  if (rangId === 'dame') innen = verteilt(10, (i, a, b) => `<i style="--x:${a * 92}%;--t:${(7 + b * 5).toFixed(2)}s;--d:${(-b * 10).toFixed(2)}s;--r:${(a * 80 - 40).toFixed(0)}deg">${symbolSvg(['herz', 'karo', 'pik', 'kreuz'][i % 4], i % 4 < 2 ? 'rot' : 'schwarz')}</i>`).join('');
  if (rangId === 'koenig') innen = '<b class="strahlen"></b><b class="schein"></b>';
  if (rangId === 'ass') innen = '<b class="glanz"></b>' + verteilt(9, (i, a, b) => `<i style="--x:${6 + a * 88}%;--y:${8 + b * 84}%;--t:${(2 + b * 2).toFixed(2)}s;--d:${(-a * 3).toFixed(2)}s">${symbolSvg('stern')}</i>`).join('');
  if (rangId === 'joker') innen = '<b class="holo"></b><b class="glanz"></b>' + verteilt(8, (i, a, b) => `<i style="--x:${a * 94}%;--y:${b * 90}%;--t:${(2.5 + b * 2).toFixed(2)}s;--d:${(-a * 3).toFixed(2)}s">${symbolSvg(['stern', 'herz', 'karo', 'pik', 'kreuz'][i % 5])}</i>`).join('');
  return `<div class="effekt e-${rangId}" aria-hidden="true">${innen}</div>`;
}

// Verzierungen für den Kartenrahmen
export function rahmenDeko(rangId) {
  if (rangId === 'dame') return `<div class="rahmen-deko" aria-hidden="true">${['lo', 'ro', 'lu', 'ru'].map(p => `<span class="${p}">${symbolSvg('herz')}</span>`).join('')}</div>`;
  if (rangId === 'ass') return `<div class="rahmen-deko" aria-hidden="true">${['lo', 'ro', 'lu', 'ru'].map(p => `<span class="${p}">${symbolSvg('pik')}</span>`).join('')}</div>`;
  if (rangId === 'koenig') return `<div class="rahmen-deko" aria-hidden="true"><span class="krone"><svg viewBox="0 0 30 16"><path d="M2 15 0 3l7.5 5L15 0l7.5 8L30 3l-2 12Z" fill="currentColor"/></svg></span></div>`;
  return '';
}
