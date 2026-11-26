// Baut bilder/nachbarn-vorschau.svg (Kachelbild der Kategorie Nachbarn) aus den Kartendaten.
// Aufruf im Repo-Ordner: node werkzeuge/nachbarn_vorschau.mjs [LANDCODE]
import fs from 'node:fs';
import { LAENDER_RINGE } from '../js/weltkarte-daten.js';
import { GRENZEN } from '../js/grenzen.js';
import { nachbarKarte } from '../js/nachbarkarte.js';
const code = process.argv[2] || 'DE';
const svg = nachbarKarte(code, LAENDER_RINGE, GRENZEN, { label: 'Land mit seinen Nachbarn', stellen: 0, rand: 1.75, farben: {
  rest: 'rgba(205,182,140,.10)', restRand: 'rgba(205,182,140,.16)', nachbar: 'rgba(205,182,140,.22)', rand: 'rgba(220,200,162,.75)',
  land: '#DCC8A2', landRand: '#FFF3D6', glut: '#E8C98A',
} });
fs.writeFileSync('bilder/nachbarn-vorschau.svg', svg + '\n');
console.log('bilder/nachbarn-vorschau.svg', svg.length, 'Zeichen');
