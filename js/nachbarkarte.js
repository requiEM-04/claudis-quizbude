// Kleine Karte für die Kategorie Nachbarn: das gefragte Land leuchtet, die Nachbarländer sind nur als Umriss da,
// alles andere bleibt blass. Wird im Spiel gezeichnet und vom Werkzeug für das Kachelbild benutzt.
// ringe: { CODE: [[lon*100, lat*100, …], …] }, grenzen: { CODE: [Nachbarcodes] }
const merc = lat => -Math.log(Math.tan(Math.PI / 4 + Math.max(-80, Math.min(80, lat)) * Math.PI / 360)) * 180 / Math.PI;
const BREIT = 160, HOCH = 100;
const kastenCache = new WeakMap();
let zaehler = 0;

function kasten(r) { // Begrenzung eines Rings in Grad
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (let i = 0; i < r.length; i += 2) { const x = r[i] / 100, y = r[i + 1] / 100; if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; }
  return [a, b, c, d];
}
function kaesten(ringe) {
  if (!kastenCache.has(ringe)) {
    const k = {};
    for (const [code, rs] of Object.entries(ringe)) k[code] = rs.map(kasten);
    kastenCache.set(ringe, k);
  }
  return kastenCache.get(ringe);
}

export function nachbarKarte(code, ringe, grenzen, opt = {}) {
  const eigene = ringe[code];
  if (!eigene?.length) return '';
  const K = kaesten(ringe);
  // Rahmen um den größten Ring (Festland), damit Überseegebiete das Bild nicht sprengen
  let haupt = 0, flaeche = -1;
  K[code].forEach(([a, b, c, d], i) => { const f = (b - a) * (d - c); if (f > flaeche) { flaeche = f; haupt = i; } });
  const [a, b, c, d] = K[code][haupt];
  const mitte = (a + b) / 2;
  let x0 = a, x1 = b, y0 = merc(d), y1 = merc(c);
  const klein = Math.max(x1 - x0, y1 - y0) < 1.4;
  // Rand drumherum, Mindestgröße, dann aufs Seitenverhältnis bringen
  const rand = opt.rand ?? 2.1;
  let w = Math.max((x1 - x0) * rand, 9), h = Math.max((y1 - y0) * rand, 9 * HOCH / BREIT);
  if (w / h > BREIT / HOCH) h = w * HOCH / BREIT; else w = h * BREIT / HOCH;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  x0 = cx - w / 2; y0 = cy - h / 2; x1 = x0 + w; y1 = y0 + h;
  const s = BREIT / w, st = opt.stellen ?? 1;
  const pfad = (rs, ks) => {
    let out = '';
    rs.forEach((r, i) => {
      let [ra, rb, rc, rd] = ks[i];
      let schub = 0; // über die Datumsgrenze: Ring auf die Seite der Mitte holen
      const rm = (ra + rb) / 2;
      if (rm - mitte > 180) schub = -360; else if (mitte - rm > 180) schub = 360;
      ra += schub; rb += schub;
      if (rb < x0 || ra > x1 || merc(rc) < y0 || merc(rd) > y1) return;
      let letzt = '';
      for (let j = 0; j < r.length; j += 2) {
        const p = `${((r[j] / 100 + schub - x0) * s).toFixed(st)} ${((merc(r[j + 1] / 100) - y0) * s).toFixed(st)}`;
        if (p === letzt) continue;
        out += (j ? 'L' : 'M') + p; letzt = p;
      }
      out += 'Z';
    });
    return out;
  };
  const nb = new Set(grenzen[code] || []);
  let rest = '', nachbarn = '';
  for (const [c2, rs] of Object.entries(ringe)) {
    if (c2 === code) continue;
    const p = pfad(rs, K[c2]);
    if (!p) continue;
    if (nb.has(c2)) nachbarn += p; else rest += p;
  }
  const land = pfad(eigene, K[code]);
  const f = opt.farben; // fürs Kachelbild als eigenständige Datei: Farben direkt im SVG
  const gid = 'nkg' + (++zaehler);
  const attr = (klasse, fill, stroke, extra = '') => f ? `fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''}${extra}` : `class="${klasse}"`;
  const mx = ((a + b) / 2 - x0) * s, my = ((merc(c) + merc(d)) / 2 - y0) * s;
  return `<svg ${opt.klasse ? `class="${opt.klasse}" ` : ''}viewBox="0 0 ${BREIT} ${HOCH}"${f ? ' xmlns="http://www.w3.org/2000/svg"' : ''} role="img" aria-label="${opt.label || 'Karte'}">`
    + `<defs><filter id="${gid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`
    + `<path ${attr('nk-rest', f?.rest, f?.restRand, ' stroke-width=".35"')} d="${rest}" fill-rule="evenodd"/>`
    + `<path ${attr('nk-nachbar', f?.nachbar, f?.rand, ' stroke-width=".7" stroke-linejoin="round"')} d="${nachbarn}" fill-rule="evenodd"/>`
    + `<path ${f ? `fill="${f.glut}" opacity=".8"` : 'class="nk-glut"'} filter="url(#${gid})" d="${land}" fill-rule="evenodd"/>`
    + `<path ${attr('nk-land', f?.land, f?.landRand, ' stroke-width=".6" stroke-linejoin="round"')} d="${land}" fill-rule="evenodd"/>`
    + (klein ? `<circle ${f ? `fill="none" stroke="${f.land}" stroke-width="1"` : 'class="nk-ring"'} cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="6"/>` : '')
    + '</svg>';
}
