# Claudis Quizbude – Stand

## Aktuell (25.11.2026)

- **Version:** 0.8.0
- **Live:** https://requiem-04.github.io/claudis-quizbude/ (Repo `requiEM-04/claudis-quizbude`, Branch `main`, GitHub Pages)
- **Server:** Supabase-Projekt `quizbude` (Ref `jgvjjjiwfjxynbzjaxsg`, Frankfurt), E-Mail-Bestätigung aus, Realtime mit öffentlichen Kanälen.
- **Inhalt:** Konten (Name + Passwort ab 4 Zeichen), Räume mit 4-Buchstaben-Code (live über Realtime), Flaggenraten (tippen oder 4 zur Auswahl), Flaggen-Sprint (60 s), Bestenliste (Siege, Punkte, Sprint), „Zuletzt gespielt".
- **Kategorien (0.3.0):** Flaggen, Umrisse (Länder-Silhouetten), Hauptstädte, Größer oder kleiner (Fläche), Allgemeinwissen (120 eigene Fragen in 8 Themen), Emoji-Rätsel (60, Filme/Wörter/Sprichwörter), Gemischt. Kacheln in der Bude öffnen direkt einen Raum mit der Kategorie.
- **Neu in 0.4.0:** Flaggen in echten Seitenverhältnissen (svg-country-flags, gemeinfrei), Profilseite (Klick auf Name/Avatar im Dock), Dock-Reiter Bude | Sprint | Lernen, Sprint für jede Kategorie mit eigenem Rekord (`profile.rekorde`, `sprint_eintragen(p_wert, p_kategorie)`, `sprint_bestenliste`), 2 s Countdown, Überspringen mit → oder Alt+D (kostet 2 s), Zahlen 1–4 für Auswahl-Antworten, Zurück-Taste = „Raus", Räume starten erst ab 2 Leuten, Klapplisten mit Symbolen, Nachschlagen (Flaggen/Umrisse, Suche, Kontinente, Details), Falschantworten rechts im Raum, Chat-Einstellung Eingeschränkt/Offen mit Wortfilter (`js/filter.js`, Hass immer gesperrt, auch für Namen).
- **Design 0.2.0:** Graphit mit gedecktem Sand und Salbei, große Radien, riesiger Schriftzug mit Flaggen-Fächer, Navigation als Dock unten in der Mitte (kein Logo oben links).

## Offen

- Nichts Dringendes. Testkonten und Testspiel sind am 24.11. gelöscht, die Datenbank startet leer.

## Getestet

- 24.11.: Live mit zwei Konten über den echten Server: Lobby zeigt Räume, Beitreten mit Sync, 5 Flaggen inkl. abgelaufener Zeit, gleicher Endstand bei beiden, Statistik und Verlauf gespeichert, Gastgeber-Wechsel beim Verlassen.
- Lokal mit nachgebautem Server (`werkzeuge/test/`): zusätzlich Auswahl-Modus und Gastgeber-Wechsel mitten im Spiel.

- **Neu in 0.5.0:** Kategorie „Spiele“ mit Snake zu zweit (`js/snake.js`, Gastgeber rechnet, Stand per Broadcast `sn`, Lenken per `lenk`), Gastmodus („Als Gast spielen“: Sprint + Lernen, Rekorde lokal), automatisches Neuladen bei neuer Version (`version.json`, nur in ruhigen Momenten, Raum/Chat/Gastgeber/Filter bleiben über `sessionStorage` erhalten), Räume starten geschlossen (Einstellung „Raum“), Flaggen standardmäßig alle Länder, Spielende: „Nochmal“ (gleiches Team) und „Andere Kategorie“ (zurück in den Warteraum).

- **Neu in 0.5.1:** Kurvenkampf (`js/kurve.js`, 2–6 Leute, Linien-Spiel): Gastgeber rechnet 60 Schritte/s, sendet gebündelt per `kv` (~20/s), Mitspieler lenken per `kd`, Wiedergabe ~4 Schritte verzögert. 10 Powerups, Ziel 5 × (Spieler − 1) Punkte.

