// Schätzfragen: f = Frage, a = Antwort, e = Einheit, t = Thema, i = Erklärung zur Auflösung.
// s = Spielraum für Fragen, bei denen der Abstand zählt statt des Verhältnisses (Jahreszahlen, Prozent, Sekundenbruchteile).
export const SCHAETZ_THEMEN = { mensch: 'Mensch und Tier', all: 'Erde und Weltall', de: 'Deutschland', rekorde: 'Rekorde und Geschichte', alltag: 'Spiel und Alltag' };

export const SCHAETZEN = [
  // Mensch und Tier
  { t: 'mensch', f: 'Wie viele Knochen hat ein erwachsener Mensch?', a: 206, e: 'Knochen', i: 'Babys kommen mit rund 300 Knochen zur Welt, viele davon wachsen später zusammen.' },
  { t: 'mensch', f: 'Wie oft schlägt ein menschliches Herz an einem einzigen Tag?', a: 100000, e: 'Schläge', i: 'Bei rund 70 Schlägen pro Minute sind es etwa 100.000 am Tag.' },
  { t: 'mensch', f: 'Wie viele Haare hat ein Mensch im Schnitt auf dem Kopf?', a: 100000, e: 'Haare', i: 'Rund 100.000. Blonde haben meist mehr, Rothaarige weniger.' },
  { t: 'mensch', f: 'Wie viele Liter Blut fließen durch den Körper eines Erwachsenen?', a: 5, e: 'Liter', i: 'Etwa 5 bis 6 Liter, je nach Körpergröße.' },
  { t: 'mensch', f: 'Wie viel wiegt das Gehirn eines Erwachsenen?', a: 1350, e: 'Gramm', i: 'Rund 1,3 bis 1,4 Kilogramm, also nur etwa 2 Prozent des Körpergewichts.' },
  { t: 'mensch', f: 'Wie viel Prozent des Körpers eines Erwachsenen sind Wasser?', a: 60, e: 'Prozent', s: 25, i: 'Rund 60 Prozent, bei Babys sogar noch mehr.' },
  { t: 'mensch', f: 'Wie viele Stunden am Tag schläft ein Koala?', a: 20, e: 'Stunden', s: 8, i: '18 bis 22 Stunden. Eukalyptusblätter liefern kaum Energie.' },
  { t: 'mensch', f: 'Wie viele Herzen hat ein Oktopus?', a: 3, e: 'Herzen', i: 'Drei: eins für den Körper und je eins für die beiden Kiemen.' },
  { t: 'mensch', f: 'Wie viele Augen hat eine Honigbiene?', a: 5, e: 'Augen', i: 'Zwei große Facettenaugen und drei kleine Punktaugen auf der Stirn.' },
  { t: 'mensch', f: 'Wie alt kann ein Grönlandhai werden?', a: 400, e: 'Jahre', i: 'Das älteste untersuchte Tier wurde auf knapp 400 Jahre geschätzt. Kein anderes Wirbeltier wird so alt.' },
  { t: 'mensch', f: 'Wie viele Eier legt eine Bienenkönigin im Sommer an einem Tag?', a: 2000, e: 'Eier', i: 'In der Hochsaison bis zu 2.000 Eier am Tag, mehr als ihr eigenes Körpergewicht.' },
  { t: 'mensch', f: 'Wie viele Zähne hat ein Erwachsener mit Weisheitszähnen?', a: 32, e: 'Zähne', i: '32, davon vier Weisheitszähne. Kinder haben 20 Milchzähne.' },
  { t: 'mensch', f: 'Wie viele Monate ist eine Elefantenkuh schwanger?', a: 22, e: 'Monate', i: 'Rund 22 Monate, so lange wie bei keinem anderen Landtier.' },
  { t: 'mensch', f: 'Wie viele Halswirbel hat eine Giraffe?', a: 7, e: 'Wirbel', i: 'Sieben, genauso viele wie ein Mensch. Sie sind nur viel länger.' },

  // Erde und Weltall
  { t: 'all', f: 'Wie weit ist der Mond im Schnitt von der Erde entfernt?', a: 384400, e: 'Kilometer', i: 'Rund 384.400 Kilometer. Ein Auto bräuchte mit 100 km/h etwa 160 Tage.' },
  { t: 'all', f: 'Wie viele Sekunden braucht das Licht von der Sonne bis zur Erde?', a: 499, e: 'Sekunden', i: 'Gut 8 Minuten und 19 Sekunden.' },
  { t: 'all', f: 'Wie schnell fliegt die Raumstation ISS um die Erde?', a: 28000, e: 'km/h', i: 'Rund 28.000 km/h. Eine Runde um die Erde dauert etwa 90 Minuten.' },
  { t: 'all', f: 'Wie tief ist die tiefste Stelle im Meer?', a: 11000, e: 'Meter', i: 'Das Challengertief im Marianengraben liegt knapp 11 Kilometer unter dem Meeresspiegel.' },
  { t: 'all', f: 'Wie viele Erden würden ungefähr in die Sonne passen?', a: 1300000, e: 'Erden', i: 'Rund 1,3 Millionen.' },
  { t: 'all', f: 'Wie schnell rast die Erde auf ihrer Bahn um die Sonne?', a: 30, e: 'Kilometer pro Sekunde', i: 'Rund 30 Kilometer pro Sekunde, also über 100.000 km/h.' },
  { t: 'all', f: 'Wie heiß ist die Oberfläche der Sonne?', a: 5500, e: '°C', i: 'Rund 5.500 °C. Im Kern sind es etwa 15 Millionen Grad.' },
  { t: 'all', f: 'Wie viele Erdtage dauert ein einziger Tag auf der Venus?', a: 243, e: 'Erdtage', i: 'Die Venus dreht sich so langsam, dass ihr Tag länger ist als ihr Jahr (225 Erdtage).' },
  { t: 'all', f: 'Wie viel Prozent der Erdoberfläche sind mit Wasser bedeckt?', a: 71, e: 'Prozent', s: 25, i: 'Rund 71 Prozent.' },
  { t: 'all', f: 'Wie hoch ist der Mount Everest?', a: 8849, e: 'Meter', i: '8.849 Meter laut der Messung von 2020.' },
  { t: 'all', f: 'Wie alt ist die Erde?', a: 4.5, e: 'Milliarden Jahre', i: 'Rund 4,5 Milliarden Jahre.' },
  { t: 'all', f: 'Wie viele Gewitter toben gleichzeitig irgendwo auf der Erde?', a: 2500, e: 'Gewitter', i: 'Zu jedem Zeitpunkt sind es etwa 2.000 bis 3.000.' },
  { t: 'all', f: 'Wie viele Menschen leben auf der Erde?', a: 8.3, e: 'Milliarden', i: 'Laut Schätzung der Vereinten Nationen rund 8,3 Milliarden (2026).' },
  { t: 'all', f: 'Wie viel Prozent aller Menschen leben in Asien?', a: 59, e: 'Prozent', s: 25, i: 'Knapp 60 Prozent. Indien und China allein kommen auf über ein Drittel.' },
  { t: 'all', f: 'Wie viele Sprachen werden auf der Welt gesprochen?', a: 7000, e: 'Sprachen', i: 'Rund 7.000, viele davon nur noch von wenigen Menschen.' },

  // Deutschland
  { t: 'de', f: 'Wie hoch ist die Zugspitze?', a: 2962, e: 'Meter', i: '2.962 Meter, der höchste Berg Deutschlands.' },
  { t: 'de', f: 'Wie viele Länder grenzen an Deutschland?', a: 9, e: 'Länder', i: 'Neun, so viele wie bei keinem anderen Land in Europa.' },
  { t: 'de', f: 'Wie lang ist der Rhein?', a: 1233, e: 'Kilometer', i: 'Rund 1.233 Kilometer von den Alpen bis zur Nordsee.' },
  { t: 'de', f: 'Wie viele Stufen führen im Kölner Dom auf den Südturm?', a: 533, e: 'Stufen', i: '533 Stufen bis zur Aussichtsplattform in rund 100 Metern Höhe.' },
  { t: 'de', f: 'Wie hoch ist der Berliner Fernsehturm?', a: 368, e: 'Meter', i: '368 Meter, das höchste Bauwerk Deutschlands.' },
  { t: 'de', f: 'Wie viele Brücken hat Hamburg?', a: 2500, e: 'Brücken', i: 'Rund 2.500, mehr als jede andere Stadt in Europa.' },
  { t: 'de', f: 'Wie viele Menschen leben in Deutschland?', a: 83.5, e: 'Millionen', i: 'Ende 2025 laut Statistischem Bundesamt 83,5 Millionen.' },
  { t: 'de', f: 'Wie lang ist das deutsche Autobahnnetz?', a: 13200, e: 'Kilometer', i: 'Rund 13.200 Kilometer, dazu kommen 37.700 Kilometer Bundesstraße.' },
  { t: 'de', f: 'Wie viele Tage stand die Berliner Mauer?', a: 10315, e: 'Tage', i: 'Vom 13. August 1961 bis zum 9. November 1989.' },
  { t: 'de', f: 'Wie viele Jahre dauerte der Bau des Kölner Doms?', a: 632, e: 'Jahre', i: 'Grundsteinlegung 1248, fertig 1880. Dazwischen lag die Baustelle rund 300 Jahre still.' },
  { t: 'de', f: 'Wie viele Sitze hat der Bundestag?', a: 630, e: 'Sitze', i: '630, so ist es seit der Wahlrechtsreform festgelegt.' },
  { t: 'de', f: 'Wie weit ist es von Berlin nach München, Luftlinie?', a: 504, e: 'Kilometer', i: 'Rund 504 Kilometer. Mit dem Auto sind es fast 600.' },

  // Rekorde und Geschichte
  { t: 'rekorde', f: 'Wie alt wurde der älteste Mensch, dessen Alter belegt ist?', a: 122, e: 'Jahre', s: 30, i: 'Jeanne Calment aus Frankreich wurde 122 Jahre alt (1875 bis 1997).' },
  { t: 'rekorde', f: 'Wie hoch ist der Burj Khalifa in Dubai?', a: 828, e: 'Meter', i: '828 Meter, das höchste Gebäude der Welt.' },
  { t: 'rekorde', f: 'Wie lang ist die Chinesische Mauer mit allen Abschnitten?', a: 21196, e: 'Kilometer', i: 'Laut einer chinesischen Vermessung von 2012 rund 21.196 Kilometer.' },
  { t: 'rekorde', f: 'In wie vielen Sekunden lief Usain Bolt seinen Weltrekord über 100 Meter?', a: 9.58, e: 'Sekunden', s: 1.5, i: '9,58 Sekunden, aufgestellt 2009 in Berlin.' },
  { t: 'rekorde', f: 'Wie viel wiegt der Eiffelturm?', a: 10100, e: 'Tonnen', i: 'Rund 10.100 Tonnen, davon etwa 7.300 Tonnen Eisen.' },
  { t: 'rekorde', f: 'Wie viele Stufen hat der Eiffelturm bis ganz nach oben?', a: 1665, e: 'Stufen', i: '1.665 Stufen. Für Besucher sind nur die ersten 674 offen.' },
  { t: 'rekorde', f: 'In welchem Jahr wurde das erste iPhone vorgestellt?', a: 2007, e: 'Jahr', s: 15, i: 'Im Januar 2007.' },
  { t: 'rekorde', f: 'In welchem Jahr flog der erste Mensch ins All?', a: 1961, e: 'Jahr', s: 25, i: 'Juri Gagarin, am 12. April 1961.' },
  { t: 'rekorde', f: 'Wie viele Tage dauerte die Mondmission Apollo 11 vom Start bis zur Landung im Meer?', a: 8, e: 'Tage', i: 'Gut 8 Tage, vom 16. bis zum 24. Juli 1969.' },

  // Spiel und Alltag
  { t: 'alltag', f: 'Wie viele Tasten hat ein klassisches Klavier?', a: 88, e: 'Tasten', i: '88 Tasten: 52 weiße und 36 schwarze.' },
  { t: 'alltag', f: 'Wie viele Karten hat ein Skatblatt?', a: 32, e: 'Karten', i: '32 Karten, von der Sieben bis zum Ass in vier Farben.' },
  { t: 'alltag', f: 'Wie viele Augen sind in einem Skatspiel insgesamt verteilt?', a: 120, e: 'Augen', i: '120 Augen. Wer als Alleinspieler 61 hat, gewinnt.' },
  { t: 'alltag', f: 'Wie viele Augen hat ein normaler Spielwürfel zusammengezählt?', a: 21, e: 'Augen', i: '1 + 2 + 3 + 4 + 5 + 6 = 21.' },
  { t: 'alltag', f: 'Wie viele Kombinationen gibt es beim Lotto 6 aus 49?', a: 13983816, e: 'Kombinationen', i: 'Genau 13.983.816, ohne Superzahl.' },
  { t: 'alltag', f: 'Wie viele Sekunden hat ein Jahr mit 365 Tagen?', a: 31536000, e: 'Sekunden', i: 'Genau 31.536.000.' },
  { t: 'alltag', f: 'Wie viele Liter Wasser passen in ein olympisches Schwimmbecken?', a: 2500000, e: 'Liter', i: 'Mindestens 2,5 Millionen: 50 mal 25 Meter und mindestens 2 Meter tief.' },
  { t: 'alltag', f: 'Wie viele farbige Felder hat ein klassischer Zauberwürfel?', a: 54, e: 'Felder', i: '54, neun auf jeder der sechs Seiten.' },
  { t: 'alltag', f: 'Wie lang ist ein Fußballfeld in der Bundesliga?', a: 105, e: 'Meter', i: '105 Meter lang und 68 Meter breit.' },
  { t: 'alltag', f: 'Wie viele Kilometer läuft ein Bundesliga-Profi in einem Spiel?', a: 11, e: 'Kilometer', i: 'Meist 10 bis 12 Kilometer, Mittelfeldspieler oft am meisten.' },
  { t: 'alltag', f: 'Wie viele Figuren stehen zu Beginn auf dem Schachbrett?', a: 32, e: 'Figuren', i: '32, je 16 für Weiß und Schwarz.' },
];
