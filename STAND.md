# Claudis Quizbude – Stand

## Aktuell (25.11.2026)

- **Version:** 0.17.1
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

- **0.9.9:** Falsche Antworten richten sich wieder nach der Chat-Einstellung des Gastgebers (Colin will das so, nicht ändern).

- **Neu in 0.10.0:**
  - Saison-Medaillen: Migration 003 (Tabellen abzeichen, saisons, Funktion saison_abschliessen). Nach Monatsende schließt die Seite die Saison von selbst ab (jeder Besuch löst es aus, passiert nur einmal), Admin hat einen Knopf. Top 3 in Punkten, Siegen und jedem Sprint. Einmaliger Medaillen-Moment beim nächsten Öffnen.
  - Abzeichen (js/abzeichen.js): 15 Erfolge mit fünf Seltenheitsstufen (Gewöhnlich, Selten, Episch, Legendär, Mythisch), eigenes Emblem je Erfolg. Profil-Reiter „Abzeichen“ mit Fortschritt.
  - Vitrine: bis zu drei Abzeichen oder Medaillen auf der Spielerkarte statt Spiele/Siege/Sprint (Spalte vitrine, Migration 004).
  - SVG-Verläufe mit eigener ID je Grafik (sonst greift der Browser auf ausgeblendete Kopien zurück).

- **Neu in 0.10.1 (Winter):**
  - Winterzauber (Hintergrund „winter“, reiner Winter: Mond, Berge, verschneite Tannen; bewegt: funkelnde Sterne, Sternschnuppe, drei Schnee-Ebenen). Ab 1.12.2026 frei für alle Konten mit erstellt vor 1.1.2027, bleibt danach. Im Dezember einmal Hinweis mit Anlegen-Knopf (nie automatisch).
  - Weihnachtsnacht: Dorf mit leuchtenden Fenstern, Kirche, geschmückter Baum, Mond; bewegt: blinkende Lichterkette, Sternschnuppe, Schnee (Schlitten seit 0.10.3 raus).
  - Questkarte in der rechten Spalte unter der Bestenliste (vor Dezember als Vorschau „startet in … Tagen“), Feier-Fenster je geschaffter Stufe mit Anlegen-Knopf.
  - Bewegte Ebenen als #winterwelt (nur transform/opacity), im Kartenmodus aus.

- **Neu in 0.10.2:**
  - Winterquest fest gegen Nebenkonten (Migration 007): Raumspiel zählt nur mit mind. zwei anderen Konten, die älter als 7 Tage sind, und alle anderen im Raum haben Punkte. Stufe 1 = 10 solche Raumspiele → Rahmen Eiskristall, Stufe 2 = 250 Sprint-Treffer im Dezember → Effekt Schneegestöber, Stufe 3 = 3 Siege in solchen Räumen mit mind. 1.000 Punkten → Hintergrund Weihnachtsnacht. Stufen nacheinander, nur Dezember 2026.
  - Winterzauber neu: Nordlicht (zwei Bänder, langsam bewegt), Mond mit Kratern oben links in der Ecke (nie hinter dem Logo), drei Bergketten mit Schnee, Schatten und Dunst, zwei Reihen verschneiter Wald, glitzernder Schnee, Sternschnuppe, drei Schnee-Ebenen.

