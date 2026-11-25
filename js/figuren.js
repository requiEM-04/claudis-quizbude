// Eigene Profilbild-Figuren (alle selbst gezeichnet), Kreis-Hintergründe und Randfarben.
// Stil: Sammelkarten-Porträt. Kräftiger Umriss, Licht von links oben (Verläufe), selbstbewusster Blick mit Lid und Iris.
// Jede gezeichnete Figur bekommt eigene IDs (dieselbe Figur steht oft mehrfach auf der Seite, auch in ausgeblendeten Teilen).

const T = '#1D1916';           // Tinte für Umrisse
const U = `stroke="${T}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const r1 = n => Math.round(n * 100) / 100;

// Farben mischen (für hell/dunkel aus einer Grundfarbe)
function mix(a, b, t) {
  const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
  const [p, q] = [h(a), h(b)];
  return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const hell = (f, t = .3) => mix(f, '#ffffff', t);
const dunkel = (f, t = .3) => mix(f, '#000000', t);

let leinwandNr = 0;
const PRAEFIX = 'fg' + Math.random().toString(36).slice(2, 6); // eindeutig, auch wenn das Modul zweimal geladen wird
// Pro Figur: sammelt Verläufe und Clips mit eindeutigen IDs
function leinwand() {
  const n = ++leinwandNr; let defs = '', i = 0;
  const id = () => `${PRAEFIX}${n}x${i++}`;
  return {
    // Kugel-Licht: hell oben links, dunkel unten rechts
    kugel(f, { cx = .36, cy = .28, h = .32, d = .32 } = {}) {
      const k = id();
      defs += `<radialGradient id="${k}" cx="${cx}" cy="${cy}" r=".78"><stop offset="0" stop-color="${hell(f, h)}"/><stop offset=".55" stop-color="${f}"/><stop offset="1" stop-color="${dunkel(f, d)}"/></radialGradient>`;
      return `url(#${k})`;
    },
    senkrecht(oben, unten) {
      const k = id();
      defs += `<linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${oben}"/><stop offset="1" stop-color="${unten}"/></linearGradient>`;
      return `url(#${k})`;
    },
    clip(form) { const k = id(); defs += `<clipPath id="${k}">${form}</clipPath>`; return `url(#${k})`; },
    defs: () => defs,
  };
}

// Augenpaar, x = linkes Auge (das rechte wird gespiegelt). schraeg > 0: Lid fällt zur Nase hin ab (entschlossener Blick)
function augen(L, x, y, r, iris, { lid = T, schraeg = 1, pupille = 'rund', braue = null, schlitz = false } = {}) {
  const form = `M${r1(x - r)} ${r1(y + r * .08)} Q${r1(x - r * .15)} ${r1(y - r * 1.05)} ${r1(x + r)} ${r1(y - r * (.05 + .28 * schraeg))} Q${r1(x + r * .2)} ${r1(y + r * .95)} ${r1(x - r)} ${r1(y + r * .08)}Z`;
  const clip = L.clip(`<path d="${form}"/>`);
  const ix = x + r * .14, iy = y + r * .04;
  const pup = schlitz || pupille === 'schlitz'
    ? `<ellipse cx="${r1(ix)}" cy="${r1(iy)}" rx="${r1(r * .14)}" ry="${r1(r * .52)}" fill="${T}"/>`
    : `<circle cx="${r1(ix)}" cy="${r1(iy)}" r="${r1(r * .3)}" fill="${T}"/>`;
  const auge = `<path d="${form}" fill="#F3EEE3"/>`
    + `<g clip-path="${clip}"><circle cx="${r1(ix)}" cy="${r1(iy)}" r="${r1(r * .64)}" fill="${iris}"/><circle cx="${r1(ix)}" cy="${r1(iy)}" r="${r1(r * .64)}" fill="none" stroke="${dunkel(iris, .45)}" stroke-width="${r1(r * .12)}"/>${pup}`
    + `<path d="M${r1(x - r)} ${r1(y - r * .9)} L${r1(x + r)} ${r1(y - r * 1.1)} L${r1(x + r)} ${r1(y - r * .18)} Q${r1(x)} ${r1(y - r * .55)} ${r1(x - r)} ${r1(y - r * .2)}Z" fill="${T}" opacity=".22"/></g>`
    + `<circle cx="${r1(ix - r * .2)}" cy="${r1(iy - r * .26)}" r="${r1(r * .19)}" fill="#fff"/>`
    + `<path d="${form}" fill="none" stroke="${T}" stroke-width="1.1"/>`
    + `<path d="M${r1(x - r * 1.12)} ${r1(y + r * .02)} Q${r1(x - r * .15)} ${r1(y - r * 1.15)} ${r1(x + r * 1.1)} ${r1(y - r * (.1 + .3 * schraeg))}" fill="none" stroke="${lid}" stroke-width="${r1(r * .38)}" stroke-linecap="round"/>`
    + (braue ? `<path d="M${r1(x - r * 1.1)} ${r1(y - r * 1.55)} Q${r1(x)} ${r1(y - r * 1.75)} ${r1(x + r * 1.15)} ${r1(y - r * (1.05 + .25 * schraeg))}" fill="none" stroke="${braue}" stroke-width="${r1(r * .5)}" stroke-linecap="round"/>` : '');
  return auge + `<g transform="matrix(-1 0 0 1 64 0)">${auge}</g>`;
}

