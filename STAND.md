# Claudis Quizbude – Stand

## Aktuell (25.11.2026)

- **Version:** 0.9.8
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

- **Neu in 0.8.1:**
  - **Ruhm neu geordnet:** Die Ränge sind die Kartenfarben Karo < Herz < Pik < Kreuz, in jeder Farbe Bube → Dame → König → Ass, oben der Joker. Freischaltungen je Farbe: Bube Namensfarbe, Dame Titel, König Effekt, Ass Rahmen und Hintergrund. Stil-Werte in der Datenbank heißen jetzt `karo/herz/pik/kreuz/joker` (Migration hat Bestehendes umgeschrieben).
  - **Bildkarten** mit eigenen Figuren: Bube mit Federhut, Dame mit Diadem, König mit Krone und Bart, Joker mit Narrenkappe.
  - **Profil:**
    - „Anpassen“ mit großer Spielerkarte als Live-Vorschau und Reitern mit Kacheln. Antippen zeigt nur eine Vorschau, erst „Anlegen“ übernimmt. Nichts wird automatisch angelegt, auch nicht beim Aufstieg.
    - Ruhmesweg als Tabelle ohne Scrollen.
    - Gleichmäßige Abstände zwischen den Bereichen.
  - **Sprint-Treffer bringen 1 Ruhm** (neue Spalte `sprint_treffer`, nachgerechnet aus `sprint_laeufe`). Am Ende steht die Aufschlüsselung als Animation: Posten, hochzählende Summe, wachsender Balken, bei Aufstieg die neue Karte. Im Raum genauso.
  - **Sprint-Ende ausgebaut:** große Zahl, Balken „Jetzt“ gegen Rekord, vier Werte (pro Treffer, beste Serie, ausgelassen, Saisonplatz), Listen „Richtig“ und „Ausgelassen“. Nur noch der Knopf „Nochmal“.
  - **Sprint-Seite:** unter den Kacheln die besten Sprints der Saison je Kategorie (Top 3 und der eigene Platz).
  - **Hauptstädte in zwei Richtungen:** „Land gegeben, Hauptstadt raten“ und „Hauptstadt gegeben, Land raten“. Technisch ist das die Kategorie `stadtland` mit eigenem Rekord. Im Raum gibt es dafür die Einstellung „Richtung“, im Sprint den Umschalter „Land → Stadt / Stadt → Land“.
  - **Ruhm-Leiste** oben in Bude, Sprint und Lernen: aktuelle Karte, Balken, „noch X bis …“.
  - **Navigation:** Am PC ist die Leiste links am Rand, größer und mit Symbolen. Am Handy bleibt sie unten, nur mit Symbolen.
  - **Abmelden** führt auf die Anmeldeseite, ohne Gastmodus. Hinweis bei eingeschalteter Feststelltaste.
  - **Spielansicht** auf großen Bildschirmen deutlich größer (Fragen, Bilder, Antwortknöpfe).
  - **„Lernen“ scrollt flüssig:** keine Schatten-Filter auf 200 Flaggen, Karten außerhalb des Bildes werden nicht gezeichnet, kein `background-attachment: fixed` mehr.
  - „Zuletzt gespielt“ in der Bude entfernt.

- **Neu in 0.8.2:** Neue Titel (Karo Flaggenflüsterer, Herz Grenzgänger, Pik Lebendes Lexikon, Kreuz Wandelnder Atlas, Joker Quizgott). Zusatzzeilen wie „2 Siege in 5“ in der Bestenliste entfernt. Ruhm-Fortschritt als senkrechte Säule in der Leiste links, füllt sich von unten nach oben; am Handy als dünne Linie über der unteren Leiste.

