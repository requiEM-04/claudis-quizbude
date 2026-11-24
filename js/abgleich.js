import { LAENDER } from './laender.js?v=0.1.0';
import { kanon } from './kanon.js?v=0.1.0';

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

// 'richtig' | 'knapp' | 'falsch' | 'leer'
export function pruefe(eingabe, code) {
  const k = kanon(eingabe);
  if (k.length < 2) return 'leer';
  const land = LAND[code];
  if (land.antworten.includes(k)) return 'richtig';
  const anderes = WEM.get(k);
  if (anderes && anderes !== code) return 'falsch'; // exakt ein anderes Land getippt
  const grenze = k.length <= 4 ? 0 : k.length <= 7 ? 1 : 2;
  let best = 99;
  for (const a of land.antworten) {
    if (Math.abs(a.length - k.length) > 3) continue;
    best = Math.min(best, abstand(a, k));
  }
  if (best <= grenze) return 'richtig';
  if (k.length >= 4 && best <= grenze + 1) return 'knapp';
  return 'falsch';
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

// Fragenliste für einen Raum. Bei „Auswahl" gibt's drei falsche Antworten aus derselben Ecke der Welt.
export function fragenBauen({ auswahl, runden, modus }) {
  const pool = LAENDER.filter(AUSWAHL[auswahl]?.filter || (() => true));
  const gezogen = mischen(pool).slice(0, Math.min(runden, pool.length));
  return gezogen.map(l => {
    const f = { c: l.code };
    if (modus === 'auswahl') {
      const nah = mischen(LAENDER.filter(x => x.code !== l.code && x.region === l.region));
      const fern = mischen(LAENDER.filter(x => x.code !== l.code && x.region !== l.region));
      f.o = mischen([l.code, ...nah.concat(fern).slice(0, 3).map(x => x.code)]);
    }
    return f;
  });
}

export function flaggeUrl(code) {
  return `flaggen/${code.toLowerCase()}.svg`;
}
