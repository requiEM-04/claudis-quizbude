# Claudis Quizbude

Quiz-Spiele für die Pause. Start mit Flaggenraten: allein im 60-Sekunden-Sprint oder zusammen in einem Raum mit Code.

**Spielen:** https://requiem-04.github.io/claudis-quizbude/

## Technik

- Reine statische Seite (GitHub Pages), keine Build-Schritte nötig.
- Konten, Bestenliste und Spielverlauf: Supabase (Projekt `quizbude`, Frankfurt). Schema: `werkzeuge/schema.sql`.
- Räume laufen live über Supabase Realtime (Broadcast + Presence). Der Gastgeber steuert die Runden; geht er raus, übernimmt automatisch der Nächste.
- Flaggen: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Länderdaten: [world-countries](https://github.com/mledoze/countries) (ODbL).

## Werkzeuge

- `node werkzeuge/flaggen_bauen.mjs <ordner-mit-node_modules>` erzeugt `js/laender.js` und kopiert die Flaggen.
- `python3 werkzeuge/release.py <version>` setzt die Version und das Cache-Busting.
- `?sitzung=2` an der Adresse = zweites Konto im selben Browser (zum Testen).