- **Neu in 0.9.0:**
  - **Kategorie Weltkarte** (direkt nach Flaggen).
    - Die Karte füllt beim Spielen den Bildschirm. Ziehen verschiebt, Mausrad, Pinch oder +/− zoomen, Doppelklick bzw. Doppeltipp setzt den Pin.
    - Fragen: Land (Flagge und Name oben, im Land = voll) oder Hauptstadt (Name, Entfernung zählt).
    - Punkte im Raum bis 150 nach Entfernung. Bei der Auflösung sehen alle alle Pins mit Linie zum Ziel.
    - Im Sprint zählt als Treffer: im Land bzw. Hauptstadt höchstens 150 km daneben.
    - Raum-Einstellung „Gesucht“: Länder und Hauptstädte, nur Länder oder nur Hauptstädte. Mit Region startet die Karte im Ausschnitt der Region.
    - Daten in `js/weltkarte-daten.js`, gebaut mit `werkzeuge/karte_bauen.mjs`: world-countries vereinfacht, Hauptstädte aus Natural Earth. Werden erst bei Bedarf geladen.
    - Datenbank: `sprint_eintragen` kennt `karte` (eingespielt am 25.11.).
  - **Emoji-Rätsel** aus der Kategorie-Liste genommen (bis zur inhaltlichen Überarbeitung). Alte Daten bleiben lesbar.
  - **Anpassen:** Klick legt sofort an, ohne Knopf. Gesperrtes per Mausüber auf der Karte ausprobieren. Den Hinweis unter der Karte gibt es nicht mehr.
  - **Hintergründe** füllen die ganze Seite statt eines Schimmers oben.
  - Mehr Abstand zwischen Schriftzug und Begrüßung.

- **Neu in 0.9.1:**
  - Hintergründe mit richtigen Mustern: Spieltisch (Filz unter Lampenlicht, Karo-Prägung), Roter Samt (Glanzbahnen, Herzen), Mitternacht (Sternenhimmel, Pik), Goldbrokat (Ornament), Schillernde Nacht (Sterne, wanderndes Polarlicht).
  - Das Polarlicht bewegt sich per transform, damit beim Scrollen nichts neu gezeichnet wird.
  - Der große Schriftzug wirkt auf farbigem Hintergrund durchscheinend.

- **Neu in 0.9.2:**
  - Profil neu: Karte links, rechts Kopf mit Rang und Reitern Übersicht, Anpassen, Ruhmesweg. Anpassen ändert nur per Klick, kein Hover-Wechsel mehr.
  - Letzte Spiele lädt wieder (Abfrage auf spieler-JSON korrigiert).
  - Weltkarte: kein Rechtsklick-Menü, flüssigeres Ziehen und Zoomen, keine Pin-Zeilen im Raum-Chat.
  - Nichts mehr markierbar oder als Bild ziehbar (außer Eingabefelder und Chat).
  - Flaggen-Fächer oben in der Bude: geht beim Drüberfahren auf, Flagge hebt sich und weht, Klick mischt neue Flaggen. Kategorie-Kacheln haben eigene kleine Hover-Bewegungen.

- **Neu in 0.9.3:**
  - Admin-Bereich (admin.html): Anmelden auf der Seite mit Namen „admin“, eigene Sitzung (quizbude.admin), normales Konto bleibt angemeldet.
  - Admin-Konto requiem-admin@quizbude.app ist per Migration 002 angelegt (ohne bekanntes Passwort). Colin legt sein Passwort beim ersten Anmelden mit „admin“ selbst fest (zweimal eingeben, Fenster 3 Stunden, danach zu). Neu öffnen: Migration 002 nochmal laufen lassen.
  - Reiter: Übersicht, Spieler (umbenennen, Passwort, Ruhm schenken, sperren, aus Bestenliste, deaktivieren), Räume (live), Nachricht an alle, Server (neue Konten an/aus), Protokoll.
  - Migration werkzeuge/migrationen/001_admin.sql (läuft mehrfach). Namen mit „admin“ sind reserviert.

