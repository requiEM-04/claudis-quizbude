// Wortfilter für Chat und Namen.
// HASS ist immer gesperrt (Herabwürdigung von Gruppen), GROB nur im eingeschränkten Chat.
// Erkennt auch Tricks wie Leerzeichen dazwischen, Zahlen statt Buchstaben oder gedehnte Buchstaben,
// ohne normale Wörter wie „negativ" oder das Land „Niger" zu treffen.

function grundform(text) {
  return String(text).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's').replace(/7/g, 't');
}
// alles ohne Leer- und Sonderzeichen: findet „n i g g …" und „f.i.c.k"
const kompakt = t => grundform(t).replace(/[^a-z]/g, '');
// einzelne Wörter mit zusammengezogenen Doppelbuchstaben: „niiiga" → „niga";
// einzeln getippte Buchstaben („n e g a") werden wieder zu einem Wort zusammengesetzt
function woerter(t) {
  const roh = grundform(t).split(/[^a-z]+/).filter(Boolean);
  const zusammen = [];
  let lauf = '';
  for (const w of roh) {
    if (w.length === 1) { lauf += w; continue; }
    if (lauf) { zusammen.push(lauf); lauf = ''; }
    zusammen.push(w);
  }
  if (lauf) zusammen.push(lauf);
  return zusammen.map(w => w.replace(/(.)\1+/g, '$1'));
}

const HASS_IM_TEXT = [
  /n+i+g{2,}/, /n+e+g{2,}e*r/, /neger/, /kanac?ke/, /schwuchtel/, /judensau/, /untermensch/, /siegheil/, /heilhitler/,
  /faggot/, /tranny/, /zigeuner/,
];
const HASS_WOERTER = new Set(['niga', 'nega', 'neger', 'nigr', 'nigs', 'kike', 'chink', 'retard', 'fag']);

const GROB_IM_TEXT = [
  /hurensohn/, /fotze/, /wi(ch|x+)s?er/, /arschloch/, /missgeburt/, /motherfuck/, /fick/, /fuck/, /schlampe/,
  /nutte/, /bitch/, /cunt/, /spast/, /hure/, /wanker/, /asshole/,
];
const GROB_WOERTER = new Set(['mongo', 'bastard', 'spasti', 'arsch', 'shit']);

function trifft(text, imText, einzelne) {
  const k = kompakt(text);
  if (imText.some(r => r.test(k))) return true;
  return woerter(text).some(w => einzelne.has(w));
}

// 'ok' | 'hass' | 'grob'
export function textPruefen(text) {
  if (trifft(text, HASS_IM_TEXT, HASS_WOERTER)) return 'hass';
  if (trifft(text, GROB_IM_TEXT, GROB_WOERTER)) return 'grob';
  return 'ok';
}

// Darf die Nachricht in einen Chat mit dieser Einstellung?
export function chatErlaubt(text, modus) {
  const r = textPruefen(text);
  if (r === 'hass') return false;
  if (r === 'grob') return modus === 'offen';
  return true;
}
