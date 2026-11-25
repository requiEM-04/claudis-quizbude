// Weltkarte zum Raten: verschieben (ziehen), zoomen (Mausrad, Pinch, Knöpfe), Doppelklick/Doppeltipp setzt den Pin.
// Die Grenzdaten (js/weltkarte-daten.js) werden erst geladen, wenn die Kategorie gebraucht wird.
let RINGE = null, STAEDTE = null;
let laden = null;
export function karteLaden() {
  if (!laden) laden = import('./weltkarte-daten.js?v=0.9.2').then(m => { RINGE = m.LAENDER_RINGE; STAEDTE = m.STAEDTE; });
  return laden;
}
export const karteDa = () => !!RINGE;
export const stadtVon = code => STAEDTE?.[code] || null;

// ---------- Projektion (Miller), Weltbreite 2000 Einheiten ----------
const B = 2000, K = B / (2 * Math.PI);
const millerY = lat => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180));
const Y0 = millerY(84); // Oberkante
const H = (Y0 - millerY(-58)) * K;
const px = lon => (lon + 180) / 360 * B;
const py = lat => (Y0 - millerY(Math.max(-85, Math.min(85, lat)))) * K;
const zuLon = x => x / B * 360 - 180;
const zuLat = y => (2.5 * Math.atan(Math.exp(0.8 * (Y0 - y / K))) - 0.625 * Math.PI) * 180 / Math.PI;

// ---------- Geometrie ----------
const RAD = Math.PI / 180;
export function km(lon1, lat1, lon2, lat2) {
  const a = Math.sin((lat2 - lat1) * RAD / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin((lon2 - lon1) * RAD / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
function imLand(code, lon, lat) {
  const x = Math.round(lon * 100), y = Math.round(lat * 100);
  let drin = false;
  for (const r of RINGE[code] || []) {
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) drin = !drin;
    }
  }
  return drin;
}
// nächster Punkt der Landesgrenze (genau genug für die Wertung)
function naechsterPunkt(code, lon, lat) {
  let best = Infinity, bp = null;
  for (const r of RINGE[code] || []) for (let i = 0; i < r.length; i += 2) {
    const d = km(lon, lat, r[i] / 100, r[i + 1] / 100);
    if (d < best) { best = d; bp = [r[i] / 100, r[i + 1] / 100]; }
  }
  return { d: best, p: bp };
}
const kleinCache = {};
function istKlein(code) { // Kleinstaaten und winzige Inseln: etwas Spielraum beim Treffen
  if (code in kleinCache) return kleinCache[code];
  let a = 180, b = -180, c = 90, d = -90;
  for (const r of RINGE[code] || []) for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i] / 100); b = Math.max(b, r[i] / 100); c = Math.min(c, r[i + 1] / 100); d = Math.max(d, r[i + 1] / 100); }
  return (kleinCache[code] = km(a, c, b, d) < 120);
}

// Wie weit liegt der Pin daneben? 0 = getroffen. ziel: Punkt, zu dem die Linie bei der Auflösung führt
export function auswerten(code, art, lon, lat) {
  if (art === 'stadt') {
    const s = stadtVon(code);
    const d = s ? km(lon, lat, s[0], s[1]) : 9999;
    return { km: Math.round(d), ziel: s, treffer: d <= 150, pkt: d <= 30 ? 150 : Math.round(150 * Math.exp(-(d - 30) / 450)) };
  }
  if (imLand(code, lon, lat)) return { km: 0, ziel: null, treffer: true, pkt: 150 };
  const n = naechsterPunkt(code, lon, lat);
  const d = n.d <= (istKlein(code) ? 60 : 25) ? 0 : n.d; // vereinfachte Küsten: knapp daneben zählt
  return { km: Math.round(d), ziel: n.p, treffer: d === 0, pkt: d === 0 ? 150 : Math.min(120, Math.round(150 * Math.exp(-d / 650))) };
}

