import { VERSION } from './config.js?v=0.19.1';
import {
  online, nameFehler, registrieren, anmelden, abmelden, sitzungHolen, profilLaden, profilSpeichern,
  bestenliste, spieleSeit, alleProfile, sprintEintragen, sprintBestenliste, rangVon, spielerAnzahl, spieleVon, sb,
  adminAnmelden, istAdminName, konfigLaden, adminEinrichten, einrichtungOffen, abzeichenVon, saisonAbschliessen, winterquestStand,
  freundeListe, freundAnfragen, freundAntworten, freundEntfernen,
} from './server.js?v=0.19.1';
import { lobbyStart, lobbyAbo, lobbyStopp } from './lobby.js?v=0.19.1';
import { Raum, codeNeu, STANDARD, TIPPFEHLER_ABZUG } from './raum.js?v=0.19.1';
import { LAND, pruefe, flaggeUrl } from './abgleich.js?v=0.19.1';
import {
  KATEGORIEN, KATEGORIE_REIHE, KATEGORIE_GRUPPEN, SPRINT_REIHE, mehrWert, bombeLaden, bombeBenutzt, bombeGrund, bombeZuletzt, bombeSvg, kategorieVon, optionSchluessel, richtigeWahl, umrisseDa, umrisseLaden,
  sprintFrage, pruefeFrage, fragenVorladen, kanon, ARTEN as GEMISCHT_ARTEN, gemischtArten, alleArten, varianteVon, zahlLesen, schaetzWertung, zahlText,
} from './kategorien.js?v=0.19.1';
import { LAENDER } from './laender.js?v=0.19.1';
import { auswahlfeld } from './auswahlfeld.js?v=0.19.1';
import { KATEGORIE_SYMBOL } from './symbole.js?v=0.19.1';
import { konfetti } from './konfetti.js?v=0.19.1';
import { karteBauen, karteLaden, auswerten } from './weltkarte.js?v=0.19.1';
import { STUFEN, ERFOLGE, erfolgStand, emblem, wertungName, saisonName, saisonKurz, vitrineLesen, SKINS, skinVon, skinVonId, skinStand, skinBedingung } from './abzeichen.js?v=0.19.1';
import {
  RAENGE, BILDER, ARTEN, JOKER, SONDER, sonderVon, sonderFrei, WINTERQUEST, questGeschafft, ruhmInfo, stufeVon, stufeInfo, wappen, effektHtml, rahmenDeko, stilVon, istFrei, freiAb, neuFrei,
  belohnungName, rangVonId, symbol, symbolSvg, SCHWELLEN, flockeSvg, bildVon, BILD_ARTEN } from './ruhm.js?v=0.19.1';
import { freundeStart, freundeStopp, freundeOrt, istOnline, onlineAbo, einladungAbo, anfrageAbo, einladen, anfrageMelden } from './freunde.js?v=0.19.1';
import { FIGUREN, FREIE_FIGUREN, KREISE, RINGE, GESTEN, figurSvg, figurAusEmoji, figurVonId, bildFrei, bildFreiAb, bildEintrag, suchtVon } from './figuren.js?v=0.19.1';
import { KOPF_TEILE, kopfLesen, kopfSchreiben, kopfBild, kopfWerte, zufallsStart, HELL } from './koepfe.js?v=0.19.1';
import { EMOTES, emoteVonId, emoteFrei, emoteHinweis, emoteImg, chatHtml, emoteErgaenzen, emotesAbStufe } from './emotes.js?v=0.19.1';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zufall = a => a[Math.floor(Math.random() * a.length)];

const AVATARE = FREIE_FIGUREN.map(f => f.emoji);
const FARBEN = ['#CDB68C', '#8FB3A2', '#9AAFC7', '#C79A9A', '#B3A3C9', '#C8A68A'];

const SPRUCH = {
  hallo: [
    'Hey {name}, Kaffee steht, Flaggen auch.',
    '{name}, Pause ist Quizzeit.',
    'Na {name}, wer holt sich heute die Krone?',
    '{name}, kurz abschalten. Hirn bleibt an.',
    'Schön, dass du da bist, {name}. Die Flaggen hängen schon.',
  ],
  richtig: ['Ticket geschlossen.', 'Sauber!', 'Zack, drin.', 'Läuft bei dir.', 'Schneller als jeder Neustart.', 'Das sitzt.'],
  falsch: ['Schon mal aus- und wieder eingeschaltet?', 'Nee, andere Baustelle.', 'Leider nein.', 'Das war nix.'],
  knapp: ['Fast! Tippfehler?', 'Ganz warm.', 'So gut wie. Nochmal genauer.'],
};

let ich = null;
let raum = null;
let sprint = null;
let neuErstellt = null;
let besteSpalte = 'punkte';
let lobbyAus = null;

// ---------- Kleinkram ----------
let aktuellerScreen = null;
function zeige(name) {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 's-' + name; });
  if (name !== 'raum' && name !== 'sprint') document.body.classList.remove('kartenmodus');
  // Weltkarte liegt außerhalb der Screens: beim Verlassen mitten im Spiel ausblenden
  if (name !== 'raum') $('raum-weltkarte').hidden = true;
  if (name !== 'sprint') $('sprint-weltkarte').hidden = true;
  if (aktuellerScreen !== name) { aktuellerScreen = name; scrollTo(0, 0); } // neue Seite beginnt oben
  ruhmMiniZeichnen();
}

// Ruhm-Leiste oben in Bude, Sprint und Lernen: aktuelle Karte, Balken, was bis zur nächsten fehlt
function ruhmMiniZeichnen() {
  const el = $('ruhm-mini');
  if (!el) return;
  el.hidden = !ich;
  if (!ich) return;
  const info = ruhmInfo(ich.ruhm || 0), zahl = n => n.toLocaleString('de-DE');
  const rest = info.bis ? `noch ${zahl(info.fehlt)} bis ${stufeInfo(info.i + 1).name}` : 'ganz oben';
  el.style.setProperty('--rang', info.rang.farbe);
  el.style.setProperty('--anteil', info.anteil.toFixed(3));
  el.title = `${info.name}, ${zahl(info.ruhm)} Ruhm: ${rest}`;
  el.setAttribute('aria-label', `Ruhm: ${info.name}, ${rest}. Zum Profil`);
  // senkrechte Säule in der Leiste links, füllt sich von unten nach oben (am Handy: dünne Linie über der Leiste)
  el.innerHTML = `${wappen(info.ruhm, { groesse: 26, titel: false })}
    <span class="rm-saeule" aria-hidden="true"><i></i></span>
    <span class="rm-zahl">${zahl(info.ruhm)}</span>
    <span class="rm-rest">${rest}</span>`;
}

// kleine Effekte
function pulsen(el, klasse = 'puls') {
  el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse);
}
function plusEins(ziel, text = '+1') {
  const s = document.createElement('span');
  s.className = 'plus-eins'; s.textContent = text;
  ziel.append(s);
  setTimeout(() => s.remove(), 900);
}
function hochzaehlen(el, bis, vorlage = n => String(n), dauer = 650) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || bis <= 0) { el.textContent = vorlage(bis); return; }
  const start = performance.now();
  const schritt = jetzt => {
    const t = Math.min(1, (jetzt - start) / dauer);
    el.textContent = vorlage(Math.round(bis * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(schritt);
  };
  requestAnimationFrame(schritt);
}

// Größer oder kleiner: beide Flächen aufdecken, größeres Land mit ✓, eigene falsche Wahl mit ✗
function duellAufdecken(box, f, gewaehlt) {
  box.classList.add('aufgedeckt');
  box.querySelectorAll('button').forEach(b => {
    b.disabled = true;
    const gross = richtigeWahl(f, b.dataset.c);
    b.classList.toggle('gewinner', gross);
    if (gewaehlt != null && b.dataset.c === gewaehlt) b.classList.add(gross ? 'richtig' : 'falsch');
    const urteil = b.querySelector('.duell-urteil');
    if (urteil) urteil.textContent = gross ? '✓ größer' : gewaehlt === b.dataset.c ? '✗ kleiner' : 'kleiner';
  });
}
// Mehr oder weniger: rechte Karte aufdecken, richtige Richtung markieren
function mehrAufdecken(box, bild, f, gewaehlt) {
  bild.querySelector('.bild-mehr')?.classList.add('offen');
  box.querySelectorAll('button').forEach(b => {
    b.disabled = true;
    const ok = richtigeWahl(f, b.dataset.c);
    b.classList.toggle('gewinner', ok);
    if (gewaehlt != null && b.dataset.c === gewaehlt) b.classList.add(ok ? 'richtig' : 'falsch');
  });
}
const groessererName = f => LAND[LAND[f.c].flaeche >= LAND[f.d].flaeche ? f.c : f.d].name;

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function farbe(f) { return /^#[0-9a-fA-F]{6}$/.test(f || '') ? f : FARBEN[0]; }
// Kleines Bild vor Chatzeilen (bekannte Mitspieler mit ihrer Figur)
// Emotes zeigen wir nur, wenn der Absender sie freigespielt hat (sein Ruhm steht in der Spielerliste)
function chatZeile(r, m) {
  const p = r.bekannt?.get(m.id) || (ich && m.id === ich.id ? ich : null);
  const { html, nurEmotes } = chatHtml(m.text, p);
  return `<li${nurEmotes ? ' class="nur-emotes"' : ''}><b>${chatAvatar(r, m)} ${esc(m.name)}:</b> ${html}</li>`;
}
// Emote-Liste über dem Chat-Feld: Klick setzt das Wort an die Schreibstelle
function emoteListeZeichnen() {
  const p = raum?.bekannt?.get(raum.ich?.id) || ich;
  $('emote-liste').innerHTML = `<div class="el-kopf"><b>Emotes</b><small>Wort tippen, Tab ergänzt</small></div><div class="el-raster">${EMOTES.map(e => {
    const frei = emoteFrei(e, p);
    return `<button type="button" class="el-emote${frei ? '' : ' zu'}" data-emote="${e.id}" title="${esc(frei ? e.code : `${e.code}: ${emoteHinweis(e)}`)}"${frei ? '' : ' aria-disabled="true"'}>${emoteImg(e, 'el-bild')}</button>`;
  }).join('')}</div>`;
}
function emoteListe(auf) {
  const l = $('emote-liste');
  if (auf === undefined) auf = l.hidden;
  if (auf) emoteListeZeichnen();
  l.hidden = !auf;
  $('emote-knopf').setAttribute('aria-expanded', auf);
  // Nach oben, wenn darüber Platz ist, sonst unter das Eingabefeld
  if (auf) l.classList.toggle('unten', $('chat-form').getBoundingClientRect().top < l.offsetHeight + 16);
}
function emoteEinsetzen(code) {
  const ein = $('chat-eingabe'), v = ein.value, a = ein.selectionStart ?? v.length, b = ein.selectionEnd ?? v.length;
  const vor = v.slice(0, a), nach = v.slice(b);
  const neu = (vor && !/\s$/.test(vor) ? vor + ' ' : vor) + code + (nach.startsWith(' ') ? '' : ' ');
  if ((neu + nach).length > 200) { toast('Die Nachricht ist schon voll.'); return; }
  ein.value = neu + nach;
  ein.focus();
  ein.setSelectionRange(neu.length, neu.length);
}
let emoteTab = null; // { start, anfang, n }: letztes Ergänzen, damit Tab weiterblättert
function emoteListeAufbauen() {
  $('emote-knopf').onclick = () => emoteListe();
  $('emote-liste').onclick = e => {
    const b = e.target.closest('.el-emote');
    if (!b) return;
    const em = emoteVonId(b.dataset.emote);
    if (b.classList.contains('zu')) { toast(`${em.code}: ${emoteHinweis(em)}.`); return; }
    emoteEinsetzen(em.code);
  };
  document.addEventListener('pointerdown', e => {
    if (!$('emote-liste').hidden && !e.target.closest('#emote-liste, #emote-knopf')) emoteListe(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('emote-liste').hidden) { emoteListe(false); $('chat-eingabe').focus(); }
  });
  const ein = $('chat-eingabe');
  ein.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey) { if (e.key !== 'Shift') emoteTab = null; return; }
    const pos = ein.selectionStart ?? ein.value.length, vor = ein.value.slice(0, pos);
    const wort = vor.match(/(\S+)$/)?.[1] || '';
    const weiter = emoteTab && emoteTab.ende === pos && vor.endsWith(emoteTab.zuletzt);
    const anfang = weiter ? emoteTab.anfang : wort, n = weiter ? emoteTab.n + 1 : 0;
    const p = raum?.bekannt?.get(raum.ich?.id) || ich;
    const em = emoteErgaenzen(anfang, p, n);
    if (!em) return;
    e.preventDefault();
    const start = pos - (weiter ? emoteTab.zuletzt.length : wort.length);
    const einsatz = em.code + ' ';
    ein.value = ein.value.slice(0, start) + einsatz + ein.value.slice(pos).replace(/^ /, '');
    const ende = start + einsatz.length;
    ein.setSelectionRange(ende, ende);
    emoteTab = { anfang, n, ende, zuletzt: einsatz };
  });
}
const chatAvatar = (r, m) => { const p = m.id && r.bekannt?.get(m.id); return `<span class="chat-av">${avatarHtml(p ? { ...p, id: m.id } : { avatar: m.avatar, farbe: '#353B3F' })}</span>`; };

// Profilbild: Figur (gewählt oder aus dem alten Emoji), Kreis (bewegt oder einfache Farbe), Rand
// Profilbild: gezeichneter Kopf (aus dem Namen oder selbst zusammengestellt), dahinter Farbe oder bewegter Hintergrund, dazu Rand und Geste
function avatarHtml(p, { bewegt = false } = {}) {
  const b = p && !p.gast && typeof p.ruhm === 'number' ? bildVon(p) : {};
  const src = kopfBild(kopfLesen(p?.stil?.kopf, p?.name), { farbe: farbe(p?.farbe), geste: b.geste, ohneGrund: !!b.kreis });
  const klassen = ['avatar', 'mit-kopf', b.kreis ? `kreis-${b.kreis}` : '', b.ring ? `ring-${b.ring}` : '', bewegt ? 'bewegt' : ''].filter(Boolean).join(' ');
  return `<span class="${klassen}"><img class="kopf" src="${src}" alt="" draggable="false">${b.kreis ? '<i class="kreis-ebene"></i>' : ''}</span>`;
}

// ---------- Ruhm im Alltag: Namensfarbe, Titel, Wappen am Avatar, Hintergrund ----------
const hatRuhm = p => p && !p.gast && typeof p.ruhm === 'number';
const nameKlasse = p => { const f = hatRuhm(p) && stilVon(p).farbe; return f ? ` nf-${f}` : ''; };
const titelVon = p => { const t = hatRuhm(p) && stilVon(p).titel; return t ? { text: rangVonId(t).titel, rang: t } : null; };
const avatarMitWappen = (p, g = 15) => hatRuhm(p) ? `<span class="mit-wappen">${avatarHtml(p)}${wappen(p.ruhm, { groesse: g })}</span>` : avatarHtml(p);
function hintergrundSetzen() {
  const hg = ich ? stilVon(ich).hintergrund : '';
  if (hg) document.body.dataset.hg = hg; else delete document.body.dataset.hg;
  // Winter und Weihnacht: bewegte Ebenen (Sterne, Schnee, bei Weihnacht Lichter, Schlitten, Sternschnuppe), alles per transform/opacity
  const welt = document.getElementById('winterwelt');
  const soll = hg === 'winter' || hg === 'weihnacht' ? hg : '';
  if (welt?.dataset.art === soll) return;
  welt?.remove();
  if (!soll) return;
  const el = document.createElement('div');
  el.id = 'winterwelt'; el.className = `winterwelt ww-${soll}`; el.dataset.art = soll; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<b class="ww-funkeln"></b>' + (soll === 'weihnacht' ? '<b class="ww-lichter a"></b><b class="ww-lichter b"></b><b class="ww-schnuppe"></b>' : '<b class="ww-polarlicht"></b><b class="ww-polarlicht"></b><b class="ww-mond"></b><b class="ww-schnuppe"></b><b class="ww-glitzern"></b>')
    + '<i class="ww-schnee s1"></i><i class="ww-schnee s2"></i><i class="ww-schnee s3"></i>';
  document.body.prepend(el);
}