// Glanzlicht oben links auf einer Rundung
const glanz = (cx, cy, rx, ry, dreh = -30, o = .35) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${dreh} ${cx} ${cy})" fill="#fff" opacity="${o}"/>`;
const spiegel = d => d.replace(/(-?\d+(?:\.\d+)?)(\s+|,)(-?\d+(?:\.\d+)?)/g, (_, x, s, y) => `${r1(64 - Number(x))}${s}${y}`);
const paar = (d, attr) => `<path d="${d}" ${attr}/><path d="${spiegel(d)}" ${attr}/>`;
const schultern = (L, f, brust) => `<path d="M8 68 Q10 51 32 51 Q54 51 56 68Z" fill="${L.kugel(f, { cy: .1 })}" ${U}/>${brust ? `<path d="M22.5 68 Q24 55.5 32 55.5 Q40 55.5 41.5 68Z" fill="${brust}"/>` : ''}`;
function zacken(cx, cy, aussen, innen, n, von = 0, bis = 360) {
  const p = [];
  for (let i = 0; i <= n * 2; i++) {
    const w = (von + (bis - von) * i / (n * 2)) * Math.PI / 180, r = i % 2 ? innen : aussen;
    p.push(`${r1(cx + r * Math.cos(w))} ${r1(cy + r * Math.sin(w))}`);
  }
  return 'M' + p.join(' L') + (bis - von >= 360 ? 'Z' : '');
}
function stern(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 10; i++) { const w = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * .45 : r; p.push(`${r1(cx + rr * Math.cos(w))} ${r1(cy + rr * Math.sin(w))}`); }
  return 'M' + p.join(' L') + 'Z';
}
// Nase mit Glanz
const nase = (x, y, rx, ry, f = T) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"/><ellipse cx="${r1(x - rx * .3)}" cy="${r1(y - ry * .35)}" rx="${r1(rx * .38)}" ry="${r1(ry * .28)}" fill="#fff" opacity=".45"/>`;

