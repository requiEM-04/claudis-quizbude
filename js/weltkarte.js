// Weltkarte zum Raten: verschieben (ziehen), zoomen (Mausrad, Pinch, Knöpfe), Doppelklick/Doppeltipp setzt den Pin.
// Die Grenzdaten (js/weltkarte-daten.js) werden erst geladen, wenn die Kategorie gebraucht wird.
let RINGE = null, STAEDTE = null;
let laden = null;
export function karteLaden() {
  if (!laden) laden = import('./weltkarte-daten.js?v=0.19.1').then(m => { RINGE = m.LAENDER_RINGE; STAEDTE = m.STAEDTE; });
  return laden;
}
export const karteDa = () => !!RINGE;
export const ringeAlle = () => RINGE;
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

// Länder einmal als Path2D in Weltkoordinaten bauen, danach malt die Canvas nur noch (viel schneller als SVG beim Ziehen)
let FORMEN = null;
function formenBauen() {
  if (FORMEN) return FORMEN;
  const alle = new Path2D(), laender = new Map();
  for (const [c, ringe] of Object.entries(RINGE)) {
    const p = new Path2D();
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const r of ringe) {
      for (let i = 0; i < r.length; i += 2) {
        const x = px(r[i] / 100), y = py(r[i + 1] / 100);
        if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
        if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y;
      }
      p.closePath();
    }
    alle.addPath(p);
    laender.set(c, { p, box: [x1, y1, x2, y2] });
  }
  const gitter = new Path2D();
  for (let lon = -150; lon <= 180; lon += 30) { gitter.moveTo(px(lon), 0); gitter.lineTo(px(lon), H); }
  for (const lat of [-30, 0, 30, 60]) { gitter.moveTo(0, py(lat)); gitter.lineTo(B, py(lat)); }
  FORMEN = { alle, laender, gitter };
  return FORMEN;
}

const FARBE = { meer: '#16212B', land: '#3B434A', hover: '#4A545C', grenze: '#1A2026', gitter: 'rgba(255,255,255,.05)' };

