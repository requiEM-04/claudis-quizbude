# Claudis Quizbude – Stand

## Aktuell (24.11.2026)

- **Version:** 0.2.0
- **Live:** https://requiem-04.github.io/claudis-quizbude/ (Repo `requiEM-04/claudis-quizbude`, Branch `main`, GitHub Pages)
- **Server:** Supabase-Projekt `quizbude` (Ref `jgvjjjiwfjxynbzjaxsg`, Frankfurt), E-Mail-Bestätigung aus, Realtime mit öffentlichen Kanälen.
- **Inhalt:** Konten (Name + Passwort ab 4 Zeichen), Räume mit 4-Buchstaben-Code (live über Realtime), Flaggenraten (tippen oder 4 zur Auswahl), Flaggen-Sprint (60 s), Bestenliste (Siege, Punkte, Sprint), „Zuletzt gespielt".
- **Design 0.2.0:** Graphit mit gedecktem Sand und Salbei, große Radien, riesiger Schriftzug mit Flaggen-Fächer, Navigation als Dock unten in der Mitte (kein Logo oben links).

## Offen

- Live-Test mit zwei echten Konten im Browser (lokal mit nachgebautem Server bestanden: Spiel, Auswahl-Modus, Gastgeber-Wechsel).
- Testkonten `Testkiosk1` (und ggf. `Testkiosk2`) im Supabase-Dashboard unter Authentication → Users löschen.

## Ideen für später

- Weitere Quiz-Formate (Hauptstädte, Umrisse, Logos, Wer-ist-schneller-Fragen).
- Profil bearbeiten (Avatar/Farbe), eigene Raum-Namen, Rang-Abzeichen.

## Ablauf bei Updates

1. Änderungen machen, `python3 werkzeuge/release.py <version>`.
2. Lokal testen: `python3 -m http.server 8765` und `python3 werkzeuge/test/spieltest.py`.
3. Commit + `git push origin HEAD:main`, nach ca. 1 Minute live (Strg+F5).
4. Datenbank-Änderungen im Supabase-SQL-Editor einspielen und in `werkzeuge/schema.sql` nachziehen.
