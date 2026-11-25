// Eigene Profilbild-Figuren (alle selbst gezeichnet), Kreis-Hintergründe und Randfarben.
// Jede Figur ist ein Brustbild in einem 64er-Raster; der runde Avatar schneidet die Ecken ab.
// Keine <defs>/IDs: dieselbe Figur steht oft mehrfach auf der Seite.

const T = '#2A2420';           // Tinte für Umrisse und Augen
const U = `stroke="${T}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;

const r1 = n => Math.round(n * 100) / 100;
const auge = (x, y, r = 2.8) => `<ellipse cx="${x}" cy="${y}" rx="${r1(r * .84)}" ry="${r}" fill="${T}"/><circle cx="${r1(x + r * .3)}" cy="${r1(y - r * .38)}" r="${r1(r * .36)}" fill="#fff"/>`;
const wangen = (xl, xr, y, f = '#F0898A') => `<ellipse cx="${xl}" cy="${y}" rx="3" ry="1.8" fill="${f}" opacity=".55"/><ellipse cx="${xr}" cy="${y}" rx="3" ry="1.8" fill="${f}" opacity=".55"/>`;
const schultern = (f, brust) => `<path d="M10 67 Q12 52 32 52 Q52 52 54 67Z" fill="${f}" ${U}/>${brust ? `<path d="M23 67 Q24.5 56 32 56 Q39.5 56 41 67Z" fill="${brust}"/>` : ''}`;
const spiegel = d => d.replace(/(-?\d+(?:\.\d+)?)(\s+|,)(-?\d+(?:\.\d+)?)/g, (_, x, s, y) => `${r1(64 - Number(x))}${s}${y}`);
const paar = (d, attr) => `<path d="${d}" ${attr}/><path d="${spiegel(d)}" ${attr}/>`;
// Zacken (Mähne, Stacheln): abwechselnd außen/innen um einen Mittelpunkt
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

const ZEICHNUNG = {
  fuchs: () => {
    const o = '#E8843C', w = '#FFF3E3';
    return paar('M15 31 L17 9 L30 21Z', `fill="${o}" ${U}`) + paar('M18.5 26 L19.3 14.5 L25.5 21Z', `fill="#3B2A24"`)
      + schultern(o, w)
      + `<path d="M10 33 Q11 19 32 18 Q53 19 54 33 Q53 42 44 48 Q38 53 32 54 Q26 53 20 48 Q11 42 10 33Z" fill="${o}" ${U}/>`
      + paar('M10.9 34.5 Q18 38.5 26 39 Q30 46 32 53.6 Q26 53 20 48 Q12 42 10.9 34.5Z', `fill="${w}"`)
      + auge(24, 32, 3) + auge(40, 32, 3) + `<ellipse cx="32" cy="47.5" rx="2.7" ry="2" fill="${T}"/>`;
  },
  frosch: () => {
    const g = '#7DC05B';
    return schultern('#69AD4A', '#D6EBA9')
      + `<ellipse cx="32" cy="40" rx="22" ry="14" fill="${g}" ${U}/>`
      + `<circle cx="21" cy="27" r="9" fill="${g}" ${U}/><circle cx="43" cy="27" r="9" fill="${g}" ${U}/>`
      + `<circle cx="21" cy="27" r="6" fill="#fff"/><circle cx="43" cy="27" r="6" fill="#fff"/>` + auge(21.6, 28, 3.3) + auge(43.6, 28, 3.3)
      + `<path d="M19 43 Q32 52 45 43" fill="none" ${U}/>` + wangen(15.5, 48.5, 42)
      + `<circle cx="29" cy="36.5" r=".9" fill="${T}"/><circle cx="35" cy="36.5" r=".9" fill="${T}"/>`;
  },
  panda: () => {
    const s = '#2E2A2A', w = '#F6F4EF';
    return `<circle cx="17" cy="20" r="7" fill="${s}" ${U}/><circle cx="47" cy="20" r="7" fill="${s}" ${U}/>`
      + schultern(s, w)
      + `<ellipse cx="32" cy="36" rx="20" ry="17.5" fill="${w}" ${U}/>`
      + `<ellipse cx="24.5" cy="35" rx="5" ry="6.6" transform="rotate(-30 24.5 35)" fill="${s}"/><ellipse cx="39.5" cy="35" rx="5" ry="6.6" transform="rotate(30 39.5 35)" fill="${s}"/>`
      + `<circle cx="25" cy="34.3" r="2.2" fill="#fff"/><circle cx="39" cy="34.3" r="2.2" fill="#fff"/><circle cx="25.4" cy="34.6" r="1.2" fill="${s}"/><circle cx="38.6" cy="34.6" r="1.2" fill="${s}"/>`
      + `<ellipse cx="32" cy="42.5" rx="3" ry="2.1" fill="${s}"/><path d="M29.5 45.5 Q32 47.6 34.5 45.5" fill="none" ${U} stroke-width="1.2"/>` + wangen(19, 45, 42);
  },
  eule: () => {
    const b = '#9C6A44', h = '#EAD5AE';
    return `<path d="M13 67 L13 30 Q13 16 21 12 L25 19 Q32 16.5 39 19 L43 12 Q51 16 51 30 L51 67Z" fill="${b}" ${U}/>`
      + `<ellipse cx="32" cy="58" rx="12.5" ry="11" fill="${h}"/>`
      + `<path d="M26.5 53.5 l2 2 l2 -2 M33.5 53.5 l2 2 l2 -2 M30 58.5 l2 2 l2 -2" fill="none" stroke="#B88E62" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="24.5" cy="31" r="9.5" fill="#F3E4C6"/><circle cx="39.5" cy="31" r="9.5" fill="#F3E4C6"/>`
      + `<circle cx="24.5" cy="31" r="6" fill="#F2BE45"/><circle cx="39.5" cy="31" r="6" fill="#F2BE45"/>` + auge(24.8, 31.3, 3.5) + auge(39.2, 31.3, 3.5)
      + `<path d="M29.5 37 L34.5 37 L32 42.5Z" fill="#E08E3C" ${U} stroke-width="1"/>`;
  },
  krake: () => {
    const p = '#C97DBA';
    return `<path d="M13 42 Q12 52 7 58 Q14 61 18 55 Q18 62 22 67 L42 67 Q46 62 46 55 Q50 61 57 58 Q52 52 51 42Z" fill="#B8679F" ${U}/>`
      + `<circle cx="13" cy="57" r="1.3" fill="#E8B4DC"/><circle cx="51" cy="57" r="1.3" fill="#E8B4DC"/><circle cx="26" cy="60" r="1.3" fill="#E8B4DC"/><circle cx="38" cy="60" r="1.3" fill="#E8B4DC"/><circle cx="32" cy="64" r="1.3" fill="#E8B4DC"/>`
      + `<path d="M13 42 Q11 12 32 12 Q53 12 51 42 Q42 47 32 47 Q22 47 13 42Z" fill="${p}" ${U}/>`
      + `<circle cx="40" cy="20" r="2.4" fill="#E3A9D6"/><circle cx="45" cy="27" r="1.6" fill="#E3A9D6"/><circle cx="21" cy="20" r="1.5" fill="#E3A9D6"/>`
      + auge(25, 33.5, 3.2) + auge(39, 33.5, 3.2) + wangen(19, 45, 39.5) + `<path d="M29 39.5 Q32 42.5 35 39.5" fill="none" ${U} stroke-width="1.3"/>`;
  },
  pinguin: () => {
    const n = '#2F3B52', w = '#F7F5F0';
    return `<path d="M13 67 Q10 44 15 28 Q20 12 32 12 Q44 12 49 28 Q54 44 51 67Z" fill="${n}" ${U}/>`
      + `<path d="M19 33 Q18 22 27 22 Q30 22 32 25 Q34 22 37 22 Q46 22 45 33 Q45 45 32 47 Q19 45 19 33Z" fill="${w}"/>`
      + `<ellipse cx="32" cy="63" rx="12" ry="9" fill="${w}"/>`
      + auge(26.5, 32, 2.7) + auge(37.5, 32, 2.7) + wangen(22, 42, 39)
      + `<path d="M28.5 37.5 Q32 35.5 35.5 37.5 Q32 43 28.5 37.5Z" fill="#F2A33A" ${U} stroke-width="1"/>`;
  },
  katze: () => {
    const g = '#7B828D', h = '#ECE7DF';
    return paar('M13 32 L15 9 L29 20Z', `fill="${g}" ${U}`) + paar('M16.5 26 L17.5 14.5 L25 20Z', `fill="#E9A3A8"`)
      + schultern(g, h)
      + `<ellipse cx="32" cy="36" rx="20.5" ry="17" fill="${g}" ${U}/>`
      + `<path d="M32 20.5 V26 M27 21.5 L28 25.5 M37 21.5 L36 25.5" fill="none" stroke="#5A606A" stroke-width="1.8" stroke-linecap="round"/>`
      + `<circle cx="29" cy="42.3" r="4.2" fill="${h}"/><circle cx="35" cy="42.3" r="4.2" fill="${h}"/>`
      + `<ellipse cx="24.5" cy="33.5" rx="3.2" ry="3.5" fill="#A6D06B"/><ellipse cx="39.5" cy="33.5" rx="3.2" ry="3.5" fill="#A6D06B"/>`
      + `<ellipse cx="24.5" cy="33.6" rx="1.2" ry="2.8" fill="${T}"/><ellipse cx="39.5" cy="33.6" rx="1.2" ry="2.8" fill="${T}"/><circle cx="25.4" cy="32.3" r=".8" fill="#fff"/><circle cx="40.4" cy="32.3" r=".8" fill="#fff"/>`
      + `<path d="M30.2 39.2 L33.8 39.2 L32 41.3Z" fill="#E58C97"/>`
      + paar('M22.5 42 L12.5 40 M22.5 44.5 L13 46', `fill="none" stroke="${T}" stroke-width=".9" stroke-linecap="round" opacity=".55"`);
  },
  igel: () => {
    const b = '#6E5140', h = '#E8CDA4';
    return `<path d="${zacken(32, 40, 27, 19, 9, 165, 375)}" fill="${b}" ${U}/>`
      + schultern(b, h)
      + `<ellipse cx="32" cy="41" rx="16" ry="14" fill="${h}" ${U}/>`
      + `<path d="M21 31 Q32 25 43 31" fill="none" stroke="#C9A97F" stroke-width="1.4" stroke-linecap="round"/>`
      + auge(26.5, 39, 2.7) + auge(37.5, 39, 2.7) + wangen(21, 43, 45)
      + `<ellipse cx="32" cy="45.8" rx="2.7" ry="2" fill="${T}"/><path d="M30 49 Q32 50.5 34 49" fill="none" ${U} stroke-width="1.1"/>`;
  },
  schildkroete: () => {
    const g = '#8DC17B';
    return `<path d="M25 53 L25 40 L39 40 L39 53Z" fill="${g}" ${U}/>`
      + `<ellipse cx="32" cy="30" rx="15" ry="13.5" fill="${g}" ${U}/>`
      + `<path d="M6 67 Q8 44 32 43 Q56 44 58 67Z" fill="#A8783F" ${U}/>`
      + `<path d="M24 67 L26 54 L32 50 L38 54 L40 67 M26 54 L13 56 M38 54 L51 56 M32 50 L32 44" fill="none" stroke="#7E5627" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<circle cx="24" cy="22" r="1.6" fill="#AEDA9F"/><circle cx="40.5" cy="21" r="1.3" fill="#AEDA9F"/><circle cx="36" cy="18.5" r="1" fill="#AEDA9F"/>`
      + auge(26.5, 30, 2.8) + auge(37.5, 30, 2.8) + wangen(21, 43, 35.5) + `<path d="M28.5 36 Q32 39 35.5 36" fill="none" ${U} stroke-width="1.3"/>`;
  },
  dino: () => {
    const g = '#5DB3A0', h = '#C3E8DA', z = '#F0A04B';
    return `<path d="M22 17 L25.5 7 L30 15Z M29.5 14.5 L33 4.5 L37 14.5Z M36.5 15.5 L41.5 8 L43.5 17.5Z" fill="${z}" ${U}/>`
      + schultern(g, h)
      + `<path d="M12 40 Q11 16 32 14.5 Q53 15 53 36 Q53 49 40 51.5 L24 51.5 Q12 50 12 40Z" fill="${g}" ${U}/>`
      + `<path d="M15.5 44.5 Q32 50 49.5 42.5 Q47.5 50.5 40 51.5 L24 51.5 Q16.5 50.5 15.5 44.5Z" fill="${h}"/>`
      + auge(24, 31, 3) + auge(41, 31, 3) + wangen(18.5, 46.5, 38)
      + `<circle cx="29" cy="39.5" r="1" fill="${T}"/><circle cx="36" cy="39.5" r="1" fill="${T}"/>`
      + `<path d="M24 44.5 Q32 48.5 41 43.5" fill="none" ${U} stroke-width="1.3"/>`;
  },
  biene: () => {
    const y = '#F2C14E';
    return `<ellipse cx="14" cy="45" rx="10" ry="6.5" transform="rotate(-28 14 45)" fill="#E3F2FA" ${U}/><ellipse cx="50" cy="45" rx="10" ry="6.5" transform="rotate(28 50 45)" fill="#E3F2FA" ${U}/>`
      + schultern(y) + `<path d="M13.4 58 Q32 53 50.6 58 L51.2 62 Q32 57 12.8 62Z" fill="${T}"/>`
      + `<path d="M27 18.5 Q24 10 19 8 M37 18.5 Q40 10 45 8" fill="none" ${U}/><circle cx="19" cy="8" r="2.3" fill="${T}"/><circle cx="45" cy="8" r="2.3" fill="${T}"/>`
      + `<circle cx="32" cy="33" r="16" fill="${y}" ${U}/>`
      + auge(26, 32.5, 3) + auge(38, 32.5, 3) + wangen(20.5, 43.5, 38.5) + `<path d="M28.5 38.5 Q32 41.5 35.5 38.5" fill="none" ${U} stroke-width="1.3"/>`;
  },
  koala: () => {
    const g = '#A0A7B1', h = '#E6E8EC';
    return `<circle cx="14" cy="25" r="11" fill="${g}" ${U}/><circle cx="50" cy="25" r="11" fill="${g}" ${U}/><circle cx="14.5" cy="26" r="6.3" fill="${h}"/><circle cx="49.5" cy="26" r="6.3" fill="${h}"/>`
      + schultern(g, h)
      + `<ellipse cx="32" cy="37" rx="18.5" ry="17" fill="${g}" ${U}/>`
      + `<ellipse cx="32" cy="41" rx="4.7" ry="6.2" fill="#3A3A40"/><ellipse cx="33.4" cy="38.3" rx="1.2" ry="1.8" fill="#fff" opacity=".5"/>`
      + auge(24, 34, 2.5) + auge(40, 34, 2.5) + wangen(21, 43, 42.5);
  },
  wal: () => {
    const b = '#5E92C9';
    return `<path d="M26 15 Q24 9 19.5 8 M29 14 Q29 7 31.5 4.5 M32 15 Q35 10 39.5 10" fill="none" stroke="#8EC5FF" stroke-width="2.2" stroke-linecap="round"/>`
      + `<path d="M6 40 Q6 22 28 21 Q46 21 52 33 Q55 29 60 24 Q62.5 33 58.5 38.5 Q62 42 60.5 48 Q55 44.5 51.5 42.5 Q46 55 28 55.5 Q6 55.5 6 40Z" fill="${b}" ${U}/>`
      + `<path d="M7.8 45 Q12 54.5 28 55 Q42 55 49.5 45.5 Q30 51 7.8 45Z" fill="#CFE3F2"/>`
      + `<path d="M16 49 L17 51.5 M22 50.5 L22.7 53 M28 51 L28.3 53.6 M34 50.8 L33.8 53.4" fill="none" stroke="#9DBEDB" stroke-width="1" stroke-linecap="round"/>`
      + `<path d="M27 46 Q30 55.5 37 51.5Z" fill="#4C7DB3" ${U} stroke-width="1.2"/>`
      + auge(20, 36, 3) + `<ellipse cx="15" cy="42.5" rx="2.6" ry="1.6" fill="#F0898A" opacity=".55"/>` + `<path d="M10 40.5 Q14 44 18.5 42" fill="none" ${U} stroke-width="1.3"/>`;
  },
  papagei: () => {
    const r = '#E2574C';
    return schultern('#3E9C62') + `<path d="M23 67 Q24.5 56 32 56 Q39.5 56 41 67Z" fill="#3F7FC9"/>`
      + `<path d="M28 16 Q29.5 6 35 3.5 Q34 10 37 15Z" fill="${r}" ${U}/>`
      + `<path d="M14 36 Q14 14 32 14 Q50 14 50 36 Q50 52 32 54 Q14 52 14 36Z" fill="${r}" ${U}/>`
      + `<ellipse cx="22.5" cy="32" rx="7" ry="8" fill="#F7F2EA"/><ellipse cx="41.5" cy="32" rx="7" ry="8" fill="#F7F2EA"/>`
      + `<path d="M17.5 36 l2 0 M18 38.5 l2 0 M44.5 36 l2 0 M44 38.5 l2 0" stroke="#C9C1B4" stroke-width="1" stroke-linecap="round"/>`
      + auge(23, 31, 2.7) + auge(41, 31, 2.7)
      + `<path d="M28.2 42 Q32 44.6 35.8 42 Q35 47.2 32 48.6 Q29 47.2 28.2 42Z" fill="#3A3530"/>`
      + `<path d="M25.6 35.6 Q32 31 38.4 35.6 Q39.4 41.6 34.4 46 Q33 47.4 32.4 50.2 Q31 46.2 28.6 44.2 Q24.8 40.8 25.6 35.6Z" fill="#F4E3C6" ${U} stroke-width="1.2"/>`
      + `<path d="M29.4 35.4 Q32 34.2 34.6 35.4" fill="none" stroke="#C9B48F" stroke-width="1" stroke-linecap="round"/>`;
  },
  // ---- per Ruhm ----
  quizbot: () => {
    const k = '#DD8A4E', d = '#23262E', l = '#7FE3D8';
    return `<path d="M32 15 V8" ${U}/><circle cx="32" cy="6.5" r="3.4" fill="${l}" ${U} stroke-width="1.2"/>`
      + `<rect x="8.5" y="29" width="5.5" height="11" rx="2.2" fill="#B86A36" ${U} stroke-width="1.2"/><rect x="50" y="29" width="5.5" height="11" rx="2.2" fill="#B86A36" ${U} stroke-width="1.2"/>`
      + `<path d="M10 67 Q12 54 32 54 Q52 54 54 67Z" fill="#C7743E" ${U}/><rect x="27" y="48" width="10" height="7" fill="#9E5A2E" ${U} stroke-width="1.2"/>`
      + `<rect x="25.5" y="57.5" width="13" height="8" rx="2.5" fill="${d}"/><text x="32" y="64" font-size="7" font-weight="800" font-family="sans-serif" text-anchor="middle" fill="${l}">?</text>`
      + `<rect x="12" y="15" width="40" height="34" rx="10" fill="${k}" ${U}/>`
      + `<rect x="17" y="20.5" width="30" height="21.5" rx="6.5" fill="${d}"/>`
      + `<rect x="22" y="26.5" width="6.5" height="7.5" rx="2.6" fill="${l}"/><rect x="35.5" y="26.5" width="6.5" height="7.5" rx="2.6" fill="${l}"/>`
      + `<path d="M27 37.6 Q32 40.4 37 37.6" fill="none" stroke="${l}" stroke-width="1.6" stroke-linecap="round"/>`
      + `<circle cx="16" cy="45.5" r="1" fill="#9E5A2E"/><circle cx="48" cy="45.5" r="1" fill="#9E5A2E"/>`;
  },
  herzdrache: () => {
    const p = '#EE90B3', h = '#F7BCD1', d = '#C8628B';
    return paar('M15 51 Q2.5 41 6.5 24 Q12 32.5 18.5 34 Q14 41 20.5 46.5Z', `fill="${d}" ${U}`)
      + paar('M21.5 20.5 Q17 11 20 5.5 Q24.5 13 26.5 18Z', `fill="#F5E2C0" ${U}`)
      + schultern(p, h)
      + `<path d="M12 36 Q12 17 32 17 Q52 17 52 36 Q52 50 32 52 Q12 50 12 36Z" fill="${p}" ${U}/>`
      + `<ellipse cx="32" cy="43.5" rx="10" ry="6.5" fill="${h}"/><ellipse cx="29" cy="42.5" rx="1" ry="1.4" fill="${T}"/><ellipse cx="35" cy="42.5" rx="1" ry="1.4" fill="${T}"/>`
      + `<path d="M32 29 C25.5 24.8 28 19.6 32 22.7 C36 19.6 38.5 24.8 32 29Z" fill="#E24E7C" ${U} stroke-width="1"/>`
      + auge(23.5, 33.5, 3) + auge(40.5, 33.5, 3) + wangen(18, 46, 40.5, '#E24E7C');
  },
  sternwolf: () => {
    const g = '#8FA6B8', h = '#EEF3F7';
    return paar('M14 30 L16 6 L29 20Z', `fill="${g}" ${U}`) + paar('M17.5 24 L18.6 12 L25.5 20Z', `fill="#DDE7EE"`)
      + schultern(g, h)
      + `<path d="M10 34 L6 40 L12 42 L8 48 L16 48 L14 54 L22 51 L32 56 L42 51 L50 54 L48 48 L56 48 L52 42 L58 40 L54 34Z" fill="#D2DFE8" ${U}/>`
      + `<path d="M12 32 Q13 18 32 17 Q51 18 52 32 Q51 46 32 52 Q13 46 12 32Z" fill="${g}" ${U}/>`
      + `<path d="M18 38 Q26 38 32 33 Q38 38 46 38 Q44 47 32 51.5 Q20 47 18 38Z" fill="${h}"/>`
      + `<path d="${stern(32, 25.5, 4.6)}" fill="#fff" stroke="#6F8A9B" stroke-width=".8" stroke-linejoin="round"/>`
      + auge(24.5, 32, 2.8) + auge(39.5, 32, 2.8) + `<ellipse cx="32" cy="43.5" rx="3" ry="2.2" fill="${T}"/>`;
  },
  phoenix: () => {
    const g = '#F5B83D', f = '#E2622F';
    return paar('M17 57 Q3.5 47 5.5 29 Q11.5 37.5 16 38 Q9.5 27.5 13.5 17 Q19.5 29.5 24.5 36Z', `fill="${f}" ${U}`)
      + `<path d="M23.5 21 Q21.5 10 27 4 Q28 12 31 15 Q31 6 36 2 Q37 11 38.5 16 Q42 10 46 9 Q43.5 16 40.5 21.5Z" fill="#F29A33" ${U}/>`
      + `<path d="M28 18.5 Q28 12.5 31 9 Q32 14 34 16 Q35 11 38 10 Q38 15 36 19Z" fill="#FCD27A"/>`
      + schultern(g) + `<path d="M24 67 Q26 60 29 57 Q30 61 32 56 Q34 61 35 57 Q38 60 40 67Z" fill="${f}"/>`
      + `<circle cx="32" cy="33" r="15.5" fill="${g}" ${U}/>`
      + `<ellipse cx="32" cy="37.5" rx="11" ry="8.5" fill="#FCE3A1"/>`
      + auge(26, 31.5, 2.7) + auge(38, 31.5, 2.7)
      + `<path d="M28.5 36.5 Q32 34.5 35.5 36.5 Q34.5 42.5 32 45 Q29.5 42.5 28.5 36.5Z" fill="${f}" ${U} stroke-width="1"/>`;
  },
  hofnarr: () => {
    const v = '#8E62D9', t = '#4FB6A8', g = '#F2C14E';
    return `<path d="M10 67 L12 56 L18 59 L22 53 L27 58 L32 52 L37 58 L42 53 L46 59 L52 56 L54 67Z" fill="${v}" ${U}/>`
      + `<path d="M22 53 L27 58 L32 52 L37 58 L42 53 L42 67 L22 67Z" fill="${t}"/>`
      + `<ellipse cx="32" cy="42" rx="15" ry="13" fill="#F6E6D6" ${U}/>`
      + `<path d="M13 31 Q8.5 19 7.5 16 Q15 14.5 21 23 Q24.5 10 32 5.5 Q39.5 10 43 23 Q49 14.5 56.5 16 Q55.5 19 51 31Z" fill="${v}" ${U}/>`
      + `<path d="M21 23 Q24.5 10 32 5.5 Q32 18 32 28.5 Q26 28.5 21 23Z" fill="${t}"/>`
      + `<path d="M13 31 Q32 24 51 31 L51.5 34.5 Q32 27.5 12.5 34.5Z" fill="${g}" ${U} stroke-width="1.2"/>`
      + `<circle cx="7.5" cy="16" r="3" fill="${g}" ${U} stroke-width="1.2"/><circle cx="32" cy="5.5" r="3" fill="${g}" ${U} stroke-width="1.2"/><circle cx="56.5" cy="16" r="3" fill="${g}" ${U} stroke-width="1.2"/>`
      + `<path d="M39 43.5 L40.8 46 L39 48.5 L37.2 46Z" fill="${v}"/>`
      + auge(26, 39.5, 2.7) + auge(38, 39.5, 2.7) + `<circle cx="21" cy="46" r="2.4" fill="#E86A7E" opacity=".6"/><circle cx="43" cy="46" r="2.4" fill="#E86A7E" opacity=".6"/>`
      + `<path d="M25.5 47 Q32 55 38.5 47 Q32 49.5 25.5 47Z" fill="#B8465E" ${U} stroke-width="1.2"/>`;
  },
  // ---- Saison ----
  loewe: () => {
    return `<path d="${zacken(32, 36, 27.5, 21, 14)}" fill="#C97A34" ${U}/>`
      + `<circle cx="32" cy="36" r="21" fill="#DE913F"/>`
      + schultern('#DE913F', '#FBE3B0')
      + `<circle cx="20" cy="22" r="5" fill="#F2C46A" ${U}/><circle cx="44" cy="22" r="5" fill="#F2C46A" ${U}/>`
      + `<ellipse cx="32" cy="37.5" rx="15.5" ry="15" fill="#F2C46A" ${U}/>`
      + `<ellipse cx="32" cy="45" rx="8" ry="5.5" fill="#FBE3B0"/>`
      + `<path d="M28.8 40.5 L35.2 40.5 Q32 45 28.8 40.5Z" fill="#8C4A2E"/><path d="M32 44 V46 M29.5 47.5 Q31.5 49 32 46 Q32.5 49 34.5 47.5" fill="none" ${U} stroke-width="1.1"/>`
      + auge(25.5, 35, 2.7) + auge(38.5, 35, 2.7)
      + `<path d="M23.5 15 L25.5 7 L29.3 11 L32 4.5 L34.7 11 L38.5 7 L40.5 15Z" fill="#F7D25A" ${U} stroke-width="1.3"/>`;
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

const svgCache = new Map();
export function figurSvg(id) {
  if (!ZEICHNUNG[id]) return '';
  if (!svgCache.has(id)) svgCache.set(id, `<svg class="figur" viewBox="0 0 64 64" aria-hidden="true">${ZEICHNUNG[id]()}</svg>`);
  return svgCache.get(id);
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
