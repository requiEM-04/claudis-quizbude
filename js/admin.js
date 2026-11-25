import { VERSION } from './config.js?v=0.9.7';
import { adminClient, adminAnmelden } from './server.js?v=0.9.7';
import { ruhmInfo, wappen, stilVon } from './ruhm.js?v=0.9.7';

// Admin-Bereich: eigenes Konto, eigene Sitzung (quizbude.admin), alles läuft über admin_*-Funktionen mit Protokoll
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zahl = n => Number(n || 0).toLocaleString('de-DE');
const sb = adminClient();

let spieler = [];
let filter = 'alle';
let offenId = null;
let lobby = null;

const KAT = { flaggen: 'Flaggen', karte: 'Weltkarte', umrisse: 'Umrisse', hauptstaedte: 'Hauptstädte', stadtland: 'Hauptstadt → Land', groesser: 'Größer oder kleiner', wissen: 'Allgemeinwissen', gemischt: 'Gemischt', emoji: 'Emoji' };
const AKTION = {
  umbenennen: 'umbenannt', passwort: 'Passwort gesetzt', sperren: 'gesperrt', entsperren: 'entsperrt',
  aus_bestenliste: 'aus der Bestenliste genommen', in_bestenliste: 'wieder in die Bestenliste', deaktivieren: 'deaktiviert',
  aktivieren: 'wieder aktiviert', ruhm: 'Ruhm geändert', einstellung: 'Einstellung geändert',
};

// ---------- Kleinkram ----------
let toastUhr = null;
function toast(text, fehler = false) {
  const t = $('toast');
  t.textContent = text; t.hidden = false; t.classList.toggle('fehler', fehler);
  clearTimeout(toastUhr); toastUhr = setTimeout(() => { t.hidden = true; }, 3200);
}

async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args);
  if (error) throw new Error(error.message.replace(/^.*?:\s*/, '') || error.message);
  return data;
}

function vor(d) {
  if (!d) return 'nie';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'gerade eben';
  if (s < 3600) return `vor ${Math.round(s / 60)} Min.`;
  if (s < 86400) return `vor ${Math.round(s / 3600)} Std.`;
  const t = Math.round(s / 86400);
  return t === 1 ? 'gestern' : `vor ${t} Tagen`;
}
const datum = d => d ? new Date(d).toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
const gesperrt = p => p.gesperrt_bis && new Date(p.gesperrt_bis) > new Date();
const dauerhaft = p => p.gesperrt_bis && new Date(p.gesperrt_bis).getFullYear() > 9000;

function avatar(p, gross = false) {
  const f = /^#[0-9a-fA-F]{6}$/.test(p.farbe || '') ? p.farbe : '#CDB68C';
  return `<span class="avatar${gross ? ' gross' : ''}" style="background:${f}">${esc(p.avatar || '🙂')}</span>`;
}

function marken(p) {
  const m = [];
  if (p.deaktiviert) m.push('<span class="ad-marke-chip rot">deaktiviert</span>');
  if (gesperrt(p)) m.push(`<span class="ad-marke-chip rot">gesperrt${dauerhaft(p) ? '' : ' bis ' + new Date(p.gesperrt_bis).toLocaleDateString('de-DE')}</span>`);
  if (p.versteckt) m.push('<span class="ad-marke-chip">nicht in der Bestenliste</span>');
  if (p.ruhm_extra) m.push(`<span class="ad-marke-chip sand">${p.ruhm_extra > 0 ? '+' : ''}${zahl(p.ruhm_extra)} Ruhm geschenkt</span>`);
  return m.join('');
}

// Nachfragen: normal ein Klick, bei schweren Sachen den Namen tippen
function fragen({ titel, text, knopf = 'Ausführen', tippen = null, gefaehrlich = false }) {
  const d = $('ad-frage');
  $('ad-frage-titel').textContent = titel;
  $('ad-frage-text').textContent = text;
  $('ad-frage-ja').textContent = knopf;
  $('ad-frage-ja').classList.toggle('gefahr', gefaehrlich);
  $('ad-frage-tippen').hidden = !tippen;
  $('ad-frage-eingabe').value = '';
  $('ad-frage-ja').disabled = !!tippen;
  $('ad-frage-eingabe').oninput = () => { $('ad-frage-ja').disabled = $('ad-frage-eingabe').value.trim() !== tippen; };
  d.returnValue = '';
  d.showModal();
  if (tippen) $('ad-frage-eingabe').focus();
  return new Promise(ok => d.addEventListener('close', () => ok(d.returnValue === 'ja'), { once: true }));
}