- **Neu in 0.5.2:** Größer oder kleiner mit Auflösung (Fläche, Balken, ✓/✗, Uhr steht im Sprint währenddessen), Konfetti nach Platz (`js/konfetti.js`), Podest-Animation mit Krone, Punkte-Pop, Countdown-Puls, Leiste unten beim Spielen ausgeblendet, Seitenwechsel scrollt nach oben, Umrisse über die Datumsgrenze (Russland, Fidschi) korrigiert, offene Frage beim Abpfiff zählt bei Eingabe als ausgelassen. Getestet: alle Sprints als Gast im echten Browser.

- **Neu in 0.6.0:** Raster-Snake entfernt, Kurvenkampf heißt jetzt „Snake“ (2–8 Leute, Ziel 5 + 3 × (Spieler − 2)), Raketen als häufigstes Powerup (↑/W/Leertaste, Doppeltipp am Handy; Kopf = raus, Linie = Loch), großes Spielfeld ohne Seitenleiste, Linien in doppelter Auflösung mit Leuchten, Explosionen mit Wackeln, Countdown-Flackern behoben, Gäste dürfen in Räume (eigene Kennung pro Tab, Ergebnisse zählen nicht).

- **Neu in 0.6.1:** Bestenliste als eigene Spalte rechts in der Bude (ab 1480 px, sonst darunter): Reiter Monat (Saison, aus `spiele` dieses Monats, nur Konten) / Siege / Punkte / Sprint, Podest Top 3 mit Medaillen, eigener Platz angeheftet, alle 30 s frisch. Podest am Spielende ohne Kastenrahmen.

- **Neu in 0.6.2:** Antworten auch mit A–D (nur wenn nicht in ein Feld getippt wird), Tastenliste als Fenster (⌨-Knopf oben in Sprint und Raum, Taste „?“) statt Hinweis unter jeder Frage. Pokémon-Kategorie bewusst nicht gebaut (Urheberrecht, Colin: „können wir auch auslassen“).

- **Neu in 0.7.0:** Rubrik „Spiele“ (Snake) komplett entfernt (alte Spiele-Runden werden in „Zuletzt gespielt“ ausgeblendet). Bestenliste neu: schmale Spalte fest am rechten Rand (ab 1560 px; 1560–1859 px rückt der Inhalt etwas nach links, darunter steht sie unter dem Inhalt), Inhalt wieder in normaler Breite. Reiter Punkte | Siege | Sprint, kleine Auswahl „Saison <Monat>“ / „Allzeit“ (Saisons ab November 2026), jede Zeile ein Feld mit Avatar, Name, Wert und Unterzeile (Platz für Titel und Ruhm-Emblem später). Platz 1–3 mit Medaille, Rahmen und Glanz, Krone fällt ein, schwebt und blitzt. Endstand im Raum im selben Stil. Datenbank: `sprint_laeufe` (jeder Sprint mit Zeitpunkt), `sprint_bestenliste(p_kategorie, p_seit)` für Saison-Sprints (Migration am 25.11. eingespielt).