// ---------- Winterquest (Dezember 2026) ----------
let winterStand = null;
async function winterLaden() {
  if (!ich || ich.gast || !online()) { winterStand = null; return; }
  if (new Date() < WINTERQUEST.ab || new Date() >= WINTERQUEST.bis) { winterStand = { flocken: 0, heute: [] }; return; }
  const vorher = winterStand;
  try { winterStand = await winterquestStand(); } catch { return; }
  // gerade eine Tagesaufgabe geschafft? (beim ersten Laden nicht melden)
  if (vorher?.heute?.length) {
    const neu = (winterStand.heute || []).filter(a => a.wert >= a.ziel && !vorher.heute.some(b => b.nr === a.nr && b.wert >= b.ziel));
    if (neu.length) toast(`Tagesaufgabe geschafft: +${neu.reduce((x, a) => x + a.flocken, 0)} Schneeflocken`);
  }
}
const KAT_KURZ = { flaggen: 'Flaggen', karte: 'Weltkarte', umrisse: 'Umrisse', hauptstaedte: 'Hauptstädte', stadtland: 'Hauptstadt → Land', nachbarn: 'Nachbarn', buchstaben: 'Buchstabensalat', bombe: 'Bombe', groesser: 'Größer oder kleiner', mehr: 'Mehr oder weniger', schaetzen: 'Schätzfragen', wissen: 'Allgemeinwissen', gemischt: 'Gemischt' };
function aufgabeText(a) {
  const z = Number(a.ziel).toLocaleString('de-DE');
  switch (a.typ) {
    case 'raumspiele': return `Spiel ${z} Raumspiele`;
    case 'raumpunkte': return `Hol ${z} Punkte in Räumen`;
    case 'raumsieg': return 'Gewinn ein Raumspiel';
    case 'treffer': return `Sammel ${z} Sprint-Treffer`;
    case 'sprint_best': return `Schaff ${z} Treffer in einem Sprint`;
    case 'sprint_kat': return `Schaff ${z} Treffer im Sprint ${KAT_KURZ[a.kategorie] || a.kategorie}`;
    default: return a.typ;
  }
}
const SCHNEEFLOCKE = flockeSvg('wq-flocke');
function questZeichnen() {
  const box = $('winterquest');
  const jetzt = new Date();
  if (jetzt >= WINTERQUEST.bis) { box.hidden = true; return; }
  const laeuft = jetzt >= WINTERQUEST.ab;
  const tage = Math.ceil(((laeuft ? WINTERQUEST.bis : WINTERQUEST.ab) - jetzt) / 86400000);
  const q = winterStand || { flocken: 0, heute: [] }, f = q.flocken || 0, max = WINTERQUEST.stufen[2].ziel;
  const mitKonto = ich && !ich.gast;
  // Gesamtbalken mit den drei Belohnungen als Marken
  const marken = WINTERQUEST.stufen.map(s => {
    const preis = sonderVon(s.art, s.belohnung), da = f >= s.ziel;
    return `<span class="wq-marke${da ? ' da' : ''}" style="--pos:${(s.ziel / max * 100).toFixed(1)}%" title="${esc(belohnungTitel(s.art, preis))} ab ${s.ziel} Schneeflocken">${kachelProbe(s.art, preis)}<small>${s.ziel}</small></span>`;
  }).join('');
  const neuIn = (() => { const m = new Date(jetzt); m.setHours(24, 0, 0, 0); const h = Math.floor((m - jetzt) / 3600000); return h >= 1 ? `in ${h} Std.` : 'gleich'; })();
  const aufgaben = (q.heute || []).map((a, i) => {
    const fertig = a.wert >= a.ziel;
    return `<li class="wq-aufgabe${fertig ? ' fertig' : ''}" style="--i:${i}">
      <span class="wq-haken">${fertig ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' : ''}</span>
      <span class="wq-mitte"><b>${esc(aufgabeText(a))}</b><span class="wq-balken" style="--anteil:${Math.min(1, a.wert / a.ziel).toFixed(3)}"><i></i></span></span>
      <span class="wq-lohn">+${a.flocken}${SCHNEEFLOCKE}<small>${Math.min(a.wert, a.ziel).toLocaleString('de-DE')}/${Number(a.ziel).toLocaleString('de-DE')}</small></span>
    </li>`;
  }).join('');
  box.innerHTML = `
    <div class="wq-kopf"><h2 id="wq-titel">Winterquest</h2><small>${laeuft ? `noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'}` : `startet in ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`}</small></div>
    <div class="wq-gesamt">
      <div class="wq-zahl">${SCHNEEFLOCKE}<b>${f.toLocaleString('de-DE')}</b><small>/ ${max} Schneeflocken</small></div>
      <div class="wq-leiste" style="--anteil:${Math.min(1, f / max).toFixed(3)}"><i></i>${marken}</div>
    </div>
    ${laeuft && mitKonto
      ? `<div class="wq-heute"><span>Heute</span><small>neue Aufgaben ${neuIn}</small></div><ol class="wq-aufgaben">${aufgaben || '<li class="leer">Aufgaben werden geladen …</li>'}</ol>`
      : `<p class="wq-text">${laeuft ? 'Mit Konto bekommst du jeden Tag drei Aufgaben und sammelst Schneeflocken.' : `Ab 1. Dezember jeden Tag drei Aufgaben. Für jede gibt es Schneeflocken, bis zu ${WINTERQUEST.proTag} am Tag. Bei 100, 200 und 300 wartet eine Belohnung, zum Schluss die Weihnachtsnacht.`}</p>`}`;
  box.hidden = false;
}
const belohnungTitel = (art, s) => `${art === 'rahmen' ? 'Rahmen' : art === 'effekt' ? 'Effekt' : 'Hintergrund'} ${s?.[art] || ''}`;

// Neue Stufe geschafft? Einmal feiern, mit Knopf zum Anlegen
function questPruefen() {
  if (!ich || ich.gast || !winterStand || new Date() < WINTERQUEST.ab) return;
  const fertig = questGeschafft(winterStand), schluessel = 'quizbude.quest.' + ich.id;
  let alt = 0; try { alt = Number(localStorage.getItem(schluessel) || 0); } catch { return; }
  if (fertig <= alt) return;
  const dlg = $('aufstieg');
  if (dlg.open || (raum && ['countdown', 'frage', 'aufloesung'].includes(raum.phase)) || sprint?.laeuft) { setTimeout(questPruefen, 4000); return; }
  try { localStorage.setItem(schluessel, String(fertig)); } catch { /* egal */ }
  const s = WINTERQUEST.stufen[fertig - 1], preis = sonderVon(s.art, s.belohnung);
  // (Stufen-Fenster) Schneeflocken-Stand steht im Text
  $('aufstieg-inhalt').style.setProperty('--rang', '#BFE3F5');
  $('aufstieg-inhalt').innerHTML = `
    <div class="winter-vorschau wq-gross ${s.art === 'hintergrund' ? 'hgf-' + s.belohnung : ''}">${s.art === 'hintergrund' ? '<span class="winterwelt mini ww-' + s.belohnung + '"><b class="ww-funkeln"></b><i class="ww-schnee s1"></i><i class="ww-schnee s2"></i></span>' : kachelProbe(s.art, preis)}</div>
    <p class="ueber">Winterquest: ${s.ziel} Schneeflocken gesammelt</p>
    <h2 id="aufstieg-titel">${esc(preis[s.art])}</h2>
    <p class="unterzeile">${esc(belohnungTitel(s.art, preis))} gehört jetzt dir${fertig < 3 ? `. Bei ${WINTERQUEST.stufen[fertig].ziel} Schneeflocken wartet die nächste Belohnung.` : '. Alle drei Belohnungen geschafft, frohe Weihnachten!'}</p>
    <div class="zeile mitte"><button class="knopf haupt" id="aufstieg-ansehen">Anlegen</button><button class="knopf zweit" id="aufstieg-weiter">Später</button></div>`;
  dlg.showModal();
  setTimeout(() => konfetti(fertig >= 3 ? 3 : 2), 500);
  $('aufstieg-weiter').onclick = () => dlg.close();
  $('aufstieg-ansehen').onclick = () => { dlg.close(); stilAnlegen({ ...stilVon(ich), [s.art]: s.belohnung }, `${preis[s.art]} angelegt.`); };
}

// Im Dezember einmal zeigen: Winterzauber ist freigeschaltet (nicht automatisch anlegen)
function winterHinweis() {
  if (!ich || ich.gast || !sonderFrei('hintergrund', 'winter', ich) || stilVon(ich).hintergrund === 'winter') return;
  const jetzt = new Date();
  if (jetzt.getMonth() !== 11) return;
  const schluessel = 'quizbude.winter.' + ich.id;
  try { if (localStorage.getItem(schluessel)) return; } catch { return; }
  const dlg = $('aufstieg');
  if (dlg.open || (raum && ['countdown', 'frage', 'aufloesung'].includes(raum.phase)) || sprint?.laeuft) { setTimeout(winterHinweis, 5000); return; }
  try { localStorage.setItem(schluessel, '1'); } catch { /* egal */ }
  $('aufstieg-inhalt').style.setProperty('--rang', '#CFE3EE');
  $('aufstieg-inhalt').innerHTML = `
    <div class="winter-vorschau hgf-winter"><span class="winterwelt mini ww-winter"><b class="ww-polarlicht"></b><b class="ww-funkeln"></b><i class="ww-schnee s1"></i><i class="ww-schnee s2"></i></span></div>
    <p class="ueber">Ein Geschenk zum Dezember</p>
    <h2 id="aufstieg-titel">Winterzauber</h2>
    <p class="unterzeile">Ein Hintergrund für alle, die bis Ende Dezember dabei sind. Er bleibt dir auch danach.</p>
    <div class="zeile mitte"><button class="knopf haupt" id="aufstieg-ansehen">Anlegen</button><button class="knopf zweit" id="aufstieg-weiter">Später</button></div>`;
  dlg.showModal();
  $('aufstieg-weiter').onclick = () => dlg.close();
  $('aufstieg-ansehen').onclick = () => { dlg.close(); stilAnlegen({ ...stilVon(ich), hintergrund: 'winter' }, 'Winterzauber angelegt.'); };
}

function wann(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.round(min / 60);
  if (std < 24) return `vor ${std} Std.`;
  const tage = Math.round(std / 24);
  return tage === 1 ? 'gestern' : `vor ${tage} Tagen`;
}

// ---------- Navigation ----------
// Die Bude ist Ebene 0, die Reiter unten (Sprint, Lernen, Profil) und Räume Ebene 1,
// ein laufender Sprint Ebene 2 über seiner Auswahl. Jeder Eintrag merkt sich, woher er kam.
// Darum führt die Zurück-Taste (Browser oder Maus) genauso zurück wie „Raus".
const tiefe = () => history.state?.qbTiefe ?? 0;
const tiefeVon = ziel => (ziel === '#/' ? 0 : /^#\/sprint\/[a-z]+$/.test(ziel) ? 2 : 1);

function navigieren(ziel) {
  const jetzt = location.hash || '#/';
  if (ziel === jetzt) return;
  if (history.state?.vorher === ziel) { history.back(); return; } // popstate ruft dann route()
  if (ziel === '#/') {
    if (tiefe() > 0) { history.go(-tiefe()); return; }
    history.replaceState({ qbTiefe: 0 }, '', '#/');
  } else if (tiefeVon(ziel) > tiefe()) {
    history.pushState({ qbTiefe: tiefe() + 1, vorher: jetzt }, '', ziel);
  } else {
    history.replaceState({ ...history.state, qbTiefe: tiefe() }, '', ziel);
  }
  route();
}

// Interne Links ohne href: Chrome zeigt dann unten links keine Adresse an
function linksZaehmen(wurzel) {
  const liste = wurzel.matches?.('a[href^="#/"]') ? [wurzel] : wurzel.querySelectorAll?.('a[href^="#/"]') || [];
  for (const a of liste) {
    a.dataset.ziel = a.getAttribute('href');
    a.removeAttribute('href');
    a.setAttribute('role', 'link');
    if (!a.hasAttribute('tabindex')) a.tabIndex = 0;
  }
}
linksZaehmen(document.body);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) linksZaehmen(n); })
  .observe(document.body, { childList: true, subtree: true });

function linkFolgen(a) {
  // Klick aufs Logo: Seite frisch laden (außer mitten im Raum oder Sprint)
  if (a.classList.contains('dock-marke') && !raum && !sprint) {
    a.classList.add('dreht');
    setTimeout(() => { history.replaceState({ qbTiefe: 0 }, '', '#/'); location.reload(); }, 380);
    return;
  }
  navigieren(a.dataset.ziel);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-ziel]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  linkFolgen(a);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const a = e.target.closest?.('a[data-ziel]');
  if (a) { e.preventDefault(); linkFolgen(a); }
});

// Klasse nach dem Wackeln wieder weg: sonst wackelt das Feld erneut, sobald es nach dem Ausblenden wieder sichtbar wird
function wackeln(el) {
  el.classList.remove('wackeln'); void el.offsetWidth; el.classList.add('wackeln');
  el.addEventListener('animationend', () => el.classList.remove('wackeln'), { once: true });
}
const pause = ms => new Promise(r => setTimeout(r, ms));

// ---------- Anmelden ----------
let anmeldeModus = 'anmelden';
const auswahl = { avatar: zufall(AVATARE), farbe: zufall(FARBEN), kopf: '' };

// Avatar- und Farbwahl (beim Registrieren und im Profil)
// Beim Konto anlegen: der Kopf aus dem Namen und ein paar andere zur Auswahl, dazu die Farbe
function wahlBauen(avatarEl, farbEl, zustand, nameEl) {
  let andere = Array.from({ length: 5 }, zufallsStart);
  const zeichnen = () => {
    const name = nameEl?.value.trim() || '';
    const koepfe = ['', ...andere.map(s => `s=${s}`)];
    avatarEl.innerHTML = koepfe.map((k, i) => `<button type="button" data-k="${k}" aria-label="${i ? `Kopf ${i + 1}` : 'Kopf aus deinem Namen'}" aria-pressed="${k === zustand.kopf}"><img src="${kopfBild(kopfLesen(k, name), { farbe: zustand.farbe })}" alt=""></button>`).join('')
      + '<button type="button" class="kopf-neu" data-neu="1" aria-label="Andere Köpfe zeigen" title="Andere Köpfe"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/></svg></button>';
    farbEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === zustand.farbe));
  };
  farbEl.innerHTML = FARBEN.map(f => `<button type="button" data-f="${f}" style="background:${f}" aria-label="Farbe ${f}"></button>`).join('');
  avatarEl.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.neu) { andere = Array.from({ length: 5 }, zufallsStart); if (zustand.kopf) zustand.kopf = ''; }
    else zustand.kopf = b.dataset.k;
    zeichnen();
  };
  farbEl.onclick = e => { const b = e.target.closest('button'); if (b) { zustand.farbe = b.dataset.f; zeichnen(); } };
  nameEl?.addEventListener('input', () => { if (!avatarEl.closest('[hidden]')) zeichnen(); });
  zeichnen();
  return zeichnen;
}

let adminPwErst = null; // erste Eingabe beim Festlegen des Admin-Passworts
function anmeldenAufbauen() {
  const koepfeZeichnen = wahlBauen($('avatar-wahl'), $('farb-wahl'), auswahl, document.querySelector('#anmelde-form [name=name]'));

  document.querySelectorAll('#s-anmelden .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      anmeldeModus = b.dataset.modus;
      document.querySelectorAll('#s-anmelden .umschalter-knopf').forEach(x => {
        x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b);
      });
      const neu = anmeldeModus === 'neu';
      document.querySelector('.nur-neu').hidden = !neu;
      if (neu) koepfeZeichnen();
      $('anmelde-knopf').textContent = neu ? 'Konto anlegen' : 'Anmelden';
      document.querySelector('#anmelde-form [name=passwort]').autocomplete = neu ? 'new-password' : 'current-password';
      $('anmelden-claudi').textContent = neu ? 'Such dir einen Kopf aus. Ein Passwort ab 4 Zeichen reicht.' : 'Claudi hat die Flaggen schon aufgehängt.';
      $('anmelde-fehler').textContent = '';
    };
  });

  // Hinweis, wenn die Feststelltaste an ist
  const pw = $('anmelde-form').passwort;
  const feststell = e => { if (e.getModifierState) $('feststell-hinweis').hidden = !e.getModifierState('CapsLock'); };
  pw.addEventListener('keydown', feststell); pw.addEventListener('keyup', feststell);
  pw.addEventListener('blur', () => { $('feststell-hinweis').hidden = true; });
  $('anmelde-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const passwort = f.passwort.value;
    const fehler = $('anmelde-fehler');
    fehler.textContent = '';
    const neu = anmeldeModus === 'neu';
    const nf = nameFehler(name, neu);
    if (nf) { fehler.textContent = nf; return; }
    if (passwort.length < 4) { fehler.textContent = 'Das Passwort braucht mindestens 4 Zeichen.'; return; }
    const knopf = $('anmelde-knopf');
    knopf.disabled = true;
    // „admin“ führt in den Admin-Bereich, das normale Konto bleibt dabei angemeldet
    if (!neu && istAdminName(name)) {
      fehler.classList.remove('info');
      try {
        // Beim allerersten Mal legst du das Admin-Passwort selbst fest, zur Sicherheit zweimal eingeben
        if (einrichtungOffen(await konfigLaden())) {
          if (adminPwErst === null) {
            adminPwErst = passwort; f.passwort.value = ''; f.passwort.focus();
            fehler.classList.add('info');
            fehler.textContent = 'Du legst gerade dein Admin-Passwort fest. Gib es zur Bestätigung nochmal ein.';
            return;
          }
          if (adminPwErst !== passwort) {
            adminPwErst = null; f.passwort.value = '';
            throw new Error('Die beiden Eingaben waren nicht gleich. Gib das Passwort nochmal zweimal ein.');
          }
          await adminEinrichten(passwort);
          adminPwErst = null;
        }
        await adminAnmelden(passwort); f.passwort.value = ''; location.href = 'admin.html';
      }
      catch (err) { fehler.textContent = err.message; }
      finally { knopf.disabled = false; }
      return;
    }
    adminPwErst = null;
    try {
      if (neu && (await konfigLaden()).neue_konten?.an === false) throw new Error('Gerade können keine neuen Konten angelegt werden.');
      const user = anmeldeModus === 'neu'
        ? await registrieren(name, passwort, auswahl.avatar, auswahl.farbe)
        : await anmelden(name, passwort);
      await profilHolen(user);
      // anderer Kopf als der aus dem Namen gewählt: gleich mitspeichern
      if (anmeldeModus === 'neu' && auswahl.kopf) {
        try { const stil = { ...(ich.stil || {}), kopf: auswahl.kopf }; await profilSpeichern(ich.id, { stil }); ich = { ...ich, stil }; chipZeichnen(); } catch { /* bleibt der Kopf aus dem Namen */ }
      }
      f.passwort.value = '';
      gast = false;
      try { localStorage.removeItem(GAST); } catch { /* egal */ }
      if (location.hash === '#/anmelden') history.replaceState({ qbTiefe: 0 }, '', '#/');
      route(true);
    } catch (err) {
      fehler.textContent = err.message;
    } finally {
      knopf.disabled = false;
    }
  };

  const fensterAuf = e => {
    const el = e.target.closest('[data-spieler]');
    if (!el || (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); spielerFenster(el.dataset.spieler, el.dataset.platz);
  };
  $('anmelden-besten').addEventListener('click', fensterAuf);
  $('anmelden-besten').addEventListener('keydown', fensterAuf);

  $('gast-los').onclick = () => {
    gast = true;
    try { localStorage.setItem(GAST, '1'); } catch { /* egal */ }
    lobbyStart();
    history.replaceState({ qbTiefe: 0 }, '', '#/');
    route(true);
  };
}

// Drei Flaggen als Fächer, bei jedem Besuch andere
function faecherFuellen() {
  const pool = LAENDER.filter(l => l.bekannt);
  const drei = [];
  while (drei.length < 3) { const c = zufall(pool).code; if (!drei.includes(c)) drei.push(c); }
  // Grundlage plus Auffächern beim Drüberfahren (--sx/--sy/--sdreh kommen obendrauf)
  const lage = [
    { x: '-34%', y: '6%', dreh: '-11deg', sx: '-24%', sy: '6%', sdreh: '-8deg' },
    { x: '0%', y: '-6%', dreh: '2deg', sx: '0%', sy: '-8%', sdreh: '0deg' },
    { x: '34%', y: '8%', dreh: '13deg', sx: '24%', sy: '6%', sdreh: '8deg' },
  ];
  document.querySelectorAll('[data-faecher]').forEach(f => {
    if (f.closest('.screen')?.hidden) return;
    f.innerHTML = drei.map((c, i) => { const l = lage[i]; return `<span class="ff" style="--i:${i};--x:${l.x};--y:${l.y};--dreh:${l.dreh}"><img src="${flaggeUrl(c)}" alt="" draggable="false"></span>`; }).join('');
    // Klick mischt neue Flaggen
    f.onclick = () => { f.classList.remove('neu'); faecherFuellen(); void f.offsetWidth; f.classList.add('neu'); };
  });
}

// Anmeldeseite: was es zu spielen gibt und wer in der Saison vorne liegt
function anmeldenKatsZeichnen() {
  if ($('anmelden-kats').childElementCount) return;
  $('anmelden-kats').innerHTML = KATEGORIE_REIHE.map((k, i) => `<li style="--i:${i}"><span class="raum-symbol" aria-hidden="true">${KATEGORIE_SYMBOL[k] || ''}</span>${esc(KATEGORIEN[k].name)}</li>`).join('');
}
async function anmeldenBestenLaden() {
  const box = $('anmelden-besten-box'), ol = $('anmelden-besten');
  if (!online()) { box.hidden = true; return; }
  try {
    const zeit = saisonOptionen()[0];
    const [von, bis] = saisonGrenzen(zeit.wert);
    let liste = (await saisonWertung(von, bis)).liste.filter(p => p.punkte > 0).sort((a, b) => b.punkte - a.punkte);
    let titel = zeit.name;
    if (!liste.length) { liste = (await bestenliste('punkte')).filter(p => p.punkte > 0); titel = 'Allzeit'; }
    if (!liste.length) { box.hidden = true; return; }
    $('ab-zeit').textContent = titel;
    ol.innerHTML = liste.slice(0, 5).map((p, i) => `<li class="${i < 3 ? 'p' + (i + 1) : ''}" style="--i:${i}">
      <a data-spieler="${esc(p.id)}" data-platz="${i + 1}" role="button" tabindex="0">
        <span class="rang">${i + 1}</span>${avatarMitWappen(p, 12)}
        <span class="ab-name${nameKlasse(p)}">${esc(p.name)}</span>
        <span class="ab-wert">${Number(p.punkte).toLocaleString('de-DE')}<small>Pkt.</small></span>
      </a></li>`).join('');
    box.hidden = false;
  } catch { box.hidden = true; }
}

function anmeldenZeigen() {
  zeige('anmelden');
  faecherFuellen();
  anmeldenKatsZeichnen();
  anmeldenBestenLaden();
  const ohneServer = !online();
  $('anmelde-form').hidden = ohneServer;
  document.querySelector('#s-anmelden .umschalter').hidden = ohneServer;
  $('offline-hinweis').hidden = !ohneServer;
}

async function profilHolen(user) {
  const p = await profilLaden(user.id);
  if (!p) throw new Error('Zu deinem Konto fehlt das Profil. Melde dich nochmal an.');
  const gesperrt = p.gesperrt_bis && new Date(p.gesperrt_bis) > new Date();
  if (p.deaktiviert || gesperrt) {
    await abmelden();
    const bis = gesperrt && new Date(p.gesperrt_bis).getFullYear() < 9000
      ? ` bis ${new Date(p.gesperrt_bis).toLocaleString('de-DE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} Uhr` : '';
    const e = new Error(p.deaktiviert ? 'Dieses Konto ist deaktiviert.' : `Dein Konto ist gesperrt${bis || ' (ohne Enddatum)'}.${p.sperr_grund ? ' Grund: ' + p.sperr_grund : ''}`);
    e.sichtbar = true;
    throw e;
  }
  ich = p;
  chipZeichnen();
  lobbyStart();
  setTimeout(ruhmPruefen, 900);
  setTimeout(saisonPruefen, 1600);
  setTimeout(winterHinweis, 4500);
  winterLaden().then(() => { questZeichnen(); setTimeout(questPruefen, 6000); });
}

const AUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

// Als Gast: ohne Konto, nur Sprint und Lernen, Rekorde auf dem Gerät
const GAST = 'quizbude.gast';
let gast = (() => { try { return localStorage.getItem(GAST) === '1'; } catch { return false; } })();

// Als Gast in Räumen: jeder Tab bekommt eine eigene Gast-Kennung und einen Namen wie „Gast 42“
function gastIch() {
  let g = null;
  try { g = JSON.parse(sessionStorage.getItem('quizbude.gastIch') || 'null'); } catch { /* egal */ }
  if (!g) {
    g = { id: 'gast-' + crypto.randomUUID(), name: 'Gast ' + (10 + Math.floor(Math.random() * 90)), avatar: '👤', farbe: '#6F777A', gast: true };
    try { sessionStorage.setItem('quizbude.gastIch', JSON.stringify(g)); } catch { /* egal */ }
  }
  return g;
}
const mitspieler = () => ich || gastIch();

function chipZeichnen() {
  hintergrundSetzen();
  ruhmMiniZeichnen();
  const chip = $('profil-chip');
  $('dock').hidden = !ich && !gast;
  if (!ich) {
    chip.innerHTML = gast ? `<span class="dock-gast">${avatarHtml({ avatar: '👤', farbe: '#353B3F' })}<span class="dock-name">${esc(gastIch().name)}</span></span><a class="knopf zweit klein" href="#/anmelden">Anmelden</a>` : '';
    return;
  }
  const aufProfil = (location.hash || '#/') === '#/profil';
  chip.innerHTML = `<a class="dock-ich${aufProfil ? ' aktiv' : ''}" href="#/profil" title="Mein Profil">${avatarHtml(ich)}<span class="dock-name${nameKlasse(ich)}">${esc(ich.name)}</span></a><button class="dock-aus" id="abmelden" title="Abmelden" aria-label="Abmelden">${AUS_ICON}</button>`;
  $('abmelden').onclick = async () => {
    if (raum) { raum.verlassen(); raum = null; }
    lobbyStopp();
    await abmelden();
    // nach dem Abmelden auf die Anmeldeseite, nicht als Gast weiter
    gast = false;
    try { localStorage.removeItem(GAST); } catch { /* egal */ }
    ich = null; chipZeichnen();
    history.replaceState({ qbTiefe: 0 }, '', '#/anmelden');
    route(true);
  };
}

// ---------- Bude ----------
function budeZeigen() {
  zeige('bude');
  faecherFuellen();
  kachelnZeichnen();
  $('bude-claudi').textContent = zufall(SPRUCH.hallo).replace('{name}', mitspieler().name);
  if (lobbyAus) lobbyAus();
  lobbyAus = lobbyAbo(raeumeZeichnen);
  bestenLaden();
}

function raeumeZeichnen(raeume) {
  const liste = $('raum-liste');
  if (!raeume.length) {
    liste.innerHTML = '<li class="leer">Gerade ist kein Raum offen. Mach einen auf, dann taucht er hier für alle auf.</li>';
    return;
  }
  liste.innerHTML = raeume.map(r => {
    const katKey = Object.keys(KATEGORIEN).find(k => KATEGORIEN[k].name === r.kategorie) || 'flaggen';
    const wartet = r.phase === 'warten' || r.phase === 'ende';
    return `
    <li class="raum-zeile">
      <span class="code">${esc(r.code)}</span>
      <span class="info">
        <strong>Raum von ${esc(r.host)}</strong>
        <span class="raum-kat"><span class="raum-symbol" aria-hidden="true">${KATEGORIE_SYMBOL[katKey] || ''}</span>${esc(r.kategorie || 'Flaggen')}${r.auswahl ? `, ${esc(r.auswahl)}` : ''}</span>
        <span class="raum-status${wartet ? ' wartet' : ''}">${r.spieler === 1 ? '1 Person' : `${r.spieler} Leute`}, ${wartet ? 'wartet auf den Start' : 'spielt gerade'}</span>
      </span>
      <a class="knopf haupt klein" href="#/raum/${esc(r.code)}">${wartet ? 'Rein da' : 'Zuschauen'}</a>
    </li>`;
  }).join('');
}

// Siegertreppchen: Plätze 1–3 auf Stufen (2 links, 1 Mitte, 3 rechts), ab Platz 4 eine ruhige Liste
const FUNKEN = [0, 60, 120, 180, 240, 300];
function treppeHtml(liste, ichId, mitKrone) {
  const DAUER = { 1: [700, 1050], 2: [420, 770], 3: [140, 490] }; // [Stufe, Kopf] in ms – erst Platz 3, dann 2, dann 1
  const oben = liste.slice(0, 3).map((e, i) => {
    const platz = i + 1, [ds, dk] = DAUER[platz];
    const krone = platz === 1 && mitKrone && e.pkt > 0;
    return `<div class="stufe s${platz}${e.id === ichId ? ' ich' : ''}" style="--ds:${ds}ms;--dk:${dk}ms">
      <div class="t-kopf">
        ${platz === 1 ? '<span class="t-strahlen" aria-hidden="true"></span>' : ''}
        ${krone ? `<span class="t-krone" aria-hidden="true">👑${FUNKEN.map(w => `<i class="funke" style="--w:${w}deg"></i>`).join('')}</span>` : ''}
        ${avatarHtml(e, { bewegt: true })}
        ${hatRuhm(e) ? `<span class="t-wappen">${wappen(e.ruhm, { groesse: platz === 1 ? 24 : 20 })}</span>` : ''}
      </div>
      <div class="t-name"><span class="${nameKlasse(e).trim()}">${esc(e.name)}</span>${e.id === ichId ? '<span class="du">du</span>' : ''}</div>
      ${titelVon(e) ? `<div class="t-titel titel-zeile nf-${titelVon(e).rang}">${esc(titelVon(e).text)}</div>` : ''}
      <div class="t-wert wert" data-pkt="${e.pkt}" data-ab="${dk + 250}">0</div>
      <div class="t-block"><span>${platz}</span></div>
    </div>`;
  }).join('');
  const rest = liste.slice(3).map((e, i) => `<li class="${e.id === ichId ? 'ich' : ''}" style="--i:${i}"><span class="platz">${i + 4}</span>${avatarMitWappen(e, 13)}<span class="podest-name"><span class="${nameKlasse(e).trim()}">${esc(e.name)}</span>${e.id === ichId ? '<span class="du">du</span>' : ''}</span><span class="wert" data-pkt="${e.pkt}" data-ab="${1300 + i * 120}">0</span></li>`).join('');
  return `<div class="treppe">${oben}</div>${rest ? `<ol class="rest">${rest}</ol>` : ''}`;
}

const SPALTE = {
  siege: n => [n, n === 1 ? 'Sieg' : 'Siege'],
  punkte: n => [n.toLocaleString('de-DE'), 'Pkt.'],
  sprint: n => [n, 'richtig'],
};
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ERSTE_SAISON = [2026, 10]; // November 2026 (Monat ab 0)

// Saisons von der ersten bis heute, neueste zuerst, dazu „Allzeit“
function saisonOptionen() {
  const jetzt = new Date(), aus = [];
  for (let j = jetzt.getFullYear(), m = jetzt.getMonth(); j > ERSTE_SAISON[0] || (j === ERSTE_SAISON[0] && m >= ERSTE_SAISON[1]); m--) {
    if (m < 0) { m = 11; j--; continue; }
    aus.push({ wert: `${j}-${m}`, name: `Saison ${MONATE[m]}${j !== jetzt.getFullYear() ? ' ' + j : ''}` });
    if (aus.length > 24) break;
  }
  aus.push({ wert: 'allzeit', name: 'Allzeit' });
  return aus;
}
const saisonGrenzen = wert => { const [j, m] = wert.split('-').map(Number); return [new Date(j, m, 1), new Date(j, m + 1, 1)]; };

// Saisonwertung: Punkte und Siege aus allen Raum-Spielen des Monats (Gäste zählen nicht)
async function saisonWertung(von, bis) {
  const [spiele, profile] = await Promise.all([spieleSeit(von), alleProfile()]);
  const proName = new Map(profile.map(p => [p.name.toLowerCase(), p]));
  const summe = new Map();
  let anzahl = 0;
  for (const s of spiele) {
    if (new Date(s.am) >= bis || s.kategorie === 'spiele') continue;
    anzahl++;
    const sp = s.spieler || [];
    sp.forEach((e, i) => {
      const p = proName.get(String(e.name || '').toLowerCase());
      if (!p) return;
      const z = summe.get(p.id) || { ...p, punkte: 0, siege: 0, spiele: 0 };
      z.punkte += e.pkt || 0; z.spiele++;
      if (i === 0 && sp.length > 1 && e.pkt > 0) z.siege++;
      summe.set(p.id, z);
    });
  }
  return { liste: [...summe.values()], anzahl };
}

// Saison-Abzeichen: kleine Medaillen-Karte mit Platz und Monat
const MEDAILLE = { 1: ['#FDEBB0', '#E2C487', '#9E7520'], 2: ['#F4F7F9', '#C3CACF', '#6E777D'], 3: ['#F3CDA9', '#C99A6E', '#7D5634'] };
let medailleNr = 0; // jede Medaille eigene Verlaufs-ID: sonst greift der Browser auf eine ausgeblendete zurück
function abzeichenSvg(platz, monat) {
  const [h, m, d] = MEDAILLE[platz];
  const gid = `qba-${platz}-${++medailleNr}`;
  return `<svg viewBox="0 0 40 48" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${h}"/><stop offset=".5" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
    <rect x="4" y="3" width="32" height="42" rx="5" fill="#22262A" stroke="url(#${gid})" stroke-width="2.4"/>
    <rect x="7.5" y="6.5" width="25" height="35" rx="2.5" fill="none" stroke="${m}" stroke-opacity=".4" stroke-width=".7"/>
    ${platz === 1 ? `<path d="M13 9.5 15 6l3 2.4L20 5l2 3.4L25 6l2 3.5Z" fill="url(#${gid})"/>` : symbol(platz === 2 ? 'herz' : 'karo', 16, 6.5, 8, m)}
    <text x="20" y="29" text-anchor="middle" font-size="15" font-weight="800" fill="url(#${gid})" font-family="var(--display, sans-serif)">${platz}</text>
    <text x="20" y="38.5" text-anchor="middle" font-size="6" font-weight="700" fill="${m}" font-family="var(--schrift, sans-serif)">${monat}</text>
  </svg>`;
}
function saisonKopf(von, bis, laeuft) {
  const ende = new Date(bis - 1);
  const tage = Math.ceil((bis - new Date()) / 86400000);
  const monat = `${String(von.getMonth() + 1).padStart(2, '0')}/${String(von.getFullYear()).slice(2)}`;
  $('besten-saison-ende').textContent = laeuft
    ? `${tage <= 1 ? 'Endet heute Nacht' : `Noch ${tage} Tage`}, dann Medaillen für die Top 3`
    : `Beendet am ${ende.getDate()}.${ende.getMonth() + 1}.${ende.getFullYear()}`;
  $('besten-saison-ende').hidden = false;
  $('besten-abzeichen').innerHTML = [1, 2, 3].map(pl => `<figure title="Abzeichen für Platz ${pl}">${abzeichenSvg(pl, monat)}<figcaption>Platz ${pl}</figcaption></figure>`).join('');
  $('besten-abzeichen').hidden = true; // die Medaillen sieht man im Profil
}

let bestenUhr = null;
async function bestenLaden() {
  const ol = $('besten-liste'), ichBox = $('besten-ich'), fuss = $('besten-fuss');
  const spalte = besteSpalte, zeit = $('besten-zeit').value || saisonOptionen()[0].wert;
  document.querySelector('.besten-kategorie').hidden = spalte !== 'sprint';
  clearInterval(bestenUhr);
  bestenUhr = setInterval(() => { if (!$('s-bude').hidden && !document.hidden) bestenLaden(); }, 30000); // frisch halten
  try {
    let liste, unter = () => '', fussText = '';
    if (zeit === 'allzeit') {
      if (spalte === 'sprint') liste = await sprintBestenliste($('besten-kategorie').value, null);
      else { liste = (await bestenliste(spalte)).map(p => ({ ...p, wert: p[spalte] })); unter = p => `${p.spiele} ${p.spiele === 1 ? 'Spiel' : 'Spiele'}`; }
      fussText = spalte === 'sprint' ? 'Beste 60-Sekunden-Sprints aller Zeiten.' : 'Alles seit dem Start der Quizbude.';
    } else {
      const [von, bis] = saisonGrenzen(zeit);
      const laeuft = bis > new Date();
      if (spalte === 'sprint') {
        liste = await sprintBestenliste($('besten-kategorie').value, von.toISOString());
        fussText = 'Bester Sprint dieser Saison.';
      } else {
        const w = await saisonWertung(von, bis);
        liste = w.liste.map(p => ({ ...p, wert: p[spalte] })).filter(p => p.wert > 0).sort((a, b) => b.wert - a.wert || b.punkte - a.punkte);
        unter = p => spalte === 'punkte' ? `${p.siege} ${p.siege === 1 ? 'Sieg' : 'Siege'} in ${p.spiele}` : `${p.punkte.toLocaleString('de-DE')} Pkt.`;
        fussText = `${w.anzahl} ${w.anzahl === 1 ? 'Spiel' : 'Spiele'} in dieser Saison`;
      }
      if (!fussText.endsWith('.')) fussText += '.';
      saisonKopf(von, bis, laeuft);
    }
    if (zeit === 'allzeit') { $('besten-saison-ende').hidden = true; $('besten-abzeichen').hidden = true; }
    if (besteSpalte !== spalte) return; // inzwischen anderer Reiter
    // Platz 1 bis 3 als Karten (in der Mitte der Erste), ab Platz 4 eine ruhige Liste mit Abstand zum Ersten
    const max = Math.max(1, liste[0]?.wert || 1), meins = p => ich && p.id === ich.id;
    const lr = p => { const r = hatRuhm(p) && stilVon(p).rahmen; return r ? ` lr-${r}` : ''; };
    const karte = (p, platz) => {
      const [zahl, einheit] = SPALTE[spalte](p.wert);
      return `<li class="bd-karte p${platz}${meins(p) ? ' ich' : ''}${lr(p)}">
        <a data-spieler="${esc(p.id)}" data-platz="${platz}" role="button" tabindex="0" aria-label="Platz ${platz}: ${esc(p.name)}, ${zahl} ${einheit}">
          <span class="bd-ecke" aria-hidden="true">${platz}${symbolSvg(['kreuz', 'herz', 'karo'][platz - 1])}</span>
          <span class="bd-avatar">${avatarHtml(p, { bewegt: platz === 1 })}</span>
          <span class="bd-name${nameKlasse(p)}">${esc(p.name)}</span>
          <span class="bd-wert">${zahl}</span>
        </a></li>`;
    };
    const feld = (p, platz) => {
      const [zahl, einheit] = SPALTE[spalte](p.wert);
      const titel = titelVon(p);
      return `<li class="besten-feld${meins(p) ? ' ich' : ''}${lr(p)}">
        <a data-spieler="${esc(p.id)}" data-platz="${platz}" role="button" tabindex="0" aria-label="Platz ${platz}: ${esc(p.name)}, ${zahl} ${einheit}">
          <span class="rang">${platz}</span>
          ${avatarHtml(p)}
          <span class="bf-mitte"><span class="bf-zeile"><span class="bf-name${nameKlasse(p)}">${esc(p.name)}</span>${hatRuhm(p) ? wappen(p.ruhm, { groesse: 13 }) : ''}</span>${titel ? `<span class="bf-titel titel-zeile nf-${titel.rang}">${esc(titel.text)}</span>` : ''}</span>
          <span class="bf-wert">${zahl}</span>
          <i class="bf-abstand" style="--a:${Math.max(2, p.wert / max * 100).toFixed(1)}%" aria-hidden="true"></i>
        </a></li>`;
    };
    const drei = $('besten-drei');
    drei.innerHTML = liste.slice(0, 3).map((p, i) => karte(p, i + 1)).join('');
    drei.hidden = !liste.length;
    drei.dataset.anzahl = Math.min(3, liste.length);
    ol.innerHTML = liste.length ? liste.slice(3, 15).map((p, i) => feld(p, i + 4)).join('')
      : `<li class="leer">${zeit === 'allzeit' ? 'Hier steht noch keiner. Spiel eine Runde, dann bist du der Erste.' : 'In dieser Saison steht hier noch keiner. Platz 1 ist frei.'}</li>`;
    // eigener Platz, wenn man nicht in den Top 15 steht
    ichBox.hidden = true;
    if (ich && !liste.slice(0, 15).some(p => p.id === ich.id)) {
      let platz = null, wert = 0;
      const i = liste.findIndex(p => p.id === ich.id);
      if (i >= 0) { platz = i + 1; wert = liste[i].wert; }
      else if (zeit === 'allzeit' && spalte !== 'sprint') { wert = ich[spalte] || 0; platz = await rangVon(spalte, wert); }
      else if (zeit === 'allzeit') wert = sprintRekord($('besten-kategorie').value);
      const [zahl, einheit] = SPALTE[spalte](wert);
      ichBox.innerHTML = `<span class="rang">${platz ?? '–'}</span>${avatarHtml(ich)}<span class="bf-name${nameKlasse(ich)}">Du</span><span class="bf-wert">${wert ? zahl : '<small>noch nichts</small>'}</span>`;
      ichBox.hidden = false;
    }
    fuss.textContent = fussText;
  } catch (e) {
    ol.innerHTML = `<li class="leer">${esc(e.message)}</li>`;
  }
}

// Raumspiele einer Person: Platz je Spiel und Summen je Kategorie (alte Kategorie „spiele“ gibt es nicht mehr)
function spieleAuswerten(spiele, name) {
  const n = String(name).toLowerCase();
  const meine = spiele.filter(sp => sp.kategorie !== 'spiele').map(sp => {
    const liste = sp.spieler || [];
    const platz = liste.findIndex(x => String(x.name).toLowerCase() === n) + 1;
    return { ...sp, platz, von: liste.length, pkt: liste[platz - 1]?.pkt ?? 0 };
  }).filter(x => x.platz > 0);
  const proKat = new Map();
  for (const g of meine) {
    const k = g.kategorie || 'flaggen';
    const e = proKat.get(k) || { n: 0, siege: 0, pkt: 0, best: 0 };
    e.n++; e.pkt += g.pkt; e.best = Math.max(e.best, g.pkt); if (g.platz === 1 && g.von > 1) e.siege++;
    proKat.set(k, e);
  }
  return { meine, proKat };
}

// Klick in die Bestenliste: Fenster mit Karte und Saison der Person
async function spielerFenster(id, platz) {
  const d = $('spieler-fenster'), innen = $('sf-innen');
  const zeit = $('besten-zeit').value || saisonOptionen()[0].wert;
  const zeitName = saisonOptionen().find(o => o.wert === zeit)?.name || 'Allzeit';
  innen.innerHTML = '<p class="sf-laden">Wird geladen …</p>';
  if (!d.open) d.showModal();
  try {
    const [p, med] = await Promise.all([profilLaden(id), abzeichenVon(id).catch(() => [])]);
    if (!p) throw new Error('Das Profil gibt es nicht mehr.');
    const allzeit = zeit === 'allzeit';
    let spiele;
    if (allzeit) spiele = await spieleVon(p.name);
    else { const [von, bis] = saisonGrenzen(zeit); spiele = (await spieleSeit(von)).filter(s => new Date(s.am) < bis); }
    const { meine, proKat } = spieleAuswerten(spiele, p.name);
    const summe = allzeit
      ? { punkte: p.punkte, siege: p.siege, spiele: p.spiele }
      : { punkte: meine.reduce((s, g) => s + g.pkt, 0), siege: meine.filter(g => g.platz === 1 && g.von > 1).length, spiele: meine.length };
    const rekorde = { ...(p.sprint_rekord ? { flaggen: p.sprint_rekord } : {}), ...(p.rekorde || {}) };
    const z = n => Number(n || 0).toLocaleString('de-DE');
    const spalteName = { punkte: 'Punkte', siege: 'Siege', sprint: 'Sprint' }[besteSpalte] || 'Punkte';
    const zeilen = SPRINT_REIHE.map(k => {
      const e = proKat.get(k), r = rekorde[k] || 0;
      if (!e && !r) return `<tr class="leer"><th>${esc(KATEGORIEN[k].name)}</th><td>–</td><td>–</td><td>–</td><td>–</td></tr>`;
      return `<tr><th>${esc(KATEGORIEN[k].name)}</th><td>${e ? e.n : '–'}</td><td class="${e?.siege ? 'gold' : ''}">${e ? e.siege : '–'}</td>
        <td>${e ? `${prozent(e.siege, e.n)} %` : '–'}</td><td class="sf-sprint">${r ? `<b>${r}</b>` : '–'}</td></tr>`;
    }).join('');
    innen.innerHTML = `
      <header class="sf-kopf">
        <div>
          <h2><span class="${nameKlasse(p).trim()}">${esc(p.name)}</span> <span class="sf-zeit">· ${esc(zeitName)}</span></h2>
          <p class="sf-summe"><b>${z(summe.punkte)}</b> ${allzeit ? 'Punkte' : 'Saisonpunkte'} · <b>${z(summe.siege)}</b> ${summe.siege === 1 ? 'Sieg' : 'Siege'} · <b>${z(summe.spiele)}</b> ${summe.spiele === 1 ? 'Spiel' : 'Spiele'} · <b>${z(p.ruhm)}</b> Ruhm</p>
        </div>
        ${platz ? `<span class="sf-platz p${Math.min(+platz, 4)}">Platz ${platz}<small>${esc(spalteName)}</small></span>` : ''}
        <button class="sf-zu" type="button" data-sf="zu" aria-label="Schließen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="sf-raster">
        <div class="sf-karte">${hochkarteHtml(p, stilVon(p), med)}
          ${med.length ? `<div class="sf-medaillen">${med.slice(0, 6).map(m => `<span tabindex="0" data-tip="Platz ${m.platz}, ${esc(wertungName(m.wertung))}" data-tip2="Saison ${esc(saisonName(m.saison))}">${abzeichenSvg(m.platz, saisonKurz(m.saison))}</span>`).join('')}</div>` : ''}</div>
        <div class="sf-rechts">
          <table class="sf-tabelle">
            <thead><tr><th>Kategorie</th><th>Spiele</th><th>Siege</th><th>Siegquote</th><th>Sprint-Rekord</th></tr></thead>
            <tbody>${zeilen}</tbody>
          </table>
          <p class="sf-erklaerung">${allzeit
            ? 'Alles seit dem Start der Quizbude. Die Kategorien zählen die letzten 60 Raumspiele.'
            : 'Saisonpunkte sind alle Punkte aus Raumspielen in diesem Monat. Ein Sieg zählt, wenn jemand in einem Raum mit mindestens zwei Leuten vorne liegt.'} Sprint-Rekord ist das beste Ergebnis aller Zeiten in 60 Sekunden.</p>
        </div>
      </div>
      <div class="sf-knoepfe">
        ${ich && !ich.gast && id !== ich.id && !freunde.some(f => f.andere === id) ? '<button class="knopf zweit" type="button" data-sf="freund">Als Freund hinzufügen</button>' : ''}
        <button class="knopf zweit" type="button" data-sf="profil">Ganzes Profil ansehen</button>
        <button class="knopf haupt" type="button" data-sf="zu">Schließen</button>
      </div>`;
    innen.dataset.id = id;
    innen.dataset.name = p.name;
  } catch (e) {
    innen.innerHTML = `<p class="sf-laden">${esc(e.message)}</p><div class="sf-knoepfe"><button class="knopf haupt" type="button" data-sf="zu">Schließen</button></div>`;
  }
}

function budeAufbauen() {
  for (const id of ['besten-liste', 'besten-drei']) {
    $(id).addEventListener('click', e => {
      const a = e.target.closest('[data-spieler]');
      if (a) spielerFenster(a.dataset.spieler, a.dataset.platz);
    });
    $(id).addEventListener('keydown', e => {
      const a = e.target.closest('[data-spieler]');
      if (a && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); spielerFenster(a.dataset.spieler, a.dataset.platz); }
    });
  }
  $('spieler-fenster').addEventListener('click', e => {
    const d = $('spieler-fenster');
    if (e.target === d) { d.close(); return; }
    const b = e.target.closest('[data-sf]'); if (!b) return;
    if (b.dataset.sf === 'freund') { freundHinzufuegen($('sf-innen').dataset.name).then(ok => { if (ok) b.remove(); }); return; }
    d.close();
    if (b.dataset.sf === 'profil') navigieren('#/profil/' + $('sf-innen').dataset.id);
  });
  $('raum-neu').onclick = () => raumAufmachen('gemischt');
  kachelnZeichnen();
  $('kachel-raster').onclick = e => {
    const b = e.target.closest('.kachel');
    if (b) raumAufmachen(b.dataset.k);
  };
  $('beitreten-form').onsubmit = e => {
    e.preventDefault();
    const c = $('code-eingabe').value.trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) { toast('Der Code hat 4 Buchstaben, zum Beispiel KXQB.'); return; }
    $('code-eingabe').value = '';
    navigieren('#/raum/' + c);
  };
  $('besten-kategorie').innerHTML = SPRINT_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
  bestenFeld = auswahlfeld($('besten-kategorie'), { symbol: v => KATEGORIE_SYMBOL[v] });
  $('besten-zeit').innerHTML = saisonOptionen().map(o => `<option value="${o.wert}">${esc(o.name)}</option>`).join('');
  zeitFeld = auswahlfeld($('besten-zeit'));
  $('besten-zeit').onchange = () => bestenLaden();
  $('besten-kategorie').onchange = () => bestenLaden();
  document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      besteSpalte = b.dataset.spalte;
      document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b); });
      bestenLaden();
    };
  });
}

