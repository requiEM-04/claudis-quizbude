// Nachbau des Supabase-Clients für lokale Tests (Konten, Tabellen, RPCs, Realtime über BroadcastChannel)
(function () {
  const L = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  const warte = (ms = 15) => new Promise(r => setTimeout(r, ms));

  function query(table) {
    const q = { table, filters: [], orderCol: null, lim: null, updateVals: null, single: false };
    const api = {
      select() { return api; },
      eq(c, v) { q.filters.push(r => r[c] === v); return api; },
      gt(c, v) { q.filters.push(r => (r[c] || 0) > v); return api; },
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
          rows = rows.filter(r => q.filters.every(f => f(r)));
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
        L.set('fake.profile', [...L.get('fake.profile', []), { id, name: m.name, avatar: m.avatar, farbe: m.farbe, spiele: 0, siege: 0, punkte: 0, richtig: 0, sprints: 0, sprint_rekord: 0 }]);
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
        if (name === 'sprint_eintragen') { let rek; profilAendern(r => { r.sprint_rekord = Math.max(r.sprint_rekord, a.p_wert); rek = r.sprint_rekord; return r; }); return { data: rek, error: null }; }
        if (name === 'spiel_loggen') L.set('fake.spiele', [{ ...a.p, am: new Date().toISOString() }, ...L.get('fake.spiele', [])]);
        return { data: null, error: null };
      },
    };
  }
  window.supabase = { createClient };
})();
