import { CONFIG } from './config.js?v=0.4.5';
import { textPruefen } from './filter.js?v=0.4.5';

// ?sitzung=2 in der Adresse = zweites Konto im selben Browser (zum Testen mit zwei Tabs)
const sitzung = new URLSearchParams(location.search).get('sitzung');

export const sb = CONFIG.url && window.supabase
  ? window.supabase.createClient(CONFIG.url, CONFIG.key, {
    auth: { storageKey: 'quizbude.auth' + (sitzung ? '.' + sitzung : ''), persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 20 } },
  })
  : null;

export const online = () => !!sb;

// Supabase will mindestens 6 Zeichen, bei uns reichen 4
const pw = p => p + '#qb26';

function mailVon(name) {
  const lokal = name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\./g, '-').replace(/[^a-z0-9_-]/g, '');
  return `${lokal}@quizbude.app`;
}

export function nameFehler(name) {
  if (name.length < 3) return 'Der Name braucht mindestens 3 Zeichen.';
  if (textPruefen(name) !== 'ok') return 'Den Namen nehmen wir lieber nicht. Such dir einen anderen aus.';
  if (name.length > 16) return 'Der Name darf höchstens 16 Zeichen haben.';
  if (!/^[A-Za-zÄÖÜäöüß0-9_.-]+$/.test(name)) return 'Im Namen gehen nur Buchstaben, Ziffern, Punkt, Strich und Unterstrich.';
  return '';
}

function uebersetzen(err) {
  const m = (err?.message || String(err)).toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('duplicate')) return 'Den Namen gibt es schon. Nimm einen anderen oder melde dich an.';
  if (m.includes('invalid login')) return 'Name oder Passwort stimmt nicht.';
  if (m.includes('rate limit')) return 'Zu viele Versuche. Warte kurz und probier es dann nochmal.';
  if (m.includes('fetch') || m.includes('network')) return 'Der Server ist gerade nicht erreichbar. Prüf die Verbindung und versuch es nochmal.';
  return 'Das hat nicht geklappt: ' + (err?.message || err);
}

export async function registrieren(name, passwort, avatar, farbe) {
  const { data, error } = await sb.auth.signUp({
    email: mailVon(name), password: pw(passwort),
    options: { data: { name, avatar, farbe } },
  });
  if (error) throw new Error(uebersetzen(error));
  if (!data.session) throw new Error('Konto angelegt, aber die Anmeldung fehlt noch. Melde dich einmal mit Name und Passwort an.');
  return data.session.user;
}

export async function anmelden(name, passwort) {
  const { data, error } = await sb.auth.signInWithPassword({ email: mailVon(name), password: pw(passwort) });
  if (error) throw new Error(uebersetzen(error));
  return data.user;
}

export async function abmelden() {
  await sb.auth.signOut();
}

export async function sitzungHolen() {
  const { data } = await sb.auth.getSession();
  return data.session?.user || null;
}

export async function profilLaden(id) {
  const { data, error } = await sb.from('profile').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(uebersetzen(error));
  return data;
}

export async function profilSpeichern(id, felder) {
  const { error } = await sb.from('profile').update(felder).eq('id', id);
  if (error) throw new Error(uebersetzen(error));
}

export async function spielEintragen(punkte, richtig, sieg) {
  const { error } = await sb.rpc('spiel_eintragen', { p_punkte: punkte, p_richtig: richtig, p_sieg: sieg });
  if (error) console.warn('[Quizbude] Spiel nicht gespeichert', error);
}

export async function spielLoggen(eintrag) {
  const { error } = await sb.rpc('spiel_loggen', { p: eintrag });
  if (error) console.warn('[Quizbude] Spiel-Log fehlgeschlagen', error);
}

export async function sprintEintragen(wert, kategorie = 'flaggen') {
  const { data, error } = await sb.rpc('sprint_eintragen', { p_wert: wert, p_kategorie: kategorie });
  if (error) { console.warn('[Quizbude] Sprint nicht gespeichert', error); return null; }
  return data; // neuer Rekord (Zahl)
}

export async function bestenliste(spalte) {
  const { data, error } = await sb.from('profile')
    .select('id,name,avatar,farbe,spiele,siege,punkte,richtig,sprint_rekord,rekorde')
    .gt(spalte, 0).order(spalte, { ascending: false }).limit(15);
  if (error) throw new Error(uebersetzen(error));
  return data;
}

// Platz in einer Bestenliste (1 = vorne), null wenn noch nichts da ist
export async function rangVon(spalte, wert) {
  if (!wert) return null;
  const { count, error } = await sb.from('profile').select('id', { count: 'exact', head: true }).gt(spalte, wert);
  if (error) return null;
  return (count ?? 0) + 1;
}

export async function spielerAnzahl() {
  const { count } = await sb.from('profile').select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export async function spieleVon(name) {
  const { data, error } = await sb.from('spiele').select('*').contains('spieler', [{ name }])
    .order('am', { ascending: false }).limit(60);
  if (error) throw new Error(uebersetzen(error));
  return data;
}

export async function sprintBestenliste(kategorie) {
  const { data, error } = await sb.rpc('sprint_bestenliste', { p_kategorie: kategorie });
  if (error) throw new Error(uebersetzen(error));
  return data || [];
}

export async function letzteSpiele() {
  const { data, error } = await sb.from('spiele').select('*').order('am', { ascending: false }).limit(5);
  if (error) throw new Error(uebersetzen(error));
  return data;
}
