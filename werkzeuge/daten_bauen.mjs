// Erzeugt js/laender.js (Namen, Antworten, Hauptstädte, Fläche), js/umrisse.js (Silhouetten) und kopiert die Flaggen.
// Aufruf (Ordner mit node_modules von flag-icons + world-countries als Argument):
//   node werkzeuge/daten_bauen.mjs /pfad/zu/deps
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { kanon } from '../js/kanon.js';

const deps = process.argv[2];
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(deps, 'package.json'));
const world = require('world-countries');
const flagDir = path.join(deps, 'node_modules/flag-icons/flags/4x3');
const geoDir = path.join(deps, 'node_modules/world-countries/data');

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

// Anzeigenamen, wie man sie im Deutschen eher sagt
const NAME = { CI: 'Elfenbeinküste', CD: 'DR Kongo', CG: 'Republik Kongo', SZ: 'Eswatini', US: 'USA',
  GB: 'Großbritannien', VA: 'Vatikan', MD: 'Moldau' };

// Hauptstädte auf Deutsch (englischer Name bleibt als Antwort gültig)
const STADT_DE = {
  Vienna: 'Wien', Rome: 'Rom', Warsaw: 'Warschau', Prague: 'Prag', Moscow: 'Moskau', Kyiv: 'Kiew',
  Brussels: 'Brüssel', Copenhagen: 'Kopenhagen', Lisbon: 'Lissabon', Athens: 'Athen', Bucharest: 'Bukarest',
  Belgrade: 'Belgrad', Beijing: 'Peking', 'New Delhi': 'Neu-Delhi', Cairo: 'Kairo', 'Mexico City': 'Mexiko-Stadt',
  Tehran: 'Teheran', Baghdad: 'Bagdad', Damascus: 'Damaskus', Riyadh: 'Riad', Muscat: 'Maskat',
  Algiers: 'Algier', Tripoli: 'Tripolis', Khartoum: 'Khartum', 'Addis Ababa': 'Addis Abeba', Nicosia: 'Nikosia',
  Luxembourg: 'Luxemburg', Tbilisi: 'Tiflis', Yerevan: 'Jerewan', Tashkent: 'Taschkent', Bishkek: 'Bischkek',
  Dushanbe: 'Duschanbe', Ashgabat: 'Aschgabat', 'Ulan Bator': 'Ulaanbaatar', Pyongyang: 'Pjöngjang',
  Tokyo: 'Tokio', Taipei: 'Taipeh', Singapore: 'Singapur', 'Washington D.C.': 'Washington, D.C.',
  Havana: 'Havanna', 'Guatemala City': 'Guatemala-Stadt', 'Panama City': 'Panama-Stadt', Santiago: 'Santiago de Chile',
  'Yaoundé': 'Jaunde', Djibouti: 'Dschibuti', Mogadishu: 'Mogadischu', 'Chișinău': 'Chișinău', Reykjavik: 'Reykjavík',
  'Kuwait City': 'Kuwait-Stadt', 'Vatican City': 'Vatikanstadt', 'City of San Marino': 'San Marino',
  'Sana\'a': 'Sanaa', Kathmandu: 'Kathmandu', 'Bandar Seri Begawan': 'Bandar Seri Begawan', Beirut: 'Beirut',
  'Port Louis': 'Port Louis', 'N\'Djamena': 'N’Djamena', Naypyidaw: 'Naypyidaw', 'Brasília': 'Brasília',
};
const STADT_EXTRA = {
  BO: ['La Paz'], LK: ['Sri Jayawardenepura Kotte', 'Kotte'], US: ['Washington'], CI: ['Abidjan'],
  ZA: ['Kapstadt'], NL: ['Den Haag'], MM: ['Nay Pyi Taw'], UA: ['Kyjiw', 'Kiev'], KZ: ['Nur-Sultan'],
  MD: ['Chisinau', 'Kischinau'], MN: ['Ulan Bator'], IN: ['Delhi'], BJ: ['Cotonou'],
};
// umstrittene oder triviale Hauptstädte bleiben aus der Hauptstadt-Runde draußen
const OHNE_STADT = new Set(['IL', 'PS', 'VA', 'MC', 'SM', 'SG', 'LU', 'DJ', 'KW', 'GT', 'PA', 'MX', 'BZ']);

