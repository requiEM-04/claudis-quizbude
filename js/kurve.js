// Kurvenkampf: frei lenken, Linie ziehen, nicht reinfahren. Im Stil von „Achtung, die Kurve!“.
// Der Gastgeber rechnet mit 60 Schritten pro Sekunde und schickt die Schritte gebündelt an alle.
// Alle zeichnen dieselben Schritte nach, leicht verzögert, damit es flüssig aussieht.

export const KURVE = { b: 1000, h: 620 };
export const KURVEN_FARBEN = ['#CDB68C', '#8FB3A2', '#CF8E8E', '#8FA8C8', '#B39DCB', '#D9A066'];
const TAKT = 60;                       // Schritte pro Sekunde
const TEMPO = 150 / TAKT;              // Einheiten pro Schritt
const DREHUNG = 3.3 / TAKT;            // Bogenmaß pro Schritt
const DICKE = 6.5;
const ZELLE = 2;
const GW = Math.ceil(KURVE.b / ZELLE), GH = Math.ceil(KURVE.h / ZELLE);
const BEREIT = 90;                     // 1,5 s stehen, bevor es losgeht
const PAUSE = 150;                     // 2,5 s nach jeder Runde
const LUECKE_WEG = 28;                 // so lang ist eine Lücke
const PU_RADIUS = 15;

// Powerups: wen sie treffen und wie lange (in Schritten)
export const POWERUPS = {
  schnell: { fuer: 'ich', dauer: 240, zeichen: '»', text: 'schneller' },
  langsam: { fuer: 'ich', dauer: 240, zeichen: '«', text: 'langsamer' },
  duenn: { fuer: 'ich', dauer: 300, zeichen: '·', text: 'dünne Linie' },
  geist: { fuer: 'ich', dauer: 180, zeichen: '◌', text: 'Geist: keine Linie, kein Zusammenstoß' },
  gschnell: { fuer: 'andere', dauer: 240, zeichen: '»', text: 'die anderen schneller' },
  dick: { fuer: 'andere', dauer: 300, zeichen: '●', text: 'die anderen dick' },
  ecken: { fuer: 'andere', dauer: 300, zeichen: '⌐', text: 'die anderen nur noch eckig' },
  spiegel: { fuer: 'andere', dauer: 300, zeichen: '⇄', text: 'die anderen verkehrt herum' },
  tor: { fuer: 'alle', dauer: 420, zeichen: '□', text: 'Wände offen' },
  wisch: { fuer: 'alle', dauer: 0, zeichen: '✕', text: 'alle Linien weg' },
};
const PU_TYPEN = Object.keys(POWERUPS);
export const PU_FARBE = { ich: '#8FB3A2', andere: '#CF8E8E', alle: '#CDB68C' };

const zufall = (a, b) => a + Math.random() * (b - a);
const runden = n => Math.round(n * 10) / 10;

// ---------- Rechnen (nur beim Gastgeber) ----------
export class KurvenSim {
  constructor(ids) {
    this.ids = ids.slice(0, KURVEN_FARBEN.length);
    this.ziel = 5 * Math.max(1, this.ids.length - 1);
    this.punkte = this.ids.map(() => 0);
    this.t = 0;
    this.runde = 0;
    this.lenk = new Map();             // id -> { l, r, lNeu, rNeu }
    this.vorbei = false;
    this.neueRunde();
  }

