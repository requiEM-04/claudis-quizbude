// Snake zu zweit. Der Gastgeber rechnet jeden Schritt aus und schickt den Stand an alle,
// die anderen schicken nur ihre Lenkbefehle. Gezeichnet wird bei allen gleich.

export const FELD = { b: 28, h: 18 };
export const SNAKE_DAUER = 120000;      // nach 2 Minuten gewinnt die längere Schlange
const START_TAKT = 120;                 // ms pro Schritt, wird mit jedem Futter etwas schneller
const MIN_TAKT = 80;
const SCHRITT = { o: [0, -1], u: [0, 1], l: [-1, 0], r: [1, 0] };
const GEGEN = { o: 'u', u: 'o', l: 'r', r: 'l' };
export const SCHLANGEN_FARBEN = ['#CDB68C', '#8FB3A2'];

const feldNr = (x, y) => y * FELD.b + x;
const xy = n => [n % FELD.b, Math.floor(n / FELD.b)];

export function snakeTakt(st) {
  const gefressen = st.schlangen.reduce((s, x) => s + x.pkt, 0);
  return Math.max(MIN_TAKT, START_TAKT - gefressen * 2);
}

// Stand: { t, schlangen: [{ id, k: [Kopf, …] als Feldnummern, r, lebt, pkt }], futter: [Feldnummern] }
export function snakeNeu(ids) {
  const mitte = Math.floor(FELD.h / 2);
  const schlangen = ids.slice(0, 2).map((id, i) => {
    const links = i === 0;
    const kx = links ? 5 : FELD.b - 6;
    const k = [0, 1, 2, 3].map(n => feldNr(links ? kx - n : kx + n, mitte + (links ? -2 : 2)));
    return { id, k, r: links ? 'r' : 'l', lebt: true, pkt: 0 };
  });
  const st = { t: 0, schlangen, futter: [] };
  while (st.futter.length < 2) futterLegen(st);
  return st;
}

function futterLegen(st) {
  const belegt = new Set([...st.schlangen.flatMap(s => s.k), ...st.futter]);
  const frei = [];
  for (let n = 0; n < FELD.b * FELD.h; n++) if (!belegt.has(n)) frei.push(n);
  if (frei.length) st.futter.push(frei[Math.floor(Math.random() * frei.length)]);
}

// Ein Schritt. eingaben: Map id -> Liste gewünschter Richtungen (älteste zuerst).
// Gibt zurück, ob das Spiel vorbei ist.
export function snakeSchritt(st, eingaben) {
  st.t++;
  const lebende = st.schlangen.filter(s => s.lebt);
  // Richtung wählen: erste gültige Eingabe (nicht umdrehen, nicht dieselbe)
  for (const s of lebende) {
    const liste = eingaben.get(s.id) || [];
    while (liste.length) {
      const r = liste.shift();
      if (SCHRITT[r] && r !== s.r && r !== GEGEN[s.r]) { s.r = r; break; }
    }
  }
  // neue Köpfe
  const neu = new Map();
  for (const s of lebende) {
    const [x, y] = xy(s.k[0]);
    const [dx, dy] = SCHRITT[s.r];
    const nx = x + dx, ny = y + dy;
    neu.set(s.id, nx < 0 || ny < 0 || nx >= FELD.b || ny >= FELD.h ? -1 : feldNr(nx, ny));
  }
  // fressen zuerst klären, damit das Schwanzende korrekt frei wird
  const frisst = new Map();
  for (const s of lebende) frisst.set(s.id, st.futter.includes(neu.get(s.id)));
  // belegte Felder nach dem Schritt (Schwanz rückt weiter, außer beim Fressen)
  const koerper = new Set();
  for (const s of st.schlangen) {
    const teile = s.lebt && !frisst.get(s.id) ? s.k.slice(0, -1) : s.k;
    for (const n of teile) koerper.add(n);
  }
  const tot = new Set();
  for (const s of lebende) {
    const n = neu.get(s.id);
    if (n < 0 || koerper.has(n)) tot.add(s.id);
  }
  // Kopf an Kopf oder durcheinander durch: beide raus
  if (lebende.length === 2) {
    const [a, b] = lebende;
    const na = neu.get(a.id), nb = neu.get(b.id);
    if (na === nb || (na === b.k[0] && nb === a.k[0])) { tot.add(a.id); tot.add(b.id); }
  }
  for (const s of lebende) {
    if (tot.has(s.id)) { s.lebt = false; continue; }
    s.k.unshift(neu.get(s.id));
    if (frisst.get(s.id)) {
      s.pkt++;
      st.futter = st.futter.filter(f => f !== s.k[0]);
    } else s.k.pop();
  }
  while (st.futter.length < 2) futterLegen(st);
  return st.schlangen.filter(s => s.lebt).length <= 1;
}