// ---------- Darstellung ----------
const REGION_BOX = { // lon/lat: west, süd, ost, nord
  europa: [-25, 34, 45, 71], afrika: [-20, -36, 53, 38], asien: [25, -11, 150, 56], amerika: [-170, -56, -30, 72], ozeanien: [110, -48, 180, 12],
};
const ns = 'http://www.w3.org/2000/svg';
function pfad(ringe) {
  let s = '';
  for (const r of ringe) {
    s += 'M' + px(r[0] / 100).toFixed(1) + ' ' + py(r[1] / 100).toFixed(1);
    for (let i = 2; i < r.length; i += 2) s += 'L' + px(r[i] / 100).toFixed(1) + ' ' + py(r[i + 1] / 100).toFixed(1);
    s += 'Z';
  }
  return s;
}
let PFADE = null;
function pfadeBauen() {
  if (PFADE) return PFADE;
  PFADE = Object.entries(RINGE).map(([c, r]) => `<path data-c="${c}" d="${pfad(r)}"/>`).join('');
  return PFADE;
}
const gitter = () => {
  let s = '';
  for (let lon = -150; lon <= 180; lon += 30) s += `M${px(lon).toFixed(1)} 0V${H.toFixed(1)}`;
  for (const lat of [-30, 0, 30, 60]) s += `M0 ${py(lat).toFixed(1)}H${B}`;
  return s;
};

