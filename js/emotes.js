// Emotes für den Chat: Wort tippen (z. B. qbGG) oder aus der Liste wählen.
// Jedes Emote ist eine der Figuren mit eigenem Gesichtsausdruck. Ein Teil ist für alle frei,
// der Rest kommt mit dem Ruhm (Dame und Ass jeder Kartenfarbe, Joker) und im Winter.
// Wer ein Emote nicht hat, schickt nur das Wort: Gezeichnet wird es bei allen nur, wenn der Absender es freigespielt hat.

import { figurAusdruck, ZEICHEN } from './figuren.js?v=0.18.0';
import { stufeVon, stufeInfo, SCHWELLEN } from './ruhm.js?v=0.18.0';

const { T, U, hell, dunkel, stern, r1 } = ZEICHEN;
const gespiegelt = inhalt => `<g transform="matrix(-1 0 0 1 64 0)">${inhalt}</g>`;
const beide = inhalt => inhalt + gespiegelt(inhalt);

// ---------- Augen ----------
// Lachen: zugekniffen wie ^ ^
const lachAugen = ({ x, y, r }) => beide(`<path d="M${r1(x - r * 1.05)} ${r1(y + r * .45)} Q${r1(x)} ${r1(y - r * 1.05)} ${r1(x + r * 1.05)} ${r1(y + r * .45)}" fill="none" stroke="${T}" stroke-width="${r1(Math.max(1.8, r * .5))}" stroke-linecap="round"/>`);
// Schlafen: Bögen nach unten
const schlafAugen = ({ x, y, r, lid }) => beide(`<path d="M${r1(x - r * 1.05)} ${r1(y)} Q${r1(x)} ${r1(y + r * .95)} ${r1(x + r * 1.05)} ${r1(y)}" fill="none" stroke="${lid}" stroke-width="${r1(Math.max(1.6, r * .45))}" stroke-linecap="round"/>`);
const herzForm = (x, y, s) => `M${r1(x)} ${r1(y + s * .85)} C${r1(x - s * 1.25)} ${r1(y + s * .05)} ${r1(x - s * 1.05)} ${r1(y - s * 1.05)} ${r1(x)} ${r1(y - s * .45)} C${r1(x + s * 1.05)} ${r1(y - s * 1.05)} ${r1(x + s * 1.25)} ${r1(y + s * .05)} ${r1(x)} ${r1(y + s * .85)}Z`;
const herz = (L, x, y, s, f = '#F0485E') => `<path d="${herzForm(x, y, s)}" fill="${L.kugel(f, { h: .4 })}" ${U} stroke-width="${r1(Math.max(1, s * .22))}"/><ellipse cx="${r1(x - s * .45)}" cy="${r1(y - s * .35)}" rx="${r1(s * .28)}" ry="${r1(s * .17)}" transform="rotate(-35 ${r1(x - s * .45)} ${r1(y - s * .35)})" fill="#fff" opacity=".7"/>`;
const herzAugen = ({ L, x, y, r }) => herz(L, x, y + r * .1, r * 1.45) + herz(L, 64 - x, y + r * .1, r * 1.45);
const sternAugen = ({ L, x, y, r }) => [x, 64 - x].map(ax => `<path d="${stern(ax, y, r * 1.55)}" fill="${L.kugel('#FFD54A', { h: .5 })}" ${U} stroke-width="1.1"/><circle cx="${r1(ax - r * .35)}" cy="${r1(y - r * .45)}" r="${r1(r * .22)}" fill="#fff" opacity=".85"/>`).join('');
// Geschockt: große weiße Augen, winzige Pupillen
const schockAugen = ({ x, y, r }) => beide(`<circle cx="${x}" cy="${y}" r="${r1(r * 1.12)}" fill="#F8F5EE" stroke="${T}" stroke-width="1.3"/><circle cx="${r1(x + r * .05)}" cy="${r1(y + r * .05)}" r="${r1(r * .24)}" fill="${T}"/>`);
// Misstrauisch zur Seite: halb zu, beide Pupillen nach rechts
function seitenAugen({ L, x, y, r, iris, lid }) {
  return [x, 64 - x].map(ax => {
    const clip = L.clip(`<ellipse cx="${ax}" cy="${y}" rx="${r1(r * 1.1)}" ry="${r1(r * .82)}"/>`);
    return `<ellipse cx="${ax}" cy="${y}" rx="${r1(r * 1.1)}" ry="${r1(r * .82)}" fill="#F3EEE3"/>`
      + `<g clip-path="${clip}"><circle cx="${r1(ax + r * .55)}" cy="${r1(y + r * .1)}" r="${r1(r * .58)}" fill="${iris}"/><circle cx="${r1(ax + r * .62)}" cy="${r1(y + r * .1)}" r="${r1(r * .28)}" fill="${T}"/>`
      + '</g>'
      + `<ellipse cx="${ax}" cy="${y}" rx="${r1(r * 1.1)}" ry="${r1(r * .82)}" fill="none" stroke="${T}" stroke-width="1.1"/>`
      + `<path d="M${r1(ax - r * 1.35)} ${r1(y - r * .2)} L${r1(ax + r * 1.35)} ${r1(y - r * .28)}" stroke="${lid}" stroke-width="${r1(r * .55)}" stroke-linecap="round"/>`;
  }).join('');
}
// Spiralen nach dem Knall
function spirale(x, y, r) {
  const p = [];
  for (let i = 0; i <= 34; i++) { const w = i * .55, rr = r * (.12 + i / 34 * .95); p.push(`${r1(x + rr * Math.cos(w))} ${r1(y + rr * Math.sin(w))}`); }
  return `<path d="M${p.join(' L')}" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`;
}
const spiralAugen = ({ x, y, r }) => [x, 64 - x].map(ax => `<circle cx="${ax}" cy="${y}" r="${r1(r * 1.15)}" fill="#F8F5EE" stroke="${T}" stroke-width="1.2"/>` + spirale(ax, y, r * 1.0)).join('');

