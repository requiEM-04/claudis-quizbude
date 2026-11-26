// Baut js/kennzeichen.js (Kategorie Autokennzeichen) aus dem npm-Paket german-license-plate-prefixes.
// Daten: Senatsverwaltung für Wirtschaft, Technologie und Forschung Berlin, CC BY 3.0.
// Aufruf: node werkzeuge/kennzeichen_bauen.mjs <Pfad zu german-license-plate-prefixes/index.json>
import fs from 'node:fs';
const roh = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// Korrekturen: HB gilt für Bremen und Bremerhaven
const KORREKTUR = { HB: 'Bremen', N: 'Nürnberg' };
// Wo die Regel danebenliegt: Hauptkennzeichen von Hand
const HAUPT_FEST = { Mittelsachsen: 'FG', Nordsachsen: 'TDO', Rostock: 'HRO', 'Nürnberger Land': 'LAU', 'Oder-Spree': 'LOS', 'Dahme-Spreewald': 'LDS', 'Sächsische Schweiz-Osterzgebirge': 'PIR', 'Werra-Meißner-Kreis': 'ESW', 'Waldeck-Frankenberg': 'KB' };
const eintraege = Object.entries(roh).map(([k, o]) => [k, KORREKTUR[k] || o]);
// Grundname ohne Zusätze wie „Region“, „(Westerwald)“, „a.d. Donau“
const grund = o => o.replace(/^(Region|Städteregion|Regionalverband|Rhein-Kreis|Landkreis|Kreis)\s+/, '').replace(/\s*\(.*\)$/, '').replace(/\s+(a\.|i\.|am|an der).*$/, '').trim();
const flach = s => s.toUpperCase().replace(/Ä/g, 'A').replace(/Ö/g, 'O').replace(/Ü/g, 'U').replace(/[^A-Z]/g, '');
const teilfolge = (code, name) => { let i = 0; for (const ch of name) if (ch === code[i]) i++; return i === code.length; };
// Hauptkennzeichen je Kreis: Anfangsbuchstabe passt, Buchstaben kommen der Reihe nach im Namen vor, kürzer ist besser
const nachKreis = new Map();
for (const [k, o] of eintraege) { if (!nachKreis.has(o)) nachKreis.set(o, []); nachKreis.get(o).push(k); }
const haupt = new Set();
for (const [o, codes] of nachKreis) {
  const n = flach(grund(o)), voll = flach(o);
  const initialen = grund(o).split(/[\s-]+/).map(w => flach(w)[0] || '').join('');
  const wert = c => { const f = flach(c); return (initialen.length > 1 && f.startsWith(initialen) ? 3 : 0) + (n.startsWith(f[0]) ? 4 : voll.includes(f[0]) ? 1 : 0) + (teilfolge(f, n) ? 3 : teilfolge(f, voll) ? 2 : 0) + (n.startsWith(f) ? 2 : 0) - f.length * .1; };
  const best = HAUPT_FEST[o] && codes.includes(HAUPT_FEST[o]) ? HAUPT_FEST[o] : codes.slice().sort((a, b) => wert(b) - wert(a))[0];
  haupt.add(best);
}
const liste = eintraege.map(([k, o]) => [k, o, haupt.has(k) ? 1 : 0]).sort((a, b) => a[0].localeCompare(b[0], 'de'));
fs.writeFileSync('js/kennzeichen.js', `// Automatisch erzeugt von werkzeuge/kennzeichen_bauen.mjs – nicht von Hand ändern.
// Unterscheidungszeichen: Senatsverwaltung für Wirtschaft, Technologie und Forschung Berlin (CC BY 3.0), über german-license-plate-prefixes.
// [Kürzel, Kreis oder Stadt, 1 = Hauptkennzeichen des Kreises]
export const KENNZEICHEN = ${JSON.stringify(liste)};
`);
console.log(liste.length, 'Kennzeichen,', haupt.size, 'Kreise');
