# Claudis Quizbude

Quiz-Spiele für die Pause: Flaggen, Umrisse, Hauptstädte, Größer oder kleiner, Allgemeinwissen, Emoji-Rätsel und Gemischt. Zusammen in einem Raum mit Code oder allein im 60-Sekunden-Flaggen-Sprint.

**Spielen:** https://requiem-04.github.io/claudis-quizbude/

## Technik

- Reine statische Seite (GitHub Pages), keine Build-Schritte nötig.
- Konten, Bestenliste und Spielverlauf: Supabase (Projekt `quizbude`, Frankfurt). Schema: `werkzeuge/schema.sql`.
- Räume laufen live über Supabase Realtime (Broadcast + Presence). Der Gastgeber steuert die Runden; geht er raus, übernimmt automatisch der Nächste.
- Flaggen in echten Seitenverhältnissen: [svg-country-flags](https://github.com/hjnilsson/country-flags) (gemeinfrei). Länderdaten und Umrisse: [world-countries](https://github.com/mledoze/countries) (ODbL).

## Werkzeuge

- `node werkzeuge/daten_bauen.mjs <ordner-mit-node_modules>` erzeugt `js/laender.js`, `js/umrisse.js` und kopiert die Flaggen.
- Fragen für Allgemeinwissen und Emoji-Rätsel stehen in `js/wissen.js` und `js/emoji.js`.
- `python3 werkzeuge/release.py <version>` setzt die Version und das Cache-Busting.
- `?sitzung=2` an der Adresse = zweites Konto im selben Browser (zum Testen).
