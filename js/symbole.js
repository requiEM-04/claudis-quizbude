// Schlichte Symbole je Kategorie (Strich in Sand), passend zur Seite
const svg = inhalt => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inhalt}</svg>`;

export const KATEGORIE_SYMBOL = {
  flaggen: svg('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  umrisse: '<img src="bilder/umriss-vorschau.svg" width="22" height="22" alt="" aria-hidden="true">',
  hauptstaedte: svg('<path d="M3 21h18"/><path d="M5 21V9l4-3v15"/><path d="M9 21V4l6 3v14"/><path d="M15 21V11l4 2v8"/>'),
  groesser: svg('<rect x="4" y="12" width="6" height="8" rx="1.2"/><rect x="14" y="4" width="6" height="16" rx="1.2"/>'),
  wissen: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17.2h.01"/>'),
  emoji: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01"/>'),
  spiele: svg('<path d="M4 17h7V9h9"/><path d="M20 9v4"/><circle cx="20" cy="16.5" r=".6"/>'),
  gemischt: svg('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>'),
};