// Bekannte Länder für die leichte Auswahl
const BEKANNT = ('DE AT CH FR IT ES PT NL BE LU GB IE DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS UA RU TR '
  + 'US CA MX BR AR CL CO PE CU JM CN JP KR KP IN PK TH VN ID PH MY SG AU NZ ZA EG MA NG KE GH '
  + 'SA AE IL IR IQ SY QA GE VA MC AL').split(' ');

const REGION = { Europe: 'europa', Asia: 'asien', Africa: 'afrika', Americas: 'amerika', Oceania: 'ozeanien' };
const DAZU = new Set(['VA', 'XK', 'PS', 'TW']); // keine UN-Mitglieder, aber Länder, die man kennt

const pool = world.filter(c => (c.unMember || DAZU.has(c.cca2)) && fs.existsSync(path.join(flagDir, c.cca2.toLowerCase() + '.svg')));

// ---------- Umrisse ----------
function douglasPeucker(punkte, eps) {
  if (punkte.length < 3) return punkte;
  const [ax, ay] = punkte[0], [bx, by] = punkte[punkte.length - 1];
  let maxD = 0, idx = 0;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < punkte.length - 1; i++) {
    const [px, py] = punkte[i];
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [punkte[0], punkte[punkte.length - 1]];
  return douglasPeucker(punkte.slice(0, idx + 1), eps).slice(0, -1).concat(douglasPeucker(punkte.slice(idx), eps));
}
const flaecheRing = r => Math.abs(r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2);

function umriss(cca3) {
  const datei = path.join(geoDir, cca3.toLowerCase() + '.geo.json');
  if (!fs.existsSync(datei)) return null;
  const geo = JSON.parse(fs.readFileSync(datei, 'utf8'));
  let polys = [];
  for (const f of geo.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') polys.push(g.coordinates);
    if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
  }
  if (!polys.length) return null;
  const lons = polys.flat(2).filter((_, i) => i % 2 === 0);
  const ueberDatumsgrenze = lons.some(x => x < -150) && lons.some(x => x > 150);
  if (ueberDatumsgrenze) polys = polys.map(p => p.map(r => r.map(([x, y]) => [x < 0 ? x + 360 : x, y])));
  // nur die großen Teile behalten, Inselstaub fliegt raus
  const mitFlaeche = polys.map(p => ({ p, f: flaecheRing(p[0]) })).sort((a, b) => b.f - a.f);
  const groesste = mitFlaeche[0].f;
  polys = mitFlaeche.filter((x, i) => i < 40 && x.f >= groesste * 0.004).map(x => x.p);
  const alle = polys.flat(2);
  const latMitte = (Math.min(...alle.map(p => p[1])) + Math.max(...alle.map(p => p[1]))) / 2;
  const k = Math.cos(latMitte * Math.PI / 180);
  const proj = polys.map(p => p.map(r => r.map(([x, y]) => [x * k, -y])));
  const pts = proj.flat(2);
  const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
  const s = 92 / Math.max(maxX - minX, maxY - minY);
  const ox = (100 - (maxX - minX) * s) / 2, oy = (100 - (maxY - minY) * s) / 2;
  let d = '';
  for (const p of proj) for (const r of p) {
    const skaliert = r.map(([x, y]) => [(x - minX) * s + ox, (y - minY) * s + oy]);
    // geschlossene Ringe am entferntesten Punkt teilen, sonst fällt alles auf Anfang = Ende zusammen
    let weit = 0, wi = 0;
    skaliert.forEach(([x, y], i) => { const dd = Math.hypot(x - skaliert[0][0], y - skaliert[0][1]); if (dd > weit) { weit = dd; wi = i; } });
    const einfach = douglasPeucker(skaliert.slice(0, wi + 1), 0.3).slice(0, -1).concat(douglasPeucker(skaliert.slice(wi), 0.3));
    if (einfach.length < 4 && flaecheRing(skaliert) < 2) continue;
    d += 'M' + einfach.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
  }
  return d.replace(/\.0(?=[ LMZ])/g, '');
}

