import { CONFIG } from './config.js?v=0.10.0';
import { textPruefen } from './filter.js?v=0.10.0';

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

// Das Admin-Konto ist ein eigenes Konto, auf der Seite meldet man sich mit „admin“ an
export const ADMIN_MAIL = 'requiem-admin@quizbude.app';
export const istAdminName = name => String(name || '').trim().toLowerCase() === 'admin';

function mailVon(name) {
  if (istAdminName(name)) return ADMIN_MAIL;
  const lokal = name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\./g, '-').replace(/[^a-z0-9_-]/g, '');
  return `${lokal}@quizbude.app`;
}

export function nameFehler(name, neu = false) {
  if (name.length < 3) return 'Der Name braucht mindestens 3 Zeichen.';
  if (neu && /admin/i.test(name)) return 'Dieser Name ist reserviert. Such dir einen anderen aus.';
  if (textPruefen(name) !== 'ok') return 'Den Namen nehmen wir lieber nicht. Such dir einen anderen aus.';
  if (name.length > 16) return 'Der Name darf höchstens 16 Zeichen haben.';
  if (!/^[A-Za-zÄÖÜäöüß0-9_.-]+$/.test(name)) return 'Im Namen gehen nur Buchstaben, Ziffern, Punkt, Strich und Unterstrich.';
  return '';
}

function uebersetzen(err) {
  const m = (err?.message || String(err)).toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('duplicate')) return 'Den Namen gibt es schon. Nimm einen anderen oder melde dich an.';
  if (m.includes('invalid login')) return 'Name oder Passwort stimmt nicht.';
  if (m.includes('database error saving new user')) return 'Das Konto ließ sich nicht anlegen. Vielleicht sind neue Konten gerade geschlossen.';
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

// Eigener Speicherplatz für die Admin-Sitzung, damit das normale Konto angemeldet bleibt
export function adminClient() {
  return window.supabase.createClient(CONFIG.url, CONFIG.key, {
    auth: { storageKey: 'quizbude.admin', persistSession: true, autoRefreshToken: true },
  });
}

export async function adminAnmelden(passwort, client = adminClient()) {
  let r = await client.auth.signInWithPassword({ email: ADMIN_MAIL, password: pw(passwort) });
  // im Dashboard angelegt ohne Anhängsel? Dann das Passwort so probieren, wie es ist
  if (r.error && passwort.length >= 6) r = await client.auth.signInWithPassword({ email: ADMIN_MAIL, password: passwort });
  if (r.error) throw new Error(uebersetzen(r.error));
  const { data: ok } = await client.rpc('is_admin');
  if (!ok) { await client.auth.signOut(); throw new Error('Das Konto hat keine Admin-Rechte.'); }
  return client;
}

// Einmalig: Admin-Passwort beim ersten Anmelden festlegen (nur solange die Einrichtung offen ist)
export async function adminEinrichten(passwort) {
  const { error } = await sb.rpc('admin_einrichten', { p_pw: passwort });
  if (error) throw new Error(error.message);
}
export const einrichtungOffen = k => !!(k?.admin_einrichtung?.offen && new Date(k.admin_einrichtung.bis) > new Date());

// Einstellungen für alle (Nachricht an alle, neue Konten an oder aus)
export async function konfigLaden() {
  try {
    const { data, error } = await sb.from('config').select('schluessel,wert');
    if (error || !Array.isArray(data)) return {};
    return Object.fromEntries(data.map(z => [z.schluessel, z.wert]));
  } catch { return {}; }
}

// Wer versteckt, gesperrt oder deaktiviert ist, taucht in keiner Liste auf
export const sichtbar = p => !p.versteckt && !p.deaktiviert && !(p.gesperrt_bis && new Date(p.gesperrt_bis) > new Date());

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
    .select('id,name,avatar,farbe,ruhm,stil,spiele,siege,punkte,richtig,sprint_rekord,rekorde,versteckt,deaktiviert,gesperrt_bis')
    .gt(spalte, 0).order(spalte, { ascending: false }).limit(20);
  if (error) throw new Error(uebersetzen(error));
  return data.filter(sichtbar).slice(0, 15);
}

// Platz in einer Bestenliste (1 = vorne), null wenn noch nichts da ist
export async function rangVon(spalte, wert) {
  if (!wert) return null;
  const { count, error } = await sb.from('profile').select('id', { count: 'exact', head: true }).gt(spalte, wert);
  if (error) return null;
  return (count ?? 0) + 1;
}

// Für die Monatswertung: alle Spiele seit einem Zeitpunkt und alle Profile (Name -> id, Farbe)
export async function spieleSeit(seit) {
  const { data, error } = await sb.from('spiele').select('am,spieler,kategorie,auswahl')
    .gte('am', seit.toISOString()).order('am', { ascending: false }).limit(1000);
  if (error) throw new Error(uebersetzen(error));
  return data || [];
}

export async function alleProfile() {
  const { data, error } = await sb.from('profile').select('id,name,avatar,farbe,ruhm,stil,versteckt,deaktiviert,gesperrt_bis').limit(1000);
  if (error) throw new Error(uebersetzen(error));
  return (data || []).filter(sichtbar);
}

export async function spielerAnzahl() {
  const { count } = await sb.from('profile').select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export async function spieleVon(name) {
  // jsonb-Spalte: Filter als JSON-Text schicken (contains() würde ein Array als Postgres-Array senden)
  const { data, error } = await sb.from('spiele').select('*').filter('spieler', 'cs', JSON.stringify([{ name }]))
    .order('am', { ascending: false }).limit(60);
  if (error) throw new Error(uebersetzen(error));
  return data;
}

export async function sprintBestenliste(kategorie, seit = null) {
  const { data, error } = await sb.rpc('sprint_bestenliste', { p_kategorie: kategorie, p_seit: seit });
  if (error) throw new Error(uebersetzen(error));
  return data || [];
}

export async function letzteSpiele() {
  const { data, error } = await sb.from('spiele').select('*').order('am', { ascending: false }).limit(5);
  if (error) throw new Error(uebersetzen(error));
  return data;
}

// ---------- Saison-Medaillen ----------
export async function abzeichenVon(userId) {
  const { data, error } = await sb.from('abzeichen').select('saison,wertung,platz,wert,vergeben').eq('user_id', userId).order('saison', { ascending: false }).order('platz');
  if (error) throw new Error(uebersetzen(error));
  return data || [];
}
// Schließt eine beendete Saison ab (passiert nur einmal, egal wer es auslöst). Rückgabe: Anzahl neuer Medaillen
export async function saisonAbschliessen(saison) {
  const { data, error } = await sb.rpc('saison_abschliessen', { p_saison: saison });
  if (error) throw new Error(error.message);
  return data || 0;
}