// ---------- Anmelden ----------
async function start() {
  $('ad-version').textContent = `Seite in Version ${VERSION}`;
  const { data } = await sb.auth.getSession();
  if (data.session) {
    const { data: ok } = await sb.rpc('is_admin');
    if (ok) return drin();
    await sb.auth.signOut();
  }
  $('ad-login').hidden = false;
  $('ad-login-form').passwort.focus();
  const { data: k } = await sb.from('config').select('wert').eq('schluessel', 'admin_einrichtung').maybeSingle();
  if (k?.wert?.offen && new Date(k.wert.bis) > new Date()) {
    $('ad-login-fehler').textContent = 'Das Admin-Passwort ist noch nicht festgelegt. Melde dich dafür einmal auf der Startseite mit dem Namen admin an.';
  }
}

$('ad-login-form').onsubmit = async e => {
  e.preventDefault();
  const f = e.target, knopf = f.querySelector('button[type=submit]');
  $('ad-login-fehler').textContent = '';
  knopf.disabled = true;
  try { await adminAnmelden(f.passwort.value, sb); f.passwort.value = ''; drin(); }
  catch (err) { $('ad-login-fehler').textContent = err.message; }
  finally { knopf.disabled = false; }
};

$('ad-abmelden').onclick = async () => { await sb.auth.signOut(); location.href = './'; };

function drin() {
  $('ad-login').hidden = true;
  $('ad-app').hidden = false;
  tab(location.hash.slice(1) || 'uebersicht');
  allesLaden();
}

async function allesLaden() {
  await Promise.all([spielerLaden(), uebersichtLaden(), konfigLaden(), protokollLaden()]);
}

// ---------- Reiter ----------
function tab(t) {
  if (!document.querySelector(`.ad-tab[data-tab="${t}"]`)) t = 'uebersicht';
  document.querySelectorAll('#ad-reiter button').forEach(b => b.classList.toggle('aktiv', b.dataset.tab === t));
  document.querySelectorAll('.ad-tab').forEach(s => { s.hidden = s.dataset.tab !== t; });
  history.replaceState(null, '', '#' + t);
  if (t === 'raeume') raeumeStart();
  if (t === 'protokoll') protokollLaden();
}
$('ad-reiter').onclick = e => { const b = e.target.closest('button'); if (b) tab(b.dataset.tab); };

// ---------- Übersicht ----------
async function uebersichtLaden() {
  try {
    const u = await rpc('admin_uebersicht');
    const kachel = (wert, name, zusatz = '') => `<div class="karte ad-zahl"><b>${zahl(wert)}</b><span>${name}</span>${zusatz ? `<small>${zusatz}</small>` : ''}</div>`;
    $('ad-zahlen').innerHTML = [
      kachel(u.spieler, 'Spieler', `${zahl(u.woche_aktiv)} diese Woche aktiv`),
      kachel(u.heute_aktiv, 'Heute aktiv', 'in den letzten 24 Stunden'),
      kachel(u.spiele_heute, 'Raumspiele heute', `${zahl(u.spiele_gesamt)} insgesamt`),
      kachel(u.sprints_heute, 'Sprints heute', `${zahl(u.sprints_gesamt)} insgesamt`),
      kachel(u.gesperrt + u.deaktiviert, 'Gesperrt oder deaktiviert', `${zahl(u.versteckt)} nicht in der Bestenliste`),
    ].join('');
  } catch (err) { toast(err.message, true); }
}

// ---------- Spieler ----------
async function spielerLaden() {
  try { spieler = await rpc('admin_spieler') || []; }
  catch (err) { toast(err.message, true); spieler = []; }
  kachelnZeichnen();
  $('ad-zuletzt').innerHTML = spieler.slice(0, 6).map(p => `<li><button data-id="${p.id}">${avatar(p)}<span class="ad-li-name">${esc(p.name)}</span><span class="ad-li-zeit">${vor(p.zuletzt)}</span></button></li>`).join('') || '<li class="leer">Noch niemand.</li>';
  if (offenId) detailZeichnen();
}