// Brauen: wütend (fallen zur Nase), traurig (steigen zur Nase), gehoben
const brauen = ({ x, y, r }, art, f = T, dicke = .55) => {
  const d = art === 'wut' ? `M${r1(x - r * 1.2)} ${r1(y - r * 1.75)} L${r1(x + r * 1.25)} ${r1(y - r * .95)}`
    : art === 'traurig' ? `M${r1(x - r * 1.2)} ${r1(y - r * 1.05)} L${r1(x + r * 1.15)} ${r1(y - r * 1.75)}`
      : `M${r1(x - r * 1.2)} ${r1(y - r * 1.55)} Q${r1(x)} ${r1(y - r * 2.15)} ${r1(x + r * 1.2)} ${r1(y - r * 1.6)}`;
  return `<path d="${d}" fill="none" stroke="${f}" stroke-width="${r1(r * dicke)}" stroke-linecap="round"/>`;
};

// ---------- Zutaten ----------
const traene = (x, y, s = 1) => `<path d="M${x} ${y} q${r1(-2.6 * s)} ${r1(4 * s)} 0 ${r1(5.6 * s)} q${r1(2.6 * s)} ${r1(-1.6 * s)} 0 ${r1(-5.6 * s)}Z" fill="#7CC8FF" stroke="${T}" stroke-width=".9"/><ellipse cx="${r1(x - .6 * s)}" cy="${r1(y + 3.4 * s)}" rx="${r1(.6 * s)}" ry="${r1(1 * s)}" fill="#fff" opacity=".8"/>`;
const bach = (x, y, laenge) => `<path d="M${r1(x - 1.6)} ${y} Q${r1(x - 2.4)} ${r1(y + laenge * .55)} ${r1(x - 1)} ${r1(y + laenge)} L${r1(x + 1.8)} ${r1(y + laenge)} Q${r1(x + 2.2)} ${r1(y + laenge * .5)} ${r1(x + 1.6)} ${y}Z" fill="#7CC8FF" opacity=".92" stroke="#3E8FD0" stroke-width=".7"/><path d="M${r1(x - .2)} ${r1(y + 2)} V${r1(y + laenge - 2)}" stroke="#fff" stroke-width=".8" opacity=".6" stroke-linecap="round"/>`;
const wange = (x, y, f = '#FF7A8C', o = .5) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.1" fill="${f}" opacity="${o}"/><ellipse cx="${r1(64 - x)}" cy="${y}" rx="3.6" ry="2.1" fill="${f}" opacity="${o}"/>`;
const zeichen = (text, x, y, groesse, f = '#FFD54A', dreh = 0, kontur = true) => `<text x="${x}" y="${y}" transform="rotate(${dreh} ${x} ${y})" text-anchor="middle" font-family="Bricolage, 'Segoe UI', system-ui, sans-serif" font-weight="800" font-size="${groesse}" fill="${f}"${kontur ? ` stroke="${T}" stroke-width="${r1(groesse * .16)}" paint-order="stroke" stroke-linejoin="round"` : ''}>${text}</text>`;
const dampfwolke = (x, y, s = 1) => `<g fill="#F4F6F8" stroke="${T}" stroke-width="1"><circle cx="${x}" cy="${y}" r="${r1(3.2 * s)}"/><circle cx="${r1(x + 3.4 * s)}" cy="${r1(y - 2.2 * s)}" r="${r1(3.6 * s)}"/><circle cx="${r1(x + 6.6 * s)}" cy="${r1(y + .4 * s)}" r="${r1(2.8 * s)}"/></g>`;
const funkeln = (x, y, s, f = '#FFE58A') => `<path d="M${x} ${r1(y - s)} Q${r1(x + s * .18)} ${r1(y - s * .18)} ${r1(x + s)} ${y} Q${r1(x + s * .18)} ${r1(y + s * .18)} ${x} ${r1(y + s)} Q${r1(x - s * .18)} ${r1(y + s * .18)} ${r1(x - s)} ${y} Q${r1(x - s * .18)} ${r1(y - s * .18)} ${x} ${r1(y - s)}Z" fill="${f}"/>`;

