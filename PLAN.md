# Claudis Quizbude – Plan für Kosmetik, Währung und Pass

Nur Planung. Umgesetzt wird erst, wenn Colin die Punkte abgesegnet hat. Alles bleibt ohne echtes Geld.

## Was schon steht (0.8.0)

- **Ruhm** steigt automatisch mit jedem Spiel und Sprint und schaltet pro Rang frei: Namensfarbe, Titel, Karten-Effekt, Rahmen und Hintergrund.
- Die Ränge sind Bube, Dame, König, Ass und Joker. Die Stufen sind die Kartenfarben Karo, Herz, Pik, Kreuz.
- Ruhm ist der Fortschritt, den man nicht ausgeben kann. Alles Weitere soll daneben laufen, nicht stattdessen.

## 1. Währung: Chips

- **Name:** Vorschlag „Chips“, passend zum Kartenthema (Alternativen: Jetons, Taler). Entscheidung offen.
- **Verdienen:**
  - 1 Chip je richtige Antwort im Raum.
  - 5 Chips für einen Sieg, 2 Chips fürs Mitspielen.
  - 1 Chip je 3 Richtige im Sprint.
  - Tagesbonus 10 Chips beim ersten Spiel des Tages.
- **Sicher machen:**
  - Gutschrift nur auf dem Server, in denselben RPCs wie die Statistik (`spiel_eintragen`, `sprint_eintragen`).
  - Neue Spalte `chips int`, die man nicht selbst ändern darf.
  - Käufe nur über ein RPC `kaufen(p_artikel)`, das Preis und Kontostand prüft und den Kauf in einer Tabelle `kaeufe` speichert.
- **Gäste:** verdienen nichts.

## 2. Shop

- **Was es gibt** (alles nur Optik, nichts, was beim Raten hilft):
  - Kartenrücken: das Muster hinter dem eigenen Wappen, wenn man auf die Karte tippt.
  - Zusätzliche Avatare und Avatarfarben.
  - Siegerjubel: andere Animationen fürs Treppchen, zum Beispiel Kartenregen, Chipsturm oder Scheinwerfer.
  - Chat-Sticker für den Raum.
  - Raum-Themen: Hintergrund der Frage für alle im Raum, gewählt vom Gastgeber.
- **Aufbau:**
  - Ein fester Bereich und ein Tagesangebot mit drei wechselnden Artikeln.
  - Preise grob 50 bis 400 Chips, Seltenes bis 800.
- **Daten:** Artikel liegen als Liste im Code (`js/shop.js`), Besitz in `kaeufe`. Im Profil kommen gekaufte Sachen in „Anpassen“ dazu.

## 3. Saisonblatt (Pass)

- **Idee:** Jede Monats-Saison hat ein eigenes Blatt mit 20 Stufen. Fortschritt gibt es durch Spielen (Blatt-Punkte wie Ruhm, aber jede Saison neu).
- **Belohnungen:** Chips, ein Saison-Avatar, ein Saison-Kartenrücken und ganz am Ende ein Saison-Titel.
- **Ohne Kauf:** Es gibt keine bezahlte Spur. Alle haben dasselbe Blatt. Ob es eine zweite Spur gegen Chips gibt, besprechen wir noch.
- **Mit den Saison-Abzeichen verbunden:** Die Top 3 der Monatswertung bekommen zusätzlich ihr Abzeichen (Platz 1–3 mit Monat). Diese Abzeichen sind schon sichtbar und werden zum Monatsende vergeben.

## 4. Saison-Abzeichen vergeben (nächster kleiner Schritt)

- **Tabelle `abzeichen`:** `profil`, `saison` (zum Beispiel 2026-11), `wertung` (`punkte`, `siege`, `sprint:<kategorie>`), `platz`.
- **Vergabe:** Funktion `saison_abschliessen(p_saison)`, am 1. jedes Monats aufgerufen. Das geht entweder über einen geplanten Job in Supabase (pg_cron) oder, falls nicht verfügbar, beim ersten Aufruf der Bude im neuen Monat.
- **Anzeige:** Abzeichen im Profil unter der Spielerkarte, das beste davon auch klein in der Bestenliste.

## Offene Fragen an Colin

1. Name der Währung: Chips, Jetons oder etwas anderes?
2. Saisonblatt: nur eine Spur für alle, oder eine zweite Spur gegen Chips?
3. Sollen Raum-Themen alle im Raum sehen, oder nur der, der sie gekauft hat?