function kachelnZeichnen() {
  const q = $('ad-suche').value.trim().toLowerCase();
  const liste = spieler.filter(p => (!q || p.name.toLowerCase().includes(q))
    && (filter === 'alle' || (filter === 'gesperrt' && gesperrt(p)) || (filter === 'versteckt' && p.versteckt) || (filter === 'deaktiviert' && p.deaktiviert)));
  $('ad-kacheln').innerHTML = liste.map(p => {
    const info = ruhmInfo(p.ruhm);
    const f = stilVon(p).farbe;
    return `<button class="karte ad-kachel${p.deaktiviert || gesperrt(p) ? ' gedimmt' : ''}" data-id="${p.id}">
      <div class="ad-kachel-kopf">${avatar(p)}<span class="ad-kachel-wappen">${wappen(p.ruhm, { groesse: 26 })}</span></div>
      <b class="ad-kachel-name${f ? ' nf-' + f : ''}">${esc(p.name)}</b>
      <span class="ad-kachel-rang">${esc(info.name)}, ${zahl(p.ruhm)} Ruhm</span>
      <span class="ad-kachel-zeit">zuletzt ${vor(p.zuletzt)}</span>
      <div class="ad-kachel-marken">${marken(p)}</div>
    </button>`;
  }).join('') || '<p class="ad-hinweis">Niemand gefunden.</p>';
}

$('ad-suche').oninput = kachelnZeichnen;
$('ad-filter').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll('#ad-filter button').forEach(x => x.classList.toggle('aktiv', x === b));
  kachelnZeichnen();
};
document.addEventListener('click', e => {
  const b = e.target.closest('#ad-kacheln [data-id], #ad-zuletzt [data-id], #ad-protokoll [data-id]');
  if (b) detailOeffnen(b.dataset.id);
});

// ---------- Detail ----------
function detailOeffnen(id) {
  if (!spieler.some(p => p.id === id)) { toast('Den Spieler gibt es nicht mehr.', true); return; }
  offenId = id;
  detailZeichnen();
  if (!$('ad-detail').open) $('ad-detail').showModal();
}
$('ad-detail').addEventListener('close', () => { offenId = null; });
$('ad-detail').addEventListener('click', e => { if (e.target === $('ad-detail')) $('ad-detail').close(); });

