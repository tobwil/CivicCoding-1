# KITA Spaltenzuordnung und verbleibende Fragen

Aktualisierung am 23.09.2026. Der Auftraggeber hat die Umsetzung logisch rekonstruierbarer Bezüge als dokumentierte Annahmen beauftragt. Das ist keine fachliche Bestätigung durch ALBA. Die Quelldateien bleiben unverändert.

## Umgesetzte Zuordnung

Die Verweise passen überwiegend zu einer Verschiebung um zehn Spalten. Statt pauschal Buchstaben zu verschieben, verwenden wir eine ausdrücklich benannte Zuordnung in `app/lib/kita.ts`:

| Persona-Verweis | Aktuelle Spalte | Verwendeter Inhalt |
| --- | --- | --- |
| S | I | Materialien |
| AF | V | Fangspiel |
| AG | W | Laufspiel |
| AH | X | Zielwurfspiel |
| AJ | Z | Ballspiele |
| AK | AA | Kraft- und Gewandheitsspiele |
| AM | AC | Überbrückungsspiel |
| AN | AD | Materialgewöhnung |
| AO | AE | Laufschule |

Quelle: `Personas_Kita_KI_Prototyp.docx`, Professionen 2 und 3; `Content-Tabelle_Kita.xlsx`, Blatt Spiele Kita, Kopfzeile 4. Die genannten Überschriften sind real; ihre Zuordnung zu den alten Buchstaben bleibt eine begründete Annahme. Die früheren zehn Testspiele belegen keine entsprechende alte Tabellenfassung.

## Damit aktive Regeln

- Die beiden Einstiegsrollen behalten ihre bisherigen Materialgewöhnung-/Laufspiel-/Fangspiel-Ketten.
- Erzieher:innen mit Sportqualifikation: zusätzlich Wechsel zwischen Fangspiel, Laufspiel, Zielwurfspiel, Kraft-/Gewandheitsspiel und Laufschule bei gleichem Material. Wenn eine Kette ein fortgeschrittenes Spiel enthält, muss das zweite ein Einsteiger-Spiel aus Laufspiel, Laufschule oder Überbrückungsspiel sein. Die Einsteiger-Bedingung auch für Überbrückung ist unsere konservative Auslegung; zwei fortgeschrittene Spiele werden nicht verbunden.
- Erfahrene Vereinstrainer:innen: zusätzlich Wechsel zwischen Fangspiel, Laufspiel, Zielwurfspiel und Kraft-/Gewandheitsspiel. Die Persona erlaubt weiterhin alle drei dokumentierten Niveaus; es wird keine zusätzliche, im Dokument nicht genannte Niveaugrenze für diese Kette erfunden.
- Trainer-Persona, Alter 3 bis unter 5: Fangspiel, Laufspiel, Zielwurfspiel, Ballspiele, Materialgewöhnung oder Laufschule. Damit sind auch 3,5 und 4,5 Jahre ausdrücklich eingeordnet.
- Trainer-Persona, Alter ab 5 und weniger als 30 Minuten: Fangspiel, Laufspiel, Zielwurfspiel, Kraft-/Gewandheitsspiel, Laufschule oder Materialgewöhnung. Ab 30 Minuten bleibt die widersprüchliche automatische Kategorien-/Einheitenfolge für diese Altersgruppe aus. Suche und ausdrücklich gewünschte freie Planung bleiben verfügbar.

Diese Alters-/Zeitkategorien gelten für Suchtreffer und die Kandidaten freier Einheiten gleichermaßen. Die freie Einheit wird dadurch nicht zu einer fachlich freigegebenen ALBA-Phasenfolge.

## Bewusst konservative Auslegung

Gleiches Material bedeutet weiterhin dieselbe normalisierte vollständige Materialliste; Groß-/Kleinschreibung, Reihenfolge und Komma/Semikolon sind unerheblich. „ohne Material“ und „kein Material“ gelten als gleich. Eine leere Angabe ist unbekannt, nicht materialfrei. Zusätzliche Geräte werden nicht unterstellt.

Beim erweiterten Kategorienwechsel dürfen die beiden Spiele keine gemeinsame Kategorie innerhalb der jeweiligen Auswahlgruppe besitzen. Mehrfachmarkierungen liefern sonst keinen eindeutigen Wechsel. Das betrifft nicht die ausdrücklich beschriebenen einfachen Übergänge. Beide Spiele müssen zu den aktuellen Gruppenbedingungen passen und aus verschiedenen Spielfamilien stammen. Ausgeblendete Spiele werden nicht empfohlen. Die Kettenprüfung erfolgt vor der Deduplizierung, damit eine passende Variante nicht verloren geht.

## Tatsächlich offene Fragen an ALBA

1. **AP und AR:** Die Verschiebung würde auf „schnell vorbereitet“ bzw. „draußen“ führen. Das sind keine Spielkategorien. Welche Inhalte sind gemeint? „AP?“ bleibt ausdrücklich ungeklärt; die davon abhängigen automatischen Regeln bleiben aus. Die Ohne-Material-Suche bleibt über die reale Materialangabe möglich, ohne einen geratenen AR-Kategoriefilter.
2. **Genau 30 Minuten:** Soll die erfahrene Trainer-Persona eine Spielesammlung, eine Auswahlstufe oder automatisch eine Dreier-Einheit bekommen? Wie verhält sich das zur Regel unter 30 Minuten und zum dritten Abschnitt über 30 Minuten?
3. **Bitte Annahmen bestätigen:** Stimmen Zuordnung, vollständige Materialgleichheit, Einsteiger-Abschluss nach einem fortgeschrittenen Spiel sowie Altersintervall 3 bis unter 5? Bei abweichender Intention lassen sich diese Festlegungen zentral korrigieren.
4. **Datenqualität:** Bedingte Niveaus, VSK, unsichere x-Markierungen und fehlende Auswahl-/Anleitungsangaben benötigen weiterhin redaktionelle Klärung. Diese Inhalte werden nicht geraten.

## Hinweis für die Begleitmail

Einige Spaltenverweise scheinen aus einer anderen Tabellenfassung zu stammen. Wir haben die plausibel rekonstruierbaren Bezüge bereits den benannten Feldern der aktuellen KITA-Tabelle zugeordnet und die entsprechenden Folgespiel-Regeln aktiviert. Die Zuordnung und unsere konservativen Auslegungen sind im Handout transparent dokumentiert. Bitte aktualisiert die Verweise bei euch ebenfalls und bestätigt die Zuordnung bei Gelegenheit. Nur die nicht eindeutig rekonstruierbaren Verweise AP/AR, die widersprüchliche automatische Zeitlogik und die genannten Datenfragen sind noch offen.