// Baut die Karte in ein Element. beiPin(lon, lat) wird beim Doppelklick/Doppeltipp aufgerufen.
export function karteBauen(el, beiPin) {
  el.innerHTML = `<svg class="wk-svg" xmlns="${ns}" aria-label="Weltkarte. Doppelklick setzt den Pin.">
      <rect class="wk-meer" x="-4000" y="-4000" width="${B + 8000}" height="${H + 8000}"/>
      <path class="wk-gitter" d="${gitter()}"/>
      <g class="wk-laender">${pfadeBauen()}</g>
      <g class="wk-oben"></g>
    </svg>
    <div class="wk-knoepfe"><button type="button" data-z="1.6" aria-label="Hineinzoomen">+</button><button type="button" data-z="0.625" aria-label="Herauszoomen">−</button><button type="button" data-z="0" aria-label="Ganze Karte">⌂</button></div>
    <p class="wk-hilfe">Doppelklick setzt deinen Pin · Mausrad zoomt · Ziehen verschiebt</p>`;
  const svg = el.querySelector('svg'), oben = el.querySelector('.wk-oben');
  const laenderG = el.querySelector('.wk-laender'), gitterP = el.querySelector('.wk-gitter');
  // Rechtsklick: kein Browser-Menü, rechts ziehen verschiebt genauso
  el.addEventListener('contextmenu', e => e.preventDefault());
  let vb = { x: 0, y: 0, w: B, h: H }, gesperrt = false, start = null;
  const ptr = new Map();
  let ziehen = null, pinch = null, letzterTipp = null, bewegt = 0;

  let rechteck = null;
  const masse = () => rechteck || (rechteck = svg.getBoundingClientRect());
  const verhaeltnis = () => { const r = masse(); return r.height && r.width ? r.height / r.width : H / B; };
  function begrenzen() {
    const v = verhaeltnis();
    const maxW = Math.max(B, H / v) * 1.05;
    vb.w = Math.max(B / 60, Math.min(maxW, vb.w)); vb.h = vb.w * v;
    const rx = Math.max(0, (vb.w - B) / 2), ry = Math.max(0, (vb.h - H) / 2);
    vb.x = vb.w >= B ? (B - vb.w) / 2 : Math.max(-rx - vb.w * .1, Math.min(B - vb.w + vb.w * .1, vb.x));
    vb.y = vb.h >= H ? (H - vb.h) / 2 : Math.max(-ry - vb.h * .1, Math.min(H - vb.h + vb.h * .1, vb.y));
  }
  function zeichnen() {
    begrenzen();
    svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    // Linien und Pins bleiben auf dem Bildschirm gleich dick bzw. groß (statt teurem non-scaling-stroke auf allen Ländern)
    const proPx = vb.w / Math.max(1, masse().width);
    laenderG.setAttribute('stroke-width', (proPx * .8).toFixed(4));
    gitterP.setAttribute('stroke-width', proPx.toFixed(4));
    oben.querySelectorAll('[data-lon]').forEach(g => g.setAttribute('transform', `translate(${px(+g.dataset.lon).toFixed(2)} ${py(+g.dataset.lat).toFixed(2)}) scale(${proPx.toFixed(4)})`));
  }
  // höchstens einmal pro Bild neu zeichnen
  let geplant = false;
  function setzen(sofort = false) {
    if (sofort) { zeichnen(); return; }
    if (geplant) return;
    geplant = true;
    requestAnimationFrame(() => { geplant = false; zeichnen(); });
  }
  function zeigeBox([w, s, o, n], rand = .08) {
    const x1 = px(w), x2 = px(o), y1 = py(n), y2 = py(s);
    const v = verhaeltnis();
    let bw = (x2 - x1) * (1 + rand * 2), bh = (y2 - y1) * (1 + rand * 2);
    if (bh / bw > v) bw = bh / v; else bh = bw * v;
    vb = { x: (x1 + x2) / 2 - bw / 2, y: (y1 + y2) / 2 - bh / 2, w: bw, h: bh };
    setzen(true);
  }
  function ganz() { rechteck = null; start ? zeigeBox(start, .02) : (vb = { x: 0, y: 0, w: B, h: H }, setzen(true)); }
  function zoom(f, cx, cy) {
    const r = masse();
    const mx = vb.x + (cx - r.left) / r.width * vb.w, my = vb.y + (cy - r.top) / r.height * vb.h;
    vb.w /= f; vb.h /= f;
    vb.x = mx - (cx - r.left) / r.width * vb.w; vb.y = my - (cy - r.top) / r.height * vb.h;
    setzen();
  }
  const punktAus = (cx, cy) => {
    const r = masse();
    const x = vb.x + (cx - r.left) / r.width * vb.w, y = vb.y + (cy - r.top) / r.height * vb.h;
    return [Math.max(-180, Math.min(180, zuLon(x))), Math.max(-60, Math.min(84, zuLat(y)))];
  };
  function pinSetzen(cx, cy) {
    if (gesperrt) return;
    const [lon, lat] = punktAus(cx, cy);
    beiPin(lon, lat);
  }

  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.pow(1.0018, -e.deltaY), e.clientX, e.clientY); }, { passive: false });
  svg.addEventListener('pointerdown', e => {
    rechteck = null;
    if (e.button === 1) e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    bewegt = 0;
    if (ptr.size === 1) ziehen = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: vb.w }; ziehen = null; }
  });
  svg.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptr.size === 2) {
      const [a, b] = [...ptr.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const f = (vb.w / (pinch.w * pinch.d / d));
      zoom(f, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); bewegt = 99;
      return;
    }
    if (ziehen) {
      const r = masse();
      bewegt = Math.max(bewegt, Math.hypot(e.clientX - ziehen.x, e.clientY - ziehen.y));
      vb.x = ziehen.vx - (e.clientX - ziehen.x) / r.width * vb.w;
      vb.y = ziehen.vy - (e.clientY - ziehen.y) / r.height * vb.h;
      setzen();
      el.classList.toggle('zieht', bewegt > 4);
    }
  });
  const loslassen = e => {
    ptr.delete(e.pointerId);
    if (ptr.size < 2) pinch = null;
    if (!ptr.size) {
      el.classList.remove('zieht');
      // Doppeltipp auf Touch (dblclick kommt dort nicht zuverlässig)
      if (e.pointerType !== 'mouse' && bewegt < 8) {
        const jetzt = performance.now();
        if (letzterTipp && jetzt - letzterTipp.t < 350 && Math.hypot(e.clientX - letzterTipp.x, e.clientY - letzterTipp.y) < 30) { letzterTipp = null; pinSetzen(e.clientX, e.clientY); }
        else letzterTipp = { t: jetzt, x: e.clientX, y: e.clientY };
      }
      ziehen = null;
    }
  };
  svg.addEventListener('pointerup', loslassen);
  svg.addEventListener('pointercancel', loslassen);
  svg.addEventListener('dblclick', e => { e.preventDefault(); if (bewegt < 6) pinSetzen(e.clientX, e.clientY); });
  el.querySelector('.wk-knoepfe').onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    const z = +b.dataset.z, r = masse();
    if (!z) ganz(); else zoom(z, r.left + r.width / 2, r.top + r.height / 2);
  };
  new ResizeObserver(() => { rechteck = null; setzen(true); }).observe(svg);
  addEventListener('scroll', () => { rechteck = null; }, { passive: true });

  const marke = (lon, lat, html, klasse) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', klasse); g.dataset.lon = lon; g.dataset.lat = lat;
    g.innerHTML = html;
    oben.append(g);
    return g;
  };
  const PIN = '<path class="wk-pin-form" d="M0 0C-3-7-10-11-10-18a10 10 0 0 1 20 0c0 7-7 11-10 18Z"/><circle class="wk-pin-punkt" cy="-18" r="4"/>';

  return {
    // neue Frage: alles leeren, Startansicht (Region) zeigen
    neu(region) {
      gesperrt = false;
      oben.innerHTML = '';
      svg.querySelectorAll('.wk-laender .ziel').forEach(p => p.classList.remove('ziel'));
      start = REGION_BOX[region] || null;
      ganz();
    },
    sperren() { gesperrt = true; },
    // eigener Pin (vor der Auflösung)
    pin(lon, lat, farbe = 'var(--sand)') {
      oben.querySelectorAll('.wk-ich').forEach(g => g.remove());
      const g = marke(lon, lat, PIN, 'wk-pin wk-ich'); g.style.setProperty('--f', farbe);
      setzen(true);
    },
    // Auflösung: Ziel markieren, alle Pins mit Linie zum Ziel, Ansicht auf alles
    loesung(code, art, pins = []) {
      gesperrt = true;
      const lp = svg.querySelector(`.wk-laender [data-c="${code}"]`);
      if (art !== 'stadt' && lp) lp.classList.add('ziel');
      const s = art === 'stadt' ? stadtVon(code) : null;
      oben.innerHTML = '';
      const punkte = [];
      for (const p of pins) {
        const a = auswerten(code, art, p.lon, p.lat);
        const z = s || a.ziel;
        if (z && a.km > 0) {
          const l = document.createElementNS(ns, 'line');
          l.setAttribute('class', 'wk-linie'); l.setAttribute('x1', px(p.lon)); l.setAttribute('y1', py(p.lat)); l.setAttribute('x2', px(z[0])); l.setAttribute('y2', py(z[1]));
          l.style.setProperty('--f', p.farbe || 'var(--sand)');
          oben.append(l);
        }
        const g = marke(p.lon, p.lat, PIN + `<text class="wk-name" y="-34">${(p.name || '').replace(/[<&>]/g, '')}${a.km ? ` · ${a.km.toLocaleString('de-DE')} km` : ' ✓'}</text>`, 'wk-pin');
        g.style.setProperty('--f', p.farbe || 'var(--sand)');
        punkte.push([p.lon, p.lat]);
      }
      if (s) { marke(s[0], s[1], '<circle class="wk-stadt-ring" r="13"/><circle class="wk-stadt" r="6"/>', 'wk-stadt-marke'); punkte.push(s); }
      else if (lp) { const bb = lp.getBBox(); punkte.push([zuLon(bb.x), zuLat(bb.y)], [zuLon(bb.x + bb.width), zuLat(bb.y + bb.height)]); }
      if (punkte.length) {
        const lons = punkte.map(p => p[0]), lats = punkte.map(p => p[1]);
        let w = Math.min(...lons), o = Math.max(...lons), sd = Math.min(...lats), n = Math.max(...lats);
        const minSpan = 6; // nicht zu nah heran
        if (o - w < minSpan) { const m = (o + w) / 2; w = m - minSpan / 2; o = m + minSpan / 2; }
        if (n - sd < minSpan / 2) { const m = (n + sd) / 2; sd = m - minSpan / 4; n = m + minSpan / 4; }
        zeigeBox([w, sd, o, n], .25);
      } else setzen(true);
    },
  };
}
