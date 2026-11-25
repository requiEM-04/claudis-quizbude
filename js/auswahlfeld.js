// Eigene Klappliste über einem normalen <select>.
// Das <select> bleibt (unsichtbar) die Quelle für Wert, Optionen und change-Ereignis.
const PFEIL = '<svg class="feld-pfeil" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const HAKEN = '<svg class="feld-haken" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let offenesFeld = null;
document.addEventListener('pointerdown', e => {
  if (offenesFeld && !offenesFeld.huelle.contains(e.target)) offenesFeld.schliessen();
});

export function auswahlfeld(select, { symbol } = {}) {
  const huelle = document.createElement('div');
  huelle.className = 'feld';
  huelle.innerHTML = `<button type="button" class="feld-knopf" aria-haspopup="listbox" aria-expanded="false"></button><ul class="feld-liste" role="listbox" tabindex="-1" hidden></ul>`;
  select.classList.add('nativ');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.after(huelle);
  const knopf = huelle.querySelector('.feld-knopf');
  const liste = huelle.querySelector('.feld-liste');
  let aktiv = 0;

  const inhalt = o => `${symbol ? `<span class="feld-symbol">${symbol(o.value) || ''}</span>` : ''}<span class="feld-text">${esc(o.textContent)}</span>`;

  function aktualisieren() {
    const o = select.options[select.selectedIndex];
    knopf.innerHTML = (o ? inhalt(o) : '<span class="feld-text"></span>') + PFEIL;
    knopf.disabled = select.disabled;
    huelle.classList.toggle('gesperrt', select.disabled);
    if (!liste.hidden) listeBauen();
  }

  function listeBauen() {
    liste.innerHTML = [...select.options].map((o, i) => `
      <li role="option" data-i="${i}" aria-selected="${i === select.selectedIndex}" class="${i === aktiv ? 'aktiv' : ''}">${inhalt(o)}${HAKEN}</li>`).join('');
  }

  function oeffnen() {
    if (select.disabled) return;
    if (offenesFeld && offenesFeld !== feld) offenesFeld.schliessen();
    aktiv = Math.max(0, select.selectedIndex);
    listeBauen();
    liste.hidden = false;
    huelle.classList.add('offen');
    knopf.setAttribute('aria-expanded', 'true');
    offenesFeld = feld;
    liste.focus({ preventScroll: true });
    liste.querySelector('.aktiv')?.scrollIntoView({ block: 'nearest' });
  }

  function schliessen(fokus = false) {
    liste.hidden = true;
    huelle.classList.remove('offen');
    knopf.setAttribute('aria-expanded', 'false');
    if (offenesFeld === feld) offenesFeld = null;
    if (fokus) knopf.focus();
  }

  function waehlen(i) {
    if (i !== select.selectedIndex) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    aktualisieren();
    schliessen(true);
  }

  function markieren(i) {
    aktiv = (i + select.options.length) % select.options.length;
    liste.querySelectorAll('li').forEach((li, n) => li.classList.toggle('aktiv', n === aktiv));
    liste.querySelector('.aktiv')?.scrollIntoView({ block: 'nearest' });
  }

  knopf.addEventListener('click', () => (liste.hidden ? oeffnen() : schliessen()));
  knopf.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); oeffnen(); }
  });
  liste.addEventListener('click', e => { const li = e.target.closest('li'); if (li) waehlen(Number(li.dataset.i)); });
  liste.addEventListener('pointermove', e => { const li = e.target.closest('li'); if (li && Number(li.dataset.i) !== aktiv) markieren(Number(li.dataset.i)); });
  liste.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); markieren(aktiv + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); markieren(aktiv - 1); }
    else if (e.key === 'Home') { e.preventDefault(); markieren(0); }
    else if (e.key === 'End') { e.preventDefault(); markieren(select.options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehlen(aktiv); }
    else if (e.key === 'Escape') { e.preventDefault(); schliessen(true); }
    else if (e.key === 'Tab') schliessen();
  });
  // wenn sich die Optionen ändern (z. B. Auswahl je Kategorie), Anzeige nachziehen
  new MutationObserver(aktualisieren).observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });

  const feld = { huelle, aktualisieren, schliessen };
  aktualisieren();
  return feld;
}
