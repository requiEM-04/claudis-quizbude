// Baut js/weltkarte-daten.js: vereinfachte Ländergrenzen (world-countries, ODbL) und Hauptstadt-Koordinaten
// (Natural Earth, gemeinfrei) für die Kategorie „Weltkarte“.
// Aufruf: node werkzeuge/karte_bauen.mjs <Ordner mit node_modules/world-countries> <ne_10m_populated_places_simple.geojson>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { LAENDER } from '../js/laender.js';

const [deps, neDatei] = process.argv.slice(2);
const require = createRequire(path.join(deps, 'x.js'));
const world = require('world-countries');
const geoDir = path.join(deps, 'node_modules/world-countries/data');

// Douglas-Peucker in Grad (reicht für eine Übersichtskarte)
function vereinfachen(pts, tol) {
  if (pts.length <= 4) return pts;
  const behalten = new Uint8Array(pts.length); behalten[0] = behalten[pts.length - 1] = 1;
  const stapel = [[0, pts.length - 1]];
  while (stapel.length) {
    const [a, b] = stapel.pop();
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    let max = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i];
      let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const ex = x1 + t * dx - x, ey = y1 + t * dy - y, d = ex * ex + ey * ey;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol * tol) { behalten[idx] = 1; stapel.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => behalten[i]);
}

const laender = {};
let punkte = 0;
for (const w of world) {
  if (w.cca3 === 'ATA' || !w.cca2) continue;
  const datei = path.join(geoDir, w.cca3.toLowerCase() + '.geo.json');
  if (!fs.existsSync(datei)) continue;
  const geo = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const ringe = [];
  for (const f of geo.features) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) for (const ring of poly) {
      let r = vereinfachen(ring, 0.05);
      if (r.length < 4) r = ring.length <= 12 ? ring : r; // Kleinstinseln roh behalten
      if (r.length < 3) continue;
      const flach = [];
      let alt = null;
      for (const [lon, lat] of r) {
        const p = [Math.round(lon * 100), Math.round(Math.max(-60, Math.min(85, lat)) * 100)];
        if (alt && p[0] === alt[0] && p[1] === alt[1]) continue;
        flach.push(p[0], p[1]); alt = p;
      }
      if (flach.length >= 6) { ringe.push(flach); punkte += flach.length / 2; }
    }
  }
  if (ringe.length) laender[w.cca2] = ringe;
}

// Hauptstädte: bevorzugt Natural-Earth-Hauptstadt, deren Name zur Stadt in laender.js passt
const ne = JSON.parse(fs.readFileSync(neDatei, 'utf8')).features.map(f => f.properties);
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const staedte = {};
const fehlt = [];
// Fälle, in denen Natural Earth eine andere Stadt als Hauptstadt führt oder die deutsche Schreibung stark abweicht
const NAME_EN = { 'Peking': 'Beijing', 'Wien': 'Vienna', 'Rom': 'Rome', 'Prag': 'Prague', 'Warschau': 'Warsaw', 'Moskau': 'Moscow', 'Kopenhagen': 'Copenhagen', 'Kairo': 'Cairo', 'Lissabon': 'Lisbon', 'Brüssel': 'Brussels', 'Athen': 'Athens', 'Belgrad': 'Belgrade', 'Bukarest': 'Bucharest', 'Neu-Delhi': 'New Delhi', 'Jerewan': 'Yerevan', 'Taschkent': 'Tashkent', 'Kiew': 'Kyiv', 'Algier': 'Algiers', 'Damaskus': 'Damascus', 'Tiflis': 'Tbilisi', 'Nikosia': 'Nicosia', 'Valletta': 'Valletta', 'Tripolis': 'Tripoli', 'Mexiko-Stadt': 'Mexico City', 'Havanna': 'Havana', 'Sanaa': "Sanaa" };
for (const l of LAENDER) {
  if (!l.stadt) continue;
  const kand = ne.filter(p => p.iso_a2 === l.code && /Admin-0 capital/.test(p.featurecla || ''));
  const ziel = [norm(l.stadt), norm(NAME_EN[l.stadt])];
  let p = kand.find(c => ziel.includes(norm(c.name)) || ziel.includes(norm(c.nameascii)) || ziel.some(z => z && norm(c.namealt).includes(z)));
  if (!p) p = ne.find(c => c.iso_a2 === l.code && (ziel.includes(norm(c.name)) || ziel.includes(norm(c.nameascii))));
  if (!p) p = kand.find(c => c.featurecla === 'Admin-0 capital') || kand[0];
  if (!p) { fehlt.push(`${l.code} ${l.stadt}`); continue; }
  staedte[l.code] = [Math.round(p.longitude * 100) / 100, Math.round(p.latitude * 100) / 100];
  if (!ziel.includes(norm(p.name)) && !ziel.includes(norm(p.nameascii))) console.log('Hauptstadt ungleich:', l.code, l.stadt, '→', p.name);
}

// fehlen in Natural Earth bzw. unter anderem Ländercode
Object.assign(staedte, { XK: [21.17, 42.67], NR: [166.92, -0.55] });

const aus = '// Automatisch erzeugt von werkzeuge/karte_bauen.mjs – nicht von Hand ändern.\n'
  + '// Grenzen: world-countries (ODbL), vereinfacht. Hauptstädte: Natural Earth (gemeinfrei).\n'
  + '// LAENDER: Ringe als flache Liste [lon*100, lat*100, …]. STAEDTE: [lon, lat].\n'
  + `export const LAENDER_RINGE = ${JSON.stringify(laender)};\n`
  + `export const STAEDTE = ${JSON.stringify(staedte)};\n`;
fs.writeFileSync(new URL('../js/weltkarte-daten.js', import.meta.url), aus);
console.log('Länder:', Object.keys(laender).length, '| Punkte:', punkte, '| Hauptstädte:', Object.keys(staedte).length, '| ohne Hauptstadt:', fehlt.join(', ') || '–', '| Größe:', Math.round(aus.length / 1024), 'KB');