- **Neu in 0.10.3 (Winterquest mit Tagesaufgaben, ersetzt die Stufen aus 0.10.2):**
  - Migration 008 (`winter_aufgaben`): für jeden Dezembertag drei feste Aufgaben (leicht 8, mittel 10, schwer 12 Schneeflocken, also 30 am Tag, 930 im Monat). Typen: Raumspiele, Raumpunkte, Raumsieg, Sprint-Treffer gesamt, bester Sprint, Sprint in einer Kategorie. Gezählt wird nur am Tag selbst (Europe/Berlin), Raumspiele nur mit mind. zwei Leuten. Verpasste Tage verfallen.
  - Belohnungen bei 100 (Rahmen Eiskristall), 200 (Effekt Schneegestöber) und 300 Schneeflocken (Hintergrund Weihnachtsnacht). Wer alles schafft, hat nach 10 Tagen alles; Server prüft über `qb_sonder_frei`.
  - Questkarte: Schneeflocken-Zähler, Balken mit den drei Belohnungen als Marken, darunter „Heute“ mit den drei Aufgaben (Fortschritt, Haken, Lohn) und Zeit bis zu den neuen Aufgaben. Meldung „Tagesaufgabe geschafft“, Feier-Fenster bei jeder Belohnung.
  - Echte Schneeflocke (sechs verästelte Arme) als Symbol in Questkarte und Eiskristall-Rahmen; Schneegestöber mit drehenden Kristallen zwischen den Punkten.
  - Schlitten raus, Sternschnuppe fliegt jetzt Kopf voraus nach links unten.

- **Neu in 0.11.0: Profilbilder** (Migration 009 am 25.11. eingespielt und mit zurückgerolltem Probe-Spieler geprüft)
- **Figuren** (`js/figuren.js`, alles eigene SVGs ohne IDs): 14 freie Tiere (Fuchs, Frosch, Panda, Eule, Krake, Pinguin, Katze, Igel, Schildkröte, Dino, Biene, Koala, Wal, Papagei), per Ruhm ab König der Farbe Quizbot (Karo), Herzdrache (Herz), Sternwolf (Pik), Phönix (Kreuz), Hofnarr ab Joker, Löwe für einen Saisonsieg. Alte Emoji-Avatare werden automatisch zur passenden Figur (🦁 und Nicht-Tiere bleiben Emoji, bis man wählt).
- **Kreis-Hintergründe:** einfache Farbe (profile.farbe) oder bewegt ab Dame der Farbe: Kupferglut, Herzschlag, Sternennacht, Sonnenrad, Holo (Joker). Bewegung nur bei großen Avataren (Spielerkarte, Treppchen, Editor), sonst still.
- **Ränder:** 6 Grundfarben frei, Kupfer/Rosé/Eisblau/Messing ab Bube der Farbe, Regenbogen ab Joker, Bronze/Silber/Gold für Platz 3/2/1 in einer Saison.
- **Speichern:** in `profile.stil` als `figur`, `kreis`, `ring` (freie Figur nur im Emoji `avatar`). Prüfung auf dem Server in Migration 009 (`qb_bild_frei`).
- **Anzeige:** überall über `avatarHtml` (Bestenliste, Raum, Chat, Treppchen, Spielerfenster, Dock, Admin), im Raum per Presence-Stil, im Spielverlauf mit `figur`.
- **Editor** im Profil („Profilbild ändern“): große Vorschau, Figur, Hintergrund, Rand, Gesperrtes mit Schloss und Bedingung. Registrierung zeigt die freien Figuren auf der gewählten Farbe. Aufstiegsfenster und Ruhmesweg nennen die neuen Freischaltungen.
- **Getestet (lokal, Test-Server):** Freischaltung nach Ruhm und Medaille, Speichern, Anzeige in Dock/Karte/Bestenliste/Raum/Chat/Treppchen, Admin, spieltest, gasttest, sprinttest (auf neuen Editor umgestellt).
- **Behoben mit 009:** Seit 006 brach das Anlegen im Profil mit „permission denied for function qb_sonder_frei“ ab (Trigger ohne `security definer`). Vorher/nachher in der Datenbank geprüft: jetzt geht Anlegen, freie Bildteile werden gespeichert, Löwe ohne Medaille und Kupferglut ohne Ruhm werden abgelehnt.
- Echte Konten am 25.11.: 🐙, 🐸, 🦉 werden automatisch Krake, Frosch, Eule; 🚧 bleibt Emoji, bis gewählt wird.

- **Neu in 0.11.1:** Abzeichen-Stufen Bronze, Silber, Gold, Platin, Diamant (statt gewöhnlich bis mythisch, kein Grün mehr). Emblem als Metall-Medaillon: Bronze mit Band, Silber mit Lorbeer, Gold mit Kranz, Krone und Funkeln, Platin mit drehendem Strahlenkranz, Diamant mit Regenbogen-Strahlen und Edelsteinen. Glanzstreifen über jedem erreichten Abzeichen, schneller je höher die Stufe.

