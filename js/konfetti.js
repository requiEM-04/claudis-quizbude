// Konfetti in den Farben der Quizbude. Stärke 1 bis 3 (Platz 3 bis Platz 1).
// Wer im System „Bewegung reduzieren“ eingestellt hat, bekommt keins.
const FARBEN = ['#CDB68C', '#E3CFA6', '#8FB3A2', '#CF8E8E', '#E4E7E4', '#8FA8C8'];
let canvas = null;
let teile = [];
let laeuft = false;

function vorbereiten() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'konfetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
}

export function konfetti(staerke = 3, von = null) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  vorbereiten();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  const anzahl = [0, 60, 120, 220][staerke] || 120;
  // aus zwei Kanonen unten links und rechts, bei Platz 1 zusätzlich von oben
  const quellen = von ? [von] : staerke >= 3
    ? [{ x: 0, y: innerHeight * .8, w: -60 }, { x: innerWidth, y: innerHeight * .8, w: -120 }, { x: innerWidth / 2, y: -20, w: 90, regen: true }]
    : [{ x: 0, y: innerHeight * .85, w: -55 }, { x: innerWidth, y: innerHeight * .85, w: -125 }];
  for (let i = 0; i < anzahl; i++) {
    const q = quellen[i % quellen.length];
    const winkel = (q.w + (Math.random() - .5) * (q.regen ? 160 : 40)) * Math.PI / 180;
    const tempo = q.regen ? 2 + Math.random() * 3 : 11 + Math.random() * 9;
    teile.push({
      x: q.regen ? Math.random() * innerWidth : q.x, y: q.y,
      vx: Math.cos(winkel) * tempo, vy: Math.sin(winkel) * tempo,
      d: Math.random() * Math.PI, dv: (Math.random() - .5) * .3,
      b: 6 + Math.random() * 6, h: 3 + Math.random() * 4,
      farbe: FARBEN[Math.floor(Math.random() * FARBEN.length)], leben: 1,
      wackel: Math.random() * 10,
    });
  }
  if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); }
}

function schritt() {
  const g = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, innerWidth, innerHeight);
  for (const t of teile) {
    t.vy += .22; t.vx *= .985; t.vy *= .985;
    t.x += t.vx + Math.sin((t.wackel += .08)) * .6; t.y += t.vy;
    t.d += t.dv;
    if (t.y > innerHeight + 30) t.leben = 0;
    g.save();
    g.translate(t.x, t.y); g.rotate(t.d);
    g.scale(1, Math.cos(t.wackel)); // dreht sich wie Papier
    g.fillStyle = t.farbe;
    g.fillRect(-t.b / 2, -t.h / 2, t.b, t.h);
    g.restore();
  }
  teile = teile.filter(t => t.leben > 0);
  if (teile.length) requestAnimationFrame(schritt);
  else { laeuft = false; g.clearRect(0, 0, innerWidth, innerHeight); }
}