function sprintRekord(k) {
  if (!ich) {
    try { return Number(localStorage.getItem('quizbude.sprint.gast.' + k) || 0); } catch { return 0; }
  }
  return ich.rekorde?.[k] ?? (k === 'flaggen' ? ich.sprint_rekord || 0 : 0);
}

function kachelHtml(k) {
  return `
    <button class="kachel" data-k="${k}">
      <span class="kachel-bild" aria-hidden="true">${kachelBild(k)}</span>
      <span class="kachel-name">${esc(KATEGORIEN[k].name).replace('Allgemeinwissen', 'Allgemein&shy;wissen').replace('Buchstabensalat', 'Buchstaben&shy;salat')}</span>
      <span class="kachel-text">${esc(KATEGORIEN[k].text)}</span>
    </button>`;
}
// Kacheln in Gruppen (Geografie, Wörter, …); kleine Gruppen stehen nebeneinander
function kachelnHtml() {
  return KATEGORIE_GRUPPEN.map(g => `<section class="kachel-gruppe gruppe-${g.id}" style="--n:${g.arten.length}" aria-label="${esc(g.titel)}">
      <h3 class="gruppe-titel">${esc(g.titel)}</h3>
      <div class="gruppe-kacheln">${g.arten.map(k => kachelHtml(k)).join('')}</div>
    </section>`).join('');
}

function kachelnZeichnen() {
  $('kachel-raster').innerHTML = kachelnHtml();
}

// ---------- Sprint-Auswahl: Liste links, Vorschau rechts ----------
// Hauptstädte steht einmal in der Liste, die Richtung wählt man in der Vorschau
const SPRINT_LISTE = KATEGORIE_GRUPPEN.map(g => ({ ...g, arten: g.arten.filter(k => SPRINT_REIHE.includes(k)) })).filter(g => g.arten.length);
const SPRINT_LISTE_FLACH = SPRINT_LISTE.flatMap(g => g.arten);
let sprintWahl = (() => { try { const k = localStorage.getItem('quizbude.sprintWahl'); return SPRINT_LISTE_FLACH.includes(k) ? k : 'flaggen'; } catch { return 'flaggen'; } })();
let sprintSaisonListen = null; // { kategorie: [{ id, name, wert, … }] } der laufenden Saison
const SPRINT_REGEL = {
  karte: 'Tipp das Land auf der Karte an. Die Uhr steht, solange die Lösung zu sehen ist.',
  groesser: 'Tipp das größere Land an. Falsch kostet 5 Sekunden.',
  mehr: 'Mehr oder weniger antippen, auch mit ↑ und ↓. Falsch kostet 5 Sekunden.',
  schaetzen: 'Zahl eintippen. Wer höchstens etwa 10 Prozent daneben liegt, bekommt den Treffer.',
  bombe: 'Ein Wort mit der Silbe eintippen. Je mehr du schaffst, desto schwerer werden die Silben.',
  wissen: 'Antwort antippen. Falsch kostet 5 Sekunden.',
  gemischt: 'Alles durcheinander. Bei Fragen mit Auswahl kostet falsch 5 Sekunden.',
};
const schmal = matchMedia('(max-width: 899px)');

function sprintWahlZeigen() {
  zeige('sprintwahl');
  sprintListeZeichnen();
  sprintVorschauZeichnen();
  sprintSaisonLaden();
}

function sprintSaisonText() {
  const jetzt = new Date(), ende = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0);
  const tage = Math.ceil((new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 1) - jetzt) / 86400000);
  return `${MONATE[jetzt.getMonth()]}, läuft bis ${ende.getDate()}.${ende.getMonth() + 1}., noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'}`;
}
const sprintPlatz = kk => (ich && sprintSaisonListen?.[kk] ? sprintSaisonListen[kk].findIndex(p => p.id === ich.id) + 1 : 0);

function sprintZeileInnen(k) {
  const kk = sprintKat(k), rekord = sprintRekord(kk), platz = sprintPlatz(kk);
  const marken = (platz ? `<span class="sl-marke${platz <= 3 ? ' p' + platz : ''}">Platz ${platz}</span>` : '') + (sprintIstUebung(kk) ? '<span class="sl-marke uebung">Übung</span>' : '');
  return `<span class="sl-symbol" aria-hidden="true">${KATEGORIE_SYMBOL[k] || ''}</span>
    <span class="sl-name"><b>${esc(KATEGORIEN[k].name)}</b>${marken ? `<span class="sl-marken">${marken}</span>` : ''}</span>
    <span class="sl-rekord${rekord ? '' : ' ohne'}"${rekord ? '' : ' aria-label="noch kein Rekord"'}><b>${rekord || '–'}</b>${rekord ? '<small>Rekord</small>' : ''}</span>`;
}
function sprintListeZeichnen() {
  $('sprint-wahl').append($('sprint-vorschau')); // auf dem Handy steckt die Vorschau in der Liste
  $('sprint-liste').innerHTML = SPRINT_LISTE.map(g => `<div class="sl-gruppe gruppe-${g.id}" role="group" aria-label="${esc(g.titel)}">
      <h3 class="gruppe-titel">${esc(g.titel)}</h3>
      ${g.arten.map(k => `<button type="button" class="sl-zeile${k === sprintWahl ? ' an' : ''}" data-k="${k}" aria-pressed="${k === sprintWahl}">${sprintZeileInnen(k)}</button>`).join('')}
    </div>`).join('');
}
// Nur den Inhalt der Zeilen neu, damit der Fokus bleibt
function sprintZeilenAuffrischen() {
  document.querySelectorAll('#sprint-liste .sl-zeile').forEach(z => {
    z.innerHTML = sprintZeileInnen(z.dataset.k);
    z.classList.toggle('an', z.dataset.k === sprintWahl);
    z.setAttribute('aria-pressed', z.dataset.k === sprintWahl);
  });
}

function sprintWerteHtml(kk) {
  const rekord = sprintRekord(kk), l = sprintSaisonListen?.[kk], platz = sprintPlatz(kk);
  const wert = (b, text, leer) => `<div class="${leer ? 'ohne' : ''}"><b>${b}</b><span>${text}</span></div>`;
  return wert(rekord || '–', rekord ? 'dein Rekord' : 'noch kein Rekord', !rekord)
    + wert(!l ? '…' : platz ? `${platz}.` : '–', 'dein Platz diese Saison', !platz)
    + wert(!l ? '…' : l.length ? l[0].wert : '–', 'Bestwert der Saison', !l?.length);
}
function sprintSaisonHtml(kk) {
  const l = sprintSaisonListen?.[kk];
  const kopf = `<div class="sv-saison-kopf"><h3>Beste der Saison</h3><small>${esc(sprintSaisonText())}</small></div>`;
  if (!l) return kopf + '<div class="sv-laedt" aria-hidden="true"></div>';
  if (!l.length) return kopf + '<p class="sv-leer">Diese Saison ist hier noch niemand gelaufen. Platz 1 ist frei.</p>';
  const i = ich ? l.findIndex(p => p.id === ich.id) : -1;
  const zeile = (p, platz, extra = '') => `<li class="${platz <= 3 ? `p${platz}` : ''}${ich && p.id === ich.id ? ' ich' : ''}${extra}"><span class="ss-platz">${platz}</span>${avatarMitWappen(p, 12)}<span class="ss-name${nameKlasse(p)}">${esc(p.name)}</span><b>${p.wert}</b></li>`;
  return kopf + `<ol>${l.slice(0, 5).map((p, j) => zeile(p, j + 1)).join('')}${i >= 5 ? zeile(l[i], i + 1, ' weiter') : ''}</ol>`;
}

function sprintKnoepfe(name, werte, jetzt, titel) {
  return `<div class="umschalter klein" role="radiogroup" aria-label="${esc(titel)}">${werte.map(([w, text, lang]) => `<button type="button" role="radio" class="umschalter-knopf${w === jetzt ? ' aktiv' : ''}" aria-checked="${w === jetzt}" data-${name}="${w}"${lang && lang !== text ? ` title="${esc(lang)}"` : ''}>${esc(text)}</button>`).join('')}</div>`;
}
function sprintVorschauZeichnen() {
  const k = sprintWahl, kk = sprintKat(k), kat = KATEGORIEN[k];
  const opt = [];
  const zeile = (titel, inhalt, erkl) => `<span class="sv-l">${esc(titel)}</span><div class="sv-wahl">${inhalt}${erkl ? `<small>${esc(erkl)}</small>` : ''}</div>`;
  if (k === 'hauptstaedte') opt.push(zeile('Richtung', sprintKnoepfe('ri', [['land', 'Land → Stadt'], ['stadt', 'Stadt → Land']], sprintRichtung, 'Richtung'), 'Jede Richtung hat ihren eigenen Rekord.'));
  if (REGION_KATEGORIEN.includes(kk)) opt.push(zeile('Region', sprintKnoepfe('r', Object.entries(REGIONEN_SPRINT), sprintRegion, 'Region'), sprintRegion !== 'alle' ? 'Gilt für alle Länder-Kategorien im Sprint.' : ''));
  if (VARIANTEN_KATEGORIEN.includes(k)) {
    const jetzt = varianteVon(kat, sprintVarianten[k]);
    const werte = Object.entries(kat.varianten.werte).map(([v, n]) => [v, n.split(':')[0].split(',')[0], n]);
    const lang = kat.varianten.werte[jetzt], erkl = lang.includes(':') ? lang.split(':')[1].trim() : lang.includes(',') ? lang.split(',').slice(1).join(',').trim() : '';
    opt.push(zeile(kat.varianten.titel, sprintKnoepfe('v', werte, jetzt, kat.varianten.titel), erkl ? erkl[0].toUpperCase() + erkl.slice(1) + '.' : ''));
  }
  if (k === 'gemischt') {
    const an = gemischtArten(sprintArten);
    opt.push(zeile('Dabei', `<div class="arten-chips">${GEMISCHT_ARTEN.map(a => `<button type="button" class="art-chip${an.includes(a) ? ' an' : ''}" data-sart="${a}" aria-pressed="${an.includes(a)}"><span aria-hidden="true">${KATEGORIE_SYMBOL[a] || ''}</span>${esc(KAT_KURZ[a])}</button>`).join('')}</div>`));
  }
  const uebung = sprintIstUebung(kk);
  $('sprint-vorschau').innerHTML = `
    <div class="sv-kopf">
      <div class="sv-bild kachel-bild" aria-hidden="true">${kachelBild(k)}</div>
      <h2>${esc(kat.name)}</h2>
      <p>${esc(KATEGORIEN[kk].text)}</p>
    </div>
    <div class="sv-werte" id="sv-werte">${sprintWerteHtml(kk)}</div>
    ${SPRINT_REGEL[k] ? `<p class="sv-regel">${esc(SPRINT_REGEL[k])}</p>` : ''}
    ${opt.length ? `<div class="sv-opt">${opt.join('')}</div>` : ''}
    ${uebung ? '<p class="sv-uebung"><span>So ist es eine Übung, der Rekord zählt nur mit den Standard-Einstellungen.</span><button type="button" class="textknopf" data-standard>Standard einstellen</button></p>' : ''}
    <button type="button" class="knopf haupt gross sv-start" data-start>${uebung ? 'Übung starten' : 'Sprint starten'}</button>
    <section class="sv-saison" id="sv-saison" aria-label="Beste der Saison">${sprintSaisonHtml(kk)}</section>`;
  sprintVorschauPlatzieren();
}
// Breit: Vorschau als zweite Spalte. Schmal: direkt unter der gewählten Zeile
function sprintVorschauPlatzieren() {
  const v = $('sprint-vorschau'), z = document.querySelector(`#sprint-liste .sl-zeile[data-k="${sprintWahl}"]`);
  if (schmal.matches && z) { if (z.nextElementSibling !== v) z.after(v); }
  else if (v.parentElement !== $('sprint-wahl')) $('sprint-wahl').append(v);
}
schmal.addEventListener('change', () => { if (!$('s-sprintwahl').hidden) sprintVorschauPlatzieren(); });

