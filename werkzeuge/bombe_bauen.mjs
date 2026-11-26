// Baut die Daten für die Kategorie Bombe:
//   js/bombe-woerter.js (wird erst bei Bombe geladen): erlaubte Wörter (bis 12 Buchstaben plus alle häufigen), vorne komprimiert
//   js/silben.js (klein, immer da): Silben mit der Zahl häufiger Wörter, die sie enthalten
// Quellen: all-the-german-words (MIT), Häufigkeiten aus OpenSubtitles 2024 über OPUS (ODC-BY) aus @zxcvbn-ts/language-de.
// Aufruf: node werkzeuge/bombe_bauen.mjs <all-the-german-words/woerter.json> <zxcvbn-ts language-de/src/commonWords.json>
import fs from 'node:fs';
const [, , alleDatei, haeufigDatei] = process.argv;
const nurBuchstaben = /^[a-zäöüß]+$/;
const alle = new Set(JSON.parse(fs.readFileSync(alleDatei, 'utf8')).map(w => w.toLowerCase()).filter(w => nurBuchstaben.test(w) && w.length >= 3));
// häufige Wörter (Untertitel), nur echte Wörter aus der großen Liste
const haeufig = [...new Set(JSON.parse(fs.readFileSync(haeufigDatei, 'utf8')))].filter(w => nurBuchstaben.test(w) && w.length >= 3 && alle.has(w));
const erlaubt = [...new Set([...[...alle].filter(w => w.length <= 12), ...haeufig])].sort();
// vorne komprimiert: Zeichen 48+n = so viele Buchstaben wie das vorige Wort, dann der Rest
let vorher = '', zeilen = [];
for (const w of erlaubt) {
  let n = 0; while (n < Math.min(w.length, vorher.length, 60) && w[n] === vorher[n]) n++;
  zeilen.push(String.fromCharCode(48 + n) + w.slice(n)); vorher = w;
}
// Silben: zwei bis drei Buchstaben, die in vielen häufigen Wörtern stecken (die ersten 15.000 Wörter zählen)
const basis = haeufig.slice(0, 15000);
const zahl = new Map();
for (const w of basis) {
  const gesehen = new Set();
  for (const l of [2, 3]) for (let i = 0; i + l <= w.length; i++) { const s = w.slice(i, i + l); if (!gesehen.has(s)) { gesehen.add(s); zahl.set(s, (zahl.get(s) || 0) + 1); } }
}
// nur Silben, die nach Silbe aussehen: mit Vokal oder ein bekannter Konsonanten-Block
const BLOCK = new Set(['ch', 'sch', 'st', 'sp', 'ng', 'nd', 'ck', 'tz', 'pf', 'nk', 'rt', 'ft', 'str', 'spr', 'nst', 'cht', 'rst', 'lt', 'rd', 'nt']);
const schoen = s => (/[aeiouäöü]/.test(s) || BLOCK.has(s)) && !/[qxyß]/.test(s) && !/^(.)\1$/.test(s) && !/^[^aeiouäöü]{2}$/.test(s) || BLOCK.has(s);
const silben = [...zahl].filter(([s, n]) => n >= 25 && schoen(s)).sort((a, b) => b[1] - a[1]);
// für die Auflösung: Beispielwörter aus den häufigsten 8.000
const beispiele = haeufig.slice(0, 8000).filter(w => w.length >= 4);
fs.writeFileSync('js/bombe-woerter.js', `// Automatisch erzeugt von werkzeuge/bombe_bauen.mjs – nicht von Hand ändern.
// Wörter: all-the-german-words (MIT). Häufige Wörter: OpenSubtitles 2024 über OPUS (ODC-BY), aus @zxcvbn-ts/language-de.
export const WOERTER = ${JSON.stringify(zeilen.join('\n'))};
export const BEISPIELE = ${JSON.stringify(beispiele.join(' '))};
`);
fs.writeFileSync('js/silben.js', `// Automatisch erzeugt von werkzeuge/bombe_bauen.mjs – nicht von Hand ändern.
// Silben für die Kategorie Bombe mit der Zahl häufiger Wörter, die sie enthalten (Quelle der Häufigkeiten: OpenSubtitles 2024 über OPUS, ODC-BY).
export const SILBEN = ${JSON.stringify(silben)};
`);
console.log('erlaubt', erlaubt.length, '| häufig', haeufig.length, '| Silben', silben.length, '| Datei', (fs.statSync('js/bombe-woerter.js').size / 1e6).toFixed(2), 'MB');
console.log(silben.slice(0, 30).map(([s, n]) => s + n).join(' '), '…', silben.slice(-20).map(([s, n]) => s + n).join(' '));