  neueRunde() {
    this.runde++;
    this.besitz = new Uint8Array(GW * GH);
    this.zeit = new Uint32Array(GW * GH);
    this.pu = [];
    this.puNr = 0;
    this.tor = 0;
    this.naechstesPu = this.t + BEREIT + Math.round(zufall(180, 300));
    this.phase = 'bereit';
    this.phaseBis = this.t + BEREIT;
    this.ereignis = { art: 'neu', runde: this.runde };
    this.rundenSieger = null;
    const plaetze = [];
    this.s = this.ids.map(id => {
      let x, y, n = 0;
      do { x = zufall(120, KURVE.b - 120); y = zufall(100, KURVE.h - 100); n++; }
      while (n < 50 && plaetze.some(p => Math.hypot(p[0] - x, p[1] - y) < 160));
      plaetze.push([x, y]);
      // grob zur Mitte zeigen, damit keiner sofort in die Wand fährt
      const a = Math.atan2(KURVE.h / 2 - y, KURVE.b / 2 - x) + zufall(-0.9, 0.9);
      return { id, x, y, a, lebt: true, luecke: 0, naechsteLuecke: Math.round(zufall(90, 200)), eff: {}, sprung: false };
    });
  }

  lenken(id, l, r) {
    const alt = this.lenk.get(id) || { l: false, r: false, lNeu: false, rNeu: false };
    this.lenk.set(id, { l, r, lNeu: alt.lNeu || (l && !alt.l), rNeu: alt.rNeu || (r && !alt.r) });
  }

  aktiv(s, art) { return (s.eff[art] || 0) > this.t; }
  tempo(s) { return TEMPO * (this.aktiv(s, 'schnell') ? 1.7 : 1) * (this.aktiv(s, 'gschnell') ? 1.7 : 1) * (this.aktiv(s, 'langsam') ? 0.55 : 1); }
  dicke(s) { return DICKE * (this.aktiv(s, 'dick') ? 2.2 : 1) * (this.aktiv(s, 'duenn') ? 0.5 : 1); }

