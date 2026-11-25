import { sb, spielEintragen, spielLoggen } from './server.js?v=0.6.2';
import { fragenBauen, pruefeFrage, richtigeWahl, fragenVorladen, KATEGORIEN, kategorieVon } from './kategorien.js?v=0.6.2';
import { lobbyMelden, lobbyAbmelden } from './lobby.js?v=0.6.2';
import { chatErlaubt, textPruefen } from './filter.js?v=0.6.2';
import { KurvenSim, KurvenBild } from './kurve.js?v=0.6.2';

export const STANDARD = { kategorie: 'flaggen', runden: 10, zeit: 15, auswahl: 'alle', modus: 'tippen', chat: 'eingeschraenkt', sichtbar: 'geschlossen' };
const COUNTDOWN = 3000;
const AUFLOESUNG = 3500;

export function codeNeu() {
  const z = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => z[Math.floor(Math.random() * z.length)]).join('');
}

// Schnell sein lohnt sich, wer als Erstes trifft, kriegt 20 obendrauf
// Klartext einer Antwortmöglichkeit (die Optionen liegen als escaptes HTML vor)
function wahlText(frage, key) {
  try {
    const html = String(kategorieVon(frage).option(String(key), frage));
    const name = html.match(/class="duell-name">([^<]*)</); // bei Größer oder kleiner nur den Ländernamen
    return (name ? name[1] : html)
      .replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  } catch { return ''; }
}

export function punkteFuer(ms, dauer, rang) {
  const rest = Math.max(0, 1 - ms / dauer);
  return 30 + Math.round(70 * rest) + (rang === 1 ? 20 : 0);
}

// Raum-Zustand pro Tab merken, damit ein Neuladen (z. B. bei neuer Version) nichts kaputt macht
const MERK = code => 'quizbude.raum.' + code;
function gemerktLesen(code) {
  try { return JSON.parse(sessionStorage.getItem(MERK(code)) || 'null'); } catch { return null; }
}

export class Raum {
  constructor(code, ich, aenderung, neu = false) {
    this.code = code;
    this.gemerkt = neu ? null : gemerktLesen(code);
    this.syncDa = false;
    this.ich = ich;
    this.aenderung = aenderung;
    this.spieler = new Map();   // anwesend: id -> {id,name,avatar,farbe,seit}
    this.bekannt = new Map();   // alle, die mal da waren (für Ergebnisse)
    this.punkte = new Map();
    this.hostId = null;
    this.phase = 'warten';      // warten | countdown | frage | aufloesung | ende
    this.einst = { ...STANDARD };
    this.fragen = [];
    this.idx = -1;
    this.dauer = 15000;
    this.start = 0;
    this.countdownEnde = 0;
    this.geloest = new Map();   // id -> {pkt, rang}
    this.gesperrt = new Set();
    this.meinStatus = null;     // null | 'geloest' | 'gesperrt'
    this.meineTreffer = 0;
    this.chat = this.gemerkt?.chat || [];
    this.ergebnis = null;
    this.spielId = null;
    this.eingetragen = null;
    this.seit = this.gemerkt?.seit || Date.now(); // wer zurückkommt, behält seinen Platz in der Reihenfolge
    this.timer = null;
    this.hostSchritt = null;    // nur beim Gastgeber: welche Runde gerade läuft
    this.vergeben = new Set();
    this.weg = false;
    this.unentschieden = false;
  }

  get istSpiel() { return !!KATEGORIEN[this.einst.kategorie]?.spiel; }
  // [mindestens, höchstens] Leute für das gewählte Spiel
  get spielerSpanne() { return this.istSpiel ? (KATEGORIEN.spiele.spielerZahl[this.einst.auswahl] || [2, 2]) : [2, 99]; }
  get startBereit() { const [min, max] = this.spielerSpanne; return this.spieler.size >= min && this.spieler.size <= max; }

  get binHost() { return this.hostId === this.ich.id; }

  merken() {
    try {
      sessionStorage.setItem(MERK(this.code), JSON.stringify({
        seit: this.seit, einst: this.einst, chat: this.chat.slice(-40), warHost: this.binHost && this.phase === 'warten',
      }));
    } catch { /* egal */ }
  }