function detailZeichnen() {
  const p = spieler.find(x => x.id === offenId);
  if (!p) { $('ad-detail').close(); return; }
  const info = ruhmInfo(p.ruhm);
  const f = stilVon(p).farbe;
  const rekorde = Object.entries(p.rekorde || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]);
  const wert = (z, n) => `<div><b>${zahl(z)}</b><span>${n}</span></div>`;
  $('ad-detail-innen').innerHTML = `
    <header class="ad-detail-kopf">
      ${avatar(p, true)}
      <div>
        <h2 class="${f ? 'nf-' + f : ''}">${esc(p.name)}</h2>
        <p>${wappen(p.ruhm, { groesse: 20 })} ${esc(info.name)}, ${zahl(p.ruhm)} Ruhm${p.ruhm_extra ? ` (davon ${p.ruhm_extra > 0 ? '+' : ''}${zahl(p.ruhm_extra)} geschenkt)` : ''}</p>
        <p class="ad-klein">Dabei seit ${datum(p.erstellt)} · zuletzt aktiv ${vor(p.zuletzt)} · zuletzt angemeldet ${vor(p.letzte_anmeldung)}</p>
        <div class="ad-kachel-marken">${marken(p)}</div>
      </div>
      <button class="ad-zu" type="button" data-aktion="zu" aria-label="Schließen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </header>
    <div class="ad-werte">${wert(p.spiele, 'Spiele')}${wert(p.siege, 'Siege')}${wert(p.punkte, 'Punkte')}${wert(p.richtig, 'Richtig')}${wert(p.sprints, 'Sprints')}${wert(p.sprint_treffer, 'Treffer')}</div>
    ${rekorde.length ? `<div class="ad-rekorde">${rekorde.map(([k, v]) => `<span>${esc(KAT[k] || k)} <b>${zahl(v)}</b></span>`).join('')}</div>` : ''}

    <div class="ad-aktionen">
      <section>
        <h3>Name ändern</h3>
        <p>Der neue Name ist auch der Anmeldename. Alte Raumspiele laufen auf den neuen Namen über.</p>
        <div class="ad-reihe"><input id="ad-neuer-name" maxlength="16" value="${esc(p.name)}" autocomplete="off"><button class="knopf zweit" data-aktion="umbenennen">Umbenennen</button></div>
      </section>
      <section>
        <h3>Neues Passwort</h3>
        <p>Wenn jemand sein Passwort vergessen hat. Mindestens 4 Zeichen, sag es der Person danach.</p>
        <div class="ad-reihe"><input id="ad-neues-pw" type="text" autocomplete="off" placeholder="neues Passwort"><button class="knopf zweit" data-aktion="passwort">Setzen</button></div>
      </section>
      <section>
        <h3>Ruhm schenken oder abziehen</h3>
        <p>Zählt zum Ruhm dazu. Fällt jemand unter eine Stufe, wird nicht mehr Freigeschaltetes abgelegt.</p>
        <div class="ad-reihe"><input id="ad-ruhm" type="number" step="50" value="100"><button class="knopf zweit" data-aktion="ruhm">Anwenden</button></div>
      </section>
      <section>
        <h3>Sperre</h3>
        ${gesperrt(p)
          ? `<p>Gesperrt ${dauerhaft(p) ? 'ohne Enddatum' : 'bis ' + datum(p.gesperrt_bis)}${p.sperr_grund ? `. Grund: ${esc(p.sperr_grund)}` : ''}.</p>
             <button class="knopf zweit" data-aktion="entsperren">Entsperren</button>`
          : `<p>Gesperrte kommen nicht mehr rein und tauchen in keiner Bestenliste auf. Den Grund sehen sie beim Anmelden.</p>
             <div class="ad-reihe">
               <select id="ad-sperr-dauer"><option value="1">1 Stunde</option><option value="24" selected>1 Tag</option><option value="168">7 Tage</option><option value="720">30 Tage</option><option value="0">Ohne Enddatum</option></select>
               <input id="ad-sperr-grund" maxlength="200" placeholder="Grund (optional)" autocomplete="off">
               <button class="knopf zweit gefahr" data-aktion="sperren">Sperren</button>
             </div>`}
      </section>
      <section>
        <h3>Bestenliste</h3>
        <p>${p.versteckt ? 'Taucht gerade in keiner Bestenliste auf.' : 'Taucht in allen Bestenlisten auf.'}</p>
        <button class="knopf zweit" data-aktion="${p.versteckt ? 'einblenden' : 'ausblenden'}">${p.versteckt ? 'Wieder anzeigen' : 'Aus der Bestenliste nehmen'}</button>
      </section>
      <section>
        <h3>Konto</h3>
        <p>${p.deaktiviert ? 'Das Konto ist deaktiviert. Alles ist noch da und lässt sich wieder einschalten.' : 'Deaktivieren statt löschen: Die Person kommt nicht mehr rein, ihre Daten bleiben.'}</p>
        <button class="knopf zweit ${p.deaktiviert ? '' : 'gefahr'}" data-aktion="${p.deaktiviert ? 'aktivieren' : 'deaktivieren'}">${p.deaktiviert ? 'Wieder aktivieren' : 'Deaktivieren'}</button>
      </section>
    </div>`;
}

