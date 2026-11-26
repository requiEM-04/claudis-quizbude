// Abzeichen: Erfolge in fünf Stufen von Bronze bis Diamant. Je höher, desto mehr Schmuck und Bewegung am Emblem.
// Bis zu drei Abzeichen (auch Saison-Medaillen) liegen auf der Spielerkarte statt Spiele, Siege, Sprint.

export const STUFEN = [
  { id: 'bronze', name: 'Bronze', farbe: '#C8834F', hell: '#F6C9A0', tief: '#6B3A1A', band: '#8E3B32' },
  { id: 'silber', name: 'Silber', farbe: '#BCC6CE', hell: '#FFFFFF', tief: '#5F6B74', band: '#3F5C8C' },
  { id: 'gold', name: 'Gold', farbe: '#E9B83A', hell: '#FFF1B0', tief: '#8A5D0E' },
  { id: 'platin', name: 'Platin', farbe: '#9FDDE4', hell: '#F2FEFF', tief: '#3C7A87' },
  { id: 'diamant', name: 'Diamant', farbe: '#B4A4FF', hell: '#FFFFFF', tief: '#4A3EA6' },
];

const rekord = k => p => k === 'flaggen' ? Math.max(p.sprint_rekord || 0, p.rekorde?.flaggen || 0) : (p.rekorde?.[k] || 0);

// Strichsymbole (24er-Raster), werden im Emblem in der Stufenfarbe gezeichnet
const SYM = {
  tuer: '<path d="M6 21V4h12v17"/><path d="M3 21h18"/><path d="M14.5 12.5h.01"/>',
  krone: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z"/>',
  haken: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
  stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  uhr: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10"/><path d="M10 2.5h4"/><path d="M12 2.5V6"/>',
  ziel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  medaille: '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.8 6 3h4l2 4 2-4h4l-2.5 6.8"/>',
  flaggen: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  karte: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
  umrisse: '<path d="M7 4c3 0 4 2 6 2s3-1 5 1-1 4 0 6 2 5-1 6-4-1-6 0-5 3-7 1 1-4-1-6-3-3-1-6 2-4 4-4Z"/>',
  hauptstaedte: '<path d="M3 21h18"/><path d="M5 21V9l4-3v15"/><path d="M9 21V4l6 3v14"/><path d="M15 21V11l4 2v8"/>',
  stadtland: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  nachbarn: '<path d="M3 6.5 8 4l4 2.5 4-2.5 5 2.5v13L16 22l-4-2.5L8 22l-5-2.5Z"/><path d="M12 6.5v13"/>',
  buchstaben: '<rect x="3" y="6" width="8" height="8" rx="1.8"/><rect x="13" y="10" width="8" height="8" rx="1.8"/>',
  groesser: '<rect x="4" y="12" width="6" height="8" rx="1.2"/><rect x="14" y="4" width="6" height="16" rx="1.2"/>',
  wissen: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17.2h.01"/>',
  gemischt: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
};