  stempeln(x, y, r, nr) {
    const x0 = Math.max(0, Math.floor((x - r) / ZELLE)), x1 = Math.min(GW - 1, Math.floor((x + r) / ZELLE));
    const y0 = Math.max(0, Math.floor((y - r) / ZELLE)), y1 = Math.min(GH - 1, Math.floor((y + r) / ZELLE));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const cx = (gx + .5) * ZELLE, cy = (gy + .5) * ZELLE;
      if ((cx - x) ** 2 + (cy - y) ** 2 <= r * r) { this.besitz[gy * GW + gx] = nr; this.zeit[gy * GW + gx] = this.t; }
    }
  }

  belegt(x, y, nr, schonfrist) {
    const gx = Math.floor(x / ZELLE), gy = Math.floor(y / ZELLE);
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
    const i = gy * GW + gx;
    const b = this.besitz[i];
    if (!b) return false;
    return b !== nr || this.zeit[i] < this.t - schonfrist;
  }

  // Ein Schritt. Gibt das Bild dieses Schritts zurück: { t, p: [[x, y, dicke, flags], …], e? }
  schritt() {
    this.t++;
    const e = this.ereignis; this.ereignis = null;
    const ereignisse = e ? [e] : [];
    if (this.phase === 'bereit' && this.t >= this.phaseBis) this.phase = 'lauf';
    if (this.phase === 'pause' && this.t >= this.phaseBis) {
      if (this.vorbei) return this.bild([{ art: 'aus' }]);
      this.neueRunde();
      return this.bild([this.ereignis]);
    }
    if (this.phase === 'lauf') this.bewegen(ereignisse);
    return this.bild(ereignisse);
  }

  bewegen(ereignisse) {
    const lebende = this.s.filter(s => s.lebt);
    for (const s of lebende) {
      const k = this.lenk.get(s.id) || { l: false, r: false, lNeu: false, rNeu: false };
      let l = k.l, r = k.r, lNeu = k.lNeu, rNeu = k.rNeu;
      if (this.aktiv(s, 'spiegel')) [l, r, lNeu, rNeu] = [r, l, rNeu, lNeu];
      if (this.aktiv(s, 'ecken')) { if (lNeu) s.a -= Math.PI / 2; if (rNeu) s.a += Math.PI / 2; }
      else s.a += ((r ? 1 : 0) - (l ? 1 : 0)) * DREHUNG;
      k.lNeu = false; k.rNeu = false;
      const v = this.tempo(s);
      s.vx = s.x; s.vy = s.y;
      s.x += Math.cos(s.a) * v; s.y += Math.sin(s.a) * v;
      s.sprung = false;
      // Lücken
      if (s.luecke > 0) s.luecke--;
      else if (--s.naechsteLuecke <= 0) { s.luecke = Math.ceil(LUECKE_WEG / v); s.naechsteLuecke = Math.round(zufall(100, 210)); }
    }
    // Wände
    const offen = this.tor > this.t;
    for (const s of lebende) {
      const r = this.dicke(s) / 2;
      if (s.x < r || s.y < r || s.x > KURVE.b - r || s.y > KURVE.h - r) {
        if (offen) { s.x = (s.x + KURVE.b) % KURVE.b; s.y = (s.y + KURVE.h) % KURVE.h; s.sprung = true; }
        else s.tot = true;
      }
    }
    // Linien und Köpfe
    for (const s of lebende) {
      if (s.tot || this.aktiv(s, 'geist')) continue;
      const nr = this.s.indexOf(s) + 1;
      const r = this.dicke(s) / 2;
      const v = this.tempo(s);
      const frist = Math.ceil((r * 2 + 5) / v) + 2;
      for (const w of [0, -0.6, 0.6]) {
        if (this.belegt(s.x + Math.cos(s.a + w) * (r + 1.2), s.y + Math.sin(s.a + w) * (r + 1.2), nr, frist)) { s.tot = true; break; }
      }
    }
    for (let i = 0; i < lebende.length; i++) for (let j = i + 1; j < lebende.length; j++) {
      const a = lebende[i], b = lebende[j];
      if (this.aktiv(a, 'geist') || this.aktiv(b, 'geist')) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < (this.dicke(a) + this.dicke(b)) / 2) { a.tot = true; b.tot = true; }
    }
    // Linie stempeln (entlang des Wegs, damit keine Löcher entstehen)
    for (const s of lebende) {
      if (s.tot || s.luecke > 0 || s.sprung || this.aktiv(s, 'geist')) continue;
      const nr = this.s.indexOf(s) + 1, r = this.dicke(s) / 2;
      const weg = Math.hypot(s.x - s.vx, s.y - s.vy), n = Math.max(1, Math.ceil(weg / Math.max(1, r)));
      for (let i = 1; i <= n; i++) this.stempeln(s.vx + (s.x - s.vx) * i / n, s.vy + (s.y - s.vy) * i / n, r, nr);
    }
    // Powerups einsammeln
    for (const s of lebende) {
      if (s.tot) continue;
      for (const p of [...this.pu]) {
        if (Math.hypot(p.x - s.x, p.y - s.y) > PU_RADIUS + this.dicke(s) / 2) continue;
        this.pu = this.pu.filter(x => x !== p);
        this.anwenden(s, p.typ, ereignisse);
      }
    }
    // neue Powerups
    if (this.t >= this.naechstesPu) {
      this.naechstesPu = this.t + Math.round(zufall(200, 380));
      if (this.pu.length < 4) {
        for (let n = 0; n < 30; n++) {
          const x = zufall(50, KURVE.b - 50), y = zufall(50, KURVE.h - 50);
          if (this.s.some(s => s.lebt && Math.hypot(s.x - x, s.y - y) < 80) || this.pu.some(p => Math.hypot(p.x - x, p.y - y) < 60)) continue;
          this.pu.push({ n: ++this.puNr, typ: PU_TYPEN[Math.floor(Math.random() * PU_TYPEN.length)], x: runden(x), y: runden(y) });
          break;
        }
      }
    }
    // Wer ist raus? Alle, die noch leben, kriegen einen Punkt pro Ausgeschiedenem
    const raus = lebende.filter(s => s.tot);
    if (raus.length) {
      for (const s of raus) { s.lebt = false; s.tot = false; ereignisse.push({ art: 'raus', i: this.s.indexOf(s) }); }
      this.s.forEach((s, i) => { if (s.lebt) this.punkte[i] += raus.length; });
      const uebrig = this.s.filter(s => s.lebt);
      if (uebrig.length <= 1) {
        this.phase = 'pause';
        this.phaseBis = this.t + PAUSE;
        this.rundenSieger = uebrig[0]?.id || null;
        const max = Math.max(...this.punkte);
        this.vorbei = max >= this.ziel && this.punkte.filter(p => p === max).length === 1;
        ereignisse.push({ art: 'runde', sieger: this.rundenSieger, vorbei: this.vorbei });
      }
    }
  }

  anwenden(s, typ, ereignisse) {
    const pu = POWERUPS[typ];
    const bis = this.t + pu.dauer;
    if (typ === 'wisch') { this.besitz.fill(0); ereignisse.push({ art: 'wisch' }); }
    else if (typ === 'tor') this.tor = bis;
    else if (pu.fuer === 'ich') s.eff[typ] = bis;
    else for (const x of this.s) if (x !== s && x.lebt) x.eff[typ] = bis;
    ereignisse.push({ art: 'pu', typ, i: this.s.indexOf(s) });
  }

  // Ein Schritt als kleines Bild: Position, Dicke und Zustand jeder Kurve
  bild(ereignisse) {
    const p = this.s.map(s => {
      const flags = (s.lebt ? 1 : 0) | (s.luecke > 0 ? 2 : 0) | (this.aktiv(s, 'geist') ? 4 : 0) | (s.sprung ? 8 : 0) | (this.aktiv(s, 'ecken') ? 16 : 0) | (this.aktiv(s, 'spiegel') ? 32 : 0);
      return [runden(s.x), runden(s.y), runden(this.dicke(s)), flags, Math.round(s.a * 100) / 100];
    });
    const b = { t: this.t, p };
    const e = ereignisse.filter(Boolean);
    if (e.length) b.e = e;
    return b;
  }

  // Was sonst noch gezeigt wird (bei jeder Sendung dabei)
  lage() {
    return { pu: this.pu, tor: Math.max(0, this.tor - this.t), punkte: this.punkte, ziel: this.ziel, phase: this.phase, runde: this.runde, ids: this.ids };
  }
}