- **Neu in 0.11.2:**
  - Neue Kategorien **Nachbarn** (Land gegeben, ein Nachbarland nennen, jedes zählt; Auswahl: das eine angrenzende Land finden; Daten `js/grenzen.js` aus world-countries über `werkzeuge/grenzen_bauen.mjs`, 158 Länder mit Landgrenze) und **Buchstabensalat** (Ländername mit gemischten Buchstaben als Kacheln, der Gastgeber mischt, Auswahl mit ähnlich langen Namen). Beide in Räumen und bei „Gemischt“. Im Sprint erst nach Migration 010 (Server-Liste der Kategorien).
  - Abzeichen größer: Spielerkarte 52 px, Übersicht 58 px, Reiter 68 px.
  - Lange Lösungen (z. B. viele Nachbarländer) werden kleiner gesetzt.

- **Neu in 0.11.3:** Alle 20 Figuren neu gezeichnet im Sammelkarten-Stil (Colin: „cooler, weniger kindlich“ und „detaillierter, edler“): kräftiger Umriss, Licht-Verläufe, entschlossener Blick mit Lid und farbiger Iris, keine Bäckchen und Grinsemünder. Verläufe mit eindeutigen IDs je Zeichnung (Präfix je Modul + Zähler).

- **Neu in 0.12.0: Freunde und Einladungen** (Migration 010 am 26.11. eingespielt und mit zwei zurückgerollten Probe-Spielern geprüft: Anfrage, Doppelanfrage, Annehmen, Lese-Regel, Sprint Nachbarn/Buchstabensalat, Entfernen)
- **Freunde:** Dock-Knopf „Freunde“ mit Zähler (grün: wie viele online, rot pulsierend: neue Anfragen). Fenster mit Anfrage per Name, Anfragen annehmen/ablehnen, Liste mit Online-Status („online“, „im Raum ABCD, Flaggen“), Gesendet/Zurückziehen, Entfernen mit Rückfrage. „Als Freund hinzufügen“ im Spielerfenster (Klick in der Bestenliste).
- **Einladen:** im Warteraum „Freunde einladen“ bzw. im Fenster „Einladen“; beim Freund erscheint oben 15 s ein Banner mit „Beitreten“. Ist ein Freund in einem Raum, zeigt das Fenster „Mitspielen“.
- **Technik:** Tabelle `freunde` + Funktionen `freund_anfragen`, `freund_antworten`, `freund_entfernen`, `freunde_liste` (Migration 010). Online und Einladungen über Realtime-Kanal `qb-online` (`js/freunde.js`, Presence-Schlüssel = Konto-ID, Broadcasts `einladung` und `anfrage`). Test: `werkzeuge/test/freundetest.py`.
- **Sprint** für Nachbarn und Buchstabensalat (inkl. Regionen) und zwei Rekord-Abzeichen (Grenzkenner, Wortakrobat). Migration 010 lässt die Kategorien in `sprint_eintragen` zu.

- **Neu in 0.12.1:** Abzeichen auf der Spielerkarte 74 px und in der Profil-Übersicht 68 px, ohne Namen darunter; Name und Stufe erscheinen als Schild beim Drüberfahren (auch per Tastatur), ebenso bei Medaillen im Spielerfenster.