// ---------- Länderliste ----------
const liste = pool.map(c => {
  const code = c.cca2;
  const de = c.translations.deu?.common || c.name.common;
  const anzeige = NAME[code] || de;
  const roh = [anzeige, de, c.translations.deu?.official, c.name.common, c.name.official,
    ...(c.altSpellings || []).filter(a => a.length > 3), ...(EXTRA[code] || [])].filter(Boolean);
  const staedteEn = c.capital || [];
  const stadt = staedteEn.length && !OHNE_STADT.has(code) ? (STADT_DE[staedteEn[0]] || staedteEn[0]) : null;
  const stadtRoh = stadt ? [stadt, ...staedteEn, ...staedteEn.map(s => STADT_DE[s]).filter(Boolean), ...(STADT_EXTRA[code] || [])] : [];
  return {
    code, name: anzeige, region: REGION[c.region] || 'sonst', bekannt: BEKANNT.includes(code), roh,
    flaeche: Math.round(c.area), stadt, stadtRoh, cca3: c.cca3,
  };
});

// Antworten, die bei zwei Ländern passen würden, fliegen raus
function eindeutig(feldRoh, feldNeu, extraFuer) {
  const wem = new Map();
  for (const l of liste) for (const a of new Set(l[feldRoh].map(kanon))) {
    if (!a) continue;
    wem.set(a, (wem.get(a) || new Set()).add(l.code));
  }
  for (const l of liste) {
    const eigene = new Set((extraFuer(l.code) || []).map(kanon));
    l[feldNeu] = [...new Set(l[feldRoh].map(kanon))].filter(a => a && a.length >= 2 && (wem.get(a).size === 1 || eigene.has(a)));
    delete l[feldRoh];
  }
}
eindeutig('roh', 'antworten', c => EXTRA[c]);
eindeutig('stadtRoh', 'stadtAntworten', c => STADT_EXTRA[c]);
liste.sort((a, b) => a.name.localeCompare(b.name, 'de'));

const fehlt = BEKANNT.filter(b => !liste.find(l => l.code === b));
if (fehlt.length) throw new Error('Bekannt-Liste ohne Flagge: ' + fehlt);

fs.mkdirSync(path.join(repo, 'flaggen'), { recursive: true });
const umrisse = {};
for (const l of liste) {
  fs.copyFileSync(path.join(flagDir, l.code.toLowerCase() + '.svg'), path.join(repo, 'flaggen', l.code.toLowerCase() + '.svg'));
  if (l.flaeche >= 2000) { const d = umriss(l.cca3); if (d) { umrisse[l.code] = d; l.umriss = true; } }
  delete l.cca3;
  if (!l.stadt) { delete l.stadt; delete l.stadtAntworten; }
}

const kopf = '// Automatisch erzeugt von werkzeuge/daten_bauen.mjs – nicht von Hand ändern.\n'
  + '// Länderdaten und Umrisse: world-countries (ODbL), Flaggen: flag-icons (MIT).\n';
fs.writeFileSync(path.join(repo, 'js/laender.js'), kopf + 'export const LAENDER = ' + JSON.stringify(liste) + ';\n');
// kleine Vorschau für die Kategorie-Kachel
fs.writeFileSync(path.join(repo, 'bilder/umriss-vorschau.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${umrisse.IT}" fill="#CDB68C" fill-rule="evenodd"/></svg>\n`);
fs.writeFileSync(path.join(repo, 'js/umrisse.js'), kopf + 'export const UMRISSE = ' + JSON.stringify(umrisse) + ';\n');
console.log('Länder:', liste.length, '| bekannt:', liste.filter(l => l.bekannt).length,
  '| mit Hauptstadt:', liste.filter(l => l.stadt).length, '| Umrisse:', Object.keys(umrisse).length,
  '| umrisse.js:', Math.round(fs.statSync(path.join(repo, 'js/umrisse.js')).size / 1024) + ' KB');