// ---------- Zeichnen (bei allen) ----------
// Bilder kommen gebündelt rein und werden mit kleinem Abstand nachgespielt.
export class KurvenBild {
  constructor() {
    this.puffer = [];      // noch nicht gezeichnete Schritte
    this.letzteT = 0;      // neuester bekannter Schritt
    this.gezeigtT = 0;     // bis hierhin ist gezeichnet
    this.spielT = 0;       // weiche Abspiel-Uhr
    this.jetzt = null;     // zuletzt gezeichnete Positionen
    this.lage = null;
    this.spur = document.createElement('canvas');
    this.spur.width = KURVE.b; this.spur.height = KURVE.h;
    this.meldung = null;   // { text, bis }
    this.zuletzt = performance.now();
  }

  aufnehmen(bilder, lage) {
    for (const b of bilder) if (b.t > this.letzteT) { this.puffer.push(b); this.letzteT = b.t; }
    if (lage) this.lage = lage;
    if (!this.spielT) this.spielT = this.letzteT - 3;
  }

  // Spielt fällige Schritte in die Spur-Ebene und zeichnet alles aufs sichtbare Feld
  zeichnen(canvas, namen, ichIndex) {
    const jetzt = performance.now();
    const dt = Math.min(100, jetzt - this.zuletzt); this.zuletzt = jetzt;
    // ca. 4 Schritte hinter dem Neuesten bleiben, bei großem Rückstand aufholen
    this.spielT += dt * TAKT / 1000;
    const zielT = this.letzteT - 4;
    if (this.spielT > this.letzteT) this.spielT = this.letzteT;
    if (this.spielT < zielT - 12) this.spielT = zielT;
    const g = this.spur.getContext('2d');
    g.lineCap = 'round';
    while (this.puffer.length && this.puffer[0].t <= this.spielT) this.anwenden(g, this.puffer.shift(), namen);
    this.malen(canvas, namen, ichIndex);
  }

