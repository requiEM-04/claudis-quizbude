// Mehr oder weniger: links steht ein Wert, rechts muss man sagen, ob es mehr oder weniger ist.
// abstand: Mindestunterschied zwischen den beiden Werten (Faktor bei Größen, Jahre bei Jahreszahlen), damit es keine Glücksfrage wird.
export const MEHR_THEMEN = {
  bauwerke: {
    titel: 'Bauwerke', frage: 'Höher oder niedriger?', mehr: 'Höher', weniger: 'Niedriger', einheit: 'm', abstand: 1.15,
    dinge: [
      ['Burj Khalifa', 828], ['Tokyo Skytree', 634], ['Shanghai Tower', 632], ['CN Tower in Toronto', 553], ['One World Trade Center', 541],
      ['Taipei 101', 508], ['Petronas Towers', 452], ['Berliner Fernsehturm', 368], ['Eiffelturm', 330], ['Burj al Arab', 321],
      ['Golden Gate Bridge (Pfeiler)', 227], ['Space Needle in Seattle', 184], ['Ulmer Münster', 162], ['Kölner Dom', 157], ['Cheops-Pyramide', 139],
      ['Atomium in Brüssel', 102], ['Big Ben', 96], ['Freiheitsstatue mit Sockel', 93], ['Schiefer Turm von Pisa', 56], ['Hermannsdenkmal', 53],
      ['Christusstatue in Rio', 38], ['Brandenburger Tor', 26],
    ],
  },
  berge: {
    titel: 'Berge', frage: 'Höher oder niedriger?', mehr: 'Höher', weniger: 'Niedriger', einheit: 'm', abstand: 1.12,
    dinge: [
      ['Mount Everest', 8849], ['K2', 8611], ['Aconcagua', 6961], ['Denali', 6190], ['Kilimandscharo', 5895], ['Mont Blanc', 4806],
      ['Matterhorn', 4478], ['Großglockner', 3798], ['Fuji', 3776], ['Zugspitze', 2962], ['Olymp', 2918], ['Watzmann', 2713],
      ['Säntis', 2502], ['Feldberg im Schwarzwald', 1493], ['Ben Nevis', 1345], ['Vesuv', 1281], ['Brocken', 1141],
    ],
  },
  fluesse: {
    titel: 'Flüsse', frage: 'Länger oder kürzer?', mehr: 'Länger', weniger: 'Kürzer', einheit: 'km', abstand: 1.15,
    dinge: [
      ['Nil', 6650], ['Jangtse', 6300], ['Wolga', 3530], ['Donau', 2850], ['Ganges', 2525], ['Rhein', 1233], ['Elbe', 1094],
      ['Oder', 866], ['Seine', 777], ['Mosel', 544], ['Main', 527], ['Weser', 452], ['Spree', 400], ['Themse', 346],
    ],
  },
  jahre: {
    titel: 'Erfindungen und Ereignisse', frage: 'Früher oder später?', mehr: 'Später', weniger: 'Früher', einheit: 'Jahr', jahr: true, abstand: 3,
    dinge: [
      ['Buchdruck von Gutenberg', 1450], ['Kolumbus erreicht Amerika', 1492], ['Französische Revolution', 1789], ['Erste deutsche Eisenbahn', 1835],
      ['Telefon von Bell', 1876], ['Glühbirne von Edison', 1879], ['Erstes Auto von Benz', 1886], ['Eröffnung des Eiffelturms', 1889],
      ['Erster Motorflug der Brüder Wright', 1903], ['Untergang der Titanic', 1912], ['Beginn des Ersten Weltkriegs', 1914], ['Mondlandung', 1969],
      ['Game Boy', 1989], ['Fall der Berliner Mauer', 1989], ['World Wide Web für alle', 1991], ['PlayStation', 1994], ['Gründung von Google', 1998],
      ['Wikipedia', 2001], ['Euro als Bargeld', 2002], ['Facebook', 2004], ['YouTube', 2005], ['Erstes iPhone', 2007], ['WhatsApp', 2009], ['Instagram', 2010],
    ],
  },
  tiere: {
    titel: 'Tiere', frage: 'Schwerer oder leichter?', mehr: 'Schwerer', weniger: 'Leichter', einheit: 'kg', abstand: 1.5, ca: true,
    dinge: [
      ['Blauwal', 150000], ['Afrikanischer Elefant', 6000], ['Breitmaulnashorn', 2300], ['Flusspferd', 1500], ['Giraffe', 1000], ['Kuh', 700],
      ['Pferd', 500], ['Eisbär', 450], ['Tiger', 220], ['Löwe', 190], ['Gorilla', 160], ['Strauß', 120], ['Mensch', 70], ['Wolf', 40],
      ['Schäferhund', 35], ['Kaiserpinguin', 30], ['Hauskatze', 4],
    ],
  },
};
