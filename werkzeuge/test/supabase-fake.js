// Nachbau des Supabase-Clients für lokale Tests (Konten, Tabellen, RPCs, Realtime über BroadcastChannel)
(function () {
  const L = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  const warte = (ms = 15) => new Promise(r => setTimeout(r, ms));
  // Ruhm wie auf dem Server: aus der Statistik berechnet
  const ruhmAus = p => (p.spiele || 0) * 10 + (p.richtig || 0) * 3 + (p.siege || 0) * 20 + (p.sprints || 0) * 4 + (p.sprint_treffer || 0)
    + Math.max(p.sprint_rekord || 0, p.rekorde?.flaggen || 0)
    + Object.entries(p.rekorde || {}).filter(([k]) => k !== 'flaggen').reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const mitRuhm = r => ({ ...r, ruhm: ruhmAus(r) + (r.ruhm_extra || 0), stil: r.stil || {} });

  function query(table) {
    const q = { table, filters: [], orderCol: null, lim: null, updateVals: null, single: false, head: false };
    const api = {
      select(_, o) { if (o?.head) q.head = true; return api; },
      contains(c, werte) {
        q.filters.push(r => werte.every(w => (r[c] || []).some(x => Object.entries(w).every(([k, v]) => x[k] === v))));
        return api;
      },
      eq(c, v) { q.filters.push(r => r[c] === v); return api; },
      filter(c, op, v) { if (op === 'cs') return api.contains(c, JSON.parse(v)); return api; },
      gt(c, v) { q.filters.push(r => (r[c] || 0) > v); return api; },
      gte(c, v) { q.filters.push(r => String(r[c] || '') >= String(v)); return api; },
      order(c, o) { q.orderCol = c; q.asc = o?.ascending; return api; },
      limit(n) { q.lim = n; return api; },
      maybeSingle() { q.single = true; return api; },
      update(v) { q.updateVals = v; return api; },
      then(ok, fail) {
        return (async () => {
          await warte();
          let rows = L.get('fake.' + table, []);
          if (q.updateVals) {
            rows = rows.map(r => q.filters.every(f => f(r)) ? { ...r, ...q.updateVals } : r);
            L.set('fake.' + table, rows);
            return { data: null, error: null };
          }
          if (table === 'profile') rows = rows.map(mitRuhm);
          rows = rows.filter(r => q.filters.every(f => f(r)));
          if (q.head) return { data: null, count: rows.length, error: null };
          if (q.orderCol) rows.sort((a, b) => (q.asc ? 1 : -1) * ((a[q.orderCol] > b[q.orderCol]) - (a[q.orderCol] < b[q.orderCol])));
          if (q.lim) rows = rows.slice(0, q.lim);
          return { data: q.single ? (rows[0] || null) : rows, error: null };
        })().then(ok, fail);
      },
    };
    return api;
  }

  function createClient(url, key, opts) {
    const sk = opts.auth.storageKey;
    const uid = () => L.get(sk, null)?.user?.id;
    const profilAendern = (f) => {
      const rows = L.get('fake.profile', []).map(r => r.id === uid() ? f({ ...r }) : r);
      L.set('fake.profile', rows);
    };
    const auth = {
      async getSession() { return { data: { session: L.get(sk, null) } }; },
      async signUp({ email, password, options }) {
        await warte(60);
        const users = L.get('fake.users', {});
        if (users[email]) return { data: {}, error: { message: 'User already registered' } };
        const id = crypto.randomUUID();
        users[email] = { id, password };
        L.set('fake.users', users);
        const m = options.data;
        const jetzt = new Date().toISOString();
        L.set('fake.profile', [...L.get('fake.profile', []), { id, name: m.name, avatar: m.avatar, farbe: m.farbe, spiele: 0, siege: 0, punkte: 0, richtig: 0, sprints: 0, sprint_rekord: 0, rekorde: {}, erstellt: jetzt, zuletzt: jetzt }]);
        const session = { user: { id } };
        L.set(sk, session);
        return { data: { session, user: session.user }, error: null };
      },
      async signInWithPassword({ email, password }) {
        await warte(60);
        const u = L.get('fake.users', {})[email];
        if (!u || u.password !== password) return { data: {}, error: { message: 'Invalid login credentials' } };
        const session = { user: { id: u.id } };
        L.set(sk, session);
        return { data: { session, user: session.user }, error: null };
      },
      async signOut() { localStorage.removeItem(sk); },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    };

    const kanaele = new Set();
    function channel(topic, copts) {
      const bc = new BroadcastChannel('fake-rt-' + topic);
      const key = copts?.config?.presence?.key || crypto.randomUUID();
      const selbst = !!copts?.config?.broadcast?.self;
      const state = {};
      const binds = [];
      let meins = null;
      const feuern = (typ, filter, arg) => binds.filter(b => b.typ === typ && (b.filter.event === filter || b.filter.event === '*')).forEach(b => b.cb(arg));
      const sync = () => setTimeout(() => feuern('presence', 'sync'), 5);
      bc.onmessage = ({ data }) => {
        if (data.art === 'bc') feuern('broadcast', data.event, { event: data.event, payload: data.payload });
        if (data.art === 'join') { state[data.key] = [data.payload]; sync(); }
        if (data.art === 'leave') { delete state[data.key]; sync(); }
        if (data.art === 'hallo' && meins) bc.postMessage({ art: 'join', key, payload: meins });
      };
      const ch = {
        on(typ, filter, cb) { binds.push({ typ, filter, cb }); return ch; },
        subscribe(cb) {
          setTimeout(() => { bc.postMessage({ art: 'hallo' }); cb && cb('SUBSCRIBED'); }, 30);
          return ch;
        },
        async track(p) { meins = p; state[key] = [p]; bc.postMessage({ art: 'join', key, payload: p }); sync(); return 'ok'; },
        async untrack() { meins = null; delete state[key]; bc.postMessage({ art: 'leave', key }); sync(); return 'ok'; },
        presenceState() { return JSON.parse(JSON.stringify(state)); },
        async send({ event, payload }) {
          bc.postMessage({ art: 'bc', event, payload });
          if (selbst) setTimeout(() => feuern('broadcast', event, { event, payload: JSON.parse(JSON.stringify(payload)) }), 3);
          return 'ok';
        },
        _weg() { if (meins) bc.postMessage({ art: 'leave', key }); bc.close(); },
      };
      kanaele.add(ch);
      return ch;
    }
    window.addEventListener('pagehide', () => kanaele.forEach(c => c._weg()));

    return {
      auth,
      from: query,
      channel,
      removeChannel(ch) { ch._weg(); kanaele.delete(ch); return Promise.resolve('ok'); },
      async rpc(name, a) {
        await warte();
        if (!uid()) return { data: null, error: { message: 'Nicht angemeldet' } };
        if (name === 'spiel_eintragen') profilAendern(r => ({ ...r, spiele: r.spiele + 1, siege: r.siege + (a.p_sieg ? 1 : 0), punkte: r.punkte + a.p_punkte, richtig: r.richtig + a.p_richtig }));
        if (name === 'sprint_eintragen') {
          const k = a.p_kategorie || 'flaggen'; let rek;
          L.set('fake.laeufe', [...L.get('fake.laeufe', []), { von: uid(), k, w: a.p_wert, am: new Date().toISOString() }]);
          profilAendern(r => { r.sprints++; r.sprint_treffer = (r.sprint_treffer || 0) + a.p_wert; if (k === 'flaggen') r.sprint_rekord = Math.max(r.sprint_rekord, a.p_wert); r.rekorde = { ...(r.rekorde || {}), [k]: Math.max(r.rekorde?.[k] || 0, a.p_wert) }; rek = r.rekorde[k]; return r; });
          return { data: rek, error: null };
        }
        if (name === 'sprint_bestenliste') {
          const k = a.p_kategorie;
          // Saison: aus den gespeicherten Läufen, sonst Rekorde
          const laeufe = L.get('fake.laeufe', []).filter(x => x.k === k && (!a.p_seit || x.am >= a.p_seit));
          const best = new Map(); for (const x of laeufe) best.set(x.von, Math.max(best.get(x.von) || 0, x.w));
          const rows = a.p_seit
            ? L.get('fake.profile', []).map(mitRuhm).filter(r => best.get(r.id) > 0).map(r => ({ id: r.id, name: r.name, avatar: r.avatar, farbe: r.farbe, ruhm: r.ruhm, stil: r.stil, wert: best.get(r.id) })).sort((x, y) => y.wert - x.wert).slice(0, 15)
            : L.get('fake.profile', []).map(mitRuhm).filter(r => (r.rekorde?.[k] || 0) > 0).map(r => ({ id: r.id, name: r.name, avatar: r.avatar, farbe: r.farbe, ruhm: r.ruhm, stil: r.stil, wert: r.rekorde[k] })).sort((x, y) => y.wert - x.wert).slice(0, 15);
          return { data: rows, error: null };
        }
        // Admin: wer in fake.admins steht, darf alles
        const admin = L.get('fake.admins', []).includes(uid());
        if (name === 'is_admin') return { data: admin, error: null };
        if (name.startsWith('admin_')) {
          if (!admin) return { data: null, error: { message: 'Kein Admin' } };
          const log = (aktion, ziel, details = null) => L.set('fake.admin_log', [{ id: Date.now(), am: new Date().toISOString(), aktion, ziel, ziel_name: L.get('fake.profile', []).find(r => r.id === ziel)?.name, details }, ...L.get('fake.admin_log', [])]);
          const setze = (id, f) => L.set('fake.profile', L.get('fake.profile', []).map(r => r.id === id ? f({ ...r }) : r));
          const alle = L.get('fake.profile', []).map(mitRuhm);
          switch (name) {
            case 'admin_uebersicht': return { data: { spieler: alle.length, heute_aktiv: alle.length, woche_aktiv: alle.length, spiele_heute: L.get('fake.spiele', []).length, spiele_gesamt: L.get('fake.spiele', []).length, sprints_heute: L.get('fake.laeufe', []).length, sprints_gesamt: L.get('fake.laeufe', []).length, gesperrt: alle.filter(r => r.gesperrt_bis > new Date().toISOString()).length, versteckt: alle.filter(r => r.versteckt).length, deaktiviert: alle.filter(r => r.deaktiviert).length }, error: null };
            case 'admin_spieler': return { data: alle.map(r => ({ ruhm_extra: 0, versteckt: false, deaktiviert: false, gesperrt_bis: null, sprint_treffer: 0, letzte_anmeldung: r.zuletzt, ...r })), error: null };
            case 'admin_umbenennen': log('umbenennen', a.p_id, { alt: alle.find(r => r.id === a.p_id)?.name, neu: a.p_name }); setze(a.p_id, r => ({ ...r, name: a.p_name })); return { data: null, error: null };
            case 'admin_passwort': log('passwort', a.p_id); return { data: null, error: null };
            case 'admin_sperren': { const bis = a.p_stunden > 0 ? new Date(Date.now() + a.p_stunden * 3600e3).toISOString() : '9999-12-31T00:00:00Z'; setze(a.p_id, r => ({ ...r, gesperrt_bis: bis, sperr_grund: a.p_grund || null })); log('sperren', a.p_id, { bis, grund: a.p_grund }); return { data: null, error: null }; }
            case 'admin_entsperren': setze(a.p_id, r => ({ ...r, gesperrt_bis: null, sperr_grund: null })); log('entsperren', a.p_id); return { data: null, error: null };
            case 'admin_verstecken': setze(a.p_id, r => ({ ...r, versteckt: a.p_an })); log(a.p_an ? 'aus_bestenliste' : 'in_bestenliste', a.p_id); return { data: null, error: null };
            case 'admin_deaktivieren': setze(a.p_id, r => ({ ...r, deaktiviert: a.p_an })); log(a.p_an ? 'deaktivieren' : 'aktivieren', a.p_id); return { data: null, error: null };
            case 'admin_ruhm': { setze(a.p_id, r => ({ ...r, ruhm_extra: (r.ruhm_extra || 0) + a.p_menge })); const neu = L.get('fake.profile', []).map(mitRuhm).find(r => r.id === a.p_id).ruhm; log('ruhm', a.p_id, { menge: a.p_menge, neu }); return { data: neu, error: null }; }
            case 'admin_config': { const k = L.get('fake.config', []).filter(z => z.schluessel !== a.p_schluessel); L.set('fake.config', [...k, { schluessel: a.p_schluessel, wert: a.p_wert }]); log('einstellung', null, { schluessel: a.p_schluessel, wert: a.p_wert }); return { data: null, error: null }; }
            case 'admin_protokoll': return { data: L.get('fake.admin_log', []), error: null };
          }
          return { data: null, error: null };
        }
        if (name === 'spiel_loggen') L.set('fake.spiele', [{ ...a.p, am: new Date().toISOString() }, ...L.get('fake.spiele', [])]);
        return { data: null, error: null };
      },
    };
  }
  window.supabase = { createClient };
})();