- **Neu in 0.13.0:**
  - **Spielerkarte:** Ecken wie bei echten Spielkarten (Rang-Buchstabe über Farbsymbol, unten gedreht) statt kleiner Wappenkarten. Die Kartenfläche folgt nicht mehr dem Seitenhintergrund.
  - **Kartenskins** (Anpassen → Kartenskin, `profile.stil.skin`), frei über Abzeichen, seit 0.13.2 als Kartenserie: Mitternacht (Pik, 5× Silber+), Neon (1× Gold+), Saphir (Karo, 3× Gold+), Smaragd (Kreuz, 1× Platin+), Rubin (Herz, 3× Platin+), Harlekin (1× Diamant), Royal Flush (Saison-Medaille). Gespeicherte IDs bleiben die alten (gewitter, matrix, frost, toxisch, lava, galaxie, meister), weil der Server sie prüft. Alle Skins haben dieselben Ebenen (`SKIN_SZENE` in app.js: Muster, Strahlen, Lichtring, Kartensymbol, Teilchen, Glanz, Rahmen, Zierlinie, Ecken, Steine); was sichtbar ist und wie es aussieht, regelt nur das CSS. Server prüft mit `qb_abzeichen_anzahl`/`qb_skin_frei` (Migration 011, am 26.11. eingespielt; Grenzen müssen zu ERFOLGE passen).
  - **Figuren süchtig** (Colins Wunsch, für alle): jede hängt an etwas anderem, mit eigenen Augen (gerötet, Augenringe, halb zu, aufgerissen) und Gegenstand. Fuchs Kaffee, Frosch Kiffen, Panda Bambus, Eule Energy-Drinks, Krake Zocken, Pinguin Bier, Katze Katzenminze, Igel Donuts, Schildkröte Serien, Dino Burger, Biene Honig, Koala Eukalyptus, Wal Vapen, Papagei Handy, Quizbot Strom, Herzdrache Lollis, Sternwolf Musik, Phönix Chili, Hofnarr Glücksspiel, Löwe Zigarren. Bewusst nichts mit Spritzen oder harten Drogen.
  - Colin: **kein Shop**. Mehr Kosmetik zum Freispielen ist gewünscht, Chat-Sticker als gute Idee genannt.

- **Neu in 0.17.1:** Gruppenfarben (Colin mochte vom Startseiten-Entwurf 3b nur die Farben, der Rest bleibt wie er war): Geografie Salbei `#8FB3A2`, Wörter Gold `#E3B66B`, Wissen und Schätzen Blau `#9DB8D9`, Alles zusammen Rosé `#D99A9A` (`--akzent` über `.gruppe-<id>`). Gruppentitel mit Farbpunkt in Bude und Sprint-Liste, Kacheln mit farbiger Oberkante, beim Drüberfahren Rand in der Gruppenfarbe.
- **Neu in 0.17.0:**
  - **Sprint-Auswahl als Liste mit Vorschau** (Colin hat aus vier UI-Vorschlägen diesen gewählt): links alle Sprint-Kategorien nach Gruppen (`SPRINT_LISTE` in app.js, Hauptstädte nur einmal), je Zeile Symbol, Rekord, Saisonplatz und „Übung“-Marke. Rechts die gewählte Kategorie groß (Kachelbild, Rekord, Saisonplatz, Bestwert der Saison, kurze Regel für Karte/Größer/Mehr/Schätzen/Bombe/Wissen/Gemischt), darunter nur die Einstellungen, die für sie gelten (Richtung, Region, Variante, Gemischt-Auswahl), „Standard einstellen“ bei Übung, Startknopf und die Top 5 der Saison plus eigener Platz. Die alte Leiste für alle Kategorien, „Mehr Einstellungen“ und das Saison-Raster darunter sind weg.
  - Gewählte Kategorie bleibt gespeichert (`quizbude.sprintWahl`), nach einem Sprint steht wieder die gespielte Kategorie da. Tastatur: ↑/↓/Pos1/Ende wählen, Enter auf der gewählten Zeile startet, Doppelklick startet auch. Unter 900 px steht die Vorschau direkt unter der gewählten Zeile, sticky nur ab 900 × 860 px.
  - Weltkarte verschwindet jetzt auch, wenn man einen Karten-Sprint oder -Raum mittendrin verlässt (vorher blieb sie hinter der nächsten Seite stehen).
  - Fußzeile überdeckt am Handy und am PC nichts mehr (mehr Platz unten in `main`).