// ---------- Die Emotes ----------
// ab: Ruhmstufe (Index in SCHWELLEN), winter: ab 1. Dezember 2026 für alle
const WINTER_AB = new Date('2026-12-01T00:00:00+01:00');
export const EMOTES = [
  {
    id: 'gg', code: 'qbGG', name: 'Gutes Spiel', figur: 'fuchs',
    augenOpt: { schraeg: 1.4 },
    dazu: L => `<path d="M33 49.2 Q36 51.6 39.5 49" fill="none" stroke="${T}" stroke-width="1.2" stroke-linecap="round"/>`
      + `<g transform="rotate(-8 32 54)"><rect x="11" y="45" width="42" height="17" rx="5" fill="${L.senkrecht('#FFE08A', '#D9A63A')}" ${U} stroke-width="2"/><rect x="14" y="47.5" width="36" height="3" rx="1.5" fill="#fff" opacity=".45"/>${zeichen('GG', 32, 59.4, 14.5, '#3A2412', 0, false)}</g>`,
  },
  {
    id: 'lol', code: 'qbLOL', name: 'Tränen gelacht', figur: 'frosch',
    augen: lachAugen,
    dazu: L => `<path d="M17 41.5 Q31 47 46 41 Q44 55 31.5 55 Q19 55 17 41.5Z" fill="#7A2230" ${U} stroke-width="1.6"/><path d="M22 50.5 Q31 46.5 41 50.5 Q37 54.5 31.5 54.5 Q25.5 54.5 22 50.5Z" fill="#F07A8E"/><path d="M19.5 42.6 Q31 46.6 43.5 42.3 L42.6 44.6 Q31 48.4 20.4 44.8Z" fill="#fff"/>`
      + traene(8, 26, 1.5) + traene(54, 26, 1.5) + traene(4.5, 36, 1.1) + traene(58.5, 36, 1.1),
  },
  {
    id: 'hmm', code: 'qbHmm', name: 'Grübeln', figur: 'panda',
    augen: ({ normal }) => normal({ schraeg: .4, zu: .25 }),
    dazu: (L, p) => brauen(p, 'flach', '#26222A', .7) + gespiegelt(brauen({ ...p, y: p.y - 1.6 }, 'hoch', '#26222A', .7))
      + `<path d="M29 48.6 Q32 47.8 35.2 48.8" fill="none" stroke="#26222A" stroke-width="1.3" stroke-linecap="round"/>`
      + `<path d="M18 62 Q17 52 25 51 Q30.5 50.5 31 54 Q31.5 57.5 27 58.5" fill="${L.kugel('#26222A', { h: .25 })}" ${U} stroke-width="1.4"/>`
      + zeichen('?', 53, 22, 22, '#FFD54A', 12),
  },
  {
    id: 'wow', code: 'qbWow', name: 'Wie bitte?!', figur: 'eule',
    augen: schockAugen,
    dazu: () => zeichen('!', 55, 23, 20, '#FFD54A', 14) + zeichen('!', 9, 23, 16, '#FFD54A', -14)
      + `<path d="M6 36 h-4 M8 30 l-3 -2.5 M58 36 h4 M56 30 l3 -2.5" stroke="#FFD54A" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  {
    id: 'heul', code: 'qbHeul', name: 'Heulen', figur: 'pinguin',
    augen: ({ normal }) => normal({ zu: .32, schraeg: -.8 }),
    dazu: (L, p) => brauen(p, 'traurig', '#25304A', .6) + gespiegelt(brauen(p, 'traurig', '#25304A', .6))
      + bach(p.x, p.y + p.r * .7, 24) + bach(64 - p.x, p.y + p.r * .7, 24)
      + `<path d="M28.6 45.8 Q32 43.6 35.4 45.8" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`,
  },
  {
    id: 'liebe', code: 'qbLiebe', name: 'Verliebt', figur: 'katze',
    augen: herzAugen,
    dazu: L => wange(18.5, 41.5) + herz(L, 54, 15, 4.2, '#FF6B86') + herz(L, 10, 12, 3, '#FF8FA3') + herz(L, 48, 6, 2.4, '#FF8FA3'),
  },
  // Ruhm: Dame und Ass jeder Kartenfarbe, dazu der Joker
  {
    id: 'cool', code: 'qbCool', name: 'Ganz entspannt', figur: 'sternwolf', ab: 1,
    augen: ({ L, x, y, r }) => {
      const glas = ax => `<path d="M${r1(ax - r * 2.1)} ${r1(y - r * 1.05)} H${r1(ax + r * 1.9)} Q${r1(ax + r * 2)} ${r1(y + r * 1.4)} ${r1(ax)} ${r1(y + r * 1.25)} Q${r1(ax - r * 2.05)} ${r1(y + r * 1.4)} ${r1(ax - r * 2.1)} ${r1(y - r * 1.05)}Z" fill="${L.senkrecht('#3B4352', '#0E1116')}" ${U} stroke-width="1.5"/><path d="M${r1(ax - r * 1.5)} ${r1(y - r * .4)} L${r1(ax - r * .5)} ${r1(y - r * .4)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>`;
      return glas(x) + glas(64 - x) + `<path d="M${r1(x + r * 1.9)} ${r1(y - r * .8)} H${r1(64 - x - r * 1.9)}" stroke="${T}" stroke-width="2.2"/><path d="M${r1(x - r * 2.1)} ${r1(y - r * .9)} L10 ${r1(y - r * 1.5)} M${r1(64 - x + r * 2.1)} ${r1(y - r * .9)} L54 ${r1(y - r * 1.5)}" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`;
    },
    dazu: () => funkeln(53, 10, 4.2) + funkeln(58, 19, 2.4),
  },
  {
    id: 'zzz', code: 'qbZzz', name: 'Eingepennt', figur: 'koala', ab: 3,
    augen: schlafAugen,
    dazu: () => `<ellipse cx="38.5" cy="51.5" rx="2.2" ry="1.4" fill="#7FC4FF" opacity=".85"/>`
      + zeichen('Z', 47, 20, 13, '#CFE3FF', 10) + zeichen('z', 54, 11, 10, '#CFE3FF', 14) + zeichen('z', 59, 4.5, 7, '#CFE3FF', 18),
  },
  {
    id: 'wut', code: 'qbWut', name: 'Kurz vorm Platzen', figur: 'dino', ab: 5,
    augen: ({ normal }) => normal({ schraeg: 2.2, rot: true }),
    dazu: (L, p) => brauen(p, 'wut', T, .7) + gespiegelt(brauen(p, 'wut', T, .7))
      + dampfwolke(2.5, 16, 1) + gespiegelt(dampfwolke(2.5, 16, 1))
      + `<g transform="translate(50 9)" fill="none" stroke="#FF3B3B" stroke-width="1.9" stroke-linecap="round"><path d="M-5 -1.5 Q-1.5 -1.5 -1.5 -5 M1.5 -5 Q1.5 -1.5 5 -1.5 M5 1.5 Q1.5 1.5 1.5 5 M-1.5 5 Q-1.5 1.5 -5 1.5"/></g>`,
  },
  {
    id: 'sus', code: 'qbSus', name: 'Verdächtig', figur: 'papagei', ab: 7,
    augen: seitenAugen,
    dazu: (L, p) => gespiegelt(brauen({ ...p, y: p.y - .8 }, 'hoch', '#822b25', .6)) + funkeln(54, 14, 0),
  },
  {
    id: 'popcorn', code: 'qbPopcorn', name: 'Popcorn raus', figur: 'schildkroete', ab: 9,
    augenOpt: { weit: true },
    dazu: L => {
      const koerner = [[22, 45.5], [27, 43.5], [32, 45], [37, 43], [42, 45.5], [25, 48], [30, 47.5], [35, 48], [40, 47.5], [29.5, 41.5], [35, 40.8]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.1" fill="#FFF6D8" stroke="${T}" stroke-width=".9"/><circle cx="${x + .9}" cy="${y + .8}" r="1.2" fill="#F2C75C" opacity=".8"/>`).join('');
      return koerner + `<path d="M19.5 48 L44.5 48 L41.5 64.5 L22.5 64.5Z" fill="#F4EFE6" ${U} stroke-width="1.6"/><path d="M23.6 48 L25.4 64.5 M30.2 48 L30.8 64.5 M36.8 48 L36 64.5 M42.4 48 L40.8 64.5" stroke="#E2453E" stroke-width="2.6"/>`
        + `<circle cx="17.5" cy="54" r="3.4" fill="#6FAE5E" ${U} stroke-width="1.3"/><circle cx="46.5" cy="54" r="3.4" fill="#6FAE5E" ${U} stroke-width="1.3"/>`
        + `<circle cx="49" cy="20" r="2.3" fill="#FFF6D8" stroke="${T}" stroke-width=".9"/><circle cx="12" cy="24" r="1.8" fill="#FFF6D8" stroke="${T}" stroke-width=".9"/>`;
    },
  },
  {
    id: 'bumm', code: 'qbBumm', name: 'Bumm', figur: 'krake', ab: 11,
    augen: spiralAugen,
    hinten: () => `<path d="${ZEICHEN.zacken(32, 30, 31, 22, 13)}" fill="#FFB23F" opacity=".9"/><path d="${ZEICHEN.zacken(32, 30, 25, 17, 13, 14, 374)}" fill="#FFE58A" opacity=".85"/>`,
    dazu: () => `<ellipse cx="20" cy="24" rx="4" ry="2.4" fill="#2A2228" opacity=".5"/><ellipse cx="44" cy="20" rx="3" ry="1.8" fill="#2A2228" opacity=".45"/><ellipse cx="39" cy="42" rx="3" ry="1.6" fill="#2A2228" opacity=".4"/>`
      + `<path d="M28.5 42 q1.2 -1.6 2.4 0 q1.2 1.6 2.4 0 q1.2 -1.6 2.4 0" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`
      + `<path d="M30 9 q-3 -3 0 -5 M35 9 q3 -3.4 0 -6" fill="none" stroke="#9AA0A6" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  {
    id: 'idee', code: 'qbIdee', name: 'Geistesblitz', figur: 'biene', ab: 13,
    augenOpt: { weit: true },
    dazu: L => `<path d="M44.5 15 Q44.5 6.5 50 6.5 Q55.5 6.5 55.5 15 Q55.5 17.5 53.3 19.6 L53.3 22 L46.7 22 L46.7 19.6 Q44.5 17.5 44.5 15Z" fill="${L.kugel('#FFE27A', { h: .55 })}" ${U} stroke-width="1.4"/><rect x="46.5" y="22" width="7" height="4.2" rx="1.2" fill="#9AA3AD" ${U} stroke-width="1.2"/><path d="M48.5 17 l1.5 -3 l1.5 3" fill="none" stroke="#E08A1E" stroke-width="1.1"/><path d="M38 9 l-3.6 -2 M50 1.2 v-3 M59.4 7.6 l3 -2" stroke="#FFD54A" stroke-width="1.6" stroke-linecap="round"/>`
      + `<path d="M28 41.2 Q32 45 36 41" fill="none" stroke="${T}" stroke-width="1.4" stroke-linecap="round"/>`,
  },
  {
    id: 'krone', code: 'qbKrone', name: 'Seine Majestät', figur: 'loewe', ab: 15,
    augen: ({ normal }) => normal({ zu: .42, schraeg: .3 }),
    dazu: L => `<path d="M18 17 L20 3.5 L26.5 10.5 L32 1 L37.5 10.5 L44 3.5 L46 17Z" fill="${L.kugel('#FFD54A', { h: .5 })}" ${U} stroke-width="1.6"/><rect x="17.2" y="14.6" width="29.6" height="5" rx="1.6" fill="${L.kugel('#E9B533')}" ${U} stroke-width="1.4"/>`
      + `<circle cx="32" cy="12" r="2" fill="#E2335F" stroke="${T}" stroke-width=".8"/><circle cx="24.5" cy="17.1" r="1.3" fill="#3AA0E8"/><circle cx="39.5" cy="17.1" r="1.3" fill="#3AA0E8"/>` + funkeln(52, 8, 3.4) + funkeln(12, 10, 2.4),
  },
  {
    id: 'jackpot', code: 'qbJackpot', name: 'Jackpot', figur: 'hofnarr', ab: 16,
    augen: sternAugen,
    dazu: L => [[8, 54, -14], [56, 50, 16], [13, 42, 8]].map(([x, y, d]) => `<g transform="rotate(${d} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="5" ry="5" fill="${L.kugel('#FFD54A', { h: .5 })}" ${U} stroke-width="1.3"/><text x="${x}" y="${y + 2.4}" text-anchor="middle" font-family="Bricolage, system-ui, sans-serif" font-weight="800" font-size="7" fill="#9E7520">Q</text></g>`).join('')
      + funkeln(50, 26, 3.6) + funkeln(9, 26, 2.6) + funkeln(56, 38, 2.2),
  },
  // Winter: ab 1. Dezember für alle
  {
    id: 'schnee', code: 'qbSchnee', name: 'Eingeschneit', figur: 'igel', winter: true,
    augenOpt: { weit: true },
    dazu: L => `<path d="M12 27 Q12 8 32 8 Q52 8 52 27Z" fill="${L.kugel('#D8434A', { h: .3 })}" ${U} stroke-width="1.6"/><path d="M19 13 L23 27 M26 9.5 L28 27 M33 8.5 L33 27 M40 9.5 L38 27 M46 13 L43 27" stroke="#B5333A" stroke-width="1.2" opacity=".6"/>`
      + `<rect x="9.5" y="24" width="45" height="7" rx="3.5" fill="${L.kugel('#F7F3EA')}" ${U} stroke-width="1.5"/><circle cx="32" cy="6" r="5" fill="${L.kugel('#FFFFFF', { d: .15 })}" ${U} stroke-width="1.4"/>`
      + [[7, 40, 2.4], [57, 44, 2], [53, 34, 1.4], [10, 52, 1.6], [58, 56, 1.8]].map(([x, y, s]) => `<path d="M${x} ${r1(y - s)} V${r1(y + s)} M${r1(x - s)} ${y} H${r1(x + s)} M${r1(x - s * .7)} ${r1(y - s * .7)} L${r1(x + s * .7)} ${r1(y + s * .7)} M${r1(x + s * .7)} ${r1(y - s * .7)} L${r1(x - s * .7)} ${r1(y + s * .7)}" stroke="#E6F2FA" stroke-width="1" stroke-linecap="round"/>`).join(''),
  },
];
export const EMOTE_CODE = new Map(EMOTES.map(e => [e.code.toLowerCase(), e]));
export const emoteVonId = id => EMOTES.find(e => e.id === id);