// was: worauf es sich bezieht (für „16 / 20 Flaggen-Rekord“), stufen: Grenzen für Bronze … Diamant
export const ERFOLGE = [
  { id: 'spiele', name: 'Stammgast', was: 'Raumspiele', sym: 'tuer', wert: p => p.spiele || 0, stufen: [5, 25, 75, 200, 500] },
  { id: 'siege', name: 'Siegertyp', was: 'Siege', sym: 'krone', wert: p => p.siege || 0, stufen: [1, 10, 30, 100, 250] },
  { id: 'richtig', name: 'Besserwisser', was: 'richtige Antworten', sym: 'haken', wert: p => p.richtig || 0, stufen: [25, 150, 500, 1500, 4000] },
  { id: 'punkte', name: 'Punktejäger', was: 'Punkte in Räumen', sym: 'stern', wert: p => p.punkte || 0, stufen: [2500, 15000, 50000, 150000, 400000] },
  { id: 'sprints', name: 'Dauerläufer', was: 'Sprints', sym: 'uhr', wert: p => p.sprints || 0, stufen: [5, 25, 75, 200, 500] },
  { id: 'treffer', name: 'Treffsicher', was: 'Sprint-Treffer', sym: 'ziel', wert: p => p.sprint_treffer || 0, stufen: [50, 300, 1000, 3000, 8000] },
  { id: 'saison', name: 'Saisonheld', was: 'Saison-Medaillen', sym: 'medaille', wert: (p, x) => x?.medaillen ?? 0, stufen: [1, 3, 6, 12, 24] },
  { id: 'r_flaggen', name: 'Flaggenblick', was: 'Flaggen-Rekord', sym: 'flaggen', wert: rekord('flaggen'), stufen: [8, 14, 20, 26, 32] },
  { id: 'r_karte', name: 'Kartenleser', was: 'Weltkarte-Rekord', sym: 'karte', wert: rekord('karte'), stufen: [4, 8, 12, 16, 20] },
  { id: 'r_umrisse', name: 'Umrissprofi', was: 'Umrisse-Rekord', sym: 'umrisse', wert: rekord('umrisse'), stufen: [5, 10, 15, 20, 25] },
  { id: 'r_hauptstaedte', name: 'Hauptstadtkenner', was: 'Hauptstädte-Rekord', sym: 'hauptstaedte', wert: rekord('hauptstaedte'), stufen: [5, 10, 15, 20, 25] },
  { id: 'r_stadtland', name: 'Länderfinder', was: 'Hauptstadt → Land-Rekord', sym: 'stadtland', wert: rekord('stadtland'), stufen: [5, 10, 15, 20, 25] },
  { id: 'r_nachbarn', name: 'Grenzkenner', was: 'Nachbarn-Rekord', sym: 'nachbarn', wert: rekord('nachbarn'), stufen: [5, 10, 15, 20, 25] },
  { id: 'r_buchstaben', name: 'Wortakrobat', was: 'Buchstabensalat-Rekord', sym: 'buchstaben', wert: rekord('buchstaben'), stufen: [4, 8, 12, 16, 20] },
  { id: 'r_groesser', name: 'Augenmaß', was: 'Größer-oder-kleiner-Rekord', sym: 'groesser', wert: rekord('groesser'), stufen: [10, 16, 22, 28, 34] },
  { id: 'r_wissen', name: 'Wissensdurst', was: 'Allgemeinwissen-Rekord', sym: 'wissen', wert: rekord('wissen'), stufen: [4, 8, 12, 16, 20] },
  { id: 'r_gemischt', name: 'Allrounder', was: 'Gemischt-Rekord', sym: 'gemischt', wert: rekord('gemischt'), stufen: [6, 12, 18, 24, 30] },
];
export const erfolgVon = id => ERFOLGE.find(e => e.id === id);

// Stand eines Erfolgs: stufe 0 = noch nichts, 1 = Bronze … 5 = Diamant
export function erfolgStand(e, p, extra) {
  const wert = e.wert(p || {}, extra);
  const stufe = e.stufen.filter(g => wert >= g).length;
  const naechste = stufe < 5 ? e.stufen[stufe] : null;
  const vorher = stufe ? e.stufen[stufe - 1] : 0;
  return { wert, stufe, naechste, anteil: naechste ? Math.min(1, (wert - vorher) / (naechste - vorher)) : 1 };
}