  // Nach dem Neuladen: wer vorher Gastgeber im Warteraum war, übernimmt wieder
  hostZurueckholen() {
    if (!this.gemerkt?.warHost || this.phase !== 'warten' || this.weg) return;
    this.gemerkt.warHost = false;
    if (this.binHost) return;
    this.hostId = this.ich.id;
    this.uebernehmen();
  }
  get frage() { return this.fragen[this.idx]; }
  meldung() { if (!this.weg) this.aenderung(this); }

  async betreten(alsHost) {
    this.kanal = sb.channel('qb-raum-' + this.code, {
      config: { broadcast: { self: true }, presence: { key: this.ich.id } },
    });
    this.kanal.on('presence', { event: 'sync' }, () => this.anwesenheit());
    this.kanal.on('broadcast', { event: 'm' }, ({ payload }) => this.empfang(payload));
    await new Promise((ok, fehler) => {
      this.kanal.subscribe(status => {
        if (status === 'SUBSCRIBED') ok();
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') fehler(new Error('Keine Verbindung zum Raum. Lade die Seite neu und versuch es nochmal.'));
      });
    });
    const { id, name, avatar, farbe } = this.ich;
    await this.kanal.track({ id, name, avatar, farbe, seit: this.seit });
    if (alsHost) {
      this.hostId = id;
      this.lobbyAktualisieren();
      this.meldung();
    } else {
      this.senden('hallo', {});
      setTimeout(() => { if (!this.hostId && !this.weg) this.hostWaehlen(); this.hostZurueckholen(); }, 2500);
    }
  }

  verlassen() {
    this.weg = true;
    clearTimeout(this.timer);
    this.kurveStopp();
    if (this.binHost) lobbyAbmelden();
    if (this.kanal) sb.removeChannel(this.kanal);
  }

  senden(t, p) {
    this.kanal.send({ type: 'broadcast', event: 'm', payload: { t, von: this.ich.id, ...p } });
  }

  anwesenheit() {
    const st = this.kanal.presenceState();
    this.spieler = new Map();
    for (const metas of Object.values(st)) {
      const m = metas[0];
      this.spieler.set(m.id, m);
      this.bekannt.set(m.id, { name: m.name, avatar: m.avatar, farbe: m.farbe });
    }
    if (this.hostId && !this.spieler.has(this.hostId)) this.hostWaehlen();
    if (this.binHost) {
      this.lobbyAktualisieren();
      if (this.phase === 'frage') this.allePruefen();
    }
    this.meldung();
  }

  // Wer am längsten im Raum ist, übernimmt. Alle rechnen dasselbe aus.
  hostWaehlen() {
    const da = [...this.spieler.values()].sort((a, b) => a.seit - b.seit || a.id.localeCompare(b.id));
    if (!da.length) return;
    const neu = da[0].id;
    if (neu === this.hostId) return;
    const warIch = this.binHost;
    this.hostId = neu;
    if (this.binHost && !warIch) this.uebernehmen();
  }

  uebernehmen() {
    this.systemZeile(`${this.ich.name} ist jetzt Gastgeber.`);
    this.senden('host', { id: this.ich.id });
    this.lobbyAktualisieren();
    clearTimeout(this.timer);
    // allein zurückgekommen: die gemerkten Einstellungen wieder einsetzen
    if (this.phase === 'warten' && !this.syncDa && this.gemerkt?.einst) {
      this.senden('einst', { einst: { ...this.einst, ...this.gemerkt.einst } });
      this.gemerkt.einst = null;
    }
    if (this.istSpiel && (this.phase === 'countdown' || this.phase === 'spiel')) {
      // Der bisherige Gastgeber ist mitten im Spiel gegangen: wer noch da ist, gewinnt bzw. der Spielstand zählt
      if (this.kurvenBild) this.kurveBeenden(this.kurvenBild.lage?.punkte, this.kurveIds);
      return;
    }
    if (this.phase === 'countdown') this.timer = setTimeout(() => this.frageSenden(0), 1500);
    else if (this.phase === 'frage') { this.hostSchritt = { i: this.idx, fertig: false }; this.aufloesen(); }
    else if (this.phase === 'aufloesung') this.timer = setTimeout(() => this.weiter(this.idx), 1500);
  }