const ZEICHNUNG = {
  fuchs: L => {
    const o = '#E0702A', w = '#FBEBD6';
    return paar('M13 32 L15.5 5.5 L30.5 20Z', `fill="${L.kugel(o)}" ${U}`) + paar('M17 26 L18.2 12 L25.5 19.5Z', `fill="#2B1F1A"`)
      + schultern(L, o, w)
      + `<path d="M8 32 Q10 17 32 16.5 Q54 17 56 32 L50 40 L53 41.5 Q46 50 32 54.5 Q18 50 11 41.5 L14 40Z" fill="${L.kugel(o)}" ${U}/>`
      + paar('M9.5 34.5 L15 39.5 L12.5 41 Q19 47.5 26 49.5 Q30 52 32 54.3 Q31.5 46 27 41 Q21 39 18 36.5Z', `fill="${w}"`)
      + `<path d="M26 41 Q32 38 38 41 Q36.5 47 32 50 Q27.5 47 26 41Z" fill="${hell(w, .4)}"/>`
      + paar('M19 23 Q24 21 28.5 25', `fill="none" stroke="${dunkel(o, .35)}" stroke-width="1.6" stroke-linecap="round"`)
      + augen(L, 23.5, 32, 4, '#F2A93B', { schraeg: 1.2 })
      + nase(32, 46.5, 3, 2.2) + `<path d="M29.5 50 Q32 51.3 34.5 50" fill="none" stroke="${T}" stroke-width="1.1" stroke-linecap="round"/>`
      + glanz(19, 22, 5, 2.2, -25, .28);
  },
  frosch: L => {
    const g = '#5FAE45';
    return schultern(L, '#4E9A3A', '#CFE7A2')
      + `<ellipse cx="32" cy="40" rx="23" ry="14.5" fill="${L.kugel(g, { cy: .2 })}" ${U}/>`
      + `<circle cx="20.5" cy="26" r="9.5" fill="${L.kugel(g)}" ${U}/><circle cx="43.5" cy="26" r="9.5" fill="${L.kugel(g)}" ${U}/>`
      + augen(L, 20.5, 27, 6.3, '#E8C24A', { schraeg: .7, lid: dunkel(g, .35) })
      + `<circle cx="16" cy="44" r="1.4" fill="${dunkel(g, .3)}"/><circle cx="48" cy="43" r="1.8" fill="${dunkel(g, .3)}"/><circle cx="44.5" cy="47.5" r="1.1" fill="${dunkel(g, .3)}"/>`
      + `<path d="M17.5 42 Q30 50.5 45.5 41.5" fill="none" stroke="${T}" stroke-width="1.7" stroke-linecap="round"/><path d="M45.5 41.5 l1.8 -1.6" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`
      + `<circle cx="29" cy="36.3" r=".9" fill="${T}"/><circle cx="35" cy="36.3" r=".9" fill="${T}"/>`
      + glanz(16.5, 21, 3.2, 1.6, -35, .35) + glanz(39.5, 21, 3.2, 1.6, -35, .35);
  },
  panda: L => {
    const s = '#26222A', w = '#F4F1EA';
    return `<circle cx="16" cy="19" r="7.5" fill="${L.kugel(s, { h: .25 })}" ${U}/><circle cx="48" cy="19" r="7.5" fill="${L.kugel(s, { h: .25 })}" ${U}/>`
      + schultern(L, s, w)
      + `<path d="M11.5 35 Q11.5 17.5 32 17.5 Q52.5 17.5 52.5 35 Q52.5 52 32 53.5 Q11.5 52 11.5 35Z" fill="${L.kugel(w, { d: .18 })}" ${U}/>`
      + paar('M16.5 37.5 Q15 29.5 22 27.5 Q28.5 26 29 31.5 Q29.5 37 23.5 41.5 Q18 44.5 16.5 37.5Z', `fill="${s}"`)
      + augen(L, 23.2, 33.6, 3.1, '#B9783A', { schraeg: 1, lid: s })
      + nase(32, 43, 3.4, 2.3, s) + `<path d="M32 45.3 V47 M29.3 48.2 Q32 49.6 34.7 48.2" fill="none" stroke="${s}" stroke-width="1.2" stroke-linecap="round"/>`
      + glanz(22, 22, 6, 2.4, -20, .45);
  },
  eule: L => {
    const b = '#8A5A36', h = '#E6CFA4';
    return `<path d="M12 68 L12 30 Q12 17 19 12 L24.5 18.5 Q32 16 39.5 18.5 L45 12 Q52 17 52 30 L52 68Z" fill="${L.kugel(b)}" ${U}/>`
      + `<path d="M19.5 68 Q19 52 32 48 Q45 52 44.5 68Z" fill="${L.kugel(h, { cy: .1 })}"/>`
      + `<path d="M25.5 55 l2 2.3 l2 -2.3 M32.5 55 l2 2.3 l2 -2.3 M29 60.5 l2 2.3 l2 -2.3 M22.5 61 l2 2.3 l2 -2.3 M36 61 l2 2.3 l2 -2.3" fill="none" stroke="${dunkel(h, .3)}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="24" cy="31.5" r="9.8" fill="${L.kugel('#F1E2C2', { d: .15 })}"/><circle cx="40" cy="31.5" r="9.8" fill="${L.kugel('#F1E2C2', { d: .15 })}"/>`
      + augen(L, 24, 32, 5.4, '#F2952E', { schraeg: .9, lid: '#5A3A22' })
      + paar('M14.5 22.5 Q22 19 30.5 26', `fill="none" stroke="#5A3A22" stroke-width="2.6" stroke-linecap="round"`)
      + `<path d="M29.2 37.5 L34.8 37.5 L32 44.5Z" fill="${L.kugel('#E3913B')}" ${U} stroke-width="1.2"/>`
      + glanz(18, 20, 4, 1.8, -40, .3);
  },
  krake: L => {
    const p = '#B35FA8';
    return `<path d="M12 41 Q10 52 5 57 Q11 62.5 17 56.5 Q16.5 63 21 68 L43 68 Q47.5 63 47 56.5 Q53 62.5 59 57 Q54 52 52 41Z" fill="${L.kugel(dunkel(p, .15), { cy: .1 })}" ${U}/>`
      + `<path d="M5 57 Q8 59 10 57.5 M59 57 Q56 59 54 57.5 M21 68 Q24 65 22.5 62" fill="none" stroke="${T}" stroke-width="1.4" stroke-linecap="round"/>`
      + `<circle cx="12.5" cy="56" r="1.3" fill="${hell(p, .45)}"/><circle cx="51.5" cy="56" r="1.3" fill="${hell(p, .45)}"/><circle cx="26" cy="60" r="1.3" fill="${hell(p, .45)}"/><circle cx="38" cy="60" r="1.3" fill="${hell(p, .45)}"/><circle cx="32" cy="64.5" r="1.3" fill="${hell(p, .45)}"/>`
      + `<path d="M12 41 Q10.5 10.5 32 10.5 Q53.5 10.5 52 41 Q43 46.5 32 46.5 Q21 46.5 12 41Z" fill="${L.kugel(p)}" ${U}/>`
      + `<circle cx="41" cy="19" r="2.5" fill="${hell(p, .3)}"/><circle cx="46" cy="27" r="1.7" fill="${hell(p, .3)}"/><circle cx="21" cy="18.5" r="1.6" fill="${hell(p, .3)}"/>`
      + augen(L, 24.5, 33, 4.2, '#F2C14E', { schraeg: .5, lid: dunkel(p, .45), pupille: 'schlitz' })
      + `<path d="M28.5 41 Q32 42.4 35.5 40.6" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`
      + glanz(22, 18, 6, 2.6, -30, .32);
  },
  pinguin: L => {
    const n = '#25304A', w = '#F5F2EB';
    return `<path d="M12 68 Q9 44 14.5 27.5 Q20 11 32 11 Q44 11 49.5 27.5 Q55 44 52 68Z" fill="${L.kugel(n, { h: .3 })}" ${U}/>`
      + `<path d="M18.5 33 Q17.5 21.5 26.5 21.5 Q30 21.5 32 24.5 Q34 21.5 37.5 21.5 Q46.5 21.5 45.5 33 Q45.5 46 32 48 Q18.5 46 18.5 33Z" fill="${L.kugel(w, { d: .15 })}"/>`
      + `<ellipse cx="32" cy="63" rx="12.5" ry="9.5" fill="${L.kugel(w, { d: .15 })}"/>`
      + augen(L, 26, 31.5, 3.3, '#6FB4E6', { schraeg: 1.1, lid: n })
      + `<path d="M28 37.2 Q32 35 36 37.2 Q34.5 42.3 32 43.6 Q29.5 42.3 28 37.2Z" fill="${L.kugel('#F2A33A')}" ${U} stroke-width="1.1"/>`
      + `<path d="M15 50 Q12 58 14 66" fill="none" stroke="${hell(n, .25)}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`
      + glanz(21, 18, 6, 2.4, -30, .3);
  },
  katze: L => {
    const g = '#727985', h = '#E9E4DB';
    return paar('M11.5 33 L14 7.5 L29 19.5Z', `fill="${L.kugel(g)}" ${U}`) + paar('M15.5 27 L16.8 13.5 L24.5 19.5Z', `fill="#E39CA3"`)
      + schultern(L, g, h)
      + `<path d="M10 36 Q10 18.5 32 18.5 Q54 18.5 54 36 Q54 43 49 47 L51.5 49 Q43 53.5 32 53.5 Q21 53.5 12.5 49 L15 47 Q10 43 10 36Z" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M32 20 V26 M27 21 L28.3 25.5 M37 21 L35.7 25.5 M13 33 L18 34 M51 33 L46 34 M13.5 37.5 L18 37.3 M50.5 37.5 L46 37.3" fill="none" stroke="${dunkel(g, .35)}" stroke-width="1.8" stroke-linecap="round"/>`
      + `<path d="M24 42 Q32 37.5 40 42 Q38.5 49.5 32 51 Q25.5 49.5 24 42Z" fill="${h}"/>`
      + augen(L, 24, 33.5, 3.9, '#9ACD5A', { schraeg: 1.3, lid: '#3C4149', pupille: 'schlitz' })
      + `<path d="M30 40.2 L34 40.2 L32 42.5Z" fill="#D9808C" stroke="${T}" stroke-width=".8" stroke-linejoin="round"/><path d="M32 42.5 V44 M29.6 45.4 Q32 46.8 34.4 45.4" fill="none" stroke="${T}" stroke-width="1" stroke-linecap="round"/>`
      + paar('M23 44 L12 42.5 M23 46.5 L13 48', `fill="none" stroke="#F4F1EA" stroke-width=".8" stroke-linecap="round" opacity=".75"`)
      + glanz(20, 24, 6, 2.4, -25, .25);
  },
  igel: L => {
    const b = '#5E4332', h = '#E3C79D';
    return `<path d="${zacken(32, 40, 28.5, 19.5, 11, 160, 380)}" fill="${L.kugel(b, { cy: .2 })}" ${U}/>`
      + `<path d="${zacken(32, 40, 23, 18, 9, 175, 365)}" fill="none" stroke="${hell(b, .25)}" stroke-width="1.1" stroke-linejoin="round" opacity=".7"/>`
      + schultern(L, b, h)
      + `<path d="M16 41 Q16 27 32 27 Q48 27 48 41 Q48 49 38 52.5 L32 55.5 L26 52.5 Q16 49 16 41Z" fill="${L.kugel(h, { d: .2 })}" ${U}/>`
      + augen(L, 26, 38.5, 3.1, '#7A4524', { schraeg: 1, lid: b })
      + nase(32, 49.6, 3, 2.3) + `<path d="M29.5 44.5 Q32 46 34.5 44.5" fill="none" stroke="${dunkel(h, .35)}" stroke-width="1" stroke-linecap="round"/>`
      + glanz(23, 31, 4.5, 1.8, -20, .35);
  },
  schildkroete: L => {
    const g = '#6FAE5E', s = '#8C5E2E';
    return `<path d="M24.5 54 L24.5 39 L39.5 39 L39.5 54Z" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M15.5 29.5 Q15.5 14.5 32 14.5 Q48.5 14.5 48.5 29.5 Q48.5 42 32 43.5 Q15.5 42 15.5 29.5Z" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M5 68 Q7 43 32 41.5 Q57 43 59 68Z" fill="${L.kugel(s, { cy: .15 })}" ${U}/>`
      + `<path d="M24 68 L26 54.5 L32 50.5 L38 54.5 L40 68 M26 54.5 L12 56.5 M38 54.5 L52 56.5 M32 50.5 L32 43" fill="none" stroke="${dunkel(s, .35)}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<path d="M7.5 58 Q32 50 56.5 58" fill="none" stroke="${hell(s, .3)}" stroke-width="1.2" opacity=".6"/>`
      + `<circle cx="22" cy="21" r="1.5" fill="${hell(g, .3)}"/><circle cx="41.5" cy="20" r="1.3" fill="${hell(g, .3)}"/>`
      + augen(L, 25.5, 29.5, 3.7, '#C9A13A', { schraeg: .4, lid: dunkel(g, .45) })
      + `<path d="M27.5 37.5 Q32 39.3 36.5 37" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`
      + glanz(23, 19, 6, 2.3, -20, .3);
  },
  dino: L => {
    const g = '#3F9C8A', h = '#B6E3D3', z = '#F08B3C';
    return `<path d="M20.5 18 L23.5 6.5 L28.5 16Z M28.5 15 L32.5 2.5 L36.5 15Z M36 16 L41.5 7 L43.5 18Z" fill="${L.kugel(z)}" ${U}/>`
      + schultern(L, g, h)
      + `<path d="M11 41 Q10 15.5 32 15 Q54 15.5 54 36 Q54 50 41 52 L23 52 Q11 51 11 41Z" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M14.5 45 Q32 50.5 50.5 43 Q48.5 51 41 52 L23 52 Q15.5 51.5 14.5 45Z" fill="${h}"/>`
      + `<path d="M22 45.5 L23.3 48.5 L24.6 45.8 M38.5 45.5 L39.8 48.3 L41 45.2" fill="#fff" stroke="${T}" stroke-width=".8" stroke-linejoin="round"/>`
      + `<path d="M20.5 45 Q32 49.5 43.5 44.2" fill="none" stroke="${T}" stroke-width="1.4" stroke-linecap="round"/>`
      + augen(L, 23.5, 31, 4, '#F2D24B', { schraeg: 1.3, lid: dunkel(g, .45), pupille: 'schlitz' })
      + `<circle cx="28.5" cy="39.5" r="1.1" fill="${T}"/><circle cx="35.5" cy="39.5" r="1.1" fill="${T}"/>`
      + glanz(20, 22, 6, 2.4, -25, .3);
  },
  biene: L => {
    const y = '#F0B92F';
    return `<ellipse cx="13" cy="44" rx="10.5" ry="6.5" transform="rotate(-30 13 44)" fill="${L.senkrecht('#F2FAFF', '#BFE0F2')}" ${U} stroke-width="1.5" opacity=".95"/><ellipse cx="51" cy="44" rx="10.5" ry="6.5" transform="rotate(30 51 44)" fill="${L.senkrecht('#F2FAFF', '#BFE0F2')}" ${U} stroke-width="1.5" opacity=".95"/>`
      + schultern(L, y) + `<path d="M13 57.5 Q32 52.5 51 57.5 L51.8 62 Q32 57 12.2 62Z" fill="${T}"/>`
      + `<path d="M27 18.5 Q23.5 9.5 18 7.5 M37 18.5 Q40.5 9.5 46 7.5" fill="none" ${U} stroke-width="1.7"/><circle cx="18" cy="7.5" r="2.4" fill="${T}"/><circle cx="46" cy="7.5" r="2.4" fill="${T}"/>`
      + `<circle cx="32" cy="33" r="16.5" fill="${L.kugel(y)}" ${U}/>`
      + `<path d="M17 29 Q32 24 47 29" fill="none" stroke="${dunkel(y, .25)}" stroke-width="1.2" opacity=".6"/>`
      + augen(L, 25.5, 33.5, 4.2, '#3A2A12', { schraeg: 1, lid: T })
      + `<path d="M28.5 41.5 Q32 43 35.5 41.2" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`
      + glanz(24, 23, 6, 2.5, -25, .4);
  },
  koala: L => {
    const g = '#8F97A2', h = '#E2E5E9';
    return `<circle cx="13.5" cy="24.5" r="11.5" fill="${L.kugel(g)}" ${U}/><circle cx="50.5" cy="24.5" r="11.5" fill="${L.kugel(g)}" ${U}/>`
      + `<circle cx="14.5" cy="25.5" r="6.8" fill="${h}"/><circle cx="49.5" cy="25.5" r="6.8" fill="${h}"/>`
      + paar('M8 24 L11 25 M8.5 28 L11.5 27.6', `fill="none" stroke="${g}" stroke-width="1.2" stroke-linecap="round"`)
      + schultern(L, g, h)
      + `<ellipse cx="32" cy="37" rx="19" ry="17.5" fill="${L.kugel(g)}" ${U}/>`
      + augen(L, 23.5, 33.5, 3, '#6E4A34', { schraeg: .2, lid: '#4C525B' })
      + `<path d="M27 37 Q27 31.5 32 31.5 Q37 31.5 37 37 L37 42.5 Q37 47.5 32 47.5 Q27 47.5 27 42.5Z" fill="${L.kugel('#34333A', { h: .25 })}"/>`
      + `<ellipse cx="30" cy="35" rx="1.5" ry="2.4" fill="#fff" opacity=".35"/>`
      + glanz(21, 25, 6, 2.4, -20, .3);
  },
  wal: L => {
    const b = '#3F78B8';
    return `<path d="M26 15 Q24 8.5 19 7 M29 14 Q29 6.5 31.5 3.5 M32 15 Q35 9.5 40 9.5" fill="none" stroke="#9FD0FF" stroke-width="2.3" stroke-linecap="round"/>`
      + `<path d="M5 40 Q5 21 28 20 Q46 20 52 32.5 Q55.5 28.5 61 23 Q63.5 32.5 59 38.5 Q63 42.5 61.5 49 Q55.5 45 51.5 42.5 Q45.5 56 28 56.5 Q5 56.5 5 40Z" fill="${L.kugel(b, { cx: .3, cy: .25 })}" ${U}/>`
      + `<path d="M6.8 45 Q11.5 55.5 28 56 Q42 56 49.5 45.5 Q30 51.5 6.8 45Z" fill="${L.senkrecht('#DDEBF7', '#B5CDE3')}"/>`
      + `<path d="M15 49 L16 52 M21 50.5 L21.7 53.4 M27 51 L27.3 54 M33 50.8 L32.8 53.8" fill="none" stroke="#8FB2D2" stroke-width="1" stroke-linecap="round"/>`
      + `<path d="M26.5 46 Q29.5 56 37 52Z" fill="${dunkel(b, .2)}" ${U} stroke-width="1.3"/>`
      + (() => { const a = augen(L, 19, 36, 3.4, '#2D5C93', { schraeg: .9, lid: dunkel(b, .4) }); return a.slice(0, a.indexOf('<g transform="matrix(-1')); })()
      + `<path d="M9 41 Q14 44.5 19.5 42.3" fill="none" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`
      + glanz(18, 26, 8, 2.6, -15, .3);
  },
  papagei: L => {
    const r = '#D8473E';
    return schultern(L, '#2F8E57') + `<path d="M22.5 68 Q24 55.5 32 55.5 Q40 55.5 41.5 68Z" fill="${L.kugel('#2F6FC0')}"/>`
      + `<path d="M27 16.5 Q28.5 5.5 35.5 2.5 Q34 10 37.5 15.5Z" fill="${L.kugel(r)}" ${U}/>`
      + `<path d="M13 36 Q13 13.5 32 13.5 Q51 13.5 51 36 Q51 52.5 32 54.5 Q13 52.5 13 36Z" fill="${L.kugel(r)}" ${U}/>`
      + `<path d="M15 33 Q15 24 22.5 24 Q29 24 29.5 32 Q30 41 22.5 41 Q15 41 15 33Z" fill="#F6F0E5"/><path d="M49 33 Q49 24 41.5 24 Q35 24 34.5 32 Q34 41 41.5 41 Q49 41 49 33Z" fill="#F6F0E5"/>`
      + `<path d="M17 35.5 l2 0 M17.5 38.2 l2 0 M44.5 35.5 l2 0 M44 38.2 l2 0" stroke="#C6BDB0" stroke-width="1" stroke-linecap="round"/>`
      + augen(L, 23, 31, 3.3, '#F2C94C', { schraeg: 1.1, lid: dunkel(r, .4) })
      + `<path d="M28.2 42 Q32 44.6 35.8 42 Q35 47.2 32 48.6 Q29 47.2 28.2 42Z" fill="#34302C"/>`
      + `<path d="M25.6 35.6 Q32 31 38.4 35.6 Q39.4 41.6 34.4 46 Q33 47.4 32.4 50.2 Q31 46.2 28.6 44.2 Q24.8 40.8 25.6 35.6Z" fill="${L.kugel('#F1DDBC', { d: .2 })}" ${U} stroke-width="1.3"/>`
      + glanz(22, 19, 6, 2.3, -25, .3);
  },
  // ---- per Ruhm ----
  quizbot: L => {
    const k = '#D07A3E', d = '#1A1D24', l = '#6FF0E0';
    return `<path d="M32 15 V8" ${U}/><circle cx="32" cy="6.5" r="3.6" fill="${L.kugel(l, { h: .5 })}" ${U} stroke-width="1.3"/>`
      + `<rect x="7.5" y="28.5" width="6" height="12" rx="2.3" fill="${L.kugel(dunkel(k, .2))}" ${U} stroke-width="1.4"/><rect x="50.5" y="28.5" width="6" height="12" rx="2.3" fill="${L.kugel(dunkel(k, .2))}" ${U} stroke-width="1.4"/>`
      + `<path d="M8 68 Q10 54 32 54 Q54 54 56 68Z" fill="${L.kugel(dunkel(k, .1), { cy: .1 })}" ${U}/><rect x="26.5" y="48" width="11" height="7" fill="${dunkel(k, .35)}" ${U} stroke-width="1.3"/>`
      + `<rect x="25" y="57.5" width="14" height="8.5" rx="2.5" fill="${d}"/><text x="32" y="64.3" font-size="7.5" font-weight="800" font-family="sans-serif" text-anchor="middle" fill="${l}">?</text>`
      + `<rect x="11.5" y="14.5" width="41" height="35" rx="9" fill="${L.kugel(k)}" ${U}/>`
      + `<rect x="16.5" y="20" width="31" height="23" rx="6" fill="${L.senkrecht('#262B35', '#111318')}" stroke="${dunkel(k, .45)}" stroke-width="1.2"/>`
      + `<path d="M20.5 27.5 L29 30 L28.2 34.5 L20.5 33Z M43.5 27.5 L35 30 L35.8 34.5 L43.5 33Z" fill="${l}"/>`
      + `<path d="M26 38.6 L38 38.6" stroke="${l}" stroke-width="1.8" stroke-linecap="round"/>`
      + `<path d="M17.5 21.5 L25 21.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".25"/>`
      + `<circle cx="15.5" cy="45.5" r="1.1" fill="${dunkel(k, .4)}"/><circle cx="48.5" cy="45.5" r="1.1" fill="${dunkel(k, .4)}"/>`
      + glanz(19, 17.5, 5, 1.5, -10, .35);
  },
  herzdrache: L => {
    const p = '#E2789F', h = '#F5B6CB', d = '#A9446E';
    return paar('M14 51 Q1 41 5 22.5 Q11 32 18 33.5 Q13.5 40.5 20.5 46.5Z', `fill="${L.kugel(d)}" ${U}`)
      + paar('M6 26 Q11 33 16.5 35 M8 37 Q12.5 40 17 41', `fill="none" stroke="${dunkel(d, .3)}" stroke-width="1" stroke-linecap="round"`)
      + paar('M21 20.5 Q15.5 10 19 3.5 Q24.5 12 27 18Z', `fill="${L.kugel('#F3E0BE')}" ${U}`)
      + schultern(L, p, h)
      + `<path d="M11 36 Q11 16.5 32 16.5 Q53 16.5 53 36 Q53 50.5 32 52.5 Q11 50.5 11 36Z" fill="${L.kugel(p)}" ${U}/>`
      + `<path d="M21.5 43.5 Q21.5 37 32 37 Q42.5 37 42.5 43.5 Q42.5 50 32 50.5 Q21.5 50 21.5 43.5Z" fill="${L.kugel(h, { d: .15 })}"/>`
      + `<ellipse cx="28.8" cy="42.5" rx="1.1" ry="1.5" fill="${T}"/><ellipse cx="35.2" cy="42.5" rx="1.1" ry="1.5" fill="${T}"/>`
      + `<path d="M27 47 Q32 48.8 37 46.8" fill="none" stroke="${T}" stroke-width="1.2" stroke-linecap="round"/><path d="M35 47.2 L35.8 49.4 L36.8 47" fill="#fff" stroke="${T}" stroke-width=".7"/>`
      + `<path d="M32 29.5 C25.5 25.3 28 20 32 23.1 C36 20 38.5 25.3 32 29.5Z" fill="${L.kugel('#E2335F')}" ${U} stroke-width="1.1"/>`
      + augen(L, 23, 33.5, 3.8, '#F7D04A', { schraeg: 1.3, lid: d, pupille: 'schlitz' })
      + glanz(20, 22, 6, 2.4, -25, .3);
  },
  sternwolf: L => {
    const g = '#7E97AB', h = '#EAF1F6';
    return paar('M13 30 L15 4 L29.5 19Z', `fill="${L.kugel(g)}" ${U}`) + paar('M16.8 24 L17.9 11 L25.5 19.5Z', `fill="#24303B"`)
      + schultern(L, g, h)
      + `<path d="M9 34 L4 40.5 L10.5 42 L6 48.5 L14.5 48 L12 55 L21 51.5 L32 57 L43 51.5 L52 55 L49.5 48 L58 48.5 L53.5 42 L60 40.5 L55 34Z" fill="${L.kugel('#CBD9E3', { cy: .2 })}" ${U}/>`
      + `<path d="M11 31.5 Q12 17 32 16 Q52 17 53 31.5 Q52 45.5 32 52 Q12 45.5 11 31.5Z" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M17.5 37.5 Q26 37.5 32 32.5 Q38 37.5 46.5 37.5 Q44.5 47 32 51.5 Q19.5 47 17.5 37.5Z" fill="${h}"/>`
      + `<path d="M24 22.5 Q28 26 30 30 M40 22.5 Q36 26 34 30" fill="none" stroke="#3A4B5A" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>`
      + `<path d="${stern(32, 24.5, 4.4)}" fill="#fff" stroke="#5D7A90" stroke-width=".9" stroke-linejoin="round"/>`
      + augen(L, 23.5, 31.5, 3.6, '#8FE6FF', { schraeg: 1.4, lid: '#24303B' })
      + nase(32, 43.5, 3.2, 2.3) + `<path d="M32 45.8 V47.3 M29.3 48.5 Q32 49.8 34.7 48.5" fill="none" stroke="${T}" stroke-width="1.1" stroke-linecap="round"/>`
      + glanz(19, 22, 5, 2, -25, .3);
  },
  phoenix: L => {
    const g = '#F2B034', f = '#DC5527';
    return paar('M16.5 58 Q2.5 47 4.5 28 Q11 37.5 15.5 38 Q8.5 27 12.5 15.5 Q19.5 29.5 24.5 36Z', `fill="${L.kugel(f)}" ${U}`)
      + paar('M9 31 Q13 37 17 40 M13.5 21 Q17 30 21 36', `fill="none" stroke="#F7C45A" stroke-width="1.2" stroke-linecap="round" opacity=".8"`)
      + `<path d="M23 21 Q21 9.5 26.5 3 Q27.5 11.5 31 14.5 Q31 5 36.5 1 Q37.5 10.5 39 15.5 Q42.5 9.5 47 8.5 Q44 15.5 41 21.5Z" fill="${L.kugel('#F2902C', { cy: .6 })}" ${U}/>`
      + `<path d="M27.5 18.5 Q27.5 12 31 8.5 Q32 13.5 34 15.5 Q35 10.5 38.5 9.5 Q38.5 15 36.5 19Z" fill="#FCD67E"/>`
      + schultern(L, g) + `<path d="M23 68 Q25 59.5 28.5 56.5 Q29.5 61 32 55.5 Q34.5 61 35.5 56.5 Q39 59.5 41 68Z" fill="${f}"/>`
      + `<circle cx="32" cy="33" r="16" fill="${L.kugel(g)}" ${U}/>`
      + `<path d="M21 37 Q22 46.5 32 47 Q42 46.5 43 37 Q32 33 21 37Z" fill="${hell(g, .45)}"/>`
      + augen(L, 25, 31, 3.4, '#FFE7A0', { schraeg: 1.4, lid: dunkel(f, .35) })
      + `<path d="M28 35.5 Q32 33.3 36 35.5 Q35 42.5 32 45.5 Q29 42.5 28 35.5Z" fill="${L.kugel(f)}" ${U} stroke-width="1.2"/>`
      + glanz(24, 23, 5, 2, -25, .35);
  },
  hofnarr: L => {
    const v = '#7A4FD0', t = '#2FA596', g = '#F2C14E';
    return `<path d="M8 68 L10.5 55.5 L17 59 L21.5 52.5 L27 58 L32 51.5 L37 58 L42.5 52.5 L47 59 L53.5 55.5 L56 68Z" fill="${L.kugel(v, { cy: .1 })}" ${U}/>`
      + `<path d="M21.5 52.5 L27 58 L32 51.5 L37 58 L42.5 52.5 L42.5 68 L21.5 68Z" fill="${t}"/>`
      + `<ellipse cx="32" cy="41.5" rx="15.5" ry="13.5" fill="${L.kugel('#F3E2D0', { d: .2 })}" ${U}/>`
      + `<path d="M12.5 31 Q7.5 18.5 6.5 15 Q15 13.5 21 22.5 Q24.5 9.5 32 4.5 Q39.5 9.5 43 22.5 Q49 13.5 57.5 15 Q56.5 18.5 51.5 31Z" fill="${L.kugel(v)}" ${U}/>`
      + `<path d="M21 22.5 Q24.5 9.5 32 4.5 Q32 18 32 28.5 Q26 28.5 21 22.5Z" fill="${L.kugel(t)}"/>`
      + `<path d="M12.5 31 Q32 24 51.5 31 L52 35 Q32 27.5 12 35Z" fill="${L.kugel(g)}" ${U} stroke-width="1.3"/>`
      + `<circle cx="6.5" cy="15" r="3.2" fill="${L.kugel(g)}" ${U} stroke-width="1.3"/><circle cx="32" cy="4.5" r="3.2" fill="${L.kugel(g)}" ${U} stroke-width="1.3"/><circle cx="57.5" cy="15" r="3.2" fill="${L.kugel(g)}" ${U} stroke-width="1.3"/>`
      + `<path d="M39.5 43.5 L41.5 46.3 L39.5 49.1 L37.5 46.3Z" fill="${v}"/><path d="M24.5 43.5 L26.5 46.3 L24.5 49.1 L22.5 46.3Z" fill="${t}"/>`
      + augen(L, 25.5, 39, 3.3, '#7A4FD0', { schraeg: 1.5, lid: T })
      + `<path d="M25 47.5 Q32 54.5 39.5 46.5 Q32 50 25 47.5Z" fill="#9E3550" ${U} stroke-width="1.2"/><path d="M27.5 48.6 Q32 50.3 37 48" fill="none" stroke="#fff" stroke-width="1.1" opacity=".8"/>`
      + glanz(22, 15, 4.5, 1.8, -40, .3);
  },
  // ---- Saison ----
  loewe: L => {
    return `<path d="${zacken(32, 36, 28.5, 21, 15)}" fill="${L.kugel('#B8642A', { cy: .3 })}" ${U}/>`
      + `<path d="${zacken(32, 36, 24, 19.5, 15, 12)}" fill="${L.kugel('#D98636')}"/>`
      + schultern(L, '#D98636', '#F7DCA6')
      + `<circle cx="19.5" cy="22" r="5" fill="${L.kugel('#E9B25C')}" ${U}/><circle cx="44.5" cy="22" r="5" fill="${L.kugel('#E9B25C')}" ${U}/>`
      + `<path d="M16.5 37 Q16.5 22.5 32 22.5 Q47.5 22.5 47.5 37 Q47.5 47.5 38.5 51.5 L32 53.5 L25.5 51.5 Q16.5 47.5 16.5 37Z" fill="${L.kugel('#EDBA62')}" ${U}/>`
      + `<path d="M24 43 Q32 39.5 40 43 Q39.5 49.5 32 51 Q24.5 49.5 24 43Z" fill="#F8E0AE"/>`
      + `<path d="M28.5 40.8 L35.5 40.8 Q32 45.8 28.5 40.8Z" fill="#6E3A22"/><path d="M32 44.5 V46.5 M29.3 48 Q31.5 49.5 32 46.5 Q32.5 49.5 34.7 48" fill="none" stroke="${T}" stroke-width="1.1" stroke-linecap="round"/>`
      + augen(L, 25.3, 34.5, 3.2, '#F0B031', { schraeg: 1.3, lid: '#6E3A22', braue: '#8C4A22' })
      + `<path d="M22.5 15.5 L24.5 6.5 L28.8 11 L32 3.5 L35.2 11 L39.5 6.5 L41.5 15.5Z" fill="${L.kugel('#F7D25A', { h: .45 })}" ${U} stroke-width="1.4"/>`
      + `<circle cx="32" cy="12" r="1.5" fill="#E2335F"/>`
      + glanz(24, 27, 5, 2, -25, .3);
  },
};