// Emblem: Metall-Medaillon mit Symbol. Ab Silber Lorbeer, ab Gold Krone und Funkeln, ab Platin Strahlenkranz,
// Diamant mit Regenbogen und Edelsteinen. Bewegung nur über transform/opacity (Glanz, Funkeln, Strahlen).
let emblemNr = 0;
const z = n => Math.round(n * 100) / 100;
function lorbeer(n, fuell, rand) {
  let aus = '';
  for (let i = 0; i < n; i++) {
    const w = 108 + i * (64 / Math.max(1, n - 1)), r = w * Math.PI / 180;
    const x = 30 + 21.5 * Math.cos(r), y = 30 + 21.5 * Math.sin(r), dreh = w + 90 + 28;
    const blatt = (bx, dr) => `<ellipse cx="${z(bx)}" cy="${z(y)}" rx="4.6" ry="2" transform="rotate(${z(dr)} ${z(bx)} ${z(y)})" fill="${fuell}" stroke="${rand}" stroke-width=".7"/>`;
    aus += blatt(x, dreh) + blatt(60 - x, 180 - dreh);
  }
  return aus;
}
const funke = (x, y, g, verz) => `<path class="em-funke" style="animation-delay:${verz}s" d="M${x} ${y - g}Q${x} ${y} ${x + g} ${y}Q${x} ${y} ${x} ${y + g}Q${x} ${y} ${x - g} ${y}Q${x} ${y} ${x} ${y - g}Z" fill="#fff"/>`;
function strahlen(spitzen, aussen, innen, fuell, klasse, versatz = 0) {
  const p = [];
  for (let i = 0; i < spitzen * 2; i++) {
    const w = (versatz + i * 180 / spitzen - 90) * Math.PI / 180, r = i % 2 ? innen : aussen;
    p.push(`${z(30 + r * Math.cos(w))} ${z(30 + r * Math.sin(w))}`);
  }
  return `<path class="${klasse}" d="M${p.join(' L')}Z" fill="${fuell}"/>`;
}
export function emblem(e, stufe, groesse = 44) {
  const aus = !stufe, t = Math.min(5, stufe || 0), s = STUFEN[Math.max(0, t - 1)];
  const n = ++emblemNr, id = k => `em${n}${k}`; // eigene IDs je Emblem (ausgeblendete Kopien würden sonst greifen)
  const sym = `<g transform="translate(21.4 21.4) scale(.72)" fill="none" stroke="${aus ? '#6F777A' : s.hell}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${SYM[e.sym] || ''}</g>`;
  if (aus) {
    return `<svg class="emblem aus" width="${groesse}" height="${groesse}" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="17" fill="#3A4045"/><circle cx="30" cy="30" r="13.8" fill="#1E2226"/>${sym}</svg>`;
  }
  const metall = `url(#${id('m')})`, regenbogen = `url(#${id('r')})`;
  let hinten = '', vorne = '';
  if (t >= 5) hinten += strahlen(16, 29.5, 23, regenbogen, 'em-strahlen em-strahlen-b', 11.25);
  if (t >= 4) hinten += strahlen(t >= 5 ? 8 : 12, t >= 5 ? 26.5 : 28.5, t >= 5 ? 19 : 21.5, metall, 'em-strahlen');
  if (t <= 2) hinten += `<path d="M22.5 40 L16.5 56 L21 53 L24 57.5 L28.5 44Z" fill="${s.band}"/><path d="M37.5 40 L43.5 56 L39 53 L36 57.5 L31.5 44Z" fill="${s.band}"/>`;
  if (t >= 2) hinten += lorbeer(t === 2 ? 3 : t === 3 ? 4 : 5, metall, s.tief);
  if (t >= 3) hinten += `<path d="M20.5 16 L21.8 5.5 L26.2 10 L30 3 L33.8 10 L38.2 5.5 L39.5 16Z" fill="${metall}" stroke="${s.tief}" stroke-width=".8" stroke-linejoin="round"/>`
    + (t >= 5 ? `<path d="M30 6.2 L32 9 L30 11.8 L28 9Z" fill="${regenbogen}" stroke="#fff" stroke-width=".5"/>` : '');
  if (t >= 5) vorne += `<path d="M30 47.5 L33.5 51.5 L30 56.5 L26.5 51.5Z" fill="${regenbogen}" stroke="#fff" stroke-width=".6"/>`;
  if (t >= 3) vorne += [[45, 17, 2.6, 0], [15.5, 43, 2.2, .9], [46, 43, 1.9, 1.7], [14, 16.5, 2, 2.4]].slice(0, t - 1).map(([x, y, g, v]) => funke(x, y, g, v)).join('');
  return `<svg class="emblem st-${s.id}" width="${groesse}" height="${groesse}" viewBox="0 0 60 60" aria-hidden="true">
    <defs>
      <linearGradient id="${id('m')}" gradientUnits="userSpaceOnUse" x1="8" y1="6" x2="52" y2="54"><stop offset="0" stop-color="${s.hell}"/><stop offset=".32" stop-color="${s.farbe}"/><stop offset=".56" stop-color="${s.tief}"/><stop offset=".8" stop-color="${s.farbe}"/><stop offset="1" stop-color="${s.hell}"/></linearGradient>
      <radialGradient id="${id('f')}" cx=".42" cy=".36" r=".7"><stop offset="0" stop-color="#323A41"/><stop offset="1" stop-color="#14181B"/></radialGradient>
      <linearGradient id="${id('g')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      ${t >= 5 ? `<linearGradient id="${id('r')}" gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="56" y2="56"><stop offset="0" stop-color="#FF9BD2"/><stop offset=".25" stop-color="#FFD98A"/><stop offset=".5" stop-color="#9BF2C0"/><stop offset=".75" stop-color="#8FD3FF"/><stop offset="1" stop-color="#C6A8FF"/></linearGradient>` : ''}
      ${t >= 3 ? `<radialGradient id="${id('s')}"><stop offset=".45" stop-color="${s.farbe}" stop-opacity=".5"/><stop offset="1" stop-color="${s.farbe}" stop-opacity="0"/></radialGradient>` : ''}
      <clipPath id="${id('c')}"><circle cx="30" cy="30" r="17"/></clipPath>
    </defs>
    ${t >= 3 ? `<circle cx="30" cy="30" r="29.5" fill="url(#${id('s')})"/>` : ''}
    ${hinten}
    <circle cx="30" cy="30" r="17" fill="${metall}" stroke="${s.tief}" stroke-width="1"/>
    <circle cx="30" cy="30" r="15.3" fill="none" stroke="${s.hell}" stroke-opacity=".5" stroke-width=".8"/>
    <circle cx="30" cy="30" r="13.8" fill="url(#${id('f')})"/>
    ${sym}
    <g clip-path="url(#${id('c')})"><g transform="rotate(25 30 30)"><rect class="em-glanz" x="25.5" y="2" width="9" height="56" fill="url(#${id('g')})"/></g></g>
    ${vorne}
  </svg>`;
}

