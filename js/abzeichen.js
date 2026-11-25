// Abzeichen: Erfolge mit fünf Seltenheitsstufen. Jede Stufe hat eine eigene Farbe, das Emblem zeigt das Thema.
// Bis zu drei Abzeichen (auch Saison-Medaillen) liegen auf der Spielerkarte statt Spiele, Siege, Sprint.

export const STUFEN = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', farbe: '#A7B0B5', hell: '#E3E8EA', tief: '#59636A' },
  { id: 'selten', name: 'Selten', farbe: '#6FCB93', hell: '#C9F2D8', tief: '#2C6E48' },
  { id: 'episch', name: 'Episch', farbe: '#7FAEFF', hell: '#D2E3FF', tief: '#2F4E8F' },
  { id: 'legendaer', name: 'Legendär', farbe: '#C29BFF', hell: '#EADBFF', tief: '#5B3C99' },
  { id: 'mythisch', name: 'Mythisch', farbe: '#F2C35B', hell: '#FFF0C2', tief: '#8E6512' },
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
  groesser: '<rect x="4" y="12" width="6" height="8" rx="1.2"/><rect x="14" y="4" width="6" height="16" rx="1.2"/>',
  wissen: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17.2h.01"/>',
  gemischt: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
};

// was: worauf es sich bezieht (für „16 / 20 Flaggen-Rekord“), stufen: Grenzen für Gewöhnlich … Mythisch
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
  { id: 'r_groesser', name: 'Augenmaß', was: 'Größer-oder-kleiner-Rekord', sym: 'groesser', wert: rekord('groesser'), stufen: [10, 16, 22, 28, 34] },
  { id: 'r_wissen', name: 'Wissensdurst', was: 'Allgemeinwissen-Rekord', sym: 'wissen', wert: rekord('wissen'), stufen: [4, 8, 12, 16, 20] },
  { id: 'r_gemischt', name: 'Allrounder', was: 'Gemischt-Rekord', sym: 'gemischt', wert: rekord('gemischt'), stufen: [6, 12, 18, 24, 30] },
];
export const erfolgVon = id => ERFOLGE.find(e => e.id === id);

// Stand eines Erfolgs: stufe 0 = noch nichts, 1 = Gewöhnlich … 5 = Mythisch
export function erfolgStand(e, p, extra) {
  const wert = e.wert(p || {}, extra);
  const stufe = e.stufen.filter(g => wert >= g).length;
  const naechste = stufe < 5 ? e.stufen[stufe] : null;
  const vorher = stufe ? e.stufen[stufe - 1] : 0;
  return { wert, stufe, naechste, anteil: naechste ? Math.min(1, (wert - vorher) / (naechste - vorher)) : 1 };
}

// Emblem: sechseckiges Schild in der Stufenfarbe, Symbol in der Mitte, Punkte unten zeigen die Stufe
let emblemNr = 0;
export function emblem(e, stufe, groesse = 44) {
  const s = STUFEN[Math.max(0, stufe - 1)];
  const aus = !stufe;
  const g = `abz-${aus ? 'aus' : s.id}-${++emblemNr}`; // eigene ID je Emblem (ausgeblendete Kopien würden sonst greifen)
  const punkte = [0, 1, 2, 3, 4].map(i => `<circle cx="${14 + i * 5}" cy="45.5" r="1.6" fill="${!aus && i < stufe ? s.hell : 'rgba(255,255,255,.18)'}"/>`).join('');
  return `<svg class="emblem${aus ? ' aus' : ` st-${s.id}`}" width="${groesse}" height="${Math.round(groesse * 52 / 48)}" viewBox="0 0 48 52" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${aus ? '#5A6166' : s.hell}"/><stop offset=".55" stop-color="${aus ? '#3E4448' : s.farbe}"/><stop offset="1" stop-color="${aus ? '#2C3135' : s.tief}"/></linearGradient></defs>
    <path d="M24 1.5 45 12.5v20.5L24 50.5 3 33V12.5Z" fill="url(#${g})"/>
    <path d="M24 6.5 40.2 15v16.2L24 44.6 7.8 31.2V15Z" fill="#1C2024"/>
    <g transform="translate(14 11.5) scale(.83)" fill="none" stroke="${aus ? '#6F777A' : s.hell}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SYM[e.sym] || ''}</g>
    ${punkte}
  </svg>`;
}

// Saison-Medaillen: Name der Wertung
const KAT_NAME = { flaggen: 'Flaggen', karte: 'Weltkarte', umrisse: 'Umrisse', hauptstaedte: 'Hauptstädte', stadtland: 'Hauptstadt → Land', groesser: 'Größer oder kleiner', wissen: 'Allgemeinwissen', gemischt: 'Gemischt', emoji: 'Emoji' };
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
