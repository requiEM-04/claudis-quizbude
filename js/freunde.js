import { sb } from './server.js?v=0.13.2';

// Wer ist gerade da? Ein Kanal für alle angemeldeten Spieler (Schlüssel = Konto-ID).
// Jeder meldet: Name und, falls im Raum, Code und Kategorie. Einladungen und „neue Anfrage“ laufen als Broadcast.
let kanal = null, bereit = false, ich = null, ort = { raum: null, kat: null };
let online = new Map();
const abos = new Set(), einladungsAbos = new Set(), anfrageAbos = new Set();

const melden = () => { if (bereit && ich) kanal.track({ id: ich.id, name: ich.name, raum: ort.raum, kat: ort.kat, ts: Date.now() }); };
function verteilen() {
  online = new Map();
  for (const liste of Object.values(kanal.presenceState())) for (const m of liste) {
    if (!m?.id) continue;
    const alt = online.get(m.id);
    if (!alt || (m.ts || 0) > (alt.ts || 0)) online.set(m.id, m);
  }
  abos.forEach(f => f(online));
}

export function freundeStart(konto) {
  if (!sb || !konto || konto.gast) return;
  if (kanal && ich?.id === konto.id) { ich = konto; melden(); return; }
  freundeStopp();
  ich = konto;
  kanal = sb.channel('qb-online', { config: { presence: { key: konto.id } } });
  kanal.on('presence', { event: 'sync' }, verteilen);
  kanal.on('broadcast', { event: 'einladung' }, ({ payload }) => { if (payload?.an === ich?.id) einladungsAbos.forEach(f => f(payload)); });
  kanal.on('broadcast', { event: 'anfrage' }, ({ payload }) => { if (ich && String(payload?.anName || '').toLowerCase() === ich.name.toLowerCase()) anfrageAbos.forEach(f => f(payload)); });
  kanal.subscribe(status => { if (status === 'SUBSCRIBED') { bereit = true; melden(); } });
}
export function freundeStopp() {
  if (kanal) sb.removeChannel(kanal);
  kanal = null; bereit = false; ich = null; online = new Map();
  abos.forEach(f => f(online));
}
// Wo bin ich gerade? (null = nicht im Raum)
export function freundeOrt(raum, kat = null) {
  if (ort.raum === raum && ort.kat === kat) return;
  ort = { raum, kat };
  melden();
}
export const istOnline = id => online.get(id) || null;
export const onlineAbo = f => { abos.add(f); f(online); return () => abos.delete(f); };
export const einladungAbo = f => { einladungsAbos.add(f); return () => einladungsAbos.delete(f); };
export const anfrageAbo = f => { anfrageAbos.add(f); return () => anfrageAbos.delete(f); };

export async function einladen(an, code, kat) {
  if (!bereit || !ich) throw new Error('Gerade keine Verbindung.');
  await kanal.send({ type: 'broadcast', event: 'einladung', payload: { an, von: ich.id, name: ich.name, code, kat, ts: Date.now() } });
}
// Dem anderen Bescheid geben, dass sich an der Freundesliste etwas getan hat (er lädt sie dann neu)
export async function anfrageMelden(anName) {
  if (bereit && ich) await kanal.send({ type: 'broadcast', event: 'anfrage', payload: { anName, von: ich.id, name: ich.name } });
}