function sprintWaehlen(k) {
  if (!SPRINT_LISTE_FLACH.includes(k)) return;
  const neu = k !== sprintWahl;
  sprintWahl = k;
  try { localStorage.setItem('quizbude.sprintWahl', k); } catch { /* egal */ }
  document.querySelectorAll('#sprint-liste .sl-zeile').forEach(z => { z.classList.toggle('an', z.dataset.k === k); z.setAttribute('aria-pressed', z.dataset.k === k); });
  if (!neu) return;
  sprintVorschauZeichnen();
  if (schmal.matches) document.querySelector(`#sprint-liste .sl-zeile[data-k="${k}"]`)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const sprintLos = () => navigieren('#/sprint/' + sprintKat(sprintWahl));
// Einstellung geändert: Vorschau neu, Zeilen (Übung, Rekord) auffrischen, Fokus zurück auf den gleichen Knopf
function sprintEinstellungGeaendert(fokus) {
  sprintVorschauZeichnen();
  sprintZeilenAuffrischen();
  if (fokus) $('sprint-vorschau').querySelector(fokus)?.focus();
}

// Beste der Saison je Kategorie, dazu der eigene Platz
let sprintSaisonAbruf = 0;
async function sprintSaisonLaden() {
  const abruf = ++sprintSaisonAbruf;
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  let listen;
  try { listen = await Promise.all(SPRINT_REIHE.map(k => sprintBestenliste(k, start.toISOString()).catch(() => []))); } catch { return; }
  if (abruf !== sprintSaisonAbruf) return;
  sprintSaisonListen = Object.fromEntries(SPRINT_REIHE.map((k, i) => [k, listen[i] || []]));
  if ($('s-sprintwahl').hidden) return;
  sprintZeilenAuffrischen();
  const kk = sprintKat(sprintWahl);
  if ($('sv-werte')) $('sv-werte').innerHTML = sprintWerteHtml(kk);
  if ($('sv-saison')) $('sv-saison').innerHTML = sprintSaisonHtml(kk);
}

// ---------- Weltkarte: je eine Karte für Raum und Sprint, einmal gebaut ----------
const KARTEN = {};
const kartenPin = {};
// Die Karte liegt über den ganzen Bildschirm, Frage und Spielerliste schweben darüber.
// Was davon verdeckt ist, bekommt die Karte als Rand, damit Regionen und Auflösungen im freien Bereich landen.
function kartenRand(id) {
  const screen = $(id === 'raum-weltkarte' ? 's-raum' : 's-sprint');
  const panel = screen.querySelector('.buehne-karte').getBoundingClientRect();
  const seite = id === 'raum-weltkarte' ? screen.querySelector('aside.seite') : null;
  const sr = seite && getComputedStyle(seite).display !== 'none' ? seite.getBoundingClientRect() : null;
  return { t: panel.bottom + 14, r: sr && sr.left > innerWidth / 2 ? innerWidth - sr.left + 14 : 14, b: 64, l: 14 };
}
function weltkarte(id) {
  if (!KARTEN[id]) KARTEN[id] = karteBauen($(id), (lon, lat) => kartenPin[id]?.(lon, lat), { rand: () => kartenRand(id) });
  return KARTEN[id];
}
// Karten ganz nach hinten in die Seite hängen: sie liegen fest über dem ganzen Bildschirm
for (const id of ['raum-weltkarte', 'sprint-weltkarte']) document.body.prepend($(id));
const kartenmodus = an => document.body.classList.toggle('kartenmodus', !!an);
const kmText = a => a.km === 0 ? 'Getroffen!' : `${a.km.toLocaleString('de-DE')} km daneben`;
const eingabeText = f => f.k === 'hauptstaedte' ? 'Welche Stadt?' : f.k === 'schaetzen' ? 'Deine Schätzung' : f.k === 'bombe' ? `Ein Wort mit ${f.s}` : 'Welches Land?';
function eingabeVorbereiten(eingabe, f) {
  eingabe.placeholder = eingabeText(f);
  eingabe.inputMode = f.k === 'schaetzen' ? 'decimal' : 'text';
}

// Bonbonglas für die Schätzfragen-Kachel (wie viele sind drin?)
let kbGlasNr = 0;
const KB_GLAS = '<svg class="kb-glas" viewBox="0 0 64 74" aria-hidden="true"><path d="M21 14h22v3c6 2 9 6 9 12v34c0 6-4 9-9 9H21c-5 0-9-3-9-9V29c0-6 3-10 9-12z" fill="rgba(255,255,255,.05)"/><clipPath id="kbg-innen"><path d="M21 17c-6 2-8 6-8 12v34c0 5 3 8 8 8h22c5 0 8-3 8-8V29c0-6-2-10-8-12z"/></clipPath><g clip-path="url(#kbg-innen)"><circle cx="18.9" cy="64.1" r="3.3" fill="#B39C72"/><circle cx="25.7" cy="64.0" r="3.3" fill="#9DB8D9"/><circle cx="32.1" cy="64.4" r="3.3" fill="#9CC4A8"/><circle cx="39.6" cy="64.4" r="3.3" fill="#CDB68C"/><circle cx="22.3" cy="57.9" r="3.3" fill="#9DB8D9"/><circle cx="29.7" cy="58.7" r="3.3" fill="#CDB68C"/><circle cx="36.2" cy="58.3" r="3.3" fill="#9CC4A8"/><circle cx="43.0" cy="58.6" r="3.3" fill="#DCC8A2"/><circle cx="19.2" cy="53.3" r="3.3" fill="#CDB68C"/><circle cx="25.1" cy="52.4" r="3.3" fill="#DCC8A2"/><circle cx="32.8" cy="53.2" r="3.3" fill="#D99A9A"/><circle cx="39.3" cy="53.3" r="3.3" fill="#9DB8D9"/><circle cx="22.0" cy="46.9" r="3.3" fill="#CDB68C"/><circle cx="29.5" cy="47.1" r="3.3" fill="#D99A9A"/><circle cx="35.9" cy="47.3" r="3.3" fill="#B39C72"/><circle cx="42.1" cy="46.9" r="3.3" fill="#B39C72"/><circle cx="18.6" cy="41.3" r="3.3" fill="#CDB68C"/><circle cx="25.9" cy="41.1" r="3.3" fill="#CDB68C"/><circle cx="33.2" cy="41.4" r="3.3" fill="#CDB68C"/><circle cx="40.0" cy="40.9" r="3.3" fill="#DCC8A2"/><circle cx="23.1" cy="35.4" r="3.3" fill="#9CC4A8"/><circle cx="30.0" cy="35.9" r="3.3" fill="#CDB68C"/><circle cx="36.1" cy="35.6" r="3.3" fill="#E3B66B"/><circle cx="42.4" cy="35.4" r="3.3" fill="#D99A9A"/></g><path d="M21 14h22v3c6 2 9 6 9 12v34c0 6-4 9-9 9H21c-5 0-9-3-9-9V29c0-6 3-10 9-12z" fill="none" stroke="#DCC8A2" stroke-width="1.6" stroke-linejoin="round"/><path d="M16.5 30c0-4 1.5-7 5-8.5M16.5 36v18" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round" fill="none"/><rect x="18" y="6" width="28" height="9" rx="2.5" fill="#CDB68C"/><path d="M18 9.5h28" stroke="#B39C72" stroke-width="1"/><circle cx="54" cy="12" r="8" fill="#1F2327" stroke="#CDB68C" stroke-width="1.4"/><text x="54" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#CDB68C" font-family="system-ui, sans-serif">?</text></svg>';
function kachelBild(k) {
  const f = c => `<img src="${flaggeUrl(c)}" alt="">`;
  switch (k) {
    case 'flaggen': return `<span class="kb-faecher">${f('JP')}${f('BR')}${f('SE')}</span>`;
    case 'karte': return '<img class="kb-karte" src="bilder/weltkarte-vorschau.svg" alt="">';
    case 'umrisse': return '<img class="kb-umriss" src="bilder/umriss-vorschau.svg" alt="">';
    case 'hauptstaedte': return '<span class="kb-text">Wien?</span>';
    case 'nachbarn': return '<img class="kb-nachbarn" src="bilder/nachbarn-vorschau.svg" alt="">';
    case 'buchstaben': return `<span class="kb-salat">${[['L', 2], ['I', 1], ['H', 2], ['C', 4], ['E', 1]].map(([b, w], i) => `<b style="--w:${(i - 2) * 17}deg">${b}<sub>${w}</sub></b>`).join('')}</span>`;
    case 'schaetzen': { const id = 'kbg' + (++kbGlasNr); return KB_GLAS.replaceAll('kbg-innen', id); }
    case 'bombe': return `<span class="kb-bombe">${bombeSvg('UNG')}</span>`;
    case 'mehr': return '<span class="kb-mehr" aria-hidden="true"><svg viewBox="0 0 120 84"><g transform="rotate(-7 32 44)"><rect x="8" y="16" width="48" height="58" rx="9" class="k1"/><text x="32" y="45" text-anchor="middle" class="w">828</text><text x="32" y="60" text-anchor="middle" class="e">m</text></g><g transform="rotate(6 88 40)"><rect x="64" y="12" width="48" height="58" rx="9" class="k2"/><path d="M88 22v16M81 29l7-7 7 7" class="hoch"/><path d="M88 60V44M81 53l7 7 7-7" class="runter"/></g></svg></span>';
    case 'groesser': return `<span class="kb-duell">${f('CA')}<b>oder</b>${f('BR')}</span>`;
    case 'wissen': return '<span class="kb-text kb-gross">?</span>';
    case 'emoji': return '<span class="kb-emoji">🦁👑</span>';
    default: return '<span class="kb-emoji">🎲</span>';
  }
}

function raumAufmachen(kategorie) {
  const code = codeNeu();
  const kat = KATEGORIEN[kategorie];
  neuErstellt = { code, einst: { ...STANDARD, kategorie, auswahl: kat.standard, zeit: kat.zeit, modus: kat.tippen ? 'tippen' : 'auswahl' } };
  navigieren('#/raum/' + code);
}

// ---------- Nachschlagen ----------
const REGIONEN = { alle: 'Alle', europa: 'Europa', afrika: 'Afrika', asien: 'Asien', amerika: 'Amerika', ozeanien: 'Ozeanien' };
let lernenArt = 'flaggen';
let lernenRegion = 'alle';
let UMRISSE_LERNEN = null;
// Im Hauptstadt-Quiz bewusst ausgelassen (gleichnamig oder umstritten), zum Nachlesen aber trotzdem da
const STADT_NACHLESEN = {
  BZ: 'Belmopan', DJ: 'Dschibuti', GT: 'Guatemala-Stadt', KW: 'Kuwait-Stadt', LU: 'Luxemburg', MX: 'Mexiko-Stadt',
  MC: 'Monaco', PA: 'Panama-Stadt', SM: 'San Marino', SG: 'Singapur', VA: 'Vatikanstadt',
  IL: 'Jerusalem (international umstritten)', PS: 'Ramallah (Regierungssitz, umstritten)',
};
const stadtVon = l => l.stadt || STADT_NACHLESEN[l.code] || '';

const umrissSvg = (code, klasse = '') => UMRISSE_LERNEN?.[code]
  ? `<svg class="${klasse}" viewBox="0 0 100 100" aria-hidden="true"><path d="${UMRISSE_LERNEN[code]}" fill-rule="evenodd"/></svg>` : '';

function lernenAufbauen() {
  $('lernen-region').innerHTML = Object.entries(REGIONEN).map(([k, n]) => `<button class="chip" data-r="${k}" aria-pressed="${k === 'alle'}">${n}</button>`).join('');
  $('lernen-region').onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    lernenRegion = b.dataset.r;
    document.querySelectorAll('#lernen-region .chip').forEach(x => x.setAttribute('aria-pressed', x === b));
    lernenZeichnen();
  };
  document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(b => {
    b.onclick = () => {
      lernenArt = b.dataset.art;
      document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x === b); x.setAttribute('aria-selected', x === b); });
      lernenZeigen();
    };
  });
  $('lernen-suche').oninput = () => lernenZeichnen();
  $('lernen-raster').onclick = e => { const b = e.target.closest('.lern-karte'); if (b) lernenDetail(b.dataset.c); };
  $('lernen-zu').onclick = () => $('lernen-detail').close();
  $('lernen-detail').onclick = e => { if (e.target === $('lernen-detail')) $('lernen-detail').close(); };
}

function lernenZeigen() {
  zeige('lernen');
  if (!UMRISSE_LERNEN) umrisseLaden().then(u => { UMRISSE_LERNEN = u; if (!$('s-lernen').hidden) lernenZeichnen(); });
  lernenZeichnen();
}

function lernenZeichnen() {
  const q = kanon($('lernen-suche').value);
  let liste = LAENDER.filter(l => lernenRegion === 'alle' || l.region === lernenRegion);
  if (lernenArt === 'umrisse') liste = liste.filter(l => l.umriss);
  if (q) liste = liste.filter(l => l.antworten.some(a => a.includes(q)) || (l.stadtAntworten || []).some(a => a.includes(q)) || kanon(stadtVon(l)).includes(q));
  $('lernen-anzahl').textContent = liste.length === 1 ? '1 Land' : `${liste.length} Länder`;
  $('lernen-raster').innerHTML = liste.length ? liste.map(l => `
    <li><button class="lern-karte" data-c="${l.code}">
      <span class="lern-bild">${lernenArt === 'umrisse' ? umrissSvg(l.code) : `<img src="${flaggeUrl(l.code)}" alt="" loading="lazy" decoding="async">`}</span>
      <span class="lern-name">${esc(l.name)}</span>
      ${stadtVon(l) ? `<span class="lern-stadt">${esc(stadtVon(l).replace(/ \(.*\)$/, ''))}</span>` : ''}
    </button></li>`).join('') : '<li class="leer">Nichts gefunden. Probier einen anderen Namen.</li>';
}

function lernenDetail(code) {
  const l = LAND[code];
  $('lernen-detail-inhalt').innerHTML = `
    <div class="detail-bilder"><img src="${flaggeUrl(code)}" alt="Flagge von ${esc(l.name)}">${umrissSvg(code)}</div>
    <h2>${esc(l.name)}</h2>
    <dl class="detail-daten">
      ${stadtVon(l) ? `<dt>Hauptstadt</dt><dd>${esc(stadtVon(l))}${l.stadtAuch ? `<span class="detail-auch">zählt auch: ${l.stadtAuch.map(esc).join(', ')}</span>` : ''}</dd>` : ''}
      <dt>Fläche</dt><dd>${l.flaeche.toLocaleString('de-DE')} km²</dd>
      <dt>Kontinent</dt><dd>${REGIONEN[l.region] || '–'}</dd>
      ${l.auch ? `<dt>Zählt auch</dt><dd>${l.auch.map(esc).join(', ')}</dd>` : ''}
    </dl>
    <p class="detail-fuss">Kleine Tippfehler zählen beim Raten trotzdem, kosten im Raum aber 10 Punkte je Fehler.</p>`;
  $('lernen-detail').showModal();
}

// ---------- Spielerkarte, Anpassen, Ruhmesweg ----------
// Kopf rechts: Name (in Namensfarbe), Titel, seit wann dabei, Rang mit Fortschritt
let profilP = null; // gerade angezeigtes Profil
function karteZeichnen(p) {
  profilP = p;
  const info = ruhmInfo(p.ruhm || 0), st = stilVon(p), zahl = n => n.toLocaleString('de-DE');
  $('profil-name').className = st.farbe ? `nf-${st.farbe}` : '';
  const t = titelVon(p);
  $('profil-titel').textContent = t ? t.text : '';
  $('profil-titel').className = 'karten-titel' + (t ? ` nf-${t.rang}` : '');
  $('profil-titel').hidden = !t;
  $('profil-ruhm').style.setProperty('--rang', info.rang.farbe);
  $('profil-ruhm').innerHTML = `${wappen(info.ruhm, { groesse: 46 })}
    <div class="pr-mitte">
      <div class="pr-zeile"><b class="nf-${info.rang.id}">${info.name}</b><span>${info.bis ? `noch <b>${zahl(info.fehlt)}</b> bis ${stufeInfo(info.i + 1).name}` : 'ganz oben angekommen'}</span></div>
      <div class="ruhm-balken" style="--anteil:${info.anteil.toFixed(3)}"><i></i></div>
    </div>
    <div class="pr-zahl"><b>${zahl(info.ruhm)}</b><small>Ruhm</small></div>`;
  hochkarteZeichnen();
}

// ---------- Anpassen: Spielerkarte im Hochformat als Live-Vorschau, rechts Reiter mit Kacheln ----------
let anpassenArt = 'farbe';
let vorschauStil = null; // beim Drüberfahren: so würde es aussehen
let auswahlStil = null;  // angetippt, aber noch nicht angelegt

// Ein Platz der Vitrine auf der Karte: Abzeichen oder Saison-Medaille
// Abzeichen auf der Spielerkarte: groß, Name und Stufe erst beim Drüberfahren (data-tip)
function vitrineTeil(v) {
  if (v.art === 'e') {
    const st = STUFEN[v.stufe - 1];
    return `<span class="hk-abz st-${st.id}" tabindex="0" data-tip="${esc(v.e.name)}" data-tip2="${st.name}" aria-label="${esc(v.e.name)}, ${st.name}">${emblem(v.e, v.stufe, 74)}</span>`;
  }
  return `<span class="hk-abz hk-medaille" tabindex="0" data-tip="Platz ${v.platz}, ${esc(wertungName(v.wertung))}" data-tip2="Saison ${esc(saisonName(v.saison))}" aria-label="Platz ${v.platz}, ${esc(wertungName(v.wertung))}, Saison ${esc(saisonName(v.saison))}">${abzeichenSvg(v.platz, saisonKurz(v.saison))}</span>`;
}
// Kartenskins: alle Skins haben dieselben Ebenen, Farben und Motive kommen aus dem CSS
const SKIN_SZENE = '<b class="sz sz-feld"><i></i></b><b class="sz sz-strahlen"></b><b class="sz sz-wirbel"></b><b class="sz sz-halo"></b>'
  + '<b class="sz sz-emblem"><i></i></b><b class="sz sz-orbit"><i></i><i></i><i></i><i></i></b><b class="sz sz-teilchen"><i></i><i></i><i></i><i></i></b><b class="sz sz-glanz"></b>'
  + '<b class="sk-rahmen"></b><b class="sk-linie"></b><b class="sk-ecke ro"></b><b class="sk-ecke lu"></b><b class="sk-stein oben"></b><b class="sk-stein unten"></b>';
const skinSzene = id => id ? SKIN_SZENE : '';

// Ecke wie bei einer echten Spielkarte: Rang-Buchstabe über dem Farbsymbol, in der Rangfarbe
function eckeHtml(info, pos) {
  const joker = info.i >= JOKER;
  return `<span class="hk-ecke ${pos}" style="color:${info.rang.farbe}" aria-hidden="true"><b>${joker ? 'J' : info.bild.kurz}</b>${symbolSvg(joker ? 'stern' : info.rang.id)}</span>`;
}
function hochkarteHtml(p, st, medaillen = null) {
  const info = ruhmInfo(p.ruhm || 0), zahl = n => (n || 0).toLocaleString('de-DE');
  const titel = st.titel ? rangVonId(st.titel).titel : '';
  const sprint = Math.max(0, p.sprint_rekord || 0, ...Object.values(p.rekorde || {}));
  const skin = p.skinVorschau !== undefined ? p.skinVorschau : skinVon(p);
  return `<div class="hochkarte${st.rahmen ? ` rahmen-${st.rahmen}` : ''}${skin ? ` skin-${skin}` : ''}" style="--rang:${info.rang.farbe}">
    <div class="hk-flaeche">${skinSzene(skin)}</div>
    ${effektHtml(st.effekt)}${rahmenDeko(st.rahmen)}
    ${eckeHtml(info, 'lo')}${eckeHtml(info, 'ru')}
    <div class="hk-inhalt">
      <span class="hk-avatar">${avatarHtml(p, { bewegt: true })}</span>
      <b class="hk-name${st.farbe ? ` nf-${st.farbe}` : ''}">${esc(p.name)}</b>
      ${titel ? `<span class="hk-titel nf-${st.titel}">${esc(titel)}</span>` : '<span class="hk-titel leer">kein Titel</span>'}
      <span class="hk-rang"><b class="nf-${info.rang.id}">${info.name}</b>, ${zahl(info.ruhm)} Ruhm</span>
      ${(() => {
        const vit = vitrineLesen(p, { medaillen: medaillen?.length ?? 0 }, medaillen);
        return vit.length ? `<span class="hk-werte hk-vitrine">${vit.map(vitrineTeil).join('')}</span>`
          : `<span class="hk-werte"><span><b>${zahl(p.spiele)}</b>Spiele</span><span><b>${zahl(p.siege)}</b>Siege</span><span><b>${sprint}</b>Sprint</span></span>`;
      })()}
    </div>
  </div>`;
}
const stilGleich = (a, b) => ARTEN.every(x => (a[x.id] || '') === (b[x.id] || ''));
const stilAllesFrei = st => ARTEN.every(x => !st[x.id] || istFrei(x.id, st[x.id], ich.ruhm || 0));
function hochkarteZeichnen() {
  const p = profilP && ich && profilP.id === ich.id ? { ...profilP, ...ich } : profilP;
  if (!p || !$('hochkarte')) return;
  const eigen = ich && p.id === ich.id;
  $('hochkarte').innerHTML = hochkarteHtml(p, (eigen && vorschauStil) || stilVon(p), eigen ? meineMedaillen : profilMedaillen);
}

const ART_NAME = { farbe: 'Namensfarbe', titel: 'Titel', effekt: 'Effekt', rahmen: 'Rahmen', hintergrund: 'Hintergrund' };
function kachelProbe(art, r) {
  if (!r) return '<span class="sk-probe keiner">–</span>';
  if (art === 'farbe') return `<span class="sk-probe text nf-${r.id}">Aa</span>`;
  if (art === 'titel') return `<span class="sk-probe text klein nf-${r.id}">„…“</span>`;
  if (art === 'effekt') return `<span class="sk-probe effekt-probe">${effektHtml(r.id)}</span>`;
  if (art === 'rahmen') return `<span class="sk-probe rahmen-probe ra-${r.id}"></span>`;
  return `<span class="sk-probe hgp-${r.id}"></span>`;
}
function kachelName(art, r) {
  if (art === 'farbe') return `<span class="nf-${r.id}">${esc(ich.name)}</span>`;
  if (art === 'titel') return `<span class="nf-${r.id}">${esc(r.titel)}</span>`;
  return esc(r[art === 'effekt' ? 'effekt' : art === 'rahmen' ? 'rahmen' : 'hintergrund']);
}
function emoteKachelnZeichnen() {
  const ruhm = ich.ruhm || 0, zahl = n => n.toLocaleString('de-DE');
  $('stil-kacheln').innerHTML = EMOTES.map(e => {
    const frei = emoteFrei(e, ich), noetig = e.ab != null ? SCHWELLEN[e.ab] : 0, rang = e.ab != null ? stufeInfo(e.ab).rang : null;
    const unten = frei ? `<small>${e.ab == null ? (e.winter ? 'Winter 2026, frei' : 'für alle frei') : `${stufeInfo(e.ab).name}, frei`}</small>`
      : e.winter ? `<small>${esc(emoteHinweis(e))}</small>`
        : `<small>ab ${stufeInfo(e.ab).name}</small><span class="ruhm-balken" style="--rang:${rang.farbe};--anteil:${Math.min(1, ruhm / noetig).toFixed(3)}"><i></i></span><small>${zahl(ruhm)} / ${zahl(noetig)} Ruhm</small>`;
    return `<button class="stil-kachel emote-kachel${frei ? '' : ' gesperrt'}" data-emote="${e.id}" aria-pressed="false"><span class="sk-probe ek-bild">${emoteImg(e, 'ek-img')}</span><span class="sk-text"><b>${esc(e.code)}</b><small class="ek-name">${esc(e.name)}</small>${unten}</span>${frei ? '' : '<span class="sk-schloss" aria-hidden="true">🔒</span>'}</button>`;
  }).join('');
}
function anpassenZeichnen() {
  const st = stilVon(ich), wahl = st, ruhm = ich.ruhm || 0, zahl = n => n.toLocaleString('de-DE');
  $('anpassen-reiter').innerHTML = ARTEN.map(a => {
    const sonder = SONDER[a.id] || [];
    const anzahl = RAENGE.filter(r => istFrei(a.id, r.id, ruhm)).length + sonder.filter(s => s.frei(ich, winterStand)).length;
    return `<button role="tab" class="umschalter-knopf${a.id === anpassenArt ? ' aktiv' : ''}" aria-selected="${a.id === anpassenArt}" data-art="${a.id}">${ART_NAME[a.id]} <small>${anzahl}/${5 + sonder.length}</small></button>`;
  }).join('') + (() => {
    const extra = { medaillen: meineMedaillen.length }, frei = SKINS.filter(k => skinStand(k, ich, extra).frei).length;
    return `<button role="tab" class="umschalter-knopf${anpassenArt === 'skin' ? ' aktiv' : ''}" aria-selected="${anpassenArt === 'skin'}" data-art="skin">Kartenskin <small>${frei + 1}/${SKINS.length + 1}</small></button>`;
  })() + `<button role="tab" class="umschalter-knopf${anpassenArt === 'emote' ? ' aktiv' : ''}" aria-selected="${anpassenArt === 'emote'}" data-art="emote">Emotes <small>${EMOTES.filter(e => emoteFrei(e, ich)).length}/${EMOTES.length}</small></button>`;
  $('anpassen-info').textContent = anpassenArt === 'emote' ? 'Emotes gibt es im Raum-Chat: das Wort tippen (Tab ergänzt) oder über den Smiley neben dem Eingabefeld wählen.' : 'Ein Klick legt es an, links siehst du sofort das Ergebnis.';
  if (anpassenArt === 'skin') { skinKachelnZeichnen(); hochkarteZeichnen(); return; }
  if (anpassenArt === 'emote') { emoteKachelnZeichnen(); hochkarteZeichnen(); return; }
  const art = anpassenArt;
  const keiner = `<button class="stil-kachel${!wahl[art] ? ' gewaehlt' : ''}${!st[art] ? ' an' : ''}" data-rang="" aria-pressed="${!wahl[art]}">${kachelProbe(art, null)}<span class="sk-text"><b>Keiner</b><small>${!st[art] ? 'angelegt' : 'nichts anzeigen'}</small></span></button>`;
  $('stil-kacheln').innerHTML = keiner + RAENGE.map(r => {
    const frei = istFrei(art, r.id, ruhm), an = st[art] === r.id, gewaehlt = wahl[art] === r.id;
    const ab = freiAb(art, r.id), abName = stufeInfo(ab).name, noetig = SCHWELLEN[ab];
    const unten = an ? '<small class="sk-an">angelegt</small>'
      : frei ? `<small>${abName}, frei</small>`
      : `<small>ab ${abName}</small><span class="ruhm-balken" style="--rang:${r.farbe};--anteil:${Math.min(1, ruhm / noetig).toFixed(3)}"><i></i></span><small>${zahl(ruhm)} / ${zahl(noetig)} Ruhm</small>`;
    return `<button class="stil-kachel${gewaehlt ? ' gewaehlt' : ''}${an ? ' an' : ''}${frei ? '' : ' gesperrt'}" data-rang="${r.id}" aria-pressed="${gewaehlt}">${kachelProbe(art, r)}<span class="sk-text"><b>${kachelName(art, r)}</b>${unten}</span>${frei ? '' : '<span class="sk-schloss" aria-hidden="true">🔒</span>'}</button>`;
  }).join('') + (SONDER[art] || []).map(s => {
    const frei = s.frei(ich, winterStand), an = st[art] === s.id;
    const unten = an ? '<small class="sk-an">angelegt</small>' : frei ? '<small>Winter 2026, frei</small>' : `<small>${esc(s.hinweis)}</small>`;
    return `<button class="stil-kachel sonder${an ? ' gewaehlt an' : ''}${frei ? '' : ' gesperrt'}" data-rang="${s.id}" aria-pressed="${an}">${kachelProbe(art, s)}<span class="sk-text"><b>${esc(s[art])}</b>${unten}</span>${frei ? '' : '<span class="sk-schloss" aria-hidden="true">🔒</span>'}</button>`;
  }).join('');
  hochkarteZeichnen();
}
async function stilAnlegen(neu, meldung = 'Angelegt.') {
  const stil = Object.fromEntries(Object.entries({ ...bildVon(ich), skin: skinVon(ich), kopf: ich.stil?.kopf, ...neu }).filter(([, v]) => v));
  try {
    await profilSpeichern(ich.id, { stil });
    ich = { ...ich, stil };
    chipZeichnen();
    if (!$('s-profil').hidden && profilP?.id === ich.id) { karteZeichnen({ ...profilP, ...ich }); anpassenZeichnen(); ruhmeswegZeichnen(); }
    if (!$('s-bude').hidden) bestenLaden();
    toast(meldung);
  } catch (e) { toast(e.message); }
}
// Ruhmesweg als Tabelle: Zeilen sind die Kartenfarben (Ränge), Spalten Bube bis Ass, jede Stufe schaltet eine Sache frei
const FREI_NACH_STUFE = ['Namensfarbe + Bildrand', 'Titel + Bildhintergrund + Emote', 'Karten-Effekt + Geste', 'Rahmen + Hintergrund + Emote'];
const emoteAb = i => emotesAbStufe(i).map(e => `, ${e.code}`).join('');
function ruhmeswegZeichnen() {
  const jetzt = stufeVon(ich.ruhm || 0), zahl = n => n.toLocaleString('de-DE');
  const zustand = i => i < jetzt ? 'erreicht' : i === jetzt ? 'aktuell' : 'gesperrt';
  const bild = (liste, r) => esc(liste.find(e => e.rang === r.id)?.name || '');
  const belohnung = (r, f) => [`${esc(r.name)}, Rand ${bild(RINGE, r)}`, `„${esc(r.titel)}“, ${bild(KREISE, r)}`, `${esc(r.effekt)}, Geste ${bild(GESTEN, r)}`, `${esc(r.rahmen)}, ${esc(r.hintergrund)}`][f] + emoteAb(RAENGE.indexOf(r) * 4 + f);
  const kopf = `<div class="rw-ecke"></div>${BILDER.map((b, f) => `<div class="rw-kopf"><b>${b.name}</b><small>${FREI_NACH_STUFE[f]}</small></div>`).join('')}`;
  const zeilen = RAENGE.slice(0, 4).map((r, ri) => `<div class="rw-rang nf-${r.id}"><span class="rw-farbe ${r.rot ? 'rot' : ''}">${symbolSvg(r.id)}</span>${r.name}</div>${[0, 1, 2, 3].map(f => {
    const i = ri * 4 + f;
    return `<div class="rw-zelle ${zustand(i)}" style="--rang:${r.farbe}">${wappen(0, { stufe: i, groesse: 28 })}<span><b>${zahl(SCHWELLEN[i])}</b><small>${belohnung(r, f)}</small></span>${i === jetzt ? '<i class="rw-du">du</i>' : ''}</div>`;
  }).join('')}`).join('');
  const joker = RAENGE[4];
  const jz = `<div class="rw-rang nf-joker">Joker</div><div class="rw-zelle rw-joker ${zustand(JOKER)}" style="--rang:${joker.farbe}">${wappen(0, { stufe: JOKER, groesse: 28 })}<span><b>${zahl(SCHWELLEN[JOKER])}</b><small>Alles im Joker-Stil: schillernder Name, „${esc(joker.titel)}“, Holo-Effekt, Regenbogenrahmen und Hintergrund, dazu Geste ${esc(GESTEN.find(g => g.rang === 'joker').name)}, Holo-Hintergrund und Regenbogenrand${emoteAb(JOKER).replace(', ', ' und Emote ')}</small></span>${jetzt === JOKER ? '<i class="rw-du">du</i>' : ''}</div>`;
  $('ruhmesweg').innerHTML = kopf + zeilen + jz;
}

// ---------- Ruhm nach Spiel und Sprint, Aufstieg ----------
const RUHM_STUFE = id => 'quizbude.ruhmStufe.' + id;
async function ruhmNachladen(vorher) {
  if (!ich || !online()) return null;
  let p = null;
  for (let versuch = 0; versuch < 3; versuch++) {
    try { p = await profilLaden(ich.id); } catch { return null; }
    if (!p || p.ruhm !== vorher) break;
    await new Promise(r => setTimeout(r, 1200));
  }
  if (!p || !ich || p.id !== ich.id) return null;
  ich = { ...ich, ...p };
  ruhmMiniZeichnen();
  return (p.ruhm || 0) - vorher;
}
// Stufe mit der zuletzt gesehenen vergleichen; beim ersten Mal (nachgerechneter Ruhm) einmalig zeigen
function ruhmPruefen() {
  if (!ich || ich.gast) return;
  // nie mitten ins Spiel: während Frage, Countdown oder Sprint später nochmal schauen
  if ((raum && ['countdown', 'frage', 'aufloesung'].includes(raum.phase)) || sprint?.laeuft) { setTimeout(ruhmPruefen, 4000); return; }
  const jetzt = stufeVon(ich.ruhm || 0);
  let alt = null;
  try { alt = localStorage.getItem(RUHM_STUFE(ich.id)); localStorage.setItem(RUHM_STUFE(ich.id), jetzt); } catch { return; }
  if (alt === null) { if ((ich.ruhm || 0) > 0) aufstiegZeigen(-1, jetzt, true); return; }
  if (jetzt > Number(alt)) aufstiegZeigen(Number(alt), jetzt, false);
  erfolgePruefen();
  winterLaden().then(() => { questZeichnen(); questPruefen(); });
}
function aufstiegZeigen(alt, neu, erstesMal) {
  const dlg = $('aufstieg');
  if (dlg.open || !ich) return;
  const s = stufeInfo(neu);
  const neues = [];
  for (let i = Math.max(0, alt + 1); i <= neu; i++) neues.push(...neuFrei(i), ...emotesAbStufe(i).map(e => ({ art: 'emote', rang: stufeInfo(i).rang.id, id: e.id })));
  const zeigen = neues.slice(-4);
  $('aufstieg-inhalt').style.setProperty('--rang', s.rang.farbe);
  $('aufstieg-inhalt').innerHTML = `
    <div class="aufstieg-buehne">${wappen(ich.ruhm, { groesse: 112, stufe: neu })}</div>
    <p class="ueber">${erstesMal ? 'Ruhm ist da. Alles Bisherige zählt mit.' : 'Aufstieg!'}</p>
    <h2 id="aufstieg-titel" class="nf-${s.rang.id}">${s.name}</h2>
    <p class="ruhm-zahl">${(ich.ruhm || 0).toLocaleString('de-DE')} Ruhm</p>
    ${zeigen.length ? `<ul class="aufstieg-neu">${zeigen.map((n, i) => `<li style="--i:${i}"><span class="nf-${n.rang}">${n.art === 'emote' ? `Emote ${esc(emoteVonId(n.id).code)}` : esc(belohnungName(n.art, n.rang, n.id))}</span><small>neu</small></li>`).join('')}</ul>` : ''}
    ${neues.length > zeigen.length ? `<p class="unterzeile">und ${neues.length - zeigen.length} weitere im Profil</p>` : ''}
    <div class="zeile mitte">${neues.length ? '<button class="knopf haupt" id="aufstieg-ansehen">Im Profil ansehen</button>' : ''}<button class="knopf zweit" id="aufstieg-weiter">Weiter</button></div>`;
  dlg.showModal();
  setTimeout(() => konfetti(neu >= JOKER ? 3 : 2), 650);
  $('aufstieg-weiter').onclick = () => dlg.close();
  const ansehen = $('aufstieg-ansehen');
  if (ansehen) ansehen.onclick = () => {
    dlg.close();
    const karte = neues.filter(n => !BILD_ARTEN.includes(n.art));
    anpassenArt = karte[karte.length - 1]?.art || 'farbe';
    navigieren('#/profil');
    setTimeout(() => $('anpassen')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600);
  };
}