  lobbyAktualisieren() {
    if (!this.binHost || this.weg) return;
    // Geschlossene Räume tauchen nicht unter „Offene Räume" auf, rein kommt man nur mit Code oder Link
    if ((this.einst.sichtbar || 'geschlossen') !== 'offen') { lobbyAbmelden(); return; }
    const kat = KATEGORIEN[this.einst.kategorie] || KATEGORIEN.flaggen;
    lobbyMelden({
      code: this.code, host: this.ich.name, spieler: Math.max(1, this.spieler.size),
      phase: this.phase, kategorie: kat.name, auswahl: kat.auswahlen[this.einst.auswahl] || '',
    });
  }

  // Falschantwort für die Spalte rechts: Name plus das, was getippt oder angeklickt wurde
  danebenZeile(id, text) {
    const t = String(text || '').trim().slice(0, 40);
    if (!t || !chatErlaubt(t, this.einst.chat || 'eingeschraenkt')) return;
    const wer = this.bekannt.get(id);
    this.chat.push({ daneben: true, id, name: wer?.name || 'Jemand', avatar: wer?.avatar, text: t });
    if (this.chat.length > 80) this.chat.shift();
  }

  systemZeile(text) {
    const letzte = this.chat[this.chat.length - 1];
    if (letzte?.system && letzte.text === text) return; // nicht doppelt
    this.chat.push({ system: true, text });
    if (this.chat.length > 80) this.chat.shift();
  }

  zustand(fuer) {
    return {
      an: fuer, hostId: this.hostId, phase: this.phase, einst: this.einst, fragen: this.fragen, idx: this.idx,
      rest: this.phase === 'frage' ? Math.max(0, this.dauer - (performance.now() - this.start)) : 0,
      dauer: this.dauer, spielId: this.spielId, ergebnis: this.ergebnis,
      punkte: [...this.punkte], geloest: [...this.geloest], gesperrt: [...this.gesperrt],
    };
  }