  anwenden(g, b, namen) {
    for (const e of b.e || []) {
      if (e.art === 'neu' || e.art === 'wisch') { g.clearRect(0, 0, KURVE.b, KURVE.h); if (e.art === 'neu') this.jetzt = null; }
      if (e.art === 'runde') this.meldung = { text: e.sieger ? `${namen(e.sieger)} holt die Runde` : 'Keiner überlebt', bis: performance.now() + 2300 };
      if (e.art === 'pu') this.meldung = { text: `${POWERUPS[e.typ].zeichen} ${POWERUPS[e.typ].text}`, bis: performance.now() + 1400, farbe: PU_FARBE[POWERUPS[e.typ].fuer] };
    }
    const vorher = this.jetzt;
    b.p.forEach(([x, y, d, f], i) => {
      const alt = vorher?.[i];
      if (!alt || !(f & 1) || (f & (2 | 4 | 8)) || !(alt[3] & 1)) return;
      g.strokeStyle = KURVEN_FARBEN[i]; g.lineWidth = d;
      g.beginPath(); g.moveTo(alt[0], alt[1]); g.lineTo(x, y); g.stroke();
    });
    this.jetzt = b.p;
    this.gezeigtT = b.t;
  }

  malen(canvas, namen, ichIndex) {
    const dpr = window.devicePixelRatio || 1;
    const breite = canvas.clientWidth, hoehe = breite * KURVE.h / KURVE.b;
    if (canvas.width !== Math.round(breite * dpr)) { canvas.width = Math.round(breite * dpr); canvas.height = Math.round(hoehe * dpr); canvas.style.height = hoehe + 'px'; }
    const g = canvas.getContext('2d');
    const m = canvas.width / KURVE.b;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(m, 0, 0, m, 0, 0);
    const lage = this.lage;
    // offene Wände: gestrichelter Rand
    if (lage?.tor > 0) {
      g.strokeStyle = 'rgba(205,182,140,.7)'; g.lineWidth = 3; g.setLineDash([14, 10]);
      g.strokeRect(2, 2, KURVE.b - 4, KURVE.h - 4); g.setLineDash([]);
    }
    g.drawImage(this.spur, 0, 0);
    // Powerups
    for (const p of lage?.pu || []) {
      const pu = POWERUPS[p.typ];
      g.fillStyle = '#23272A'; g.strokeStyle = PU_FARBE[pu.fuer]; g.lineWidth = 3;
      g.beginPath(); g.arc(p.x, p.y, PU_RADIUS, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = PU_FARBE[pu.fuer]; g.font = '700 17px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(pu.zeichen, p.x, p.y + 1);
    }
    // Köpfe
    (this.jetzt || []).forEach(([x, y, d, f, a], i) => {
      if (!(f & 1)) return;
      const farbe = KURVEN_FARBEN[i];
      g.globalAlpha = f & 4 ? .45 : 1;
      g.fillStyle = farbe;
      g.beginPath(); g.arc(x, y, d / 2 + 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#16191B';
      g.beginPath(); g.arc(x + Math.cos(a) * (d / 2), y + Math.sin(a) * (d / 2), 1.6, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      // vor dem Start: Richtung zeigen, eigene Kurve markieren
      if (lage?.phase === 'bereit') {
        g.strokeStyle = farbe; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34); g.stroke();
        if (i === ichIndex) { g.lineWidth = 2; g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.stroke(); }
      }
    });
    // Meldungen (Runde vorbei, Powerup eingesammelt)
    if (this.meldung && this.meldung.bis > performance.now()) {
      g.font = '800 34px Bricolage, Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(22,25,27,.75)';
      const w = g.measureText(this.meldung.text).width + 48;
      g.fillRect(KURVE.b / 2 - w / 2, 34, w, 56);
      g.fillStyle = this.meldung.farbe || '#E4E7E4';
      g.fillText(this.meldung.text, KURVE.b / 2, 63);
    }
  }
}