$('ad-detail-innen').addEventListener('click', async e => {
  const b = e.target.closest('[data-aktion]'); if (!b) return;
  const p = spieler.find(x => x.id === offenId); if (!p) return;
  const a = b.dataset.aktion;
  if (a === 'zu') { $('ad-detail').close(); return; }
  try {
    let ok = false, meldung = '';
    if (a === 'umbenennen') {
      const n = $('ad-neuer-name').value.trim();
      if (n === p.name) return;
      ok = await fragen({ titel: 'Umbenennen?', text: `${p.name} heißt danach ${n} und meldet sich auch mit ${n} an.`, knopf: 'Umbenennen' });
      if (ok) { await rpc('admin_umbenennen', { p_id: p.id, p_name: n }); meldung = `Heißt jetzt ${n}.`; }
    } else if (a === 'passwort') {
      const pw = $('ad-neues-pw').value;
      if (pw.length < 4) { toast('Das Passwort braucht mindestens 4 Zeichen.', true); return; }
      ok = await fragen({ titel: 'Neues Passwort setzen?', text: `${p.name} kommt danach nur noch mit dem neuen Passwort rein.`, knopf: 'Passwort setzen', tippen: p.name });
      if (ok) { await rpc('admin_passwort', { p_id: p.id, p_pw: pw }); meldung = 'Passwort gesetzt.'; }
    } else if (a === 'ruhm') {
      const m = Math.round(Number($('ad-ruhm').value));
      if (!m) { toast('Gib eine Zahl ein, die nicht 0 ist.', true); return; }
      ok = await fragen({ titel: m > 0 ? 'Ruhm schenken?' : 'Ruhm abziehen?', text: `${p.name} ${m > 0 ? 'bekommt' : 'verliert'} ${zahl(Math.abs(m))} Ruhm.`, knopf: m > 0 ? 'Schenken' : 'Abziehen' });
      if (ok) { const r = await rpc('admin_ruhm', { p_id: p.id, p_menge: m }); meldung = `${p.name} hat jetzt ${zahl(r)} Ruhm.`; }
    } else if (a === 'sperren') {
      const h = Number($('ad-sperr-dauer').value), grund = $('ad-sperr-grund').value.trim();
      const dauer = $('ad-sperr-dauer').selectedOptions[0].textContent;
      ok = await fragen({ titel: 'Sperren?', text: `${p.name} wird ${h ? 'für ' + dauer : 'ohne Enddatum'} gesperrt${grund ? ', Grund: ' + grund : ''}.`, knopf: 'Sperren', gefaehrlich: true });
      if (ok) { await rpc('admin_sperren', { p_id: p.id, p_stunden: h, p_grund: grund }); meldung = 'Gesperrt.'; }
    } else if (a === 'entsperren') {
      ok = await fragen({ titel: 'Entsperren?', text: `${p.name} kommt danach wieder rein.`, knopf: 'Entsperren' });
      if (ok) { await rpc('admin_entsperren', { p_id: p.id }); meldung = 'Entsperrt.'; }
    } else if (a === 'ausblenden' || a === 'einblenden') {
      const an = a === 'ausblenden';
      ok = await fragen({ titel: an ? 'Aus der Bestenliste nehmen?' : 'Wieder anzeigen?', text: an ? `${p.name} spielt normal weiter, taucht aber in keiner Bestenliste mehr auf.` : `${p.name} taucht wieder in den Bestenlisten auf.`, knopf: an ? 'Rausnehmen' : 'Anzeigen' });
      if (ok) { await rpc('admin_verstecken', { p_id: p.id, p_an: an }); meldung = an ? 'Nicht mehr in der Bestenliste.' : 'Wieder in der Bestenliste.'; }
    } else if (a === 'deaktivieren' || a === 'aktivieren') {
      const an = a === 'deaktivieren';
      ok = await fragen(an
        ? { titel: 'Konto deaktivieren?', text: `${p.name} kommt nicht mehr rein und verschwindet aus allen Listen. Die Daten bleiben, du kannst es jederzeit wieder einschalten.`, knopf: 'Deaktivieren', tippen: p.name, gefaehrlich: true }
        : { titel: 'Wieder aktivieren?', text: `${p.name} kommt wieder rein.`, knopf: 'Aktivieren' });
      if (ok) { await rpc('admin_deaktivieren', { p_id: p.id, p_an: an }); meldung = an ? 'Deaktiviert.' : 'Wieder aktiv.'; }
    }
    if (ok) { toast(meldung); await Promise.all([spielerLaden(), uebersichtLaden(), protokollLaden()]); }
  } catch (err) { toast(err.message, true); }
});

// ---------- Räume (live aus der Lobby) ----------
function raeumeStart() {
  if (lobby) return;
  lobby = sb.channel('qb-lobby', { config: { presence: { key: 'admin-' + crypto.randomUUID() } } });
  const zeichnen = () => {
    const alle = Object.values(lobby.presenceState()).flat().filter(m => m.code);
    const je = new Map(); for (const r of alle) if (!je.has(r.code) || je.get(r.code).ts < r.ts) je.set(r.code, r);
    const liste = [...je.values()].sort((a, b) => b.ts - a.ts);
    $('ad-raeume').innerHTML = liste.map(r => `<div class="karte ad-raum">
      <b class="ad-raum-code">${esc(r.code)}</b>
      <div><b>${esc(r.kategorie || '')}</b>${r.auswahl ? ` <span>${esc(r.auswahl)}</span>` : ''}<p>Gastgeber ${esc(r.host)} · ${r.spieler} ${r.spieler === 1 ? 'Person' : 'Leute'} · ${r.phase === 'warten' || !r.phase ? 'wartet' : 'läuft'}</p></div>
      <a class="knopf zweit klein" href="./#/raum/${encodeURIComponent(r.code)}" target="_blank" rel="noopener">Ansehen</a>
    </div>`).join('') || '<p class="ad-hinweis">Gerade ist kein Raum offen.</p>';
  };
  lobby.on('presence', { event: 'sync' }, zeichnen);
  lobby.subscribe();
  $('ad-raeume').innerHTML = '<p class="ad-hinweis">Verbinde …</p>';
}