  empfang(p) {
    if (this.weg) return;
    const name = this.bekannt.get(p.von)?.name || 'Jemand';
    switch (p.t) {
      case 'hallo':
        if (this.binHost && p.von !== this.ich.id) this.senden('sync', this.zustand(p.von));
        break;
      case 'sync':
        if (p.an !== this.ich.id) break;
        Object.assign(this, {
          hostId: p.hostId, phase: p.phase, einst: p.einst, fragen: p.fragen, idx: p.idx, dauer: p.dauer,
          spielId: p.spielId, ergebnis: p.ergebnis,
          punkte: new Map(p.punkte), geloest: new Map(p.geloest), gesperrt: new Set(p.gesperrt),
        });
        this.start = performance.now() - (p.dauer - p.rest);
        if (this.phase === 'countdown') this.countdownEnde = performance.now() + 1500;
        this.vorladen();
        this.syncDa = true;
        if (this.hostId && !this.spieler.has(this.hostId) && this.spieler.size) this.hostWaehlen();
        this.hostZurueckholen();
        break;
      case 'host': {
        const warIch = this.binHost;
        this.hostId = p.id;
        if (warIch && !this.binHost) lobbyAbmelden(); // jemand anderes hat übernommen
        break;
      }
      case 'einst':
        this.einst = p.einst;
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'start':
        Object.assign(this, {
          einst: p.einst, fragen: p.fragen, spielId: p.spielId, idx: -1, phase: 'countdown',
          punkte: new Map(), geloest: new Map(), gesperrt: new Set(), ergebnis: null, meineTreffer: 0,
          unentschieden: false,
          kurveIds: p.kurve?.ids || null, kurvenBild: p.kurve ? new KurvenBild() : null,
        });
        this.kurveStopp();
        this.countdownEnde = performance.now() + COUNTDOWN;
        this.vorladen();
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'frage':
        Object.assign(this, { idx: p.i, dauer: p.dauer, phase: 'frage', geloest: new Map(), gesperrt: new Set(), meinStatus: null });
        this.start = performance.now();
        break;
      case 'treffer':
        if (!this.binHost || this.phase !== 'frage' || p.i !== this.idx || this.vergeben.has(p.von)) break;
        this.vergeben.add(p.von);
        {
          const rang = this.vergeben.size;
          this.senden('geloest', { i: p.i, id: p.von, pkt: punkteFuer(p.ms, this.dauer, rang), rang });
        }
        break;
      case 'fehl':
        if (!this.binHost || this.phase !== 'frage' || p.i !== this.idx || this.vergeben.has(p.von)) break;
        this.vergeben.add(p.von);
        this.senden('gesperrt', { i: p.i, id: p.von, wahl: p.wahl });
        break;
      case 'daneben':
        if (this.phase !== 'frage' || p.i !== this.idx) break;
        this.danebenZeile(p.von, p.text);
        break;
      case 'geloest':
        if (p.i !== this.idx || this.geloest.has(p.id)) break;
        this.geloest.set(p.id, { pkt: p.pkt, rang: p.rang });
        this.punkte.set(p.id, (this.punkte.get(p.id) || 0) + p.pkt);
        if (p.id === this.ich.id) { this.meinStatus = 'geloest'; this.meineTreffer++; }
        this.systemZeile(`${this.bekannt.get(p.id)?.name || 'Jemand'} hat's! +${p.pkt}`);
        if (this.binHost) this.allePruefen();
        break;
      case 'gesperrt':
        if (p.i !== this.idx || this.gesperrt.has(p.id)) break;
        this.gesperrt.add(p.id);
        if (p.wahl != null && this.frage) this.danebenZeile(p.id, wahlText(this.frage, p.wahl));
        if (p.id === this.ich.id) this.meinStatus = 'gesperrt';
        if (this.binHost) this.allePruefen();
        break;
      case 'aufloesung':
        this.phase = 'aufloesung';
        break;
      case 'kv':
        if (!this.kurvenBild) return;
        this.kurvenBild.aufnehmen(p.b, p.l);
        if (this.phase === 'countdown') { this.phase = 'spiel'; break; }
        return;
      case 'kd':
        if (this.binHost && this.kurve) this.kurve.lenken(p.von, !!p.l, !!p.r);
        return;
      case 'kf':
        if (this.binHost && this.kurve && p.von !== this.ich.id) this.kurve.feuern(p.von);
        return;
      case 'ende':
        this.phase = 'ende';
        this.ergebnis = p.liste;
        this.unentschieden = !!p.unentschieden;
        this.eintragen();
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'warten':
        this.kurveStopp();
        Object.assign(this, { phase: 'warten', fragen: [], idx: -1, punkte: new Map(), ergebnis: null });
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'chat':
        if (!chatErlaubt(String(p.text), this.einst.chat || 'eingeschraenkt')) break; // auch fremde Clients können nichts durchschmuggeln
        this.chat.push({ id: p.von, name, avatar: this.bekannt.get(p.von)?.avatar, text: String(p.text).slice(0, 200) });
        if (this.chat.length > 80) this.chat.shift();
        break;
      default:
        return;
    }
    this.meldung();
  }

  vorladen() {
    fragenVorladen(this.fragen).then(() => this.meldung());
  }

  // ---------- Gastgeber ----------
  einstellen(neu) {
    if (!this.binHost || this.phase !== 'warten' && this.phase !== 'ende') return;
    this.senden('einst', { einst: { ...this.einst, ...neu } });
  }

  starten() {
    if (!this.binHost || !this.startBereit) return; // Quiz ab 2 Leuten, Spiele je nach Spiel
    clearTimeout(this.timer);
    if (this.istSpiel) return this.spielStarten();
    const fragen = fragenBauen(this.einst);
    this.senden('start', { einst: this.einst, fragen, spielId: crypto.randomUUID() });
    this.timer = setTimeout(() => this.frageSenden(0), COUNTDOWN);
  }