// ---------- Freunde: Liste, Anfragen, wer online ist, Einladungen in den Raum ----------
let freunde = [], freundeGeladen = false, einladungTimer = null;
const FREUND_TEXT = { gesendet: 'Anfrage geschickt.', angenommen: 'Ihr seid jetzt Freunde.', schon: 'Ihr seid schon Freunde, oder eine Anfrage läuft noch.', unbekannt: 'Den Namen gibt es nicht.', selbst: 'Dich selbst kannst du nicht hinzufügen.', voll: 'Deine Liste ist voll.' };
const meinRaumCode = () => (location.hash.match(/^#\/raum\/([A-Za-z]{4})$/) || [])[1]?.toUpperCase() || null;
const mitKonto = () => !!ich && !ich.gast;
function freundePruefen(h) {
  const an = mitKonto();
  $('dock-freunde').hidden = !an;
  $('raum-freunde').hidden = !an;
  if (!an) { if (freundeGeladen) { freunde = []; freundeGeladen = false; $('fr-innen').innerHTML = ''; } freundeStopp(); return; }
  freundeStart(ich);
  if (!/^#\/raum\//.test(h)) freundeOrt(null);
  if (!freundeGeladen) freundeLaden();
}
async function freundeLaden() {
  if (!mitKonto() || !online()) return;
  try { freunde = await freundeListe(); freundeGeladen = true; } catch (e) { console.warn('[Quizbude] Freunde', e); return; }
  freundeZaehlen();
  if ($('freunde-fenster').open) freundeZeichnen();
}
function freundeZaehlen() {
  const anfragen = freunde.filter(f => f.status === 'offen' && f.richtung === 'ein').length;
  const da = freunde.filter(f => f.status === 'ok' && istOnline(f.andere)).length;
  const z = $('freunde-zahl');
  z.hidden = !(anfragen || da);
  z.textContent = anfragen || da;
  z.classList.toggle('anfrage', !!anfragen);
  $('dock-freunde').title = anfragen ? `${anfragen === 1 ? 'Eine neue Anfrage' : `${anfragen} neue Anfragen`}` : `${da} ${da === 1 ? 'Freund' : 'Freunde'} online`;
}
const ortText = o => !o ? 'offline' : o.raum ? `im Raum ${o.raum}${o.kat ? `, ${o.kat}` : ''}` : 'online';
function freundeZeichnen() {
  const hier = meinRaumCode();
  const ein = freunde.filter(f => f.status === 'offen' && f.richtung === 'ein');
  const aus = freunde.filter(f => f.status === 'offen' && f.richtung === 'aus');
  const ok = freunde.filter(f => f.status === 'ok').map(f => ({ ...f, o: istOnline(f.andere) }))
    .sort((a, b) => (!!b.o - !!a.o) || a.name.localeCompare(b.name, 'de'));
  const person = (f, unter) => `${avatarMitWappen({ ...f, id: f.andere }, 13)}<span class="fr-name"><b class="${nameKlasse(f).trim()}">${esc(f.name)}</b><small>${unter}</small></span>`;
  const zeile = f => {
    const imSelben = hier && f.o?.raum === hier;
    const knopf = hier && f.o && !imSelben ? `<button class="knopf haupt klein" type="button" data-fr="einladen" data-an="${f.andere}">Einladen</button>`
      : !hier && f.o?.raum ? `<button class="knopf haupt klein" type="button" data-fr="beitreten" data-code="${esc(f.o.raum)}">Mitspielen</button>` : '';
    return `<li class="${f.o ? 'da' : ''}">${person(f, `<i class="fr-punkt"></i>${esc(imSelben ? 'hier im Raum' : ortText(f.o))}`)}<span class="fr-knoepfe">${knopf}<button class="fr-weg" type="button" data-fr="weg" data-andere="${f.andere}" data-name="${esc(f.name)}" title="Aus der Liste nehmen" aria-label="${esc(f.name)} entfernen">×</button></span></li>`;
  };
  if (!$('fr-form')) $('fr-innen').innerHTML = `
    <header class="sf-kopf"><div><h2>Freunde</h2><p class="sf-summe" id="fr-summe"></p></div>
      <button class="sf-zu" type="button" data-fr="zu" aria-label="Schließen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
    <form class="fr-form" id="fr-form" autocomplete="off"><input name="wer" maxlength="16" placeholder="Name eintippen" aria-label="Name"><button class="knopf haupt" type="submit">Anfrage schicken</button></form>
    <div id="fr-listen"></div>`;
  $('fr-summe').innerHTML = `<b>${ok.filter(f => f.o).length}</b> von <b>${ok.length}</b> online${hier ? ` · du bist in Raum <b>${esc(hier)}</b>` : ''}`;
  $('fr-listen').innerHTML = `
    ${ein.length ? `<h3 class="fr-titel">Anfragen an dich</h3><ul class="fr-liste">${ein.map(f => `<li class="neu">${person(f, 'möchte mit dir befreundet sein')}<span class="fr-knoepfe"><button class="knopf haupt klein" type="button" data-fr="ja" data-id="${f.id}" data-name="${esc(f.name)}">Annehmen</button><button class="knopf zweit klein" type="button" data-fr="nein" data-id="${f.id}">Ablehnen</button></span></li>`).join('')}</ul>` : ''}
    <h3 class="fr-titel">Deine Freunde</h3>
    ${ok.length ? `<ul class="fr-liste">${ok.map(zeile).join('')}</ul>` : `<p class="fr-leer">Noch niemand. Schick oben eine Anfrage oder klick in der Bestenliste auf jemanden.</p>`}
    ${aus.length ? `<h3 class="fr-titel">Gesendet</h3><ul class="fr-liste">${aus.map(f => `<li>${person(f, 'wartet auf Antwort')}<span class="fr-knoepfe"><button class="knopf zweit klein" type="button" data-fr="weg" data-andere="${f.andere}" data-name="${esc(f.name)}">Zurückziehen</button></span></li>`).join('')}</ul>` : ''}`;
}
async function freundHinzufuegen(name) {
  try {
    const r = await freundAnfragen(name);
    toast(FREUND_TEXT[r] || r);
    if (r === 'gesendet' || r === 'angenommen') anfrageMelden(name);
    await freundeLaden();
    return r === 'gesendet' || r === 'angenommen' || r === 'schon';
  } catch (e) { toast(e.message); return false; }
}
function freundeOeffnen() {
  freundeZeichnen();
  if (!$('freunde-fenster').open) $('freunde-fenster').showModal();
  freundeLaden();
}
function einladungZeigen(p) {
  if (!freunde.some(f => f.status === 'ok' && f.andere === p.von) || meinRaumCode() === p.code) return;
  const el = $('einladung');
  el.innerHTML = `<span class="ei-text"><span><b>${esc(p.name)}</b> lädt dich in Raum <b>${esc(p.code)}</b> ein</span>${p.kat ? `<small>${esc(p.kat)}</small>` : ''}</span>
    <button class="knopf haupt klein" type="button" data-ei="ja">Beitreten</button><button class="ei-zu" type="button" data-ei="nein" aria-label="Einladung schließen">×</button><i class="ei-zeit"></i>`;
  el.hidden = false;
  el.classList.remove('an'); void el.offsetWidth; el.classList.add('an');
  clearTimeout(einladungTimer);
  einladungTimer = setTimeout(() => { el.hidden = true; }, 15000);
  el.onclick = e => {
    const b = e.target.closest('[data-ei]'); if (!b) return;
    el.hidden = true; clearTimeout(einladungTimer);
    if (b.dataset.ei === 'ja') navigieren('#/raum/' + p.code);
  };
}
function freundeAufbauen() {
  $('dock-freunde').onclick = freundeOeffnen;
  $('raum-freunde').onclick = freundeOeffnen;
  const d = $('freunde-fenster');
  d.addEventListener('click', async e => {
    if (e.target === d) { d.close(); return; }
    const b = e.target.closest('[data-fr]'); if (!b) return;
    const was = b.dataset.fr;
    try {
      if (was === 'zu') d.close();
      else if (was === 'ja' || was === 'nein') {
        b.disabled = true;
        await freundAntworten(Number(b.dataset.id), was === 'ja');
        if (was === 'ja') { toast('Ihr seid jetzt Freunde.'); anfrageMelden(b.dataset.name); }
        await freundeLaden();
      } else if (was === 'einladen') {
        await einladen(b.dataset.an, meinRaumCode(), raum ? KATEGORIEN[raum.einst?.kategorie]?.name : null);
        b.disabled = true; b.textContent = 'Eingeladen';
      } else if (was === 'beitreten') { d.close(); navigieren('#/raum/' + b.dataset.code); }
      else if (was === 'weg') {
        if (b.dataset.sicher !== '1') {
          const vorher = b.textContent;
          b.dataset.sicher = '1'; b.textContent = 'Sicher?'; b.classList.add('sicher');
          setTimeout(() => { if (b.isConnected && b.dataset.sicher === '1') { b.dataset.sicher = ''; b.textContent = vorher; b.classList.remove('sicher'); } }, 3000);
          return;
        }
        await freundEntfernen(b.dataset.andere);
        anfrageMelden(b.dataset.name);
        await freundeLaden();
      }
    } catch (err) { b.disabled = false; toast(err.message); }
  });
  d.addEventListener('submit', async e => {
    e.preventDefault();
    const feld = e.target.elements.namedItem('wer'), name = feld.value.trim();
    if (!name) return;
    if (await freundHinzufuegen(name)) feld.value = '';
  });
  onlineAbo(() => { if (!mitKonto()) return; freundeZaehlen(); if (d.open) freundeZeichnen(); });
  anfrageAbo(p => freundeLaden().then(() => {
    if (freunde.some(f => f.status === 'offen' && f.richtung === 'ein' && f.andere === p.von)) toast(`${p.name} möchte mit dir befreundet sein.`);
  }));
  einladungAbo(p => (freundeGeladen ? Promise.resolve() : freundeLaden()).then(() => einladungZeigen(p)));
}

// Kartenskins: eigene Oberfläche der Spielerkarte, frei über Abzeichen
function skinKachelnZeichnen() {
  const extra = { medaillen: meineMedaillen.length }, jetzt = skinVon(ich);
  const probe = id => `<span class="sk-probe skin-probe${id ? ` skin-${id}` : ''}"><span class="hk-flaeche">${skinSzene(id)}</span></span>`;
  $('stil-kacheln').innerHTML = `<button class="stil-kachel${!jetzt ? ' gewaehlt an' : ''}" data-skin="" aria-pressed="${!jetzt}">${probe('')}<span class="sk-text"><b>Klassik</b><small>${!jetzt ? 'angelegt' : 'immer frei'}</small></span></button>`
    + SKINS.map(k => {
      const st = skinStand(k, ich, extra), an = jetzt === k.id;
      const unten = an ? '<small class="sk-an">angelegt</small>'
        : st.frei ? '<small>frei</small>'
        : `<small>${esc(skinBedingung(k))}</small><span class="ruhm-balken" style="--rang:#CDB68C;--anteil:${(st.hat / st.braucht).toFixed(3)}"><i></i></span><small>${st.hat} / ${st.braucht}</small>`;
      return `<button class="stil-kachel${an ? ' gewaehlt an' : ''}${st.frei ? '' : ' gesperrt'}" data-skin="${k.id}" aria-pressed="${an}">${probe(k.id)}<span class="sk-text"><b>${esc(k.name)}</b>${unten}</span>${st.frei ? '' : '<span class="sk-schloss" aria-hidden="true">🔒</span>'}</button>`;
    }).join('');
}

// ---------- Profil ----------
const profilWahl = { avatar: '', farbe: '', kopf: null, kreis: '', ring: '', geste: '' };

// ---------- Profilbild-Editor: Kopf (Teile, würfeln), Geste, Hintergrund (Farbe, hell oder bewegt), Rand ----------
const besterPlatz = () => { const p = (meineMedaillen || []).map(m => m.platz).filter(Boolean); return p.length ? Math.min(...p) : null; };
function bildBedingung(art, e) {
  if (e.medaille) return e.medaille === 1 ? 'nur für einen Saisonsieg' : `für Platz ${e.medaille} oder besser in einer Saison`;
  return `frei ab ${stufeInfo(bildFreiAb(art, e)).name}`;
}
const wahlStil = () => ({ ...stilVon(ich), kopf: kopfSchreiben(profilWahl.kopf), kreis: profilWahl.kreis, ring: profilWahl.ring, geste: profilWahl.geste });
const PFEIL_L = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const PFEIL_R = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
function bildEditorZeichnen() {
  const stufe = stufeVon(ich.ruhm || 0), best = besterPlatz(), t = profilWahl.kopf, werte = kopfWerte(t);
  const kachel = (art, e, innen, gewaehlt) => {
    const frei = bildFrei(art, e.id, stufe, best);
    return `<button type="button" class="pb-wahl${frei ? '' : ' gesperrt'}" data-art="${art}" data-id="${e.id}" aria-pressed="${gewaehlt}" title="${esc(e.name)}${frei ? '' : `, ${esc(bildBedingung(art, e))}`}">${innen}${frei ? '' : '<span class="pb-schloss" aria-hidden="true">🔒</span>'}</button>`;
  };
  const grundBild = { farbe: profilWahl.farbe, ohneGrund: !!profilWahl.kreis };
  const altScroll = document.querySelector('#pb-kopf .pk-liste')?.scrollTop || 0;
  $('pb-kopf').innerHTML = `<div class="pk-teile">${KOPF_TEILE.map(x => {
    const n = werte[x.id], anzahl = x.werte.length, offen = kopfListe === x.id;
    const text = x.ohne ? (n ? `${n} / ${anzahl}` : x.ohne) : `${n + 1} / ${anzahl}`;
    // aufklappbare Liste: alle Möglichkeiten gleich am eigenen Kopf
    const liste = offen ? `<div class="pk-liste" role="listbox" aria-label="${x.name} wählen">${Array.from({ length: anzahl + (x.ohne ? 1 : 0) }, (_, i) => {
      const bild = kopfBild({ ...t, [x.id]: i }, grundBild);
      return `<button type="button" class="pk-option" role="option" data-teil-wahl="${x.id}" data-n="${i}" aria-selected="${i === n}" title="${x.ohne && i === 0 ? x.ohne : `${x.name} ${x.ohne ? i : i + 1}`}"><img src="${bild}" alt=""${grundBild.ohneGrund ? ' style="background:#3A4046"' : ''}>${x.ohne && i === 0 ? `<small>${x.ohne}</small>` : ''}</button>`;
    }).join('')}</div>` : '';
    return `<div class="pk-zeile${offen ? ' offen' : ''}"><span>${x.name}</span><button type="button" class="pk-pfeil" data-teil="${x.id}" data-d="-1" aria-label="${x.name} zurück">${PFEIL_L}</button><button type="button" class="pk-wert" data-liste="${x.id}" aria-expanded="${offen}" title="Alle ${x.name === 'Brille' ? 'Brillen' : x.name === 'Bart' ? 'Bärte' : x.name === 'Frisur' ? 'Frisuren' : 'Oberteile'} zeigen">${text}<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><button type="button" class="pk-pfeil" data-teil="${x.id}" data-d="1" aria-label="${x.name} weiter">${PFEIL_R}</button></div>${liste}`;
  }).join('')}</div>
    <div class="pk-knoepfe"><button type="button" class="knopf zweit klein" data-kopf="wuerfeln">Neu würfeln</button><button type="button" class="textknopf" data-kopf="name">Kopf aus meinem Namen</button></div>`;
  const liste = document.querySelector('#pb-kopf .pk-liste');
  if (liste) liste.scrollTop = altScroll;
  const grund = { farbe: profilWahl.farbe, ohneGrund: !!profilWahl.kreis };
  $('pb-gesten').innerHTML = `<button type="button" class="pb-wahl" data-art="geste" data-id="" aria-pressed="${!profilWahl.geste}" title="Keine Geste"><span class="avatar mit-kopf"${grund.ohneGrund ? ' style="background:#3A4046"' : ''}><img class="kopf" src="${kopfBild(t, grund)}" alt=""></span></button>`
    + GESTEN.map(g => kachel('geste', g, `<span class="avatar mit-kopf"${grund.ohneGrund ? ' style="background:#3A4046"' : ''}><img class="kopf" src="${kopfBild(t, { ...grund, geste: g.id })}" alt=""></span>`, profilWahl.geste === g.id)).join('');
  const hell = t.k === 'h' && !profilWahl.kreis;
  $('pb-kreise').innerHTML = FARBEN.map(f => `<button type="button" class="pb-wahl" data-art="farbe" data-id="${f}" aria-pressed="${!profilWahl.kreis && !hell && profilWahl.farbe === f}" title="Einfarbig"><span class="avatar" style="background:${f}"></span></button>`).join('')
    + `<button type="button" class="pb-wahl" data-art="hell" data-id="hell" aria-pressed="${hell}" title="Hell"><span class="avatar" style="background:${HELL}"></span></button>`
    + KREISE.map(k => kachel('kreis', k, `<span class="avatar kreis-${k.id} bewegt"><i class="kreis-ebene"></i></span>`, profilWahl.kreis === k.id)).join('');
  $('pb-ringe').innerHTML = `<button type="button" class="pb-wahl" data-art="ring" data-id="" aria-pressed="${!profilWahl.ring}" title="Kein Rand"><span class="avatar pb-keiner"></span></button>`
    + RINGE.map(r => kachel('ring', r, `<span class="avatar ring-${r.id} bewegt" style="background:#30363B"></span>`, profilWahl.ring === r.id)).join('');
  const vorschau = { ...ich, farbe: profilWahl.farbe, stil: wahlStil() };
  $('pb-vorschau').innerHTML = avatarHtml(vorschau, { bewegt: true });
  const geste = GESTEN.find(g => g.id === profilWahl.geste);
  $('pb-was').innerHTML = `<b>Dein Kopf</b><small>${esc(profilWahl.kreis ? bildEintrag('kreis', profilWahl.kreis).name : hell ? 'Hell' : 'Einfarbig')}, ${esc(profilWahl.ring ? `Rand ${bildEintrag('ring', profilWahl.ring).name}` : 'ohne Rand')}${geste ? `, Geste ${esc(geste.name)}` : ''}</small>`;
}
function bildWahl(t) {
  const art = t.dataset.art, id = t.dataset.id;
  if (t.classList.contains('gesperrt')) { const e = bildEintrag(art, id); toast(`${e.name}: ${bildBedingung(art, e)}.`); return; }
  if (art === 'farbe') { profilWahl.farbe = id; profilWahl.kreis = ''; delete profilWahl.kopf.k; }
  else if (art === 'hell') { profilWahl.kreis = ''; profilWahl.kopf.k = 'h'; }
  else profilWahl[art] = id;
  bildEditorZeichnen();
}
let kopfListe = null; // welche Teile-Liste gerade aufgeklappt ist
function kopfAendern(t) {
  const k = profilWahl.kopf;
  if (t.dataset.liste) { kopfListe = kopfListe === t.dataset.liste ? null : t.dataset.liste; bildEditorZeichnen(); document.querySelector(`#pb-kopf [data-liste="${t.dataset.liste}"]`)?.focus(); return; }
  if (t.dataset.teilWahl) { k[t.dataset.teilWahl] = Number(t.dataset.n); bildEditorZeichnen(); document.querySelector(`#pb-kopf [data-teil-wahl="${t.dataset.teilWahl}"][data-n="${t.dataset.n}"]`)?.focus({ preventScroll: true }); return; }
  if (t.dataset.kopf === 'wuerfeln') profilWahl.kopf = { s: zufallsStart(), ...(k.k ? { k: k.k } : {}) };
  else if (t.dataset.kopf === 'name') profilWahl.kopf = { ...kopfLesen('', ich.name), ...(k.k ? { k: k.k } : {}) };
  else if (t.dataset.teil) {
    const x = KOPF_TEILE.find(y => y.id === t.dataset.teil), anzahl = x.werte.length + (x.ohne ? 1 : 0);
    const jetzt = kopfWerte(k)[x.id];
    k[x.id] = (jetzt + Number(t.dataset.d) + anzahl) % anzahl;
  } else return;
  bildEditorZeichnen();
}
let profilAbruf = 0;

function datum(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}
const prozent = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function profilAufbauen() {
  $('profil-bearbeiten').onclick = () => {
    const b = bildVon(ich);
    Object.assign(profilWahl, { avatar: ich.avatar, farbe: farbe(ich.farbe), kopf: kopfLesen(ich.stil?.kopf, ich.name), kreis: b.kreis || '', ring: b.ring || '', geste: b.geste || '' });
    kopfListe = null;
    bildEditorZeichnen();
    $('profil-editor').hidden = false;
  };
  for (const el of ['pb-gesten', 'pb-kreise', 'pb-ringe']) $(el).addEventListener('click', e => { const t = e.target.closest('[data-art]'); if (t) bildWahl(t); });
  $('pb-kopf').addEventListener('click', e => { const t = e.target.closest('[data-kopf], [data-teil], [data-liste], [data-teil-wahl]'); if (t) kopfAendern(t); });
  $('profil-abbrechen').onclick = () => { $('profil-editor').hidden = true; };
  $('profil-reiter').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) profilTab(b.dataset.tab); };
  abzZiehenAufbauen();
  for (const el of ['abz-raster', 'abz-medaillen', 'abz-vitrine']) $(el).addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    if (b.getAttribute('aria-disabled') === 'true') { toast('Das Abzeichen hast du noch nicht.'); return; }
    vitrineUmschalten(b.dataset.v);
  });
  $('anpassen-reiter').onclick = e => {
    const b = e.target.closest('[data-art]');
    if (!b) return;
    anpassenArt = b.dataset.art; vorschauStil = null;
    anpassenZeichnen();
  };
  // Klick legt Freigeschaltetes sofort an; Gesperrtes bleibt eine Probe auf der Karte
  $('stil-kacheln').onclick = e => {
    const b = e.target.closest('.stil-kachel');
    if (!b) return;
    if (anpassenArt === 'emote') {
      const em = emoteVonId(b.dataset.emote);
      toast(b.classList.contains('gesperrt') ? `${em.code}: ${emoteHinweis(em)}.` : `Im Raum-Chat ${em.code} tippen.`);
      return;
    }
    if (anpassenArt === 'skin') {
      const k = skinVonId(b.dataset.skin);
      if (b.classList.contains('gesperrt')) { toast(`${k.name}: frei mit ${skinBedingung(k)}.`); return; }
      if (b.getAttribute('aria-pressed') === 'true') return;
      stilAnlegen({ ...stilVon(ich), skin: b.dataset.skin }, b.dataset.skin ? `${k.name} angelegt.` : 'Klassik angelegt.');
      return;
    }
    if (b.classList.contains('gesperrt')) {
      const sonder = sonderVon(anpassenArt, b.dataset.rang);
      toast(sonder ? `${sonder[anpassenArt]}: ${sonder.hinweis}.` : `Noch gesperrt, frei ab ${stufeInfo(freiAb(anpassenArt, b.dataset.rang)).name}.`);
      return;
    }
    if (b.getAttribute('aria-pressed') === 'true') return;
    vorschauStil = null;
    stilAnlegen({ ...stilVon(ich), [anpassenArt]: b.dataset.rang }, 'Angelegt.');
  };
  $('profil-speichern').onclick = async () => {
    // Kopf aus dem Namen ohne Änderungen braucht keinen Eintrag; die alte Figur fällt weg
    const avatar = profilWahl.avatar;
    const kopf = kopfSchreiben(profilWahl.kopf) === kopfSchreiben(kopfLesen('', ich.name)) ? '' : kopfSchreiben(profilWahl.kopf);
    const stil = Object.fromEntries(Object.entries({ ...wahlStil(), skin: skinVon(ich), kopf }).filter(([, v]) => v));
    try {
      await profilSpeichern(ich.id, { avatar, farbe: profilWahl.farbe, stil });
      ich = { ...ich, avatar, farbe: profilWahl.farbe, stil };
      chipZeichnen();
      $('profil-editor').hidden = true;
      hochkarteZeichnen();
      toast('Profilbild gespeichert.');
    } catch (e) { toast(e.message); }
  };
}

let profilTabJetzt = 'uebersicht';
// ---------- Abzeichen und Saison-Medaillen im Profil ----------
let meineMedaillen = [], profilMedaillen = null;
async function abzeichenLaden(p, eigenes, abruf) {
  let med = [];
  try { med = await abzeichenVon(p.id); } catch { /* ohne Medaillen weiter */ }
  if (abruf !== profilAbruf) return;
  profilMedaillen = med;
  if (eigenes) meineMedaillen = med;
  hochkarteZeichnen();
  // kurze Übersicht für alle Profile: erreichte Abzeichen und Medaillen
  const erreicht = ERFOLGE.map(e => ({ e, st: erfolgStand(e, p, { medaillen: med.length }) })).filter(x => x.st.stufe).sort((a, b) => b.st.stufe - a.st.stufe);
  $('profil-abzeichen').innerHTML = med.map(m => `<span class="abz-mini" tabindex="0" data-tip="Platz ${m.platz}, ${esc(wertungName(m.wertung))}" data-tip2="Saison ${esc(saisonName(m.saison))}">${abzeichenSvg(m.platz, saisonKurz(m.saison))}</span>`).join('')
    + erreicht.map(x => `<span class="abz-mini" tabindex="0" data-tip="${esc(x.e.name)}" data-tip2="${STUFEN[x.st.stufe - 1].name}">${emblem(x.e, x.st.stufe, 68)}</span>`).join('')
    || `<p class="leer">${eigenes ? 'Noch keine Abzeichen. Spiel ein paar Runden, die ersten kommen schnell.' : 'Noch keine Abzeichen.'}</p>`;
  if (eigenes) abzeichenZeichnen();
}

