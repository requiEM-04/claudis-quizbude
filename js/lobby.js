import { sb } from './server.js?v=0.6.0';

// Ein gemeinsamer Kanal, in dem Gastgeber ihre offenen Räume anzeigen.
let kanal = null;
let bereit = false;
let wartet = null; // Meldung, die raus soll, sobald der Kanal steht
let raeume = [];
const abos = new Set();
const schluessel = crypto.randomUUID();

function verteilen() {
  const alle = Object.values(kanal.presenceState()).flat().filter(m => m.code);
  const jeCode = new Map();
  for (const r of alle) if (!jeCode.has(r.code) || jeCode.get(r.code).ts < r.ts) jeCode.set(r.code, r);
  raeume = [...jeCode.values()].sort((a, b) => b.ts - a.ts);
  abos.forEach(f => f(raeume));
}

export function lobbyStart() {
  if (kanal || !sb) return;
  kanal = sb.channel('qb-lobby', { config: { presence: { key: schluessel } } });
  kanal.on('presence', { event: 'sync' }, verteilen);
  kanal.subscribe(status => {
    if (status === 'SUBSCRIBED') {
      bereit = true;
      if (wartet) kanal.track(wartet);
      wartet = null;
    }
  });
}

export function lobbyMelden(info) {
  const eintrag = { ...info, ts: Date.now() };
  if (bereit) kanal.track(eintrag); else wartet = eintrag;
}

export function lobbyAbmelden() {
  wartet = null;
  if (bereit) kanal.untrack();
}

export function lobbyAbo(f) {
  abos.add(f);
  f(raeume);
  return () => abos.delete(f);
}

export function lobbyStopp() {
  if (kanal) sb.removeChannel(kanal);
  kanal = null; bereit = false; raeume = [];
}