- **Neu in 0.9.4:**
  - Admin-Passwort einmalig beim ersten Anmelden festlegen.
  - Fußzeile sitzt immer ganz unten, Inhalt steht bei breiten Bildschirmen in der Bildschirmmitte, Sprint passt bei 1920×1080 ohne Scrollen.
  - Interne Links ohne href (keine Adresse mehr unten links in Chrome), Klick aufs Logo lädt die Seite neu (dreht sich dabei).

- **Neu in 0.9.5:**
  - Klick in die Bestenliste öffnet ein Fenster: Karte links, rechts die Saison je Kategorie (Spiele, Siege, Ø, bestes Spiel, Sprint-Rekord), Platz-Abzeichen, Knopf zum ganzen Profil.
  - Flaggen-Fächer: feste Trefferflächen (kein Flackern an den Kanten), Flagge unter der Maus wird hervorgehoben, die anderen leicht abgedunkelt, nichts verschwindet.
  - Alte Kategorie „spiele“ taucht in Profil-Auswertungen nicht mehr auf.

- **Neu in 0.9.6:**
  - Weltkarte über den ganzen Bildschirm, Frage oben und Spielerliste rechts schweben als Glas-Panels darüber (Leiste und Fußzeile im Kartenmodus aus).
  - Länder werden auf Canvas gemalt (ein Path2D je Land, einmal gebaut): 60 Bilder/s beim Ziehen und Zoomen. Pins, Linien und Beschriftungen liegen als SVG darüber.
  - Ansichten (Region, Auflösung) passen sich an die verdeckten Ränder an (opt.rand in karteBauen).
  - Auflösung bei Hauptstädten: alle Hauptstädte als kleine Punkte, die gesuchte mit Ring und Namen.

- **Neu in 0.9.7:**
  - Ladebildschirm (vier Asse werden ausgeteilt, Balken, Schritte): Schriften, Bilder und alle Effekte werden einmal unsichtbar vorgezeichnet. Mindestens 0,65 s, höchstens 2,5 s, Notaus per CSS nach 9 s.
  - Leistung: alle Weichzeichner (backdrop-filter) entfernt, Holo per transform statt background-position, weniger Partikel je Effekt, Effekt-Vorschauen im Anpassen laufen nur beim Drüberfahren, Effekte pausieren bei offenen Fenstern und im Kartenmodus.
  - Anmeldeseite: Überschrift „Quizzen in der Pause …“, Spielarten als Chips, darunter „Gerade vorne“ (Saison-Top 5, Klick öffnet das Spieler-Fenster).

- **Neu in 0.9.8:**
  - Ruhm-Box im Endstand: Klasse „aufstieg“ kollidierte mit dem Aufstiegs-Fenster (Rand und Innenabstand weg), heißt jetzt rp-hoch und wird beim nächsten Spiel zurückgesetzt.
  - Falsche Antworten in der Chat-Spalte werden immer streng gefiltert, auch bei offenem Chat.

## Als Nächstes (mit Colin besprochen)

1. Eigene Profilbilder statt Emojis (mit Colin zusammen gestalten).
2. Admin-Bereich wie in Pokélings (eigenes Konto `requiem-admin`, Login mit Name „Admin“, Tabelle `admins`, `is_admin()` in jeder Funktion, eigene Seite `admin.html`): Spieler, Räume, Nachricht an alle, Server, Protokoll. Colin legt das Konto selbst in Supabase an.
3. Colin bewertet den Ruhm (Namen, Optik, Tempo). Danach Feinschliff.
4. Saison-Abzeichen zum Monatsende vergeben (siehe `PLAN.md`, Abschnitt 4). Die erste Saison endet am 30.11.2026.
5. Währung, Shop und Saisonblatt nach `PLAN.md`, sobald die offenen Fragen geklärt sind.
6. Freunde + Einladen in Räume (Einladung 15 s oben sichtbar).
7. Emoji-Rätsel inhaltlich überarbeiten (spannender).

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
