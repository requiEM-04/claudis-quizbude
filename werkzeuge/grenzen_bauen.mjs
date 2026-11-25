// Baut js/grenzen.js: Nachbarländer (Landgrenzen) je Land, nur Länder, die es in js/laender.js gibt.
// Aufruf: node werkzeuge/grenzen_bauen.mjs <ordner mit node_modules/world-countries>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LAENDER } from '../js/laender.js';

const basis = process.argv[2];
if (!basis) { console.error('Ordner mit node_modules fehlt'); process.exit(1); }
const welt = JSON.parse(readFileSync(join(basis, 'node_modules/world-countries/countries.json'), 'utf8'));
const da = new Set(LAENDER.map(l => l.code));
const cca2 = Object.fromEntries(welt.map(c => [c.cca3, c.cca2]));
const grenzen = {};
for (const c of welt) {
  if (!da.has(c.cca2)) continue;
  const n = (c.borders || []).map(b => cca2[b]).filter(x => x && da.has(x)).sort();
  if (n.length) grenzen[c.cca2] = n;
}
writeFileSync(new URL('../js/grenzen.js', import.meta.url),
  '// Automatisch erzeugt von werkzeuge/grenzen_bauen.mjs – nicht von Hand ändern.\n// Landgrenzen aus world-countries (ODbL).\n'
  + `export const GRENZEN = ${JSON.stringify(grenzen)};\n`);
console.log('Länder mit Nachbarn:', Object.keys(grenzen).length, 'von', da.size);