// Saison-Medaillen: Name der Wertung
const KAT_NAME = { flaggen: 'Flaggen', karte: 'Weltkarte', umrisse: 'Umrisse', hauptstaedte: 'Hauptstädte', stadtland: 'Hauptstadt → Land', nachbarn: 'Nachbarn', buchstaben: 'Buchstabensalat', schaetzen: 'Schätzfragen', groesser: 'Größer oder kleiner', wissen: 'Allgemeinwissen', gemischt: 'Gemischt', emoji: 'Emoji' };
export function wertungName(w) {
  if (w === 'punkte') return 'Punkte';
  if (w === 'siege') return 'Siege';
  if (w.startsWith('sprint:')) return `Sprint ${KAT_NAME[w.slice(7)] || w.slice(7)}`;
  return w;
}
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const saisonName = s => { const [j, m] = s.split('-').map(Number); return `${MONATE[m - 1]} ${j}`; };
export const saisonKurz = s => { const [j, m] = s.split('-'); return `${m}/${j.slice(2)}`; };

// Vitrine: Einträge „e:<erfolg>“ oder „s:<saison>:<wertung>:<platz>“
export function vitrineLesen(p, extra, medaillen = null) {
  const aus = [];
  for (const v of Array.isArray(p?.vitrine) ? p.vitrine.slice(0, 3) : []) {
    if (typeof v !== 'string') continue;
    if (v.startsWith('e:')) {
      const e = erfolgVon(v.slice(2)); if (!e) continue;
      const st = erfolgStand(e, p, extra);
      if (st.stufe) aus.push({ art: 'e', id: v, e, stufe: st.stufe, wert: st.wert });
    } else if (v.startsWith('s:')) {
      // Wertung kann selbst einen Doppelpunkt enthalten (sprint:flaggen)
      const teile = v.split(':');
      const saison = teile[1], pl = Number(teile[teile.length - 1]), w = teile.slice(2, -1).join(':');
      if (!saison || !w || !(pl >= 1 && pl <= 3)) continue;
      if (medaillen && !medaillen.some(m => m.saison === saison && m.wertung === w && m.platz === pl)) continue;
      aus.push({ art: 's', id: v, saison, wertung: w, platz: pl });
    }
  }
  return aus;
}

// Kartenskins: eigene Oberfläche der Spielerkarte, freigeschaltet über Abzeichen (der Server rechnet dasselbe nach, Migration 011).
// Die IDs sind die vom Server geprüften Schlüssel und bleiben deshalb, auch wenn Name und Aussehen sich geändert haben.
export const SKINS = [
  { id: 'gewitter', name: 'Mitternacht', stufe: 2, anzahl: 5 },
  { id: 'matrix', name: 'Neon', stufe: 3, anzahl: 1 },
  { id: 'frost', name: 'Saphir', stufe: 3, anzahl: 3 },
  { id: 'toxisch', name: 'Smaragd', stufe: 4, anzahl: 1 },
  { id: 'lava', name: 'Rubin', stufe: 4, anzahl: 3 },
  { id: 'galaxie', name: 'Harlekin', stufe: 5, anzahl: 1 },
  { id: 'meister', name: 'Royal Flush', medaille: true },
];
export const skinVonId = id => SKINS.find(s => s.id === id) || null;
export const skinVon = p => skinVonId(p?.stil?.skin)?.id || null;
export function skinBedingung(s) {
  if (s.medaille) return 'eine Saison-Medaille';
  return `${s.anzahl === 1 ? 'ein' : s.anzahl} Abzeichen in ${STUFEN[s.stufe - 1].name} oder besser`;
}
export function skinStand(s, p, extra) {
  if (s.medaille) { const n = extra?.medaillen || 0; return { frei: n >= 1, hat: Math.min(n, 1), braucht: 1 }; }
  const n = ERFOLGE.filter(e => erfolgStand(e, p, extra).stufe >= s.stufe).length;
  return { frei: n >= s.anzahl, hat: Math.min(n, s.anzahl), braucht: s.anzahl };
}
