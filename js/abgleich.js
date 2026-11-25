import { LAENDER } from './laender.js?v=0.4.2';
import { kanon } from './kanon.js?v=0.4.2';

export const LAND = Object.fromEntries(LAENDER.map(l => [l.code, l]));
const WEM = new Map();
for (const l of LAENDER) for (const a of l.antworten) WEM.set(a, l.code);

// Tippfehler-Abstand; vertauschte Nachbarbuchstaben („schwiez") zählen als ein Fehler
function abstand(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const k = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + k);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

// Vergleicht eine Eingabe mit einer Liste erlaubter Antworten (schon kanonisiert).
// gehoertAnderem(k) sagt, ob die exakte Eingabe zu einer anderen Lösung passt. Ergebnis: 'richtig' | 'knapp' | 'falsch' | 'leer'
export function abgleichen(eingabe, antworten, gehoertAnderem = () => false) {
  const k = kanon(eingabe);
  if (k.length < 2) return 'leer';
  if (antworten.includes(k)) return 'richtig';
  if (gehoertAnderem(k)) return 'falsch';
  const grenze = k.length <= 4 ? 0 : k.length <= 7 ? 1 : 2;
  let best = 99;
  for (const a of antworten) {
    if (Math.abs(a.length - k.length) > 3) continue;
    best = Math.min(best, abstand(a, k));
  }
  if (best <= grenze) return 'richtig';
  if (k.length >= 4 && best <= grenze + 1) return 'knapp';
  return 'falsch';
}

export function pruefe(eingabe, code) {
  return abgleichen(eingabe, LAND[code].antworten, k => { const anderes = WEM.get(k); return !!anderes && anderes !== code; });
}

export const AUSWAHL = {
  bekannt: { name: 'Bekannte Flaggen', filter: l => l.bekannt },
  alle: { name: 'Alle Länder', filter: () => true },
  europa: { name: 'Europa', filter: l => l.region === 'europa' },
  afrika: { name: 'Afrika', filter: l => l.region === 'afrika' },
  asien: { name: 'Asien', filter: l => l.region === 'asien' },
  amerika: { name: 'Amerika', filter: l => l.region === 'amerika' },
  ozeanien: { name: 'Ozeanien', filter: l => l.region === 'ozeanien' },
};

export function mischen(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function flaggeUrl(code) {
  return `flaggen/${code.toLowerCase()}.svg`;
}