// Ab wann? Text für Liste und Profil
export function emoteHinweis(e) {
  if (e.winter) return 'Ab 1. Dezember für alle';
  if (e.ab == null) return 'Für alle frei';
  return `Ab ${stufeInfo(e.ab).name} (${SCHWELLEN[e.ab].toLocaleString('de-DE')} Ruhm)`;
}
// Hat Spieler p (mit ruhm) das Emote? Gäste und Fremde ohne Daten bekommen die freien.
export function emoteFrei(e, p, jetzt = new Date()) {
  if (!e) return false;
  if (e.winter) return jetzt >= WINTER_AB;
  if (e.ab == null) return true;
  return stufeVon(p?.ruhm || 0) >= e.ab;
}
export const emotesFrei = p => EMOTES.filter(e => emoteFrei(e, p));
// Welche Emotes kommen mit Ruhmstufe i?
export const emotesAbStufe = i => EMOTES.filter(e => e.ab === i);

// Gezeichnet wird jedes Emote nur einmal und dann als Bild-Adresse benutzt (leicht für den Chat, keine doppelten IDs)
const CACHE = new Map(), BILD = new Map();
export function emoteSvg(id) {
  if (CACHE.has(id)) return CACHE.get(id);
  const e = emoteVonId(id);
  const svg = e ? figurAusdruck(e.figur, { rahmen: '2 1 60 60', ...e }) : '';
  CACHE.set(id, svg);
  return svg;
}
// Als Bild muss es sauberes XML sein: doppelte Attribute (die Figuren setzen stroke-width gern zweimal) wie im HTML nur einmal, das erste gilt
const xmlSauber = svg => svg.replace(/<([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*(\/?)>/g, (_, tag, attr, zu) => {
  const a = new Map();
  for (const [, n, v] of attr.matchAll(/\s+([a-zA-Z:-]+)="([^"]*)"/g)) if (!a.has(n)) a.set(n, v);
  return `<${tag}${[...a].map(([n, v]) => ` ${n}="${v}"`).join('')}${zu ? '/' : ''}>`;
});
export function emoteBild(id) {
  if (!BILD.has(id)) BILD.set(id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xmlSauber(emoteSvg(id)).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" ')));
  return BILD.get(id);
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const emoteImg = (e, klasse = 'emote') => `<img class="${klasse}" src="${emoteBild(e.id)}" alt="${esc(e.code)}" title="${esc(e.code)}" draggable="false">`;

// Chat-Text: escapen, Emote-Wörter des Absenders als Bild. Nur Emotes werden größer gezeigt.
export function chatHtml(text, absender) {
  let emotes = 0, sonst = 0;
  const html = String(text).split(/(\s+)/).map(t => {
    if (!t.trim()) return t;
    const e = EMOTE_CODE.get(t.toLowerCase());
    if (e && emoteFrei(e, absender)) { emotes++; return emoteImg(e); }
    sonst++;
    return esc(t);
  }).join('');
  return { html, nurEmotes: emotes > 0 && sonst === 0 && emotes <= 6 };
}

// Tab im Chat: angefangenes Wort zu einem freien Emote ergänzen (mehrmals Tab blättert weiter)
export function emoteErgaenzen(anfang, p, schonGezeigt = 0) {
  const a = anfang.toLowerCase();
  if (a.length < 2) return null;
  const treffer = emotesFrei(p).filter(e => e.code.toLowerCase().startsWith(a) || e.name.toLowerCase().startsWith(a) || e.code.slice(2).toLowerCase().startsWith(a));
  return treffer.length ? treffer[schonGezeigt % treffer.length] : null;
}