- **Neu in 0.16.0:**
  - **Spielleiter**: Gastgeber kann im Warteraum „Leitet nur, spielt nicht mit“ wählen (`einst.leiter` = seine ID). Dann Start erst ab 2 Mitspielern (`startBereit` zählt den Spielleiter nicht), keine Eingabe/Knöpfe für ihn (auch `raten`/`waehlen`/`pinSetzen`/`schaetzen` geben „zu“, der Host ignoriert Treffer von ihm), Stand „x von y haben geantwortet“, Lösung auf Knopfdruck nur für ihn, nicht im Endstand und nicht in der Bestenliste, Auflösung wartet nicht auf ihn. In der Spielerliste als „Spielleiter“ unten.
  - **Kacheln in Gruppen** (`KATEGORIE_GRUPPEN` in kategorien.js: Geografie, Wörter, Wissen und Schätzen, Alles zusammen; `KATEGORIE_REIHE` folgt daraus). Kleine Gruppen stehen nebeneinander (Kachelbreite `--kw` über Container-Einheiten), gleiche Höhe in einer Reihe, auf dem Handy zwei Spalten je Gruppe.
- **Neu in 0.15.1:** Mehr oder weniger mit Pfeiltasten: ↑ = mehr (höher, länger, später, schwerer), ↓ = weniger; Tastenhinweis auf den Knöpfen und in der Tastenliste.
- **Neu in 0.15.0:**
  - **Bombe** (`bombe`): Silbe auf einer Bombe, Zündschnur brennt über die Fragezeit ab; jedes Wort mit der Silbe zählt, aber nur einmal pro Spiel (`bombeBenutzt`, im Raum über `treffer`/`geloest` mit `wort` geteilt). Wortliste `js/bombe-woerter.js` (601.762 Wörter bis 12 Buchstaben plus häufige, vorne komprimiert, 3,3 MB, wird nur bei Bombe geladen), dazu Zusammensetzungen aus bis zu drei bekannten Teilen mit Fugen-s. Silben `js/silben.js` mit Häufigkeit; Auswahl Leicht (≥250), Mittel (90–249), Schwer (<90, nur drei Buchstaben); Sprint steigert sich von selbst. ae/oe/ue und ss gehen auch. Gebaut mit `node --max-old-space-size=4096 werkzeuge/bombe_bauen.mjs <all-the-german-words/woerter.json> <@zxcvbn-ts/language-de/src/commonWords.json>`. Zeit um und nicht alle hatten ein Wort: „BUMM!“, sonst entschärft. Nicht in Gemischt (große Liste).
  - **Mehr oder weniger** (`mehr`, Daten `js/mehr.js`): links Wert sichtbar, rechts raten; Themen Bauwerke, Berge, Flüsse, Erfindungen und Ereignisse, Tiere; Paare nur mit deutlichem Abstand.
  - Schätzfragen im Sprint: Auflösung groß unter der Frage, bleibt kurz stehen, danach leere Rückmeldung.
  - Migration 013 (Sprint-Whitelist + mehr, bombe), am 26.11. eingespielt.
