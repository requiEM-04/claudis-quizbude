// Erzeugt js/laender.js und kopiert die Flaggen nach flaggen/.
// Aufruf (Ordner mit node_modules von flag-icons + world-countries als Argument):
//   node werkzeuge/flaggen_bauen.mjs /pfad/zu/deps
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { kanon } from '../js/kanon.js';

const deps = process.argv[2];
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(deps, 'package.json'));
const world = require('world-countries');
const flagDir = path.join(deps, 'node_modules/flag-icons/flags/4x3');

// Zusätzliche Antworten, die Leute in der Pause wirklich tippen
const EXTRA = {
  US: ['USA', 'US', 'Amerika', 'Vereinigte Staaten', 'Vereinigte Staaten von Amerika'],
  GB: ['UK', 'Großbritannien', 'Britannien', 'Vereinigtes Königreich', 'Great Britain'],
  NL: ['Holland'],
  CZ: ['Tschechische Republik', 'Tschechei', 'Czechia'],
  CI: ['Elfenbeinküste', "Côte d'Ivoire", 'Ivory Coast'],
  CD: ['DR Kongo', 'Demokratische Republik Kongo', 'Kongo-Kinshasa', 'DRK', 'Zaire', 'DRC'],
  CG: ['Kongo', 'Republik Kongo', 'Kongo-Brazzaville'],
  KP: ['Nordkorea'], KR: ['Südkorea', 'Korea'],
  BY: ['Weißrussland', 'Belarus'], MM: ['Birma', 'Burma', 'Myanmar'],
  SZ: ['Swasiland', 'Eswatini'], TL: ['Osttimor', 'Timor-Leste'],
  CV: ['Kap Verde', 'Kapverden', 'Cabo Verde'], TR: ['Türkei', 'Türkiye'],
  VA: ['Vatikan', 'Vatikanstadt'], MK: ['Mazedonien', 'Nordmazedonien'],
  AE: ['VAE', 'UAE', 'Emirate', 'Vereinigte Arabische Emirate'],
  BA: ['Bosnien', 'Bosnien und Herzegowina', 'Bosnien-Herzegowina'],
  DO: ['Dominikanische Republik', 'Dom Rep'], CF: ['ZAR', 'Zentralafrikanische Republik'],
  VC: ['St. Vincent'], KN: ['St. Kitts', 'St. Kitts und Nevis'], LC: ['St. Lucia'],
  TT: ['Trinidad'], AG: ['Antigua'], ST: ['Sao Tome', 'São Tomé und Príncipe'],
  PG: ['Papua-Neuguinea', 'Papua'], MD: ['Moldau', 'Moldawien', 'Moldova'],
  IR: ['Persien'], SA: ['Saudi-Arabien'], FM: ['Mikronesien'],
  RU: ['Russland'], CN: ['China', 'Volksrepublik China'], LA: ['Laos'],
  GM: ['Gambia'], BS: ['Bahamas'], VN: ['Vietnam'], SY: ['Syrien'],
  PS: ['Palästina'], XK: ['Kosovo'], TW: ['Taiwan'],
  KM: ['Komoren'], SC: ['Seychellen'], MV: ['Malediven'], PH: ['Philippinen'],
};

// Bekannte Flaggen für die leichte Auswahl
const BEKANNT = ('DE AT CH FR IT ES PT NL BE LU GB IE DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS UA RU TR '
  + 'US CA MX BR AR CL CO PE CU JM CN JP KR KP IN PK TH VN ID PH MY SG AU NZ ZA EG MA NG KE GH '
  + 'SA AE IL IR IQ SY QA GE VA MC AL').split(' ');

// Anzeigenamen, wie man sie im Deutschen eher sagt
const NAME = { CI: 'Elfenbeinküste', CD: 'DR Kongo', CG: 'Republik Kongo', SZ: 'Eswatini', US: 'USA',
  GB: 'Großbritannien', VA: 'Vatikan', MD: 'Moldau' };

const REGION = { Europe: 'europa', Asia: 'asien', Africa: 'afrika', Americas: 'amerika', Oceania: 'ozeanien' };
const DAZU = new Set(['VA', 'XK', 'PS', 'TW']); // keine UN-Mitglieder, aber Länder, die man kennt

const pool = world.filter(c => (c.unMember || DAZU.has(c.cca2)) && fs.existsSync(path.join(flagDir, c.cca2.toLowerCase() + '.svg')));


const liste = pool.map(c => {
  const code = c.cca2;
  const de = c.translations.deu?.common || c.name.common;
  const anzeige = NAME[code] || de;
  const roh = [anzeige, de, c.translations.deu?.official, c.name.common, c.name.official,
    ...(c.altSpellings || []).filter(a => a.length > 3), ...(EXTRA[code] || [])].filter(Boolean);
  return { code, name: anzeige, region: REGION[c.region] || 'sonst', bekannt: BEKANNT.includes(code), roh };
});

// Antworten, die bei zwei Ländern passen würden, fliegen raus
const wem = new Map();
for (const l of liste) for (const a of new Set(l.roh.map(kanon))) {
  if (!a) continue;
  wem.set(a, (wem.get(a) || new Set()).add(l.code));
}
const doppelt = [...wem].filter(([, s]) => s.size > 1);
for (const l of liste) {
  const eigene = EXTRA[l.code] ? new Set(EXTRA[l.code].map(kanon)) : new Set();
  l.antworten = [...new Set(l.roh.map(kanon))].filter(a => a && (wem.get(a).size === 1 || eigene.has(a)) && a.length >= 2);
  delete l.roh;
}
liste.sort((a, b) => a.name.localeCompare(b.name, 'de'));

const fehlt = BEKANNT.filter(b => !liste.find(l => l.code === b));
if (fehlt.length) throw new Error('Bekannt-Liste ohne Flagge: ' + fehlt);

fs.mkdirSync(path.join(repo, 'flaggen'), { recursive: true });
for (const l of liste) fs.copyFileSync(path.join(flagDir, l.code.toLowerCase() + '.svg'), path.join(repo, 'flaggen', l.code.toLowerCase() + '.svg'));

const js = '// Automatisch erzeugt von werkzeuge/flaggen_bauen.mjs – nicht von Hand ändern.\n'
  + '// Länderdaten: world-countries (ODbL), Flaggen: flag-icons (MIT).\n'
  + 'export const LAENDER = ' + JSON.stringify(liste) + ';\n';
fs.writeFileSync(path.join(repo, 'js/laender.js'), js);
console.log('Länder:', liste.length, '| bekannt:', liste.filter(l => l.bekannt).length,
  '| Regionen:', JSON.stringify(liste.reduce((m, l) => (m[l.region] = (m[l.region] || 0) + 1, m), {})));
console.log('Doppelte Antworten entfernt:', doppelt.map(([a, s]) => a + '=' + [...s]).join(', '));