// ---------- Nachricht und Server ----------
async function konfigLaden() {
  const { data } = await sb.from('config').select('schluessel,wert');
  const k = Object.fromEntries((data || []).map(z => [z.schluessel, z.wert]));
  $('ad-nachricht-text').value = k.nachricht?.text || '';
  $('ad-nachricht-an').checked = !!k.nachricht?.an;
  $('ad-neue-konten').checked = k.neue_konten?.an !== false;
  vorschau();
}
function vorschau() {
  const t = $('ad-nachricht-text').value;
  $('ad-nachricht-vorschau').textContent = t || 'Hier steht dann deine Nachricht.';
  $('ad-nachricht-zeichen').textContent = `${t.length} / 200`;
}
$('ad-nachricht-text').oninput = vorschau;
$('ad-nachricht-speichern').onclick = async () => {
  const text = $('ad-nachricht-text').value.trim(), an = $('ad-nachricht-an').checked;
  if (an && !text) { toast('Ohne Text gibt es nichts anzuzeigen.', true); return; }
  try { await rpc('admin_config', { p_schluessel: 'nachricht', p_wert: { text, an } }); toast(an ? 'Gespeichert, alle sehen sie gleich.' : 'Gespeichert, gerade ausgeblendet.'); protokollLaden(); }
  catch (err) { toast(err.message, true); }
};
$('ad-neue-konten').onchange = async e => {
  const an = e.target.checked;
  try { await rpc('admin_config', { p_schluessel: 'neue_konten', p_wert: { an } }); toast(an ? 'Neue Konten sind wieder möglich.' : 'Neue Konten sind jetzt geschlossen.'); protokollLaden(); }
  catch (err) { e.target.checked = !an; toast(err.message, true); }
};

// ---------- Protokoll ----------
function logZeile(l) {
  let was = AKTION[l.aktion] || l.aktion;
  const d = l.details || {};
  if (l.aktion === 'umbenennen') was = `umbenannt: ${esc(d.alt)} → ${esc(d.neu)}`;
  if (l.aktion === 'ruhm') was = `${d.menge > 0 ? '+' : ''}${zahl(d.menge)} Ruhm, jetzt ${zahl(d.neu)}`;
  if (l.aktion === 'sperren') was = `gesperrt ${new Date(d.bis).getFullYear() > 9000 ? 'ohne Enddatum' : 'bis ' + datum(d.bis)}${d.grund ? ` (${esc(d.grund)})` : ''}`;
  if (l.aktion === 'einstellung') was = d.schluessel === 'nachricht' ? (d.wert?.an ? `Nachricht an alle: „${esc(d.wert.text)}“` : 'Nachricht an alle ausgeblendet') : `Neue Konten ${d.wert?.an ? 'erlaubt' : 'geschlossen'}`;
  const wer = l.ziel ? `<button data-id="${l.ziel}" class="ad-log-name">${esc(l.ziel_name || 'gelöscht')}</button>` : '';
  return `<li><span class="ad-li-zeit">${datum(l.am)}</span><span>${wer}${wer ? ' ' : ''}${was}</span></li>`;
}
async function protokollLaden() {
  try {
    const log = await rpc('admin_protokoll', { p_anzahl: 200 }) || [];
    $('ad-protokoll').innerHTML = log.map(logZeile).join('') || '<li class="leer">Noch nichts passiert.</li>';
    $('ad-zuletzt-log').innerHTML = log.slice(0, 6).map(logZeile).join('') || '<li class="leer">Noch nichts passiert.</li>';
  } catch (err) { toast(err.message, true); }
}

// frisch halten, solange die Seite offen ist
setInterval(() => { if (!document.hidden && !$('ad-app').hidden && !$('ad-detail').open) { spielerLaden(); uebersichtLaden(); } }, 30000);

start();