// Wer hat gewonnen? Überlebende Schlange, sonst die längere. Gleich lang = unentschieden.
export function snakeErgebnis(st) {
  const lebend = st.schlangen.filter(s => s.lebt);
  let sieger = null;
  if (lebend.length === 1) sieger = lebend[0].id;
  else {
    const [a, b] = [...st.schlangen].sort((x, y) => y.k.length - x.k.length);
    if (a && b && a.k.length !== b.k.length) sieger = a.id;
    else if (a && !b) sieger = a.id;
  }
  return { sieger, unentschieden: !sieger };
}

// ---------- Zeichnen ----------
export function snakeZeichnen(canvas, st, ichId) {
  const dpr = window.devicePixelRatio || 1;
  const breite = canvas.clientWidth;
  const zelle = breite / FELD.b;
  const hoehe = zelle * FELD.h;
  if (canvas.width !== Math.round(breite * dpr) || canvas.height !== Math.round(hoehe * dpr)) {
    canvas.width = Math.round(breite * dpr); canvas.height = Math.round(hoehe * dpr);
    canvas.style.height = hoehe + 'px';
  }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, breite, hoehe);
  // Raster aus feinen Punkten
  g.fillStyle = 'rgba(255,255,255,.05)';
  for (let y = 0; y < FELD.h; y++) for (let x = 0; x < FELD.b; x++) {
    g.beginPath(); g.arc((x + .5) * zelle, (y + .5) * zelle, 1.1, 0, Math.PI * 2); g.fill();
  }
  if (!st) return;
  // Futter
  for (const f of st.futter) {
    const [x, y] = xy(f);
    g.fillStyle = '#CF8E8E';
    g.beginPath(); g.arc((x + .5) * zelle, (y + .5) * zelle, zelle * .32, 0, Math.PI * 2); g.fill();
  }
  // Schlangen
  st.schlangen.forEach((s, i) => {
    const farbe = SCHLANGEN_FARBEN[i] || '#A2AAAB';
    g.globalAlpha = s.lebt ? 1 : .3;
    s.k.forEach((n, j) => {
      const [x, y] = xy(n);
      const rand = j === 0 ? 1 : 2.5;
      g.fillStyle = farbe;
      rundesRechteck(g, x * zelle + rand, y * zelle + rand, zelle - rand * 2, zelle - rand * 2, zelle * .28);
    });
    // Augen am Kopf
    const [kx, ky] = xy(s.k[0]);
    const [dx, dy] = SCHRITT[s.r];
    g.fillStyle = '#16191B';
    for (const seite of [-1, 1]) {
      const ax = (kx + .5 + dx * .18 + (dy ? seite * .2 : 0)) * zelle;
      const ay = (ky + .5 + dy * .18 + (dx ? seite * .2 : 0)) * zelle;
      g.beginPath(); g.arc(ax, ay, zelle * .08, 0, Math.PI * 2); g.fill();
    }
    // eigene Schlange am Anfang kurz markieren
    if (s.id === ichId && st.t < 12 && s.lebt) {
      g.strokeStyle = farbe; g.lineWidth = 2; g.globalAlpha = 1 - st.t / 12;
      g.beginPath(); g.arc((kx + .5) * zelle, (ky + .5) * zelle, zelle * 1.1, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
  });
}

function rundesRechteck(g, x, y, b, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + b, y, x + b, y + h, r); g.arcTo(x + b, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + b, y, r); g.closePath(); g.fill();
}
