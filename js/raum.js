import { sb, spielEintragen, spielLoggen } from './server.js?v=0.4.4';
import { fragenBauen, pruefeFrage, richtigeWahl, fragenVorladen, KATEGORIEN, kategorieVon } from './kategorien.js?v=0.4.4';
import { lobbyMelden, lobbyAbmelden } from './lobby.js?v=0.4.4';
import { chatErlaubt, textPruefen } from './filter.js?v=0.4.4';

export const STANDARD = { kategorie: 'flaggen', runden: 10, zeit: 15, auswahl: 'bekannt', modus: 'tippen', chat: 'eingeschraenkt' };
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
    return String(kategorieVon(frage).option(String(key), frage))
      .replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  } catch { return ''; }
}

export function punkteFuer(ms, dauer, rang) {
  const rest = Math.max(0, 1 - ms / dauer);
  return 30 + Math.round(70 * rest) + (rang === 1 ? 20 : 0);
}

export class Raum {
  constructor(code, ich, aenderung) {
    this.code = code;
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
    this.chat = [];
    this.ergebnis = null;
    this.spielId = null;
    this.eingetragen = null;
    this.seit = Date.now();
    this.timer = null;
    this.hostSchritt = null;    // nur beim Gastgeber: welche Runde gerade läuft
    this.vergeben = new Set();
    this.weg = false;
  }

  get binHost() { return this.hostId === this.ich.id; }
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
      setTimeout(() => { if (!this.hostId && !this.weg) this.hostWaehlen(); }, 2500);
    }
  }

  verlassen() {
    this.weg = true;
    clearTimeout(this.timer);
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
    if (this.phase === 'countdown') this.timer = setTimeout(() => this.frageSenden(0), 1500);
    else if (this.phase === 'frage') { this.hostSchritt = { i: this.idx, fertig: false }; this.aufloesen(); }
    else if (this.phase === 'aufloesung') this.timer = setTimeout(() => this.weiter(this.idx), 1500);
  }

  lobbyAktualisieren() {
    if (!this.binHost || this.weg) return;
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
        if (this.hostId && !this.spieler.has(this.hostId) && this.spieler.size) this.hostWaehlen();
        break;
      case 'host':
        this.hostId = p.id;
        break;
      case 'einst':
        this.einst = p.einst;
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'start':
        Object.assign(this, {
          einst: p.einst, fragen: p.fragen, spielId: p.spielId, idx: -1, phase: 'countdown',
          punkte: new Map(), geloest: new Map(), gesperrt: new Set(), ergebnis: null, meineTreffer: 0,
        });
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
      case 'ende':
        this.phase = 'ende';
        this.ergebnis = p.liste;
        this.eintragen();
        if (this.binHost) this.lobbyAktualisieren();
        break;
      case 'warten':
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
    if (!this.binHost || this.spieler.size < 2) return; // gespielt wird ab 2 Leuten
    clearTimeout(this.timer);
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
    spielLoggen({
      code: this.code, kategorie: this.einst.kategorie, runden: this.fragen.length, modus: this.einst.modus, auswahl: this.einst.auswahl,
      spieler: liste.slice(0, 20).map(({ name, avatar, pkt }) => ({ name, avatar, pkt })),
    });
  }

  nochmal() {
    if (!this.binHost) return;
    clearTimeout(this.timer);
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
    if (!this.spielId || this.eingetragen === this.spielId || !this.ergebnis) return;
    this.eingetragen = this.spielId;
    const ich = this.ergebnis.find(e => e.id === this.ich.id);
    if (!ich) return;
    const sieg = this.ergebnis.length >= 2 && this.ergebnis[0].id === this.ich.id && ich.pkt > 0;
    spielEintragen(ich.pkt, this.meineTreffer, sieg);
  }
}