- **Neu in 0.14.2:** Autokennzeichen wieder komplett raus (Colin: kennt keiner). Die Server-Whitelist aus Migration 012 kennt `kennzeichen` noch, das schadet nicht.
- **Neu in 0.14.1:** Abzeichen „Auf deiner Karte“ per Ziehen sortieren (Pointer-Events, auch am Handy; aus der Liste mit der Maus direkt auf einen Platz, voller Platz wird ersetzt; Klick nimmt weiterhin runter). Kachelbild Schätzfragen als Bonbonglas (clipPath-ID je Kachel eindeutig).
- **Neu in 0.14.0:**
  - **Varianten** je Kategorie (`varianten` in kategorien.js, Raum-Einstellung `variante`, im Sprint unter „Mehr Einstellungen“): Buchstabensalat Leicht/Mittel/Schwer (Leicht: kurze Namen, erster Buchstabe steht vorne und ist golden; Schwer: lange/komplexe Namen, alle Wörter in einem Haufen; Stufe über `salatStufe`), Nachbarn Leicht (Karte) / Schwer (ohne Karte), Flaggen „Stück für Stück aufdecken“ (30 Kärtchen, Reihenfolge aus dem Ländercode, Dauer 75 % der Fragezeit, im Sprint 8 s; bei der Auflösung ganz offen).
  - **Gemischt**: Kategorien an- und abwählen (Raum: `einst.arten`, null = alle; Sprint: `quizbude.sprintArten` im localStorage). Gemischt enthält jetzt auch Hauptstadt → Land und Schätzfragen.
  - **Sprint-Übung**: Rekorde zählen nur mit Standard-Einstellungen (Region Alle, jeweils erste Variante, alle Kategorien in Gemischt). Sonst `s.uebung` mit Grund, Kachel bekommt „Übung“.
  - **Schätzfragen** (`js/schaetzen.js`, 62 Fragen in 5 Themen, Zahlen am 26.11. geprüft): Zahl eintippen (1.234, 2,5 Mio …, `zahlLesen`), Wertung nach Nähe (`schaetzWertung`: bis 150 Punkte, Verhältnis auf log-Skala, bei Jahren/Prozent fester Spielraum `s`), Treffer = höchstens 10 % daneben. Im Raum eine Abgabe pro Frage (Nachricht `schaetz`), Auflösung zeigt alle Schätzungen.
  - Migration 012 (Sprint-Whitelist + kennzeichen, schaetzen), am 26.11. eingespielt und mit zurückgerolltem Probekonto geprüft.
- **Neu in 0.13.2:** Kartenskins komplett neu als Kartenserie (siehe oben). Nachbarn zeigt im Spiel eine kleine Karte: das Land leuchtet, Nachbarn als Umriss, Rest blass (`js/nachbarkarte.js`, braucht die Weltkarten-Daten, die bei Nachbarn/Gemischt mitgeladen werden; ohne Daten Flagge wie vorher). Kachelbild Nachbarn: `bilder/nachbarn-vorschau.svg`, gebaut mit `node werkzeuge/nachbarn_vorschau.mjs [CODE]`. Buchstabensalat: helle Spielsteine mit Punktwerten auf einer Holzbank, Kachel als Fächer aus Steinen, Titel bricht als „Buchstaben-salat“ um.
- **Neu in 0.13.1:** Ladebildschirm schlicht (nur Logo + dünne Linie, Logo erst nach 0,25 s, Fläche sofort deckend). Updates laden still: keine Meldung, erst wenn kein Spiel läuft und der Tab im Hintergrund ist oder 15 s nichts passiert; danach ohne Ladebildschirm zurück an dieselbe Stelle (Adresse, Scrollstand, Raum, Profil-Reiter, Anpassen-Reiter). Flag `quizbude.leise` in sessionStorage.

## Als Nächstes (mit Colin besprochen)
- Reihenfolge jetzt: neue Profilbilder (live in 0.11.0) → Freunde und Einladungen → neue Quizze Nachbarn und Buchstabensalat → vorgemerkt: Seitenverhältnisse (von Flaggen) raten. Kein Tagesrätsel nach Loldle-Art.

1. Eigene Profilbilder statt Emojis (mit Colin zusammen gestalten).
2. (erledigt in 0.9.3) Admin-Bereich (eigenes Konto `requiem-admin`, Login mit Name „Admin“, Tabelle `admins`, `is_admin()` in jeder Funktion, eigene Seite `admin.html`): Spieler, Räume, Nachricht an alle, Server, Protokoll. Colin legt das Konto selbst in Supabase an.
3. Colin bewertet den Ruhm (Namen, Optik, Tempo). Danach Feinschliff.
4. Saison-Abzeichen zum Monatsende vergeben (siehe `PLAN.md`, Abschnitt 4). Die erste Saison endet am 30.11.2026.
5. Währung, Shop und Saisonblatt nach `PLAN.md`, sobald die offenen Fragen geklärt sind.
6. Freunde + Einladen in Räume (Einladung 15 s oben sichtbar).
7. Emoji-Rätsel inhaltlich überarbeiten (spannender).

- **Insider-Fragen**: von Colin am 26.11. gestrichen.
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