function abzeichenZeichnen() {
  if (!ich || !$('abz-raster')) return;
  const vit = Array.isArray(ich.vitrine) ? ich.vitrine : [];
  const extra = { medaillen: meineMedaillen.length }, zahl = n => Number(n).toLocaleString('de-DE');
  const liste = vitrineLesen(ich, extra, meineMedaillen);
  $('abz-vitrine').innerHTML = [0, 1, 2].map(i => {
    const v = liste[i];
    return v ? `<button class="abz-platz voll" data-i="${i}" data-v="${esc(v.id)}" title="Ziehen zum Verschieben, klicken zum Runternehmen">${v.art === 'e' ? emblem(v.e, v.stufe, 66) : abzeichenSvg(v.platz, saisonKurz(v.saison))}<span>${esc(v.art === 'e' ? v.e.name : wertungName(v.wertung))}</span><small>runternehmen</small></button>`
      : `<div class="abz-platz" data-i="${i}"><span class="abz-leer">${i + 1}</span><small>frei</small></div>`;
  }).join('');
  $('abz-medaillen').innerHTML = meineMedaillen.length ? meineMedaillen.map(m => {
    const id = `s:${m.saison}:${m.wertung}:${m.platz}`, an = vit.includes(id);
    return `<button class="abz-medaille${an ? ' an' : ''}" data-v="${esc(id)}">${abzeichenSvg(m.platz, saisonKurz(m.saison))}<span><b>Platz ${m.platz}, ${esc(wertungName(m.wertung))}</b><small>Saison ${esc(saisonName(m.saison))}${an ? ', auf der Karte' : ''}</small></span></button>`;
  }).join('') : '<p class="leer">Die Top 3 jeder Saison bekommen eine Medaille: in Punkten, Siegen und jedem Sprint. Die erste Saison endet am 30. November.</p>';
  $('abz-raster').innerHTML = ERFOLGE.map(e => {
    const st = erfolgStand(e, ich, extra), id = `e:${e.id}`, an = vit.includes(id);
    const stufe = st.stufe ? STUFEN[st.stufe - 1] : null, naechste = st.naechste != null ? STUFEN[st.stufe] : null;
    const fortschritt = naechste
      ? `<span class="abz-balken" style="--f:${naechste.farbe};--anteil:${st.anteil.toFixed(3)}"><i></i></span><small>${zahl(st.wert)} / ${zahl(st.naechste)} ${esc(e.was)} bis ${naechste.name}</small>`
      : `<small class="abz-max">Höchste Stufe erreicht, ${zahl(st.wert)} ${esc(e.was)}</small>`;
    return `<button class="abz-kachel${st.stufe ? '' : ' gesperrt'}${an ? ' an' : ''}" data-v="${id}" ${st.stufe ? '' : 'aria-disabled="true"'}>
      ${emblem(e, st.stufe, 68)}
      <span class="abz-text"><b>${esc(e.name)}</b><span class="abz-stufe" style="--f:${stufe?.farbe || 'var(--text-3)'}">${stufe ? stufe.name : 'Noch nicht erreicht'}${an ? ' · auf der Karte' : ''}</span>${fortschritt}</span>
    </button>`;
  }).join('');
}

// Vitrine per Ziehen: Abzeichen auf einen Platz ziehen sortiert um; aus der Liste darunter (mit der Maus) legt es auf genau diesen Platz
let abzZug = null, abzKlickSperre = false;
function abzZiehenAufbauen() {
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !ich) return;
    const quelle = e.target.closest('#abz-vitrine .abz-platz.voll') || (e.pointerType !== 'touch' && e.target.closest('#abz-raster .abz-kachel:not(.gesperrt), #abz-medaillen .abz-medaille'));
    if (!quelle) return;
    abzZug = { quelle, id: quelle.dataset.v, x: e.clientX, y: e.clientY, pid: e.pointerId, aktiv: false, ziel: null };
  });
  document.addEventListener('pointermove', e => {
    const z = abzZug;
    if (!z || e.pointerId !== z.pid) return;
    if (!z.aktiv) {
      if (Math.hypot(e.clientX - z.x, e.clientY - z.y) < 8) return;
      z.aktiv = true;
      z.geist = document.createElement('div');
      z.geist.className = 'abz-geist';
      const bild = z.quelle.querySelector('svg'); if (bild) z.geist.append(bild.cloneNode(true));
      document.body.append(z.geist);
      z.quelle.classList.add('zieht');
      $('abz-vitrine').classList.add('beim-ziehen');
      try { z.quelle.setPointerCapture?.(e.pointerId); } catch { /* egal */ }
    }
    e.preventDefault();
    z.geist.style.transform = `translate(${e.clientX - 36}px, ${e.clientY - 36}px)`;
    const ziel = document.elementFromPoint(e.clientX, e.clientY)?.closest('#abz-vitrine .abz-platz') || null;
    if (ziel !== z.ziel) { z.ziel?.classList.remove('drueber'); ziel?.classList.add('drueber'); z.ziel = ziel; }
  });
  const ende = e => {
    const z = abzZug;
    if (!z || e.pointerId !== z.pid) return;
    abzZug = null;
    if (!z.aktiv) return;
    z.geist.remove(); z.quelle.classList.remove('zieht'); z.ziel?.classList.remove('drueber');
    $('abz-vitrine').classList.remove('beim-ziehen');
    abzKlickSperre = true; setTimeout(() => { abzKlickSperre = false; }, 60);
    if (e.type === 'pointercancel' || !z.ziel) return;
    vitrineAufPlatz(z.id, Number(z.ziel.dataset.i));
  };
  document.addEventListener('pointerup', ende);
  document.addEventListener('pointercancel', ende);
  // nach dem Ziehen kein Klick hinterher (der würde das Abzeichen sonst runternehmen)
  document.addEventListener('click', e => { if (abzKlickSperre) { e.stopPropagation(); e.preventDefault(); abzKlickSperre = false; } }, true);
}

async function vitrineAufPlatz(id, platz) {
  const alt = Array.isArray(ich.vitrine) ? ich.vitrine.filter(v => typeof v === 'string').slice(0, 3) : [];
  const von = alt.indexOf(id);
  let neu;
  if (von >= 0) { // umsortieren
    if (von === platz || (platz >= alt.length && von === alt.length - 1)) return;
    neu = alt.filter(v => v !== id);
    neu.splice(Math.min(platz, neu.length), 0, id);
  } else { // neu drauflegen, bei vollem Platz das alte ersetzen
    if (id.startsWith('e:')) {
      const e = ERFOLGE.find(x => `e:${x.id}` === id);
      if (!e || !erfolgStand(e, ich, { medaillen: meineMedaillen.length }).stufe) { toast('Das Abzeichen hast du noch nicht.'); return; }
    }
    neu = alt.slice();
    if (platz < neu.length) neu[platz] = id; else neu.push(id);
  }
  await vitrineSpeichern(neu, von >= 0 ? 'Umsortiert.' : 'Liegt jetzt auf deiner Karte.');
}

async function vitrineSpeichern(neu, text) {
  try {
    await profilSpeichern(ich.id, { vitrine: neu });
    ich = { ...ich, vitrine: neu };
    if (profilP?.id === ich.id) profilP = { ...profilP, vitrine: neu };
    abzeichenZeichnen(); hochkarteZeichnen();
    toast(text);
  } catch (e) { toast(e.message); }
}

async function vitrineUmschalten(id) {
  const alt = Array.isArray(ich.vitrine) ? ich.vitrine.filter(v => typeof v === 'string') : [];
  let neu;
  if (alt.includes(id)) neu = alt.filter(v => v !== id);
  else {
    if (id.startsWith('e:')) {
      const e = ERFOLGE.find(x => `e:${x.id}` === id);
      if (!e || !erfolgStand(e, ich, { medaillen: meineMedaillen.length }).stufe) { toast('Das Abzeichen hast du noch nicht.'); return; }
    }
    if (alt.length >= 3) { toast('Auf die Karte passen drei. Nimm erst eins runter.'); return; }
    neu = [...alt, id];
  }
  await vitrineSpeichern(neu, neu.length > alt.length ? 'Liegt jetzt auf deiner Karte.' : 'Von der Karte genommen.');
}

// Neue Abzeichen-Stufe erreicht? Kurzer Hinweis (beim ersten Mal nur merken)
function erfolgePruefen() {
  if (!ich || ich.gast) return;
  const extra = { medaillen: meineMedaillen.length };
  const jetzt = Object.fromEntries(ERFOLGE.map(e => [e.id, erfolgStand(e, ich, extra).stufe]));
  let alt = null;
  try { alt = JSON.parse(localStorage.getItem('quizbude.erfolge.' + ich.id) || 'null'); localStorage.setItem('quizbude.erfolge.' + ich.id, JSON.stringify(jetzt)); } catch { return; }
  if (!alt) return;
  const neu = ERFOLGE.filter(e => jetzt[e.id] > (alt[e.id] || 0));
  if (!neu.length) return;
  const e = neu[0], st = STUFEN[jetzt[e.id] - 1];
  toast(neu.length === 1 ? `Neues Abzeichen: ${e.name}, ${st.name}` : `${neu.length} neue Abzeichen, schau im Profil vorbei`);
}

// ---------- Saison: nach Monatsende abschließen, neue Medaillen feiern ----------
async function saisonPruefen() {
  if (!online()) return;
  const jetzt = new Date(), vor = new Date(jetzt.getFullYear(), jetzt.getMonth() - 1, 1);
  const saison = `${vor.getFullYear()}-${String(vor.getMonth() + 1).padStart(2, '0')}`;
  if (saison >= '2026-11') {
    let erledigt = null; try { erledigt = localStorage.getItem('quizbude.saison.zu'); } catch { /* egal */ }
    if (erledigt !== saison) {
      try { await saisonAbschliessen(saison); localStorage.setItem('quizbude.saison.zu', saison); }
      catch (e) { console.warn('[Quizbude] Saison noch nicht abgeschlossen', e); }
    }
  }
  if (!ich || ich.gast) return;
  try { meineMedaillen = await abzeichenVon(ich.id); } catch { return; }
  const schluessel = 'quizbude.medaillen.' + ich.id;
  let gesehen = null; try { gesehen = localStorage.getItem(schluessel); } catch { /* egal */ }
  const neue = meineMedaillen.filter(m => !gesehen || m.vergeben > gesehen);
  const neuestes = meineMedaillen.reduce((x, m) => (m.vergeben > x ? m.vergeben : x), gesehen || '');
  try { if (neuestes) localStorage.setItem(schluessel, neuestes); } catch { /* egal */ }
  // beim allerersten Mal nur frische Medaillen zeigen (die letzten zwei Wochen)
  const frisch = gesehen ? neue : neue.filter(m => Date.now() - new Date(m.vergeben) < 14 * 86400000);
  if (frisch.length) setTimeout(() => medailleZeigen(frisch), 1200);
}

function medailleZeigen(neue) {
  const dlg = $('aufstieg');
  if (dlg.open || !ich) { setTimeout(() => medailleZeigen(neue), 3000); return; }
  if ((raum && ['countdown', 'frage', 'aufloesung'].includes(raum.phase)) || sprint?.laeuft) { setTimeout(() => medailleZeigen(neue), 4000); return; }
  const saison = neue[0].saison;
  $('aufstieg-inhalt').style.setProperty('--rang', '#EBC660');
  $('aufstieg-inhalt').innerHTML = `
    <div class="aufstieg-buehne medaillen-buehne">${neue.slice(0, 3).map((m, i) => `<span class="mb-medaille" style="--i:${i}">${abzeichenSvg(m.platz, saisonKurz(m.saison))}</span>`).join('')}</div>
    <p class="ueber">Saison ${esc(saisonName(saison))} ist vorbei</p>
    <h2 id="aufstieg-titel">${neue.length === 1 ? 'Du hast eine Medaille!' : `Du hast ${neue.length} Medaillen!`}</h2>
    <ul class="aufstieg-neu">${neue.map((m, i) => `<li style="--i:${i}"><span>Platz ${m.platz}, ${esc(wertungName(m.wertung))}</span><small>${Number(m.wert).toLocaleString('de-DE')}</small></li>`).join('')}</ul>
    <div class="zeile mitte"><button class="knopf haupt" id="aufstieg-ansehen">Auf die Karte legen</button><button class="knopf zweit" id="aufstieg-weiter">Weiter</button></div>`;
  dlg.showModal();
  setTimeout(() => konfetti(3), 500);
  $('aufstieg-weiter').onclick = () => dlg.close();
  $('aufstieg-ansehen').onclick = () => { dlg.close(); profilTabJetzt = 'abzeichen'; navigieren('#/profil'); };
}

function profilTab(t) {
  profilTabJetzt = t;
  document.querySelectorAll('#profil-reiter [data-tab]').forEach(b => { const an = b.dataset.tab === t; b.classList.toggle('aktiv', an); b.setAttribute('aria-selected', an); });
  document.querySelectorAll('.profil-tab').forEach(d => { d.hidden = d.dataset.tab !== t; });
  if (t !== 'anpassen' && vorschauStil) { vorschauStil = null; hochkarteZeichnen(); }
}

async function profilZeigen(id) {
  zeige('profil');
  const eigenes = !id || id === ich.id;
  const abruf = ++profilAbruf;
  $('profil-editor').hidden = true;
  $('profil-bearbeiten').hidden = !eigenes;
  $('profil-werte').innerHTML = '';
  for (const el of ['profil-raenge', 'profil-rekorde', 'profil-kategorien', 'profil-spiele']) $(el).innerHTML = '<li class="leer">Wird geladen …</li>';
  let p;
  try { p = await profilLaden(eigenes ? ich.id : id); } catch (e) { toast(e.message); return; }
  if (abruf !== profilAbruf) return;
  if (!p) { $('profil-name').textContent = 'Profil nicht gefunden'; $('profil-seit').textContent = ''; return; }
  if (eigenes) { ich = { ...ich, ...p }; chipZeichnen(); }

  $('profil-name').textContent = p.name;
  $('profil-seit').textContent = `Dabei seit ${datum(p.erstellt)}, zuletzt aktiv ${wann(p.zuletzt)}`;
  vorschauStil = null;
  profilMedaillen = null;
  karteZeichnen(p);
  abzeichenLaden(p, eigenes, abruf);
  // Anpassen und Ruhmesweg gibt es nur im eigenen Profil
  $('profil-reiter').hidden = !eigenes;
  profilTab(eigenes ? profilTabJetzt : 'uebersicht');
  if (eigenes) { anpassenZeichnen(); ruhmeswegZeichnen(); }

  // Punkte pro Treffer hängt nicht an der Rundenzahl und zeigt, wie schnell jemand ist
  const proTreffer = p.richtig ? Math.round(p.punkte / p.richtig) : 0;
  const werte = [
    ['Spiele', p.spiele], ['Siege', p.siege, true], ['Siegquote', `${prozent(p.siege, p.spiele)}<small>%</small>`], ['Punkte', p.punkte.toLocaleString('de-DE')],
    ['Punkte pro Treffer', proTreffer || '–'], ['Richtige Antworten', p.richtig],
    ['Bester Sprint', Math.max(0, p.sprint_rekord || 0, ...Object.values(p.rekorde || {})), true], ['Sprints gespielt', p.sprints],
  ];
  $('profil-werte').innerHTML = werte.map(([dt, dd, hervor]) => `<div${hervor ? ' class="hervor"' : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`).join('');

  try {
    const [rSiege, rPunkte, alle, spiele] = await Promise.all([
      rangVon('siege', p.siege), rangVon('punkte', p.punkte), spielerAnzahl(), spieleVon(p.name),
    ]);
    if (abruf !== profilAbruf) return;
    const rang = (r, leer) => r ? `<span class="${r === 1 ? 'platz-1' : ''}">Platz ${r}</span> <span class="neben">von ${alle}</span>` : `<span class="neben">${leer}</span>`;
    $('profil-raenge').innerHTML = [
      ['Siege', rang(rSiege, 'noch kein Sieg')], ['Punkte', rang(rPunkte, 'noch keine Punkte')],
    ].map(([n, w]) => `<li><span>${n}</span><span>${w}</span></li>`).join('');
    const rekorde = { ...(p.sprint_rekord ? { flaggen: p.sprint_rekord } : {}), ...(p.rekorde || {}) };
    const mitRekord = SPRINT_REIHE.filter(k => rekorde[k] > 0);
    $('profil-rekorde').innerHTML = mitRekord.length
      ? mitRekord.map(k => `<li><span>${esc(KATEGORIEN[k].name)}</span><span><b>${rekorde[k]}</b> <span class="neben">richtig in 60 s</span></span></li>`).join('')
      : '<li class="leer">Noch kein Sprint gespielt.</li>';

    // Spiele dieses Profils auswerten
    const { meine, proKat } = spieleAuswerten(spiele, p.name);
    const kats = [...proKat].sort((a, b) => b[1].n - a[1].n);
    $('profil-kategorien').innerHTML = kats.length ? kats.map(([k, e], i) => `
      <li><span>${esc(KATEGORIEN[k]?.name || k)}${i === 0 && kats.length > 1 ? ' <span class="neben">(am liebsten)</span>' : ''}</span>
        <span class="neben">${e.n} ${e.n === 1 ? 'Spiel' : 'Spiele'}, ${e.siege} ${e.siege === 1 ? 'Sieg' : 'Siege'} (${prozent(e.siege, e.n)} %)</span></li>`).join('')
      : '<li class="leer">Noch keine Raum-Spiele.</li>';
    $('profil-spiele').innerHTML = meine.length ? meine.slice(0, 10).map(g => `
      <li><span${g.platz === 1 && g.von > 1 ? ' class="platz-1"' : ''}>${g.von > 1 ? `Platz ${g.platz} von ${g.von}` : 'Allein gespielt'}</span>
        <span class="neben">${esc(KATEGORIEN[g.kategorie]?.name || 'Flaggen')}, ${g.pkt} Punkte, ${wann(g.am)}</span></li>`).join('')
      : '<li class="leer">Noch keine Raum-Spiele. Mach einen Raum auf!</li>';
  } catch (e) {
    $('profil-spiele').innerHTML = `<li class="leer">${esc(e.message)}</li>`;
  }
}

// ---------- Raum ----------
let gezeichnet = { idx: -2, phase: '' };
let einstFelder = [];
let bestenFeld = null;
let zeitFeld = null;

async function raumBetreten(code) {
  if (raum && raum.code === code) { raumZeichnen(); return; }
  zeige('raum');
  gezeichnet = { idx: -2, phase: '' };
  $('chat-liste').innerHTML = '';
  $('spieler-liste').innerHTML = '';
  const alsHost = neuErstellt?.code === code;
  raum = new Raum(code, mitspieler(), () => raumZeichnen(), alsHost);
  if (alsHost) raum.einst = neuErstellt.einst;
  neuErstellt = null;
  raumZeichnen();
  try {
    await raum.betreten(alsHost);
  } catch (e) {
    toast(e.message);
    navigieren('#/');
  }
}

function raumAufbauen() {
  $('einst-kategorie').innerHTML = KATEGORIE_REIHE.map(k => `<option value="${k}">${esc(KATEGORIEN[k].name)}</option>`).join('');
  einstFelder = [...document.querySelectorAll('#einst select')]
    .map(sel => auswahlfeld(sel, sel.dataset.e === 'kategorie' ? { symbol: v => KATEGORIE_SYMBOL[v] } : {}));
  document.querySelectorAll('#einst select').forEach(s => {
    s.onchange = () => {
      if (!raum) return;
      if (s.dataset.e === 'kategorie') {
        const kat = KATEGORIEN[s.value];
        raum.einstellen({ kategorie: s.value, auswahl: kat.standard, zeit: kat.zeit, modus: kat.tippen ? 'tippen' : 'auswahl', variante: kat.varianten?.standard ?? null });
        return;
      }
      if (s.dataset.e === 'richtung') { raum.einstellen({ kategorie: s.value === 'stadt' ? 'stadtland' : 'hauptstaedte' }); return; }
      if (s.dataset.e === 'leiter') { raum.einstellen({ leiter: s.value === 'leiten' ? raum.ich.id : null }); return; }
      const wert = ['runden', 'zeit'].includes(s.dataset.e) ? Number(s.value) : s.value;
      raum.einstellen({ [s.dataset.e]: wert });
    };
  });
  // Gemischt: Kategorien an- und abwählen (mindestens eine bleibt)
  $('einst-arten').onclick = e => {
    const b = e.target.closest('[data-art]');
    if (!b || !raum?.binHost) return;
    const jetzt = gemischtArten(raum.einst.arten);
    const neu = jetzt.includes(b.dataset.art) ? jetzt.filter(k => k !== b.dataset.art) : GEMISCHT_ARTEN.filter(k => jetzt.includes(k) || k === b.dataset.art);
    if (!neu.length) { toast('Mindestens eine Kategorie muss dabei sein.'); return; }
    raum.einstellen({ arten: neu.length === GEMISCHT_ARTEN.length ? null : neu });
  };
  $('einst-arten-alle').onclick = () => { if (raum?.binHost) raum.einstellen({ arten: null }); };
  $('leiter-loesung-knopf').onclick = () => {
    const l = $('leiter-loesung'), f = raum?.frage;
    if (!f) return;
    l.hidden = !l.hidden;
    l.textContent = l.hidden ? '' : kategorieVon(f).loesung(f);
    $('leiter-loesung-knopf').textContent = l.hidden ? 'Lösung zeigen' : 'Lösung verstecken';
  };
  $('los').onclick = () => raum?.starten();
  $('nochmal').onclick = () => raum?.nochmal();
  $('andere-kategorie').onclick = () => raum?.zurueckInDenWarteraum();
  $('raum-code').onclick = async () => {
    const url = `${location.origin}${location.pathname}#/raum/${raum.code}`;
    try { await navigator.clipboard.writeText(url); toast('Einladungslink kopiert.'); } catch { toast(url); }
  };
  $('rate-form').onsubmit = e => {
    e.preventDefault();
    const eingabe = $('rate-eingabe');
    if (!raum || !eingabe.value.trim()) return;
    if (raum.frage?.k === 'schaetzen') {
      const w = raum.schaetzen(eingabe.value);
      const rm = $('rueckmeldung');
      if (w === null) { rm.className = 'rueckmeldung schlecht'; rm.textContent = 'Das ist keine Zahl. Zum Beispiel 1.500 oder 2,5 Mio.'; wackeln(eingabe); return; }
      if (w === 'zu') return;
      eingabe.disabled = true;
      rm.className = 'rueckmeldung'; rm.textContent = `Deine Schätzung: ${zahlText(raum.meineSchaetzung)}. Gleich siehst du, wer am nächsten dran ist.`;
      return;
    }
    const r = raum.raten(eingabe.value);
    const rm = $('rueckmeldung');
    if (r === 'richtig') {
      eingabe.classList.add('richtig'); eingabe.disabled = true;
      const f = raum.tippfehler || 0;
      rm.className = 'rueckmeldung gut';
      rm.textContent = raum.frage?.k === 'bombe' ? `${bombeZuletzt.charAt(0).toUpperCase() + bombeZuletzt.slice(1)} zählt!` : f ? `Richtig, aber ${f === 1 ? '1 Tippfehler' : `${f} Tippfehler`}: −${f * TIPPFEHLER_ABZUG} Punkte.` : zufall(SPRUCH.richtig);
    } else if (r === 'knapp') {
      rm.className = 'rueckmeldung'; rm.textContent = zufall(SPRUCH.knapp); wackeln(eingabe);
    } else if (r === 'falsch') {
      rm.className = 'rueckmeldung schlecht'; rm.textContent = raum.frage?.k === 'bombe' && bombeGrund ? bombeGrund : zufall(SPRUCH.falsch); wackeln(eingabe); eingabe.select();
    }
  };
  $('optionen').onclick = e => {
    const b = e.target.closest('button');
    if (!b || !raum) return;
    const f = raum.frage;
    const r = raum.waehlen(b.dataset.c);
    const rm = $('rueckmeldung');
    if (r !== 'zu' && f?.k === 'mehr') {
      mehrAufdecken($('optionen'), $('frage-bild'), f, b.dataset.c);
      rm.className = 'rueckmeldung ' + (r === 'richtig' ? 'gut' : 'schlecht');
      rm.textContent = `${r === 'richtig' ? 'Richtig' : 'Falsch'}. ${kategorieVon(f).loesung(f)}.`;
      return;
    }
    if (r !== 'zu' && f?.k === 'groesser') {
      duellAufdecken($('optionen'), f, b.dataset.c);
      rm.className = 'rueckmeldung ' + (r === 'richtig' ? 'gut' : 'schlecht');
      rm.textContent = `${r === 'richtig' ? 'Richtig' : 'Falsch'}, ${groessererName(f)} ist größer.`;
      return;
    }
    if (r === 'richtig') { b.classList.add('richtig'); rm.className = 'rueckmeldung gut'; rm.textContent = zufall(SPRUCH.richtig); }
    if (r === 'falsch') { b.classList.add('falsch'); rm.className = 'rueckmeldung schlecht'; rm.textContent = zufall(SPRUCH.falsch); }
    if (r !== 'zu') document.querySelectorAll('#optionen button').forEach(x => { x.disabled = true; });
  };
  emoteListeAufbauen();
  $('chat-form').onsubmit = e => {
    e.preventDefault();
    if (!raum) return;
    emoteListe(false);
    const r = raum.chatten($('chat-eingabe').value);
    if (r === 'hass') { toast('Nicht gesendet. So etwas gibt es hier nicht.'); return; }
    if (r === 'grob') { toast('Nicht gesendet. Der Chat ist eingeschränkt.'); return; }
    $('chat-eingabe').value = '';
  };
}

function zeitleisteStarten(fuellung, restMs, gesamtMs) {
  fuellung.style.transition = 'none';
  fuellung.style.width = `${Math.max(0, restMs / gesamtMs) * 100}%`;
  fuellung.classList.remove('knapp');
  void fuellung.offsetWidth;
  fuellung.style.transition = `width ${restMs}ms linear`;
  fuellung.style.width = '0%';
}