- **Neu in 0.8.0:**
  - **Ruhm im Kartenthema** (`js/ruhm.js`): Ränge Bube, Dame, König, Ass, die Stufen sind die Kartenfarben Karo < Herz < Pik < Kreuz, ganz oben der Joker (17 Stufen).
  - **Ruhm-Berechnung** auf dem Server per Trigger aus der Statistik: Mitspielen 10, richtige Antwort 3, Sieg 20, Sprint 4, plus die Summe der Sprint-Rekorde. Für alle Konten nachgerechnet.
  - **Belohnungen je Rang:** Karo Namensfarbe, Herz Titel, Pik Karten-Effekt, Kreuz Rahmen (Karte + Bestenliste) und Seitenhintergrund. Gewählt wird in `profile.stil`, der Trigger prüft die Freischaltung.
  - **Wappen** als kleine Spielkarte am Avatar (Bestenliste, Raum, Treppchen).
  - **Profil:** Spielerkarte mit Fortschritt, „Anpassen“ und Ruhmesweg.
  - **Am Spiel- und Sprintende** „+X Ruhm“, Aufstiegsfenster mit „Gleich anlegen“, einmaliges Fenster für den nachgerechneten Ruhm.
  - **Endstand** als Siegertreppchen 2–1–3 mit fallender Krone.
  - **Bestenliste:** Titel unter dem Namen, Saison-Ende und Vorschau der Saison-Abzeichen. Bei 1100–1559 px dritte Spalte neben den Räumen.
  - **Kategorie-Kacheln** kompakter.
  - Plan für Währung, Shop und Saisonblatt in `PLAN.md`.
  - **Tippfehler** zählen weiter als richtig, kosten im Raum aber 10 Punkte je Fehler (max. 2). Der Spieler sieht es in seiner Rückmeldung, alle im Raum-Chat.
  - **Räume sind standardmäßig offen** (Einstellung „Raum“ bleibt).
  - **Sprint mit Region** (Flaggen, Umrisse, Hauptstädte): gilt als Übung, ohne Rekord und ohne Ruhm.
  - **„Offene Räume“ und „Zuletzt gespielt“** als richtige Zeilen. Die Stile waren in 0.7.0 versehentlich mit herausgeschnitten worden.
  - Leiste unten am Handy für Gäste enger, nichts wird mehr abgeschnitten.

## Als Nächstes (mit Colin besprochen)

1. Neue Kategorie mit Weltkarte: Land oder Hauptstadt auf der Karte anklicken (Flagge und Name oben, Karte zum Ausklappen unten rechts), Punkte nach Entfernung.
2. Colin bewertet den Ruhm (Namen, Optik, Tempo). Danach Feinschliff.
3. Saison-Abzeichen zum Monatsende vergeben (siehe `PLAN.md`, Abschnitt 4). Die erste Saison endet am 30.11.2026.
4. Währung, Shop und Saisonblatt nach `PLAN.md`, sobald die offenen Fragen geklärt sind.
5. Freunde + Einladen in Räume (Einladung 15 s oben sichtbar).
6. Emoji-Rätsel inhaltlich überarbeiten (spannender).

- **Insider-Fragen** (BAUPART, Ticketsystem): wartet auf Colins Antwort, ob Salvatore und Ali einverstanden sind. Wenn ja, nicht ins öffentliche Repo, sondern in Supabase nur für angemeldete Spieler.
- **Regel:** In der Seite, in Patchnotes und im Repo nie erwähnen, woher Ideen stammen.

## Ideen für später

- Sprint auch für Umrisse und Hauptstädte, mehr Allgemeinwissen-Fragen, Schätzfragen (wer liegt am nächsten dran).
- Profil bearbeiten (Avatar/Farbe), eigene Raum-Namen, Rang-Abzeichen.

## Ablauf bei Updates

1. Änderungen machen, `python3 werkzeuge/release.py <version>`.
2. Lokal testen: `python3 -m http.server 8765`, dann `python3 werkzeuge/test/spieltest.py` (Flaggen, Chatfilter, Falschantworten, Gastgeber-Wechsel), `python3 werkzeuge/test/kategorientest.py` (jede Kategorie, Bilder nach /tmp) und `python3 werkzeuge/test/sprinttest.py` (Sprint, Lernen, Profil, Zurück-Taste).
3. Länderdaten neu bauen (nur bei Änderungen an Namen/Hauptstädten): `node werkzeuge/daten_bauen.mjs <ordner mit node_modules von svg-country-flags + world-countries>`, danach Flaggen mit svgo optimieren.
4. Commit + `git push origin HEAD:main`, nach ca. 1 Minute live (Strg+F5).
5. Datenbank-Änderungen im Supabase-SQL-Editor einspielen und in `werkzeuge/schema.sql` nachziehen.