  frageSenden(i) {
    if (!this.binHost || this.weg) return;
    this.vergeben = new Set();
    this.hostSchritt = { i, fertig: false };
    const dauer = this.einst.zeit * 1000;
    this.senden('frage', { i, dauer });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.aufloesen(), dauer + 500);
  }

  allePruefen() {
    const schritt = this.hostSchritt;
    if (!schritt || schritt.fertig || schritt.alleDa || this.phase !== 'frage') return;
    const ids = [...this.spieler.keys()];
    if (ids.length && ids.every(id => this.geloest.has(id) || this.gesperrt.has(id))) {
      schritt.alleDa = true; // nur einmal planen, sonst schiebt jede Anwesenheits-Meldung die Auflösung nach hinten
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.aufloesen(), 700);
    }
  }

  aufloesen() {
    if (!this.binHost || this.weg || !this.hostSchritt || this.hostSchritt.fertig) return;
    this.hostSchritt.fertig = true;
    const i = this.hostSchritt.i;
    this.senden('aufloesung', { i });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.weiter(i), AUFLOESUNG);
  }

  weiter(i) {
    if (!this.binHost || this.weg) return;
    if (i + 1 < this.fragen.length) this.frageSenden(i + 1);
    else this.beenden();
  }

  beenden() {
    const liste = [...this.punkte].map(([id, pkt]) => ({ id, pkt, ...(this.bekannt.get(id) || { name: '?' }) }));
    for (const [id, s] of this.spieler) if (!this.punkte.has(id)) liste.push({ id, pkt: 0, name: s.name, avatar: s.avatar, farbe: s.farbe });
    liste.sort((a, b) => b.pkt - a.pkt);
    this.senden('ende', { liste });
    if (!this.ich.gast) spielLoggen({
      code: this.code, kategorie: this.einst.kategorie, runden: this.fragen.length, modus: this.einst.modus, auswahl: this.einst.auswahl,
      spieler: liste.slice(0, 20).map(({ name, avatar, pkt }) => ({ name, avatar, pkt })),
    });
  }

  // Gleiche Einstellungen, neue Fragen, alle bleiben drin. Passt die Zahl nicht, geht's zurück in den Warteraum.
  nochmal() {
    if (!this.binHost) return;
    clearTimeout(this.timer);
    if (this.startBereit) this.starten();
    else this.senden('warten', {});
  }

  // ---------- Kurvenkampf ----------
  kurveStarten() {
    const ids = [...this.spieler.keys()].sort((a, b) => (a === this.hostId ? -1 : b === this.hostId ? 1 : (this.spieler.get(a).seit - this.spieler.get(b).seit)));
    this.senden('start', { einst: this.einst, fragen: [], spielId: crypto.randomUUID(), kurve: { ids: ids.slice(0, 8) } });
    this.timer = setTimeout(() => this.kurveLos(), COUNTDOWN);
  }

  kurveLos() {
    if (!this.binHost || this.weg || !this.kurveIds) return;
    this.kurve = new KurvenSim(this.kurveIds);
    if (this.kurveVorab) this.kurve.lenken(this.ich.id, this.kurveVorab.l, this.kurveVorab.r);
    this.kurveUhr = performance.now();
    this.kurveBuendel = [];
    this.kurveSchleife = setInterval(() => this.kurveWeiter(), 1000 / 60);
  }

  kurveWeiter() {
    const sim = this.kurve;
    if (!this.binHost || this.weg || !sim) return this.kurveStopp();
    // Wer den Raum verlässt, scheidet aus
    sim.s.forEach(s => { if (s.lebt && !this.spieler.has(s.id) && sim.phase === 'lauf') s.tot = true; });
    const jetzt = performance.now();
    let n = Math.floor((jetzt - this.kurveUhr) / (1000 / 60));
    if (n > 20) { n = 20; this.kurveUhr = jetzt; } else this.kurveUhr += n * (1000 / 60);
    for (let i = 0; i < n; i++) this.kurveBuendel.push(sim.schritt());
    // bis 4 Leute etwa 20 Sendungen pro Sekunde, darüber 12 (damit der Server nicht ans Limit kommt)
    if (this.kurveBuendel.length >= (sim.ids.length > 4 ? 5 : 3)) {
      const b = this.kurveBuendel; this.kurveBuendel = [];
      const l = sim.lage();
      this.kurvenBild?.aufnehmen(b, l);
      this.senden('kv', { b, l });
      if (this.phase === 'countdown') { this.phase = 'spiel'; this.meldung(); }
    }
    if (sim.vorbei && sim.phase === 'pause' && sim.t >= sim.phaseBis) this.kurveBeenden(sim.punkte, sim.ids);
  }

  kurveStopp() {
    clearInterval(this.kurveSchleife);
    this.kurveSchleife = null;
  }

  kurveBeenden(punkte, ids) {
    if (!this.binHost || this.weg) return;
    this.kurveStopp();
    clearTimeout(this.timer);
    ids = ids || [];
    punkte = punkte || ids.map(() => 0);
    const max = Math.max(0, ...punkte);
    const liste = ids.map((id, i) => ({
      id, pkt: punkte[i] * 10 + (punkte[i] === max && max > 0 && punkte.filter(p => p === max).length === 1 ? 30 : 0),
      ...(this.bekannt.get(id) || { name: '?' }),
    })).sort((a, b) => b.pkt - a.pkt);
    const unentschieden = liste.length > 1 && liste[0].pkt === liste[1].pkt;
    this.kurve = null;
    this.senden('ende', { liste, unentschieden });
    if (!this.ich.gast) spielLoggen({
      code: this.code, kategorie: 'spiele', runden: null, modus: 'kurve', auswahl: 'kurve',
      spieler: liste.map(({ name, avatar, pkt }) => ({ name, avatar, pkt })),
    });
  }

  kurveFeuern() {
    if (this.phase !== 'spiel') return;
    if (this.binHost) this.kurve?.feuern(this.ich.id);
    else this.senden('kf', {});
  }

  // Links/rechts gedrückt halten. Der Gastgeber gibt es direkt an seine Rechnung, alle anderen schicken es.
  kurveLenken(l, r) {
    if (this.phase !== 'spiel' && this.phase !== 'countdown') return;
    if (this.binHost) {
      if (this.kurve) this.kurve.lenken(this.ich.id, l, r);
      else this.kurveVorab = { l, r };
    } else this.senden('kd', { l, r });
  }

  spielStarten() { return this.kurveStarten(); }

  // Alle zusammen zurück in den Warteraum, dort sucht der Gastgeber eine neue Kategorie aus
  zurueckInDenWarteraum() {
    if (!this.binHost) return;
    clearTimeout(this.timer);
    this.kurveStopp();
    this.senden('warten', {});
  }

  // ---------- Mitspielen ----------
  raten(text) {
    if (this.phase !== 'frage' || this.meinStatus) return 'zu';
    const ergebnis = pruefeFrage(this.frage, text);
    if (ergebnis === 'richtig') {
      this.meinStatus = 'wartet';
      this.senden('treffer', { i: this.idx, ms: performance.now() - this.start });
    } else if (ergebnis === 'falsch') {
      // knappe Versuche bleiben privat, die würden die Lösung fast verraten
      const t = text.trim().slice(0, 40);
      this.senden('daneben', { i: this.idx, text: t }); // kommt über den Kanal auch bei mir selbst an
    }
    return ergebnis;
  }

  waehlen(code) {
    if (this.phase !== 'frage' || this.meinStatus) return 'zu';
    const ms = performance.now() - this.start;
    if (richtigeWahl(this.frage, code)) { this.meinStatus = 'wartet'; this.senden('treffer', { i: this.idx, ms }); return 'richtig'; }
    this.meinStatus = 'gesperrt';
    this.senden('fehl', { i: this.idx, wahl: code });
    this.meldung();
    return 'falsch';
  }

  // true = gesendet, sonst der Grund ('hass' oder 'grob')
  chatten(text) {
    const t = text.trim().slice(0, 200);
    if (!t) return true;
    if (!chatErlaubt(t, this.einst.chat || 'eingeschraenkt')) return textPruefen(t);
    this.senden('chat', { text: t });
    return true;
  }

  eintragen() {
    if (!this.spielId || this.eingetragen === this.spielId || !this.ergebnis || this.ich.gast) return; // Gäste zählen nicht für die Bestenliste
    this.eingetragen = this.spielId;
    const ich = this.ergebnis.find(e => e.id === this.ich.id);
    if (!ich) return;
    const sieg = !this.unentschieden && this.ergebnis.length >= 2 && this.ergebnis[0].id === this.ich.id && ich.pkt > 0;
    spielEintragen(ich.pkt, this.meineTreffer, sieg);
  }
}