function raumZeichnen() {
  if (!raum) return;
  const r = raum;
  $('raum-code').textContent = r.code;
  freundeOrt(r.code, KATEGORIEN[r.einst?.kategorie]?.name || null);
  const n = r.fragen.length;
  $('raum-runde').textContent = r.phase === 'frage' || r.phase === 'aufloesung' ? `Frage ${r.idx + 1} von ${n}`
    : r.phase === 'ende' ? 'Fertig' : r.phase === 'countdown' ? 'Gleich geht\'s los' : 'Warteraum';

  const sichtbar = { warten: 'p-warten', countdown: 'p-countdown', frage: 'p-frage', aufloesung: 'p-frage', ende: 'p-ende' }[r.phase];
  for (const id of ['p-warten', 'p-countdown', 'p-frage', 'p-ende']) $(id).hidden = id !== sichtbar;
  $('zeitleiste').hidden = !(r.phase === 'frage' || r.phase === 'aufloesung');
  const hostName = r.spieler.get(r.hostId)?.name || r.bekannt.get(r.hostId)?.name;

  if (r.phase === 'warten') {
    const kat = KATEGORIEN[r.einst.kategorie] || KATEGORIEN.flaggen;
    const vWahl = varianteVon(kat, r.einst.variante);
    const auswahlHtml = Object.entries(kat.auswahlen).map(([k, name]) => {
      const anzahl = kat.pool ? kat.pool(k, vWahl).length : 0;
      return `<option value="${k}">${esc(name)}${anzahl ? ` (${anzahl})` : ''}</option>`;
    }).join('');
    if ($('einst-auswahl').dataset.fuer !== r.einst.kategorie + vWahl) { $('einst-auswahl').innerHTML = auswahlHtml; $('einst-auswahl').dataset.fuer = r.einst.kategorie + vWahl; }
    // Variante (Schwierigkeit, Richtung, Darstellung), nur wo es eine gibt
    document.querySelector('.einst-variante').hidden = !kat.varianten;
    if (kat.varianten && $('einst-variante').dataset.fuer !== r.einst.kategorie) {
      $('einst-variante').innerHTML = Object.entries(kat.varianten.werte).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('');
      $('einst-variante').dataset.fuer = r.einst.kategorie;
      $('einst-variante-titel').textContent = kat.varianten.titel;
    }
    // Gemischt: welche Kategorien dabei sind
    const istGemischt = r.einst.kategorie === 'gemischt';
    $('einst-arten-feld').hidden = !istGemischt;
    if (istGemischt) {
      const an = gemischtArten(r.einst.arten);
      $('einst-arten').innerHTML = GEMISCHT_ARTEN.map(k => `<button type="button" class="art-chip${an.includes(k) ? ' an' : ''}" data-art="${k}" aria-pressed="${an.includes(k)}"${r.binHost ? '' : ' disabled'}><span aria-hidden="true">${KATEGORIE_SYMBOL[k] || ''}</span>${esc(KAT_KURZ[k] || KATEGORIEN[k].name)}</button>`).join('');
      $('einst-arten-alle').hidden = !r.binHost || alleArten(r.einst.arten);
    }
    document.querySelectorAll('#einst select').forEach(s => { s.value = String(r.einst[s.dataset.e] ?? STANDARD[s.dataset.e] ?? ''); s.disabled = !r.binHost; });
    if (kat.varianten) $('einst-variante').value = vWahl;
    $('einst-leiter').value = r.einst.leiter ? 'leiten' : 'mit';
    // Hauptstädte gibt es in zwei Richtungen; in der Kategorie-Liste steht nur „Hauptstädte“
    const stadtKat = ['hauptstaedte', 'stadtland'].includes(r.einst.kategorie);
    if (r.einst.kategorie === 'stadtland') $('einst-kategorie').value = 'hauptstaedte';
    document.querySelector('.einst-richtung').hidden = !stadtKat;
    document.querySelector('.einst-ziel').hidden = r.einst.kategorie !== 'karte';
    document.querySelector('.einst-modus').hidden = r.einst.kategorie === 'karte' || !!kat.zahl || !!kat.nurTippen;
    $('einst-richtung').value = r.einst.kategorie === 'stadtland' ? 'stadt' : 'land';
    if (!kat.tippen) { $('einst-modus').value = 'auswahl'; $('einst-modus').disabled = true; }
    einstFelder.forEach(f => f.aktualisieren());
    $('los').hidden = !r.binHost;
    const genug = r.startBereit;
    $('los').disabled = !genug;
    $('los-hinweis').textContent = genug ? '' : r.binHost
        ? (r.ichLeite ? 'Als Spielleiter brauchst du mindestens 2 Mitspieler. Klick oben auf den Code und schick den Link rum.' : 'Starten geht ab 2 Leuten. Klick oben auf den Code und schick den Link rum.')
        : 'Es geht los, sobald genug Leute da sind.';
    $('warten-text').textContent = !r.hostId ? 'Verbinde mit dem Raum …'
      : r.binHost ? 'Stell ein und leg los, sobald alle da sind. Klick auf den Code oben, dann ist der Einladungslink kopiert.'
        : `${hostName || 'Der Gastgeber'} stellt ein und startet gleich.`;
  }

  if (r.phase === 'frage' || r.phase === 'aufloesung') {
    const f = r.frage;
    const kat = kategorieVon(f);
    const eingabe = $('rate-eingabe');
    if (gezeichnet.idx !== r.idx || gezeichnet.umriss !== umrisseDa()) {
      $('frage-hinweis').textContent = kat.hinweis(f);
      $('frage-bild').innerHTML = kat.bild(f);
      $('frage-bild').dataset.art = f.k;
      $('frage-bild').dataset.phase = r.phase;
      gezeichnet.umriss = umrisseDa();
    }
    const istKarte = f.k === 'karte';
    kartenmodus(istKarte);
    $('raum-weltkarte').hidden = !istKarte;
    if (istKarte && gezeichnet.idx !== r.idx) {
      const idx = r.idx;
      kartenPin['raum-weltkarte'] = (lon, lat) => {
        const a = raum?.pinSetzen(lon, lat);
        if (!a) return;
        weltkarte('raum-weltkarte').pin(lon, lat); weltkarte('raum-weltkarte').sperren();
        $('rueckmeldung').className = 'rueckmeldung ' + (a.treffer ? 'gut' : '');
        $('rueckmeldung').textContent = `${kmText(a)} +${a.pkt}. Warte auf die anderen …`;
      };
      karteLaden().then(() => { if (raum && raum.idx === idx) weltkarte('raum-weltkarte').neu(raum.einst.auswahl); });
    }
    if (gezeichnet.idx !== r.idx) {
      eingabe.value = ''; eingabe.disabled = false; eingabe.classList.remove('richtig');
      eingabeVorbereiten(eingabe, f);
      $('rueckmeldung').textContent = ''; $('rueckmeldung').className = 'rueckmeldung';
      $('frage-info').innerHTML = '';
      $('optionen').className = 'optionen' + (kat.optionKlasse ? ' ' + kat.optionKlasse : '');
      $('optionen').innerHTML = f.o ? optionSchluessel(f).map(k => `<button type="button" data-c="${esc(k)}">${kat.option(k, f)}</button>`).join('') : '';
      if (r.phase === 'frage') {
        zeitleisteStarten($('zeitleiste-fuellung'), Math.max(0, r.dauer - (performance.now() - r.start)), r.dauer);
        if (!f.o) setTimeout(() => eingabe.focus(), 30);
      }
    }
    if (r.meinStatus === 'geloest' && istKarte && r.phase === 'frage') {
      const mein = r.geloest.get(r.ich.id);
      $('rueckmeldung').className = 'rueckmeldung' + (mein?.treffer ? ' gut' : '');
      $('rueckmeldung').textContent = `${kmText(mein || { km: 0 })} +${mein?.pkt ?? 0}. Warte auf die anderen …`;
    } else if (r.meinStatus === 'geloest' && f.k === 'schaetzen') {
      eingabe.disabled = true;
      if (r.phase === 'frage') { $('rueckmeldung').className = 'rueckmeldung'; $('rueckmeldung').textContent = `Deine Schätzung: ${zahlText(r.meineSchaetzung ?? r.geloest.get(r.ich.id)?.wert ?? 0)}. Gleich siehst du, wer am nächsten dran ist.`; }
    } else if (r.meinStatus === 'geloest' && !istKarte) {
      const mein = r.geloest.get(r.ich.id);
      eingabe.disabled = true; eingabe.classList.add('richtig');
      $('rueckmeldung').className = 'rueckmeldung gut';
      $('rueckmeldung').textContent = `Richtig! +${mein?.pkt ?? ''}${mein?.rang === 1 ? ', als Erstes' : ''}${mein?.abzug ? ` (−${mein.abzug} für Tippfehler)` : ''}`;
    }
    $('frage-bild').dataset.phase = r.phase;
    $('frage-bild').dataset.entschaerft = r.phase === 'aufloesung' && r.geloest.size >= r.spieler.size ? '1' : '';
    if (r.phase === 'aufloesung' && gezeichnet.phase !== 'aufloesung-' + r.idx) {
      const fl = $('zeitleiste-fuellung');
      fl.style.transition = 'none'; fl.style.width = '0%';
      eingabe.disabled = true;
      $('aufgeloest').textContent = kat.loesung(f);
      $('aufgeloest').classList.toggle('lang', $('aufgeloest').textContent.length > 40);
      $('frage-info').innerHTML = (kat.nachher ? kat.nachher(f) : '') + esc(kat.info ? kat.info(f) : '');
      if (istKarte) {
        const pins = [...r.geloest].filter(([, g]) => g.lon != null).map(([id, g]) => {
          const p = r.spieler.get(id) || r.bekannt.get(id) || {};
          return { lon: g.lon, lat: g.lat, name: id === r.ich.id ? 'Du' : p.name, farbe: id === r.ich.id ? 'var(--sand)' : farbe(p.farbe) };
        });
        karteLaden().then(() => weltkarte('raum-weltkarte').loesung(f.c, f.t, pins, LAND[f.c]?.stadt));
      }
      if (f.k === 'groesser') duellAufdecken($('optionen'), f, null);
      else if (f.k === 'mehr') mehrAufdecken($('optionen'), $('frage-bild'), f, null);
      else document.querySelectorAll('#optionen button').forEach(b => {
        b.disabled = true;
        if (richtigeWahl(f, b.dataset.c)) b.classList.add('richtig');
      });
      const istSchaetz = f.k === 'schaetzen';
      const finder = istKarte
        ? [...r.geloest].sort((a, b) => b[1].pkt - a[1].pkt).map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} ${g.km ? `${g.km.toLocaleString('de-DE')} km` : 'drin'} (+${g.pkt})`)
        : istSchaetz
          ? [...r.geloest].sort((a, b) => b[1].pkt - a[1].pkt).map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} ${zahlText(g.wert)} (+${g.pkt})`)
          : [...r.geloest].sort((a, b) => a[1].rang - b[1].rang).map(([id, g]) => `${r.bekannt.get(id)?.name || '?'} (+${g.pkt})`);
      $('rueckmeldung').className = 'rueckmeldung';
      $('rueckmeldung').textContent = finder.length ? `${istKarte ? 'Pins' : istSchaetz ? 'Schätzungen' : 'Gefunden'}: ${finder.join(', ')}` : istKarte ? 'Keiner hat einen Pin gesetzt.' : istSchaetz ? 'Keiner hat geschätzt.' : 'Keiner hatte es.';
      gezeichnet.phase = 'aufloesung-' + r.idx;
    }
    if (r.phase === 'frage') $('aufgeloest').textContent = '';
    $('rate-form').hidden = !!f.o || istKarte || r.phase === 'aufloesung' || r.ichLeite;
    $('leiter-hinweis').hidden = !r.ichLeite;
    if (r.ichLeite) {
      document.querySelectorAll('#optionen button').forEach(b => { b.disabled = true; });
      const mit = r.mitspieler, fertig = mit.filter(id => r.geloest.has(id) || r.gesperrt.has(id)).length;
      $('leiter-stand').textContent = r.phase === 'aufloesung' ? 'Du leitest diese Runde.' : `Du leitest: ${fertig} von ${mit.length} haben geantwortet.`;
      if (gezeichnet.leiterIdx !== r.idx) { $('leiter-loesung').hidden = true; $('leiter-loesung').textContent = ''; $('leiter-loesung-knopf').textContent = 'Lösung zeigen'; gezeichnet.leiterIdx = r.idx; }
      $('leiter-loesung-knopf').hidden = r.phase === 'aufloesung';
    }
    gezeichnet.idx = r.idx;
  } else {
    kartenmodus(false); $('raum-weltkarte').hidden = true;
    gezeichnet.idx = -2;
  }

  if (r.phase === 'ende') {
    const liste = r.ergebnis || [];
    $('ende-titel').textContent = 'Endstand';
    if (gezeichnet.ende !== r.spielId) {
      gezeichnet.ende = r.spielId;
      $('podest').innerHTML = treppeHtml(liste, r.ich.id, !r.unentschieden);
      $('ende-ruhm').hidden = true;
      if (ich && liste.some(e => e.id === ich.id)) {
        const vorher = ich.ruhm || 0, spielId = r.spielId;
        setTimeout(async () => {
          const plus = await ruhmNachladen(vorher);
          if (plus == null || plus <= 0 || gezeichnet.ende !== spielId) return;
          const mein = liste.find(e => e.id === ich.id);
          const sieg = !r.unentschieden && liste.length >= 2 && liste[0].id === ich.id && (mein?.pkt || 0) > 0;
          const t = r.meineTreffer || 0;
          ruhmAufschluesseln($('ende-ruhm'), vorher, [['Mitgespielt', 10], [`${t} richtig`, t * 3], sieg ? ['Sieg', 20] : null], plus);
          setTimeout(ruhmPruefen, 2800);
        }, 1600);
      }
      $('podest').querySelectorAll('.wert').forEach(w => setTimeout(() => hochzaehlen(w, Number(w.dataset.pkt)), Number(w.dataset.ab || 300)));
      // Konfetti je nach eigenem Platz (bei mehreren Leuten)
      const platz = liste.findIndex(e => e.id === r.ich.id);
      if (liste.length >= 2 && platz >= 0 && platz <= 2 && !(r.unentschieden && platz === 0) && (liste[platz].pkt > 0)) setTimeout(() => konfetti(3 - platz), 350);
    }
    $('nochmal').hidden = !r.binHost;
    $('andere-kategorie').hidden = !r.binHost;
    $('ende-text').textContent = r.binHost
      ? (!r.startBereit ? (r.ichLeite ? 'Als Spielleiter brauchst du mindestens 2 Mitspieler. Nochmal bringt dich in den Warteraum.' : 'Du bist gerade allein im Raum. Nochmal bringt dich in den Warteraum.') : r.ichLeite ? 'Du hast diese Runde geleitet.' : '')
      : `${hostName || 'Der Gastgeber'} entscheidet, wie es weitergeht: nochmal oder andere Kategorie.`;
  }

  // Spielerliste
  const leute = [...r.spieler.values()].sort((a, b) => (a.id === r.leiterId) - (b.id === r.leiterId) || (r.punkte.get(b.id) || 0) - (r.punkte.get(a.id) || 0));
  $('spieler-liste').innerHTML = leute.map(p => {
    const status = r.phase === 'frage' || r.phase === 'aufloesung'
      ? (r.geloest.has(p.id) ? '<span class="status ok" title="Gefunden">✓</span>' : r.gesperrt.has(p.id) ? '<span class="status nein" title="Daneben">✗</span>' : '<span class="status"></span>')
      : '<span class="status"></span>';
    const leitet = p.id === r.leiterId;
    return `<li${leitet ? ' class="leitet"' : ''}>${avatarMitWappen(p, 13)}<span class="name"><span class="${nameKlasse(p).trim()}">${esc(p.name)}</span>${leitet ? '<span class="host">Spielleiter</span>' : p.id === r.hostId ? '<span class="host">Gastgeber</span>' : ''}</span>${leitet ? '<span class="status"></span>' : status}<span class="wert">${leitet ? '–' : r.punkte.get(p.id) || 0}</span></li>`;
  }).join('');

  // Chat
  const cl = $('chat-liste');
  const unten = cl.scrollHeight - cl.scrollTop - cl.clientHeight < 40;
  cl.innerHTML = r.chat.map(m => m.system
    ? `<li class="system">${esc(m.text)}</li>`
    : m.daneben
      ? `<li class="daneben"><span class="daneben-x" aria-label="falsch">✗</span><b>${esc(m.name)}</b> <span class="daneben-text">${esc(m.text)}</span></li>`
      : chatZeile(r, m)).join('');
  if (unten) cl.scrollTop = cl.scrollHeight;
}

// ---------- Neue Version: von selbst neu laden, aber nur in einem ruhigen Moment ----------
// Ruhig heißt: kein Sprint und kein laufendes Spiel, nichts halb Getipptes, kein offenes Fenster.
// Vorher merken wir uns, wo man war (Adresse, Raum, Chat, Filter, Scrollstand).
let neueVersion = null;
const ZURUECK = 'quizbude.zurueck';
const VERSUCH = 'quizbude.update';
const LEISE = 'quizbude.leise';
// Wann hat man zuletzt etwas gemacht? Neu geladen wird erst, wenn der Tab im Hintergrund ist oder 15 s Ruhe war.
let zuletztAktiv = performance.now();
for (const t of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']) addEventListener(t, () => { zuletztAktiv = performance.now(); }, { passive: true, capture: true });

// Nachricht an alle (kommt aus dem Admin-Bereich), lässt sich wegklicken
async function nachrichtPruefen() {
  if (!online()) return;
  const n = (await konfigLaden()).nachricht;
  const el = $('nachricht');
  let weg = null; try { weg = localStorage.getItem('quizbude.nachricht.weg'); } catch { /* egal */ }
  const zeigen = !!(n?.an && n.text && n.text !== weg);
  if (zeigen) $('nachricht-text').textContent = n.text;
  el.hidden = !zeigen;
  $('nachricht-zu').onclick = () => { el.hidden = true; try { localStorage.setItem('quizbude.nachricht.weg', n?.text || ''); } catch { /* egal */ } };
}

async function versionPruefen() {
  nachrichtPruefen();
  if (!neueVersion) {
    try {
      const antwort = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (antwort.ok) {
        const { version } = await antwort.json();
        if (version && version !== VERSION) neueVersion = version;
      }
    } catch { /* offline, dann eben beim nächsten Mal */ }
  }
  updateWennRuhig();
}

function ruhigGenug() {
  if (sprint) return false;
  if (raum && raum.phase !== 'warten') return false;
  if ($('lernen-detail').open || !$('profil-editor').hidden) return false;
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value.trim() && a.id !== 'lernen-suche') return false;
  if (!$('s-anmelden').hidden && [...document.querySelectorAll('#anmelde-form input')].some(i => i.value)) return false;
  return true;
}

function zustandMerken() {
  raum?.merken();
  try {
    sessionStorage.setItem(ZURUECK, JSON.stringify({
      scroll: Math.round(scrollY), hash: location.hash || '#/',
      lernen: { art: lernenArt, region: lernenRegion, suche: $('lernen-suche').value },
      besten: { spalte: besteSpalte, kategorie: $('besten-kategorie').value },
      profilTab: profilTabJetzt, anpassenArt,
    }));
  } catch { /* egal */ }
}

function updateWennRuhig() {
  if (!neueVersion || !ruhigGenug()) return;
  if (!document.hidden && performance.now() - zuletztAktiv < 15000) return;
  let versuch = null;
  try { versuch = JSON.parse(sessionStorage.getItem(VERSUCH) || 'null'); } catch { /* egal */ }
  const zahl = versuch?.ziel === neueVersion ? versuch.zahl : 0;
  if (zahl >= 2) return; // zweimal versucht und immer noch alt: lieber in Ruhe lassen als ständig neu laden
  try { sessionStorage.setItem(VERSUCH, JSON.stringify({ ziel: neueVersion, zahl: zahl + 1 })); } catch { /* egal */ }
  zustandMerken();
  neueVersion = null;
  try { sessionStorage.setItem(LEISE, '1'); } catch { /* egal */ }
  if (zahl === 0) { location.reload(); return; }
  // Beim zweiten Versuch am Zwischenspeicher vorbei
  const u = new URL(location.href); u.searchParams.set('neu', versuch.ziel);
  location.replace(u.toString());
}

function zustandWiederherstellen() {
  const u = new URL(location.href);
  if (u.searchParams.has('neu')) { u.searchParams.delete('neu'); history.replaceState(history.state, '', u.toString()); }
  let z = null;
  try { z = JSON.parse(sessionStorage.getItem(ZURUECK) || 'null'); sessionStorage.removeItem(ZURUECK); } catch { /* egal */ }
  if (!z) return;
  if (z.lernen) {
    lernenArt = z.lernen.art === 'umrisse' ? 'umrisse' : 'flaggen';
    lernenRegion = z.lernen.region in REGIONEN ? z.lernen.region : 'alle';
    $('lernen-suche').value = z.lernen.suche || '';
    document.querySelectorAll('#lernen-art .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x.dataset.art === lernenArt); x.setAttribute('aria-selected', x.dataset.art === lernenArt); });
    document.querySelectorAll('#lernen-region .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.r === lernenRegion));
  }
  if (z.besten) {
    besteSpalte = ['siege', 'punkte', 'sprint'].includes(z.besten.spalte) ? z.besten.spalte : 'siege';
    document.querySelectorAll('#besten-reiter .umschalter-knopf').forEach(x => { x.classList.toggle('aktiv', x.dataset.spalte === besteSpalte); x.setAttribute('aria-selected', x.dataset.spalte === besteSpalte); });
    if (z.besten.kategorie && KATEGORIEN[z.besten.kategorie]) { $('besten-kategorie').value = z.besten.kategorie; bestenFeld?.aktualisieren(); }
  }
  if (z.anpassenArt) anpassenArt = z.anpassenArt;
  if (z.profilTab && z.hash?.startsWith('#/profil')) setTimeout(() => { if (!$('s-profil').hidden) profilTab(z.profilTab); }, 700);
  if (z.hash === (location.hash || '#/') && z.scroll) setTimeout(() => scrollTo(0, z.scroll), z.profilTab ? 900 : 400);
}

window.addEventListener('pagehide', () => zustandMerken());
document.addEventListener('visibilitychange', () => { if (document.hidden) updateWennRuhig(); else versionPruefen(); });
setInterval(versionPruefen, 60000);
setInterval(updateWennRuhig, 3000); // falls die neue Version schon bekannt ist und es gerade ruhig wird

// Countdown und knapp werdende Zeit
setInterval(() => {
  if (raum && raum.phase === 'countdown') {
    const z = String(Math.max(1, Math.ceil((raum.countdownEnde - performance.now()) / 1000)));
    if ($('countdown').textContent !== z) { $('countdown').textContent = z; pulsen($('countdown')); }
  }
  // Während gespielt wird, verschwindet die Leiste unten (verdeckt sonst auf kleinen Bildschirmen die Antworten)
  const spielt = (sprint && !$('s-sprint').hidden && (sprint.laeuft || !sprint.ende))
    || (raum && !$('s-raum').hidden && ['countdown', 'frage', 'aufloesung'].includes(raum.phase));
  document.body.classList.toggle('spielt', !!spielt);
  if (raum && raum.phase === 'frage') {
    const rest = raum.dauer - (performance.now() - raum.start);
    $('zeitleiste-fuellung').classList.toggle('knapp', rest < raum.dauer * 0.3);
  }
  if (sprint && sprint.laeuft) sprintTick();
}, 100);

// ---------- Sprint (allein, jede Kategorie) ----------
const SPRINT_MS = 60000;
const SPRINT_STRAFE = 2000;  // Überspringen
const SPRINT_FALSCH = 5000;  // falsch geklickt (nur bei Auswahl-Fragen)
const SPRINT_COUNTDOWN = 2;  // Sekunden vor der ersten Frage

async function sprintStart(kategorie = 'flaggen') {
  if (!KATEGORIEN[kategorie] || !SPRINT_REIHE.includes(kategorie)) kategorie = 'flaggen';
  // zurück in der Auswahl steht dann diese Kategorie
  sprintWahl = kategorie === 'stadtland' ? 'hauptstaedte' : kategorie;
  if (sprintWahl === 'hauptstaedte') sprintRichtung = kategorie === 'stadtland' ? 'stadt' : 'land';
  try { localStorage.setItem('quizbude.sprintWahl', sprintWahl); localStorage.setItem('quizbude.sprintRichtung', sprintRichtung); } catch { /* egal */ }
  zeige('sprint');
  const region = REGION_KATEGORIEN.includes(kategorie) && sprintRegion !== 'alle' ? sprintRegion : null;
  const kk = KATEGORIEN[kategorie === 'stadtland' ? 'hauptstaedte' : kategorie];
  const variante = varianteVon(kk, sprintVarianten[kategorie]);
  const arten = kategorie === 'gemischt' && !alleArten(sprintArten) ? gemischtArten(sprintArten) : null;
  // Übung (kein Rekord): mit Region, mit anderer als der Standardvariante oder mit eigener Gemischt-Auswahl
  const uebung = [region && REGIONEN_SPRINT[region], variante && variante !== kk.varianten.standard && (kk.varianten.kurz?.[variante] || kk.varianten.werte[variante]), arten && 'eigene Auswahl'].filter(Boolean).join(', ') || null;
  const s = { kategorie, region, variante, arten, uebung, punkte: 0, ende: 0, benutzt: new Set(), verpasst: [], richtige: [], serie: 0, besteSerie: 0, laeuft: false, vorrat: [], frage: null };
  sprint = s;
  $('sp-laeuft').hidden = false; $('sp-ende').hidden = true;
  $('sprint-punkte').textContent = '0';
  $('sprint-zeit').textContent = '60 s';
  $('sprint-leiste').style.width = '100%';
  $('sprint-rueck').textContent = ''; $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-optionen').innerHTML = '';
  $('sprint-form').hidden = true; $('sprint-skip').hidden = true;
  $('sprint-eingabe').classList.remove('wackeln', 'richtig');
  $('sprint-hinweis').textContent = `${KATEGORIEN[kategorie].name}${uebung ? ` (${uebung}, Übung)` : ''}: gleich geht's los`;
  $('sprint-bild').innerHTML = `<p class="countdown" id="sprint-countdown">${SPRINT_COUNTDOWN}</p>`;
  // Während des Countdowns schon Umrisse und die ersten Bilder laden
  bombeBenutzt.clear();
  const laden = Promise.all([['umrisse', 'gemischt'].includes(kategorie) ? umrisseLaden() : null, ['karte', 'nachbarn', 'gemischt'].includes(kategorie) ? karteLaden() : null, kategorie === 'bombe' ? bombeLaden() : null]);
  laden.then(() => { if (sprint === s) while (s.vorrat.length < 2) sprintZiehen(); });
  for (let i = SPRINT_COUNTDOWN; i >= 1; i--) {
    if (sprint !== s) return;
    $('sprint-countdown').textContent = i;
    pulsen($('sprint-countdown'));
    await pause(1000);
  }
  await laden;
  if (sprint !== s) return;
  $('sprint-skip').hidden = false;
  s.ende = performance.now() + SPRINT_MS;
  s.laeuft = true;
  sprintNaechste();
}

function sprintZiehen() {
  const s = sprint;
  const f = sprintFrage(s.kategorie, s.punkte + s.vorrat.length, s.benutzt, s.region, { variante: s.variante, arten: s.arten });
  fragenVorladen([f]); // Bilder schon mal laden, damit es ohne Warten weitergeht
  s.vorrat.push(f);
}

function sprintNaechste() {
  const s = sprint;
  while (s.vorrat.length < 2) sprintZiehen();
  const f = s.vorrat.shift();
  sprintZiehen();
  s.frage = f;
  s.versucht = false;
  const kat = kategorieVon(f);
  $('sprint-hinweis').textContent = kat.hinweis(f);
  $('sprint-bild').innerHTML = kat.bild(f); // jedes Mal neue Elemente, nie ein altes Bild
  const istKarte = f.k === 'karte';
  kartenmodus(istKarte);
  $('sprint-weltkarte').hidden = !istKarte;
  if (istKarte) {
    kartenPin['sprint-weltkarte'] = (lon, lat) => sprintPin(lon, lat);
    weltkarte('sprint-weltkarte').neu(s.region);
  }
  const eingabe = $('sprint-eingabe');
  $('sprint-form').hidden = !!f.o || istKarte;
  $('sprint-optionen').className = 'optionen' + (kat.optionKlasse ? ' ' + kat.optionKlasse : '');
  $('sprint-optionen').innerHTML = f.o ? optionSchluessel(f).map(k => `<button type="button" data-c="${esc(k)}">${kat.option(k, f)}</button>`).join('') : '';
  eingabe.value = '';
  eingabeVorbereiten(eingabe, f);
  if (!f.o && !istKarte) setTimeout(() => eingabe.focus(), 20);
}

// Weltkarte im Sprint: Treffer = im Land bzw. Hauptstadt höchstens 150 km daneben; Auflösung kurz zeigen, Uhr steht so lange
function sprintPin(lon, lat) {
  const s = sprint;
  if (!s?.laeuft || s.frage?.k !== 'karte' || s.pauseSeit) return;
  const f = s.frage, a = auswerten(f.c, f.t, lon, lat), k = weltkarte('sprint-weltkarte');
  s.pauseSeit = performance.now();
  k.loesung(f.c, f.t, [{ lon, lat, name: 'Du', farbe: 'var(--sand)' }], LAND[f.c]?.stadt);
  const rm = $('sprint-rueck');
  if (a.treffer) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = a.km ? `${kmText(a)}, zählt!` : 'Getroffen!'; }
  else { s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = `${kmText(a)}. Das war ${kategorieVon(f).loesung(f)}.`; }
  setTimeout(() => {
    if (sprint !== s || !s.laeuft) return;
    s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
    if (s.frage === f) sprintNaechste();
  }, a.treffer ? 1200 : 2200);
}

function sprintSchaetzen() {
  const s = sprint, f = s.frage, eingabe = $('sprint-eingabe'), rm = $('sprint-rueck');
  if (s.pauseSeit) return;
  const wert = zahlLesen(eingabe.value), w = schaetzWertung(f, wert);
  if (!w) { rm.className = 'rueckmeldung schlecht'; rm.textContent = 'Das ist keine Zahl. Zum Beispiel 1.500 oder 2,5 Mio.'; wackeln(eingabe); return; }
  s.pauseSeit = performance.now();
  const loesung = kategorieVon(f).loesung(f);
  // Auflösung groß unter der Frage, bleibt kurz stehen, dann erst die nächste Frage
  $('sprint-bild').querySelector('.bild-schaetzen')?.insertAdjacentHTML('beforeend', `<div class="schaetz-loesung ${w.treffer ? 'gut' : 'schlecht'}"><b>${esc(loesung)}</b><span>Du: ${esc(zahlText(wert))}, ${esc(w.abweichung)} daneben</span></div>`);
  if (w.treffer) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = 'Stark, das zählt!'; }
  else { s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = 'Zu weit weg.'; }
  eingabe.disabled = true;
  setTimeout(() => {
    eingabe.disabled = false;
    rm.textContent = ''; rm.className = 'rueckmeldung';
    if (sprint !== s || !s.laeuft) return;
    s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
    if (s.frage === f) sprintNaechste();
  }, w.treffer ? 1900 : 2600);
}