// frei: alle; rang: per Ruhm (ab König der Farbe); medaille: Platz in einer Saison (1 = Sieg)
export const FIGUREN = [
  { id: 'fuchs', name: 'Fuchs', emoji: '🦊' },
  { id: 'frosch', name: 'Frosch', emoji: '🐸' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
  { id: 'eule', name: 'Eule', emoji: '🦉' },
  { id: 'krake', name: 'Krake', emoji: '🐙' },
  { id: 'pinguin', name: 'Pinguin', emoji: '🐧' },
  { id: 'katze', name: 'Katze', emoji: '🐱' },
  { id: 'igel', name: 'Igel', emoji: '🦔' },
  { id: 'schildkroete', name: 'Schildkröte', emoji: '🐢' },
  { id: 'dino', name: 'Dino', emoji: '🦖' },
  { id: 'biene', name: 'Biene', emoji: '🐝' },
  { id: 'koala', name: 'Koala', emoji: '🐨' },
  { id: 'wal', name: 'Wal', emoji: '🐳' },
  { id: 'papagei', name: 'Papagei', emoji: '🦜' },
  { id: 'quizbot', name: 'Quizbot', emoji: '🤖', rang: 'karo' },
  { id: 'herzdrache', name: 'Herzdrache', emoji: '🐉', rang: 'herz' },
  { id: 'sternwolf', name: 'Sternwolf', emoji: '🐺', rang: 'pik' },
  { id: 'phoenix', name: 'Phönix', emoji: '🔥', rang: 'kreuz' },
  { id: 'hofnarr', name: 'Hofnarr', emoji: '🃏', rang: 'joker' },
  { id: 'loewe', name: 'Löwe', emoji: '🦁', medaille: 1 },
];
export const figurVonId = id => FIGUREN.find(f => f.id === id);

export function figurSvg(id) {
  const zeichnen = ZEICHNUNG[id];
  if (!zeichnen) return '';
  const L = leinwand(), inhalt = zeichnen(L);
  return `<svg class="figur" viewBox="0 0 64 64" aria-hidden="true"><defs>${L.defs()}</defs>${inhalt}</svg>`;
}

// Alte Emoji-Avatare: freie Tiere werden automatisch zur passenden Figur
const EMOJI_FIGUR = Object.fromEntries(FIGUREN.filter(f => !f.rang && !f.medaille).map(f => [f.emoji, f.id]));
export const figurAusEmoji = e => EMOJI_FIGUR[e] || null;
export const FREIE_FIGUREN = FIGUREN.filter(f => !f.rang && !f.medaille);

// Bewegte Kreis-Hintergründe (ab Dame der Farbe); sonst die einfache Farbe aus profile.farbe
export const KREISE = [
  { id: 'glut', name: 'Kupferglut', rang: 'karo' },
  { id: 'herzschlag', name: 'Herzschlag', rang: 'herz' },
  { id: 'sternennacht', name: 'Sternennacht', rang: 'pik' },
  { id: 'sonnenrad', name: 'Sonnenrad', rang: 'kreuz' },
  { id: 'holo', name: 'Holo', rang: 'joker' },
];

// Randfarben: Grundfarben frei, Kartenfarben ab Bube der Farbe, Metall per Saison-Medaille
export const RINGE = [
  { id: 'weiss', name: 'Weiß', farbe: '#F4F1EA' },
  { id: 'sand', name: 'Sand', farbe: '#CDB68C' },
  { id: 'salbei', name: 'Salbei', farbe: '#8FB3A2' },
  { id: 'himmel', name: 'Himmel', farbe: '#9AAFC7' },
  { id: 'rose', name: 'Rose', farbe: '#D99A9A' },
  { id: 'flieder', name: 'Flieder', farbe: '#B3A3C9' },
  { id: 'karo', name: 'Kupfer', rang: 'karo', farbe: '#E39A63' },
  { id: 'herz', name: 'Rosé', rang: 'herz', farbe: '#F0A9C3' },
  { id: 'pik', name: 'Eisblau', rang: 'pik', farbe: '#CFE6F3' },
  { id: 'kreuz', name: 'Messing', rang: 'kreuz', farbe: '#EBC660' },
  { id: 'joker', name: 'Regenbogen', rang: 'joker' },
  { id: 'bronze', name: 'Bronze', medaille: 3 },
  { id: 'silber', name: 'Silber', medaille: 2 },
  { id: 'gold', name: 'Gold', medaille: 1 },
];

// Ab welcher Ruhmstufe? (Farbe × 4 + Bild: Ring ab Bube, Kreis ab Dame, Figur ab König; Joker = 16)
export const BILD_AB = { ring: 0, kreis: 1, figur: 2 };
export function bildFreiAb(art, eintrag) {
  if (!eintrag?.rang) return null;
  if (eintrag.rang === 'joker') return 16;
  return ['karo', 'herz', 'pik', 'kreuz'].indexOf(eintrag.rang) * 4 + BILD_AB[art];
}
const LISTE = { figur: FIGUREN, kreis: KREISE, ring: RINGE };
export const bildEintrag = (art, id) => LISTE[art]?.find(e => e.id === id) || null;
// bestPlatz: bester Saison-Platz (1–3) oder null
export function bildFrei(art, id, stufe, bestPlatz) {
  const e = bildEintrag(art, id);
  if (!e) return false;
  if (e.medaille) return bestPlatz != null && bestPlatz <= e.medaille;
  if (e.rang) return stufe >= bildFreiAb(art, e);
  return art !== 'kreis';
}