// Baut die Karte in ein Element. beiPin(lon, lat) wird beim Doppelklick/Doppeltipp aufgerufen.
// opt.rand() liefert in Pixeln, was oben/rechts/unten/links von Bedienelementen verdeckt ist: Ansichten passen sich daran an.
export function karteBauen(el, beiPin, opt = {}) {
  el.innerHTML = `<canvas class="wk-flaeche" aria-label="Weltkarte. Doppelklick setzt den Pin."></canvas>
    <svg class="wk-svg" xmlns="${ns}" aria-hidden="true"><g class="wk-oben"></g></svg>
    <div class="wk-knoepfe"><button type="button" data-z="1.6" aria-label="Hineinzoomen">+</button><button type="button" data-z="0.625" aria-label="Herauszoomen">−</button><button type="button" data-z="0" aria-label="Ganze Karte">⌂</button></div>
    <p class="wk-hilfe">Doppelklick setzt deinen Pin · Mausrad zoomt · Ziehen verschiebt</p>`;
  const leinwand = el.querySelector('canvas'), ctx = leinwand.getContext('2d');
  const svg = el.querySelector('svg'), oben = el.querySelector('.wk-oben');
  el.addEventListener('contextmenu', e => e.preventDefault());
  let vb = { x: 0, y: 0, w: B, h: H }, gesperrt = false, start = null;
  let hoverCode = null, zielCode = null, stadtPunkte = null;
  const ptr = new Map();
  let ziehen = null, pinch = null, letzterTipp = null, bewegt = 0;

  let rechteck = null;
  const masse = () => rechteck || (rechteck = el.getBoundingClientRect());
  const verhaeltnis = () => { const r = masse(); return r.height && r.width ? r.height / r.width : H / B; };
  const einsatz = () => { try { return { t: 0, r: 0, b: 0, l: 0, ...(opt.rand?.() || {}) }; } catch { return { t: 0, r: 0, b: 0, l: 0 }; } };
  function begrenzen() {
    const v = verhaeltnis();
    vb.w = Math.max(B / 60, Math.min(Math.max(B, H / v) * 1.8, vb.w)); vb.h = vb.w * v;
    vb.x = Math.max(-vb.w * .75, Math.min(B - vb.w * .25, vb.x));
    vb.y = Math.max(-vb.h * .75, Math.min(H - vb.h * .25, vb.y));
  }

  function malen(zeit = performance.now()) {
    const r = masse();
    if (!r.width || !r.height || !RINGE) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(r.width * dpr), Hp = Math.round(r.height * dpr);
    if (leinwand.width !== W || leinwand.height !== Hp) { leinwand.width = W; leinwand.height = Hp; }
    const f = formenBauen(), k = W / vb.w;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = FARBE.meer; ctx.fillRect(0, 0, W, Hp);
    ctx.setTransform(k, 0, 0, k, -vb.x * k, -vb.y * k);
    ctx.lineWidth = dpr / k; ctx.strokeStyle = FARBE.gitter; ctx.stroke(f.gitter);
    // nur Länder füllen, die in den Ausschnitt ragen
    const x2 = vb.x + vb.w, y2 = vb.y + vb.h;
    ctx.fillStyle = FARBE.land;
    for (const [c, l] of f.laender) {
      const b = l.box;
      if (b[2] < vb.x || b[0] > x2 || b[3] < vb.y || b[1] > y2 || c === zielCode) continue;
      if (c === hoverCode) { ctx.fillStyle = FARBE.hover; ctx.fill(l.p, 'evenodd'); ctx.fillStyle = FARBE.land; }
      else ctx.fill(l.p, 'evenodd');
    }
    if (zielCode && f.laender.has(zielCode)) {
      const t = (Math.sin(zeit / 500) + 1) / 2; // pulsiert
      ctx.fillStyle = `rgb(${Math.round(205 + 30 * t)}, ${Math.round(182 + 34 * t)}, ${Math.round(140 + 40 * t)})`;
      ctx.fill(f.laender.get(zielCode).p, 'evenodd');
    }
    ctx.lineWidth = .8 * dpr / k; ctx.lineJoin = 'round'; ctx.strokeStyle = FARBE.grenze; ctx.stroke(f.alle);
    // bei der Auflösung einer Hauptstadt-Frage: alle Hauptstädte als kleine Punkte zur Orientierung
    if (stadtPunkte) {
      const rad = 2.6 * dpr / k;
      ctx.fillStyle = 'rgba(255, 241, 207, .55)';
      ctx.beginPath();
      for (const [x, y] of stadtPunkte) { if (x < vb.x || x > x2 || y < vb.y || y > y2) continue; ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, Math.PI * 2); }
      ctx.fill();
    }
  }

  // pulsierendes Zielland: solange es eins gibt und die Karte sichtbar ist
  let puls = 0;
  function pulsen() {
    if (puls) return;
    const schritt = t => { if (!zielCode || el.hidden || !el.isConnected) { puls = 0; return; } malen(t); puls = requestAnimationFrame(schritt); };
    puls = requestAnimationFrame(schritt);
  }

  function zeichnen() {
    begrenzen();
    malen();
    svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    const proPx = vb.w / Math.max(1, masse().width);
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
  // Ausschnitt so wählen, dass die Box im freien Bereich (ohne verdeckte Ränder) ganz zu sehen ist
  function zeigeBox([w, s, o, n], rand = .08) {
    rechteck = null;
    const r = masse(), e = einsatz();
    if (!r.width) { vb = { x: 0, y: 0, w: B, h: H }; return; }
    const iw = Math.max(160, r.width - e.l - e.r), ih = Math.max(140, r.height - e.t - e.b);
    const x1 = px(w), x2 = px(o), y1 = py(n), y2 = py(s);
    let bw = (x2 - x1) * (1 + rand * 2), bh = (y2 - y1) * (1 + rand * 2);
    if (bh / bw > ih / iw) bw = bh * iw / ih; else bh = bw * ih / iw;
    const k = bw / iw; // Welt-Einheiten pro Pixel
    vb = { x: (x1 + x2) / 2 - (e.l + iw / 2) * k, y: (y1 + y2) / 2 - (e.t + ih / 2) * k, w: r.width * k, h: r.height * k };
    setzen(true);
  }
  const WELT = [-170, -56, 180, 80];
  function ganz() { zeigeBox(start || WELT, start ? .06 : .01); }
  function zoom(f, cx, cy) {
    const r = masse();
    const mx = vb.x + (cx - r.left) / r.width * vb.w, my = vb.y + (cy - r.top) / r.height * vb.h;
    vb.w /= f; vb.h /= f;
    vb.x = mx - (cx - r.left) / r.width * vb.w; vb.y = my - (cy - r.top) / r.height * vb.h;
    setzen();
  }
  const weltAus = (cx, cy) => { const r = masse(); return [vb.x + (cx - r.left) / r.width * vb.w, vb.y + (cy - r.top) / r.height * vb.h]; };
  const punktAus = (cx, cy) => {
    const [x, y] = weltAus(cx, cy);
    return [Math.max(-180, Math.min(180, zuLon(x))), Math.max(-60, Math.min(84, zuLat(y)))];
  };
  function pinSetzen(cx, cy) {
    if (gesperrt) return;
    const [lon, lat] = punktAus(cx, cy);
    beiPin(lon, lat);
  }
  // Land unter der Maus leicht aufhellen (nur ohne Ziehen, einmal pro Bild)
  let hoverGeplant = null;
  function hoverPruefen(cx, cy) {
    if (hoverGeplant) { hoverGeplant = [cx, cy]; return; }
    hoverGeplant = [cx, cy];
    requestAnimationFrame(() => {
      const [hx, hy] = hoverGeplant; hoverGeplant = null;
      if (!FORMEN || ptr.size) return;
      const r = masse(), dpr = leinwand.width / r.width;
      const [wx, wy] = weltAus(hx, hy);
      let treffer = null;
      for (const [c, l] of FORMEN.laender) {
        const b = l.box;
        if (wx < b[0] || wx > b[2] || wy < b[1] || wy > b[3]) continue;
        if (ctx.isPointInPath(l.p, (hx - r.left) * dpr, (hy - r.top) * dpr, 'evenodd')) { treffer = c; break; }
      }
      if (treffer !== hoverCode) { hoverCode = treffer; malen(); }
    });
  }

  leinwand.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.pow(1.0018, -e.deltaY), e.clientX, e.clientY); }, { passive: false });
  leinwand.addEventListener('pointerdown', e => {
    rechteck = null;
    if (e.button === 1) e.preventDefault();
    leinwand.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    bewegt = 0;
    if (ptr.size === 1) ziehen = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: vb.w }; ziehen = null; }
  });
  leinwand.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) { if (e.pointerType === 'mouse') hoverPruefen(e.clientX, e.clientY); return; }
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
  leinwand.addEventListener('pointerleave', () => { if (hoverCode && !ptr.size) { hoverCode = null; malen(); } });
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
  leinwand.addEventListener('pointerup', loslassen);
  leinwand.addEventListener('pointercancel', loslassen);
  leinwand.addEventListener('dblclick', e => { e.preventDefault(); if (bewegt < 6) pinSetzen(e.clientX, e.clientY); });
  el.querySelector('.wk-knoepfe').onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    const z = +b.dataset.z, r = masse();
    if (!z) ganz(); else zoom(z, r.left + r.width / 2, r.top + r.height / 2);
  };
  new ResizeObserver(() => { rechteck = null; setzen(true); }).observe(el);
  addEventListener('scroll', () => { rechteck = null; }, { passive: true });

  const marke = (lon, lat, html, klasse) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', klasse); g.dataset.lon = lon; g.dataset.lat = lat;
    g.innerHTML = html;
    oben.append(g);
    return g;
  };
  const PIN = '<path class="wk-pin-form" d="M0 0C-3-7-10-11-10-18a10 10 0 0 1 20 0c0 7-7 11-10 18Z"/><circle class="wk-pin-punkt" cy="-18" r="4"/>';
  const text = t => String(t || '').replace(/[<&>"]/g, '');

  return {
    // neue Frage: alles leeren, Startansicht (Region) zeigen
    neu(region) {
      gesperrt = false;
      oben.innerHTML = '';
      zielCode = null; stadtPunkte = null; hoverCode = null;
      start = REGION_BOX[region] || null;
      requestAnimationFrame(ganz); // erst wenn die Bedienelemente stehen, sind die Ränder bekannt
      ganz();
    },
    sperren() { gesperrt = true; },
    // eigener Pin (vor der Auflösung)
    pin(lon, lat, farbe = 'var(--sand)') {
      oben.querySelectorAll('.wk-ich').forEach(g => g.remove());
      const g = marke(lon, lat, PIN, 'wk-pin wk-ich'); g.style.setProperty('--f', farbe);
      setzen(true);
    },
    // Auflösung: Ziel markieren, alle Pins mit Linie zum Ziel, Ansicht auf alles. stadtName: Name der gesuchten Hauptstadt
    loesung(code, art, pins = [], stadtName = '') {
      gesperrt = true;
      const f = formenBauen();
      const land = f.laender.get(code);
      zielCode = art !== 'stadt' && land ? code : null;
      const s = art === 'stadt' ? stadtVon(code) : null;
      stadtPunkte = s ? Object.values(STAEDTE).map(([lon, lat]) => [px(lon), py(lat)]) : null;
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
        const g = marke(p.lon, p.lat, PIN + `<text class="wk-name" y="-34">${text(p.name)}${a.km ? ` · ${a.km.toLocaleString('de-DE')} km` : ' ✓'}</text>`, 'wk-pin');
        g.style.setProperty('--f', p.farbe || 'var(--sand)');
        punkte.push([p.lon, p.lat]);
      }
      if (s) {
        marke(s[0], s[1], `<circle class="wk-stadt-ring" r="13"/><circle class="wk-stadt" r="6"/>${stadtName ? `<text class="wk-name wk-stadt-name" y="26">${text(stadtName)}</text>` : ''}`, 'wk-stadt-marke');
        punkte.push(s);
      } else if (land) {
        const b = land.box;
        punkte.push([zuLon(b[0]), zuLat(b[3])], [zuLon(b[2]), zuLat(b[1])]);
      }
      if (zielCode) pulsen();
      if (punkte.length) {
        const lons = punkte.map(p => p[0]), lats = punkte.map(p => p[1]);
        let w = Math.min(...lons), o = Math.max(...lons), sd = Math.min(...lats), n = Math.max(...lats);
        const minSpan = 8; // nicht zu nah heran
        if (o - w < minSpan) { const m = (o + w) / 2; w = m - minSpan / 2; o = m + minSpan / 2; }
        if (n - sd < minSpan / 2) { const m = (n + sd) / 2; sd = m - minSpan / 4; n = m + minSpan / 4; }
        zeigeBox([w, sd, o, n], .4);
      } else setzen(true);
    },
  };
}