function punktePop() {
  $('sprint-punkte').textContent = sprint.punkte;
  pulsen($('sprint-punkte').parentElement, 'pop');
  plusEins($('sprint-punkte').parentElement);
}

function trefferMerken(s) {
  s.richtige.push(s.frage);
  s.serie++; s.besteSerie = Math.max(s.besteSerie, s.serie);
}
function sprintTreffer() {
  trefferMerken(sprint);
  sprint.punkte++;
  punktePop();
  $('sprint-rueck').className = 'rueckmeldung gut'; $('sprint-rueck').textContent = zufall(SPRUCH.richtig);
  sprintNaechste();
}

function sprintTick() {
  const rest = Math.max(0, sprint.ende - (sprint.pauseSeit || performance.now())); // während einer Auflösung steht die Uhr
  $('sprint-zeit').textContent = `${Math.ceil(rest / 1000)} s`;
  const fl = $('sprint-leiste');
  fl.style.width = `${(rest / SPRINT_MS) * 100}%`;
  fl.classList.toggle('knapp', rest < 10000);
  if (rest <= 0) sprintEnde();
}

async function sprintEnde() {
  const s = sprint;
  s.laeuft = false;
  // Die Frage beim Abpfiff zählt nur als ausgelassen, wenn man schon etwas versucht oder eingetippt hatte
  if (s.frage && !s.verpasst.includes(s.frage) && (s.versucht || (!s.frage.o && $('sprint-eingabe').value.trim()))) s.verpasst.push(s.frage);
  const kat = KATEGORIEN[s.kategorie];
  $('sp-laeuft').hidden = true; $('sp-ende').hidden = false;
  kartenmodus(false); $('sprint-weltkarte').hidden = true;
  $('sprint-kat').textContent = `${kat.name}${s.uebung ? `, ${s.uebung} (Übung)` : ''}`;
  hochzaehlen($('sprint-ergebnis'), s.punkte, n => n);
  // Listen: richtig und ausgelassen
  $('sprint-richtig').innerHTML = s.richtige.map(f => `<li>${kategorieVon(f).kurz(f)}</li>`).join('');
  $('sprint-richtig-zahl').textContent = s.richtige.length;
  $('sprint-richtig-bereich').hidden = !s.richtige.length;
  $('sprint-verpasst').innerHTML = s.verpasst.map(f => `<li>${kategorieVon(f).kurz(f)}</li>`).join('');
  $('sprint-verpasst-zahl').textContent = s.verpasst.length;
  $('sprint-verpasst-bereich').hidden = !s.verpasst.length;
  const alt = s.uebung ? 0 : sprintRekord(s.kategorie);
  const neuerRekord = !s.uebung && s.punkte > alt && s.punkte > 0;
  // Werte
  const wert = (zahl, text) => `<div><b>${zahl}</b><span>${text}</span></div>`;
  const werteZeichnen = platz => {
    $('sprint-werte').innerHTML = wert(s.punkte ? `${(60 / s.punkte).toLocaleString('de-DE', { maximumFractionDigits: 1 })} s` : '–', 'pro Treffer')
      + wert(s.besteSerie, 'beste Serie') + wert(s.verpasst.length, 'ausgelassen')
      + wert(s.uebung ? 'Übung' : !ich ? '–' : platz ?? '…', s.uebung ? 'zählt nicht' : !ich ? 'nur mit Konto' : 'Saisonplatz');
  };
  werteZeichnen(null);
  // Vergleich mit dem Rekord
  const max = Math.max(s.punkte, alt, 1);
  $('sprint-vergleich').hidden = !!s.uebung;
  $('sprint-vergleich').innerHTML = s.uebung ? '' : `
    <div class="sv-zeile${neuerRekord ? ' neu' : ''}"><span>Jetzt</span><span class="sv-balken"><i style="--w:${(s.punkte / max).toFixed(3)}"></i></span><b>${s.punkte}</b></div>
    <div class="sv-zeile alt"><span>${neuerRekord ? 'Alter Rekord' : 'Rekord'}</span><span class="sv-balken"><i style="--w:${(alt / max).toFixed(3)}"></i></span><b>${alt || '–'}</b></div>`;
  const rekordText = $('sprint-rekord');
  rekordText.classList.toggle('rekord-neu', neuerRekord);
  rekordText.textContent = s.uebung ? 'Übungsrunde: Rekorde und Ruhm gibt es mit den Standard-Einstellungen.'
    : neuerRekord ? (alt ? `Neuer Rekord! ${s.punkte - alt} mehr als vorher.` : 'Dein erster Rekord steht.')
    : alt - s.punkte <= 2 && s.punkte ? `Knapp! Nur ${alt - s.punkte || 'null'} unter deinem Rekord.` : `Noch ${alt - s.punkte} bis zu deinem Rekord.`;
  if (neuerRekord) setTimeout(() => konfetti(alt ? 3 : 2), 500);
  $('sprint-ruhm').hidden = true;
  if (s.uebung) return;
  if (ich && online()) {
    const vorher = ich.ruhm || 0;
    const neu = await sprintEintragen(s.punkte, s.kategorie);
    if (typeof neu === 'number') ich.rekorde = { ...(ich.rekorde || {}), [s.kategorie]: neu };
    ruhmNachladen(vorher).then(plus => {
      if (plus == null || plus <= 0 || sprint !== s) return;
      ruhmAufschluesseln($('sprint-ruhm'), vorher, [['Sprint gespielt', 4], [`${s.punkte} ${s.punkte === 1 ? 'Treffer' : 'Treffer'}`, s.punkte], neuerRekord && alt ? ['Rekord verbessert', s.punkte - alt] : neuerRekord ? ['Erster Rekord', s.punkte] : null], plus);
      setTimeout(ruhmPruefen, 2600);
    });
    // Saisonplatz in dieser Kategorie
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    sprintBestenliste(s.kategorie, start.toISOString()).then(l => {
      if (sprint !== s) return;
      const i = l.findIndex(p => p.id === ich.id);
      werteZeichnen(i >= 0 ? `#${i + 1}` : 'ab 16');
    }).catch(() => werteZeichnen('–'));
  } else if (s.punkte > alt) {
    try { localStorage.setItem('quizbude.sprint.gast.' + s.kategorie, s.punkte); } catch { /* egal */ }
  }
}

// Ruhm-Zuwachs Posten für Posten, Summe zählt hoch, Balken füllt sich (bei Aufstieg erst voll, dann neue Karte)
function ruhmAufschluesseln(box, vorher, posten, gesamt) {
  const liste = posten.filter(p => p && p[1] > 0);
  const summe = liste.reduce((s, p) => s + p[1], 0);
  if (summe !== gesamt) liste.push(['Sonstiges', gesamt - summe]); // falls der Server anders gerechnet hat
  const alt = ruhmInfo(vorher), neu = ruhmInfo(vorher + gesamt), aufstieg = neu.i > alt.i;
  const text = i => i.bis ? `noch ${i.fehlt.toLocaleString('de-DE')} bis ${stufeInfo(i.i + 1).name}` : 'Joker erreicht';
  box.style.setProperty('--rang', alt.rang.farbe);
  box.classList.remove('rp-hoch'); // vom letzten Spiel
  box.innerHTML = `
    <div class="rp-kopf">${wappen(vorher, { groesse: 26 })}<b class="rp-summe">+0</b><span>Ruhm</span></div>
    <ul class="rp-posten">${liste.map(([n, w], i) => `<li style="--i:${i}"><span>${esc(n)}</span><b>+${w}</b></li>`).join('')}</ul>
    <div class="rp-leiste"><span class="ruhm-balken"><i style="--anteil:${alt.anteil.toFixed(3)}"></i></span><small class="rp-text">${text(alt)}</small></div>`;
  box.hidden = false;
  const verz = 250 + liste.length * 260;
  setTimeout(() => hochzaehlen(box.querySelector('.rp-summe'), gesamt, n => `+${n}`), 300);
  const balken = box.querySelector('.ruhm-balken i');
  setTimeout(() => {
    if (!aufstieg) { balken.style.setProperty('--anteil', neu.anteil.toFixed(3)); box.querySelector('.rp-text').textContent = text(neu); return; }
    balken.style.setProperty('--anteil', 1);
    setTimeout(() => {
      box.style.setProperty('--rang', neu.rang.farbe);
      box.querySelector('.rp-kopf .wappen').outerHTML = wappen(vorher + gesamt, { groesse: 26 });
      balken.style.transition = 'none'; balken.style.setProperty('--anteil', 0); void balken.offsetWidth; balken.style.transition = '';
      balken.style.setProperty('--anteil', neu.anteil.toFixed(3));
      box.querySelector('.rp-text').textContent = `Neu: ${neu.name}! ${text(neu)}`;
      box.classList.add('rp-hoch');
    }, 950);
  }, verz);
}

// Region für Sprints in Flaggen, Umrisse, Hauptstädte (Übung)
const REGION_KATEGORIEN = ['flaggen', 'karte', 'umrisse', 'hauptstaedte', 'stadtland', 'nachbarn', 'buchstaben'];
let sprintRichtung = (() => { try { return localStorage.getItem('quizbude.sprintRichtung') === 'stadt' ? 'stadt' : 'land'; } catch { return 'land'; } })();
const sprintKat = k => (k === 'hauptstaedte' && sprintRichtung === 'stadt' ? 'stadtland' : k);
const REGIONEN_SPRINT = { alle: 'Alle', europa: 'Europa', afrika: 'Afrika', asien: 'Asien', amerika: 'Amerika', ozeanien: 'Ozeanien' };
let sprintRegion = (() => { try { return localStorage.getItem('quizbude.sprintRegion') || 'alle'; } catch { return 'alle'; } })();
if (!REGIONEN_SPRINT[sprintRegion]) sprintRegion = 'alle';
// Weitere Einstellungen im Sprint: Variante je Kategorie und was in „Gemischt“ vorkommt (alles außer Standard ist Übung)
const VARIANTEN_KATEGORIEN = ['flaggen', 'nachbarn', 'buchstaben'];
let sprintVarianten = (() => { try { return JSON.parse(localStorage.getItem('quizbude.sprintVarianten') || '{}') || {}; } catch { return {}; } })();
let sprintArten = (() => { try { const a = JSON.parse(localStorage.getItem('quizbude.sprintArten') || 'null'); return Array.isArray(a) ? a : null; } catch { return null; } })();
const sprintIstUebung = k => (sprintRegion !== 'alle' && REGION_KATEGORIEN.includes(k))
  || (KATEGORIEN[k]?.varianten && varianteVon(KATEGORIEN[k], sprintVarianten[k]) !== KATEGORIEN[k].varianten.standard)
  || (k === 'gemischt' && !alleArten(sprintArten));

function sprintAufbauen() {
  const liste = $('sprint-liste');
  liste.onclick = e => {
    const z = e.target.closest('.sl-zeile');
    if (!z) return;
    // Enter auf der schon gewählten Zeile startet (Tastatur-Klick hat detail 0)
    if (z.dataset.k === sprintWahl && e.detail === 0) { sprintLos(); return; }
    sprintWaehlen(z.dataset.k);
  };
  liste.ondblclick = e => { if (e.target.closest('.sl-zeile')) sprintLos(); };
  liste.onkeydown = e => {
    const z = e.target.closest('.sl-zeile');
    if (!z || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const zeilen = [...liste.querySelectorAll('.sl-zeile')], i = zeilen.indexOf(z);
    const ziel = zeilen[e.key === 'Home' ? 0 : e.key === 'End' ? zeilen.length - 1 : Math.min(zeilen.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    e.preventDefault();
    ziel.focus();
    sprintWaehlen(ziel.dataset.k);
  };
  $('sprint-vorschau').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if ('start' in d) { sprintLos(); return; }
    if (d.r) {
      sprintRegion = d.r;
      try { localStorage.setItem('quizbude.sprintRegion', sprintRegion); } catch { /* egal */ }
      sprintEinstellungGeaendert(`[data-r="${d.r}"]`);
    } else if (d.ri) {
      sprintRichtung = d.ri;
      try { localStorage.setItem('quizbude.sprintRichtung', sprintRichtung); } catch { /* egal */ }
      sprintEinstellungGeaendert(`[data-ri="${d.ri}"]`);
    } else if (d.v) {
      sprintVarianten = { ...sprintVarianten, [sprintWahl]: d.v };
      try { localStorage.setItem('quizbude.sprintVarianten', JSON.stringify(sprintVarianten)); } catch { /* egal */ }
      sprintEinstellungGeaendert(`[data-v="${d.v}"]`);
    } else if (d.sart) {
      const jetzt = gemischtArten(sprintArten);
      const neu = jetzt.includes(d.sart) ? jetzt.filter(k => k !== d.sart) : GEMISCHT_ARTEN.filter(k => jetzt.includes(k) || k === d.sart);
      if (!neu.length) { toast('Mindestens eine Kategorie muss dabei sein.'); return; }
      sprintArten = neu.length === GEMISCHT_ARTEN.length ? null : neu;
      try { localStorage.setItem('quizbude.sprintArten', JSON.stringify(sprintArten)); } catch { /* egal */ }
      sprintEinstellungGeaendert(`[data-sart="${d.sart}"]`);
    } else if ('standard' in d) {
      const kk = sprintKat(sprintWahl);
      if (REGION_KATEGORIEN.includes(kk)) sprintRegion = 'alle';
      if (VARIANTEN_KATEGORIEN.includes(sprintWahl)) sprintVarianten = { ...sprintVarianten, [sprintWahl]: KATEGORIEN[sprintWahl].varianten.standard };
      if (sprintWahl === 'gemischt') sprintArten = null;
      try {
        localStorage.setItem('quizbude.sprintRegion', sprintRegion);
        localStorage.setItem('quizbude.sprintVarianten', JSON.stringify(sprintVarianten));
        localStorage.setItem('quizbude.sprintArten', JSON.stringify(sprintArten));
      } catch { /* egal */ }
      sprintEinstellungGeaendert('[data-start]');
    }
  };
  $('sprint-form').onsubmit = e => {
    e.preventDefault();
    if (!sprint?.laeuft || !sprint.frage || sprint.frage.o) return;
    if (sprint.frage.k === 'schaetzen') { sprintSchaetzen(); return; }
    const eingabe = $('sprint-eingabe');
    const r = pruefeFrage(sprint.frage, eingabe.value);
    const rm = $('sprint-rueck');
    if (r === 'richtig' && sprint.frage.k === 'bombe') { sprint.frage.w = bombeZuletzt; bombeBenutzt.add(bombeZuletzt); }
    if (r === 'richtig') sprintTreffer();
    else if (r === 'knapp') { rm.className = 'rueckmeldung'; rm.textContent = zufall(SPRUCH.knapp); wackeln(eingabe); }
    else if (r === 'falsch') { sprint.versucht = true; rm.className = 'rueckmeldung schlecht'; rm.textContent = sprint.frage.k === 'bombe' && bombeGrund ? bombeGrund : zufall(SPRUCH.falsch); wackeln(eingabe); eingabe.select(); }
  };
  $('sprint-optionen').onclick = e => {
    const b = e.target.closest('button');
    const s = sprint;
    if (!b || !s?.laeuft || !s.frage?.o || b.disabled || s.pauseSeit) return;
    const f = s.frage;
    if (f.k === 'mehr') {
      const ok = richtigeWahl(f, b.dataset.c);
      s.pauseSeit = performance.now();
      mehrAufdecken($('sprint-optionen'), $('sprint-bild'), f, b.dataset.c);
      const rm = $('sprint-rueck');
      if (ok) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = `Richtig. ${kategorieVon(f).loesung(f)}.`; }
      else { s.ende -= SPRINT_FALSCH; s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = `Falsch. ${kategorieVon(f).loesung(f)}. Minus 5 Sekunden.`; }
      setTimeout(() => {
        if (sprint !== s || !s.laeuft) return;
        s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
        if (s.frage === f) sprintNaechste();
      }, ok ? 1100 : 1900);
      return;
    }
    if (f.k === 'groesser') {
      // Auflösung zeigen, die Uhr steht so lange
      const ok = richtigeWahl(f, b.dataset.c);
      s.pauseSeit = performance.now();
      duellAufdecken($('sprint-optionen'), f, b.dataset.c);
      const rm = $('sprint-rueck');
      if (ok) { trefferMerken(s); s.punkte++; punktePop(); rm.className = 'rueckmeldung gut'; rm.textContent = `Richtig, ${groessererName(f)} ist größer.`; }
      else { s.ende -= SPRINT_FALSCH; s.verpasst.push(f); s.serie = 0; rm.className = 'rueckmeldung schlecht'; rm.textContent = `Falsch, ${groessererName(f)} ist größer. Minus 5 Sekunden.`; }
      setTimeout(() => {
        if (sprint !== s || !s.laeuft) return;
        s.ende += performance.now() - s.pauseSeit; s.pauseSeit = null;
        if (s.frage === f) sprintNaechste();
      }, ok ? 1300 : 1900);
      return;
    }
    if (richtigeWahl(f, b.dataset.c)) { sprintTreffer(); return; }
    // falsch: richtige Antwort kurz zeigen, Zeit abziehen, weiter
    s.ende -= SPRINT_FALSCH;
    s.verpasst.push(f); s.serie = 0;
    document.querySelectorAll('#sprint-optionen button').forEach(x => {
      x.disabled = true;
      if (richtigeWahl(f, x.dataset.c)) x.classList.add('richtig');
    });
    b.classList.add('falsch');
    $('sprint-rueck').className = 'rueckmeldung schlecht'; $('sprint-rueck').textContent = `${zufall(SPRUCH.falsch)} Minus 5 Sekunden.`;
    setTimeout(() => { if (sprint === s && s.laeuft && s.frage === f) sprintNaechste(); }, 800);
  };
  $('sprint-skip').onclick = () => sprintUeberspringen();
  $('sprint-nochmal').onclick = () => sprintStart(sprint?.kategorie);
}

function sprintUeberspringen() {
  const s = sprint;
  if (!s?.laeuft || !s.frage || s.pauseSeit) return;
  s.verpasst.push(s.frage); s.serie = 0;
  s.ende -= SPRINT_STRAFE;
  $('sprint-rueck').className = 'rueckmeldung';
  $('sprint-rueck').textContent = `Das war ${kategorieVon(s.frage).loesung(s.frage)}.`;
  sprintNaechste();
}

// Tastenkürzel: Pfeil rechts oder Alt+D = überspringen, 1–4 = Antwort wählen
document.addEventListener('keydown', e => {
  const imSprint = sprint?.laeuft && !$('s-sprint').hidden;
  const imRaum = raum && raum.phase === 'frage' && !$('s-raum').hidden;
  if (!imSprint && !imRaum) return;
  const ziel = e.target;
  const tippt = ziel instanceof HTMLInputElement || ziel instanceof HTMLTextAreaElement;
  // Mehr oder weniger: Pfeil hoch = mehr (höher, später …), Pfeil runter = weniger
  const frageJetzt = imSprint ? sprint.frage : raum?.frage;
  if (frageJetzt?.k === 'mehr' && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !tippt && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const k = document.querySelector(`${imSprint ? '#sprint-optionen' : '#optionen'} button[data-c="${e.key === 'ArrowUp' ? 'mehr' : 'weniger'}"]`);
    e.preventDefault();
    if (k && !k.disabled) k.click();
    return;
  }
  if (imSprint) {
    if (e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); sprintUeberspringen(); return; }
    if (e.key === 'ArrowRight' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      const amEnde = !tippt || ziel.id !== 'sprint-eingabe' || (ziel.selectionStart === ziel.value.length && ziel.selectionEnd === ziel.value.length);
      if (amEnde) { e.preventDefault(); sprintUeberspringen(); }
      return;
    }
  }
  // Antworten: 1–4 oder A–D (Buchstaben nur, wenn man nicht gerade in ein Feld tippt)
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const taste = e.key.toLowerCase();
  const nr = /^[1-4]$/.test(taste) && !(tippt && ziel.id === 'chat-eingabe') ? Number(taste)
    : /^[a-d]$/.test(taste) && !tippt ? 'abcd'.indexOf(taste) + 1 : 0;
  if (nr) {
    const knoepfe = [...document.querySelectorAll(imSprint ? '#sprint-optionen button' : '#optionen button')];
    const k = knoepfe[nr - 1];
    if (k && !k.disabled) { e.preventDefault(); k.click(); }
  }
});

// ---------- Tastenliste ----------
document.addEventListener('click', e => { if (e.target.closest('.tasten-knopf')) $('tasten-dialog').showModal(); });
$('tasten-zu').onclick = () => $('tasten-dialog').close();
$('tasten-dialog').onclick = e => { if (e.target === $('tasten-dialog')) $('tasten-dialog').close(); };
document.addEventListener('keydown', e => {
  const tippt = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  if (e.key === '?' && !tippt && !$('tasten-dialog').open) { e.preventDefault(); $('tasten-dialog').showModal(); }
});

// ---------- Weiche ----------
let geroutet = null;

function route(erzwingen = false) {
  const h = location.hash || '#/';
  if (!erzwingen && h === geroutet) return; // popstate und hashchange kommen oft beide
  geroutet = h;
  const nav = h === '#/lernen' ? 'lernen' : h.startsWith('#/sprint') ? 'sprint' : h.startsWith('#/raum/') || h.startsWith('#/profil') ? '' : 'bude';
  document.querySelectorAll('.dock-link').forEach(a => a.classList.toggle('aktiv', a.dataset.nav === nav));
  if (raum && h !== '#/raum/' + raum.code) { raum.verlassen(); raum = null; }
  if (sprint && !/^#\/sprint\/[a-z]+$/.test(h)) { sprint.laeuft = false; sprint = null; }
  if (h !== '#/' && lobbyAus) { lobbyAus(); lobbyAus = null; }
  if (!$('s-lernen').hidden && h !== '#/lernen' && $('lernen-detail').open) $('lernen-detail').close();
  freundePruefen(h);
  chipZeichnen();
  if (h === '#/lernen') return lernenZeigen();
  if (h === '#/sprint') return sprintWahlZeigen();
  const sm = h.match(/^#\/sprint\/([a-z]+)$/);
  if (sm) return sprintStart(sm[1]);
  if (h === '#/anmelden') return anmeldenZeigen();
  if (!ich && !gast) return anmeldenZeigen();
  if (!ich && h.startsWith('#/profil')) return anmeldenZeigen(); // Profil gibt es nur mit Konto
  chipZeichnen();
  const pm = h.match(/^#\/profil(?:\/([0-9a-f-]{36}))?$/);
  if (pm) return profilZeigen(pm[1]);
  const m = h.match(/^#\/raum\/([A-Za-z]{4})$/);
  if (m) {
    const code = m[1].toUpperCase();
    if (m[1] !== code) { history.replaceState(history.state, '', '#/raum/' + code); return route(true); }
    return raumBetreten(code);
  }
  return budeZeigen();
}

// ---------- Ladebildschirm: kurz Schriften, Bilder und Effekte vorbereiten ----------
const bildLaden = src => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = src; });
const naechstesBild = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
function ladeSchritt(_text, anteil) {
  const f = $('lade-fuellung');
  if (f) f.style.transform = `scaleX(${anteil})`;
}
async function vorbereiten() {
  ladeSchritt('Schriften laden …', .2);
  await Promise.race([document.fonts?.ready, pause(1200)]);
  ladeSchritt('Flaggen aufhängen …', .45);
  const bilder = ['bilder/logo.svg', 'bilder/weltkarte-vorschau.svg', 'bilder/umriss-vorschau.svg', ...['JP', 'BR', 'SE', 'CA'].map(flaggeUrl)];
  await Promise.race([Promise.all(bilder.map(bildLaden)), pause(1500)]);
  // Effekte und Karten einmal unsichtbar zeichnen, damit sie danach sofort flüssig laufen
  ladeSchritt('Karten mischen …', .75);
  const probe = document.createElement('div');
  probe.className = 'lade-probe'; probe.setAttribute('aria-hidden', 'true');
  probe.innerHTML = RAENGE.map((r, i) => hochkarteHtml({ name: 'Probe', avatar: '🙂', farbe: '#CDB68C', ruhm: SCHWELLEN[Math.min(SCHWELLEN.length - 1, i * 4 + 3)], spiele: 0, siege: 0 }, { effekt: r.id, rahmen: r.id, hintergrund: r.id, farbe: r.id })).join('');
  document.body.append(probe);
  await naechstesBild();
  probe.remove();
  ladeSchritt('Los geht’s', 1);
}
async function ladeEnde(vorbereitung, start) {
  if (!$('lade')) return;
  await Promise.race([vorbereitung, pause(2500)]);
  // Das Logo kommt erst nach 0,25 s. Ist es schon zu sehen, bleibt es kurz stehen statt aufzublitzen.
  const dauer = performance.now() - start;
  if (dauer > 250 && dauer < 750) await pause(750 - dauer);
  $('lade').classList.add('weg');
  setTimeout(() => $('lade')?.remove(), 600);
}

async function los() {
  const ladeStart = performance.now();
  // Nach einem Update im Hintergrund: kein Ladebildschirm, man ist sofort wieder da, wo man war
  let leise = false;
  try { leise = sessionStorage.getItem(LEISE) === '1'; sessionStorage.removeItem(LEISE); } catch { /* egal */ }
  if (leise) $('lade')?.remove();
  const vorbereitung = vorbereiten().catch(() => {});
  $('version').textContent = VERSION;
  anmeldenAufbauen();
  budeAufbauen();
  raumAufbauen();
  sprintAufbauen();
  profilAufbauen();
  lernenAufbauen();
  freundeAufbauen();
  zustandWiederherstellen();
  // Direktlink (z. B. Einladung in einen Raum): die Bude kommt darunter, damit „Zurück" dorthin führt
  const start = location.hash || '#/';
  if (history.state?.qbTiefe == null) {
    if (start !== '#/') { history.replaceState({ qbTiefe: 0 }, '', '#/'); history.pushState({ qbTiefe: 1, vorher: '#/' }, '', start); }
    else history.replaceState({ qbTiefe: 0 }, '', '#/');
  }
  window.addEventListener('popstate', () => route());
  window.addEventListener('hashchange', () => route());
  if (online()) {
    try {
      const user = await sitzungHolen();
      if (user) await profilHolen(user);
      if (!ich && gast) lobbyStart(); // Gäste sehen die offenen Räume auch
    } catch (e) {
      console.warn('[Quizbude] Sitzung nicht wiederhergestellt', e);
      if (e.sichtbar) setTimeout(() => { $('anmelde-fehler').textContent = e.message; }, 50);
    }
    nachrichtPruefen();
    sb.auth.onAuthStateChange(ereignis => {
      if (ereignis === 'SIGNED_OUT' && ich) { ich = null; chipZeichnen(); route(true); }
    });
  }
  route(true);
  ladeEnde(vorbereitung, ladeStart);
  if (!ich) setTimeout(saisonPruefen, 2500); // Gäste schließen eine beendete Saison genauso ab
  setTimeout(versionPruefen, 4000);
}

// Für die Fehlersuche in der Konsole: quizbude.raum
// Bilder und Links nicht wegziehen lassen
document.addEventListener('dragstart', e => { if (e.target.closest?.('img, svg, a')) e.preventDefault(); });

window.quizbude = { get raum() { return raum; }, get sprint() { return sprint; }, versionPruefen };

los();
