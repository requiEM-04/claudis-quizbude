# Claudis Quizbude – Stand

## Aktuell (24.11.2026)

- **Version:** 0.3.0
- **Live:** https://requiem-04.github.io/claudis-quizbude/ (Repo `requiEM-04/claudis-quizbude`, Branch `main`, GitHub Pages)
- **Server:** Supabase-Projekt `quizbude` (Ref `jgvjjjiwfjxynbzjaxsg`, Frankfurt), E-Mail-Bestätigung aus, Realtime mit öffentlichen Kanälen.
- **Inhalt:** Konten (Name + Passwort ab 4 Zeichen), Räume mit 4-Buchstaben-Code (live über Realtime), Flaggenraten (tippen oder 4 zur Auswahl), Flaggen-Sprint (60 s), Bestenliste (Siege, Punkte, Sprint), „Zuletzt gespielt".
- **Kategorien (0.3.0):** Flaggen, Umrisse (Länder-Silhouetten wie Worldle), Hauptstädte, Größer oder kleiner (Fläche), Allgemeinwissen (120 eigene Fragen in 8 Themen), Emoji-Rätsel (60, Filme/Wörter/Sprichwörter), Gemischt. Kacheln in der Bude öffnen direkt einen Raum mit der Kategorie.
- **Design 0.2.0:** Graphit mit gedecktem Sand und Salbei, große Radien, riesiger Schriftzug mit Flaggen-Fächer, Navigation als Dock unten in der Mitte (kein Logo oben links).

## Offen

- Nichts Dringendes. Testkonten und Testspiel sind am 24.11. gelöscht, die Datenbank startet leer.

## Getestet

- 24.11.: Live mit zwei Konten über den echten Server: Lobby zeigt Räume, Beitreten mit Sync, 5 Flaggen inkl. abgelaufener Zeit, gleicher Endstand bei beiden, Statistik und Verlauf gespeichert, Gastgeber-Wechsel beim Verlassen.
- Lokal mit nachgebautem Server (`werkzeuge/test/`): zusätzlich Auswahl-Modus und Gastgeber-Wechsel mitten im Spiel.

## Ideen für später

- Sprint auch für Umrisse und Hauptstädte, mehr Allgemeinwissen-Fragen, Schätzfragen (wer liegt am nächsten dran).
- Profil bearbeiten (Avatar/Farbe), eigene Raum-Namen, Rang-Abzeichen.

## Ablauf bei Updates

1. Änderungen machen, `python3 werkzeuge/release.py <version>`.
2. Lokal testen: `python3 -m http.server 8765`, dann `python3 werkzeuge/test/spieltest.py` (Flaggen, Gastgeber-Wechsel) und `python3 werkzeuge/test/kategorientest.py` (jede Kategorie, Bilder nach /tmp).
3. Länderdaten neu bauen (nur bei Änderungen an Namen/Hauptstädten): `node werkzeuge/daten_bauen.mjs <ordner mit node_modules von flag-icons + world-countries>`.
4. Commit + `git push origin HEAD:main`, nach ca. 1 Minute live (Strg+F5).
5. Datenbank-Änderungen im Supabase-SQL-Editor einspielen und in `werkzeuge/schema.sql` nachziehen.
