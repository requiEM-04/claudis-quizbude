// Profilbilder: gezeichnete Köpfe aus einem freien Zeichen-Set (Notionists von Zoish, CC0), zusammengesetzt mit DiceBear (MIT).
// Ohne eigene Wahl entsteht der Kopf aus dem Namen. Eigene Wahl steht kurz in profile.stil.kopf, z. B. "s=k3x9a;h=12;g=0;k=h":
//   s Startwert (Augen, Mund, Nase, Brauen und alles, was nicht festgelegt ist), h Frisur, g Brille (0 = keine), b Bart (0 = keiner), o Oberteil, k=h heller Grund

import { createAvatar, notionists } from '../vendor/koepfe.js?v=0.19.3';

const liste = feld => notionists.schema.properties[feld].items.enum.slice().sort();
export const KOPF_TEILE = [
  { id: 'h', name: 'Frisur', feld: 'hair', werte: liste('hair') },
  { id: 'g', name: 'Brille', feld: 'glasses', werte: liste('glasses'), ohne: 'keine' },
  { id: 'b', name: 'Bart', feld: 'beard', werte: liste('beard'), ohne: 'keiner' },
  { id: 'o', name: 'Oberteil', feld: 'body', werte: liste('body') },
];
export const HELL = '#E9E4DA';

// Startwert aus dem Namen (FNV-1a), damit jeder ohne Zutun einen festen Kopf hat
export function startwert(name) {
  let h = 0x811c9dc5;
  for (const c of String(name || '').toLowerCase()) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'n' + h.toString(36);
}
export const zufallsStart = () => 'w' + Math.random().toString(36).slice(2, 10);

export function kopfLesen(code, name) {
  const t = { s: startwert(name) };
  for (const teil of String(code || '').split(';')) {
    const [k, v] = teil.split('=');
    if (k === 's' && /^[a-z0-9]{1,24}$/.test(v || '')) t.s = v;
    else if (KOPF_TEILE.some(x => x.id === k) && /^\d{1,2}$/.test(v || '')) t[k] = Number(v);
    else if (k === 'k' && v === 'h') t.k = 'h';
  }
  return t;
}
export const kopfSchreiben = t => ['s=' + t.s, ...KOPF_TEILE.filter(x => t[x.id] != null).map(x => `${x.id}=${t[x.id]}`), t.k === 'h' ? 'k=h' : ''].filter(Boolean).join(';');

function optionen(t, { farbe = '#CDB68C', geste = '', ohneGrund = false } = {}) {
  const o = { seed: t.s, scale: 116, translateY: 5, gestureProbability: 0, bodyIconProbability: 0 };
  for (const x of KOPF_TEILE) {
    const n = t[x.id];
    if (n == null) continue;
    if (x.ohne) {
      if (n === 0) o[`${x.feld}Probability`] = 0;
      else { o[x.feld] = [x.werte[(n - 1) % x.werte.length]]; o[`${x.feld}Probability`] = 100; }
    } else o[x.feld] = [x.werte[n % x.werte.length]];
  }
  if (geste) { o.gesture = [geste]; o.gestureProbability = 100; }
  o.backgroundColor = [ohneGrund ? 'transparent' : (t.k === 'h' ? HELL : farbe).replace('#', '')];
  return o;
}

// Bild-Adresse, einmal je Kopf erzeugt
const CACHE = new Map();
export function kopfBild(t, opt = {}) {
  const schluessel = `${kopfSchreiben(t)}|${opt.farbe}|${opt.geste || ''}|${opt.ohneGrund ? 1 : 0}`;
  let url = CACHE.get(schluessel);
  if (!url) {
    url = createAvatar(notionists, optionen(t, opt)).toDataUri();
    if (CACHE.size > 600) CACHE.clear();
    CACHE.set(schluessel, url);
  }
  return url;
}

// Welche Teile hat ein Kopf gerade (auch die, die nur aus dem Startwert kommen)? Für den Editor
export function kopfWerte(t) {
  const extra = createAvatar(notionists, optionen(t)).toJson().extra;
  const aus = {};
  for (const x of KOPF_TEILE) {
    const v = extra[x.feld];
    aus[x.id] = x.ohne ? (v ? x.werte.indexOf(v) + 1 : 0) : Math.max(0, x.werte.indexOf(v));
  }
  return aus;
}
