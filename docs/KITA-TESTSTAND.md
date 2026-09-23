# KITA-Teststand vom 23. September 2026

## Auftrag und Ausgangspunkt

Maßgeblich ist ALBAs Mail vom 22.09.2026: ausschließlich Spiele aus der angehängten KITA-Content-Tabelle und ausschließlich die bereits ausgearbeiteten Personas verwenden. Die Kommunikation vom 18.09.2026 erläutert die Trennung zwischen Profil und situativen Filtern. Die Originalmails und personenbezogenen Kontaktdaten werden nicht im Repository veröffentlicht.

Nach `git fetch origin` war `main` unverändert auf `00cc1e6`. Der neu sichtbare Remote-Branch `Prototype_V1` zeigt auf den älteren Stand `13a13c2` und ist ein Vorfahr von `main`, keine neuere Implementierung. Der Feature-Branch `codex/kita-personas-alba` basiert deshalb auf `00cc1e6`. Keine Änderung an den bestehenden Deployments.

## Quellen und Import

- `Content-Tabelle_Kita.xlsx`, Blatt `Spiele Kita`, Kopfzeile 4.
- `Personas_Kita_KI_Prototyp.docx`, drei ausgearbeitete Regelgruppen mit insgesamt vier Rollen.
- Der Import übernimmt 129 Zeilen mit Spielname oder Titel. Auch die beiden benannten Beispielzeilen 5 und 6 bleiben als Tabelleninhalt enthalten; sie erhalten keine Sonderfreigabe.
- Vier unbenannte Zeilen sind keine Spielkarten: 14 (K2.5), 87 (K64 / „Drehungen“), 88 (K65 / „Dehungen“) und 97 („Osterdreh 2022“). Leere Formatierungszeilen bis Zeile 1130 sind ebenfalls kein Inhalt.
- IDs enthalten die Quellzeile (`kita-r…`). Der SHA-256 der Quelldatei wird im Datensatz und jeder Coach-Sitzung gespeichert. Ein neuer Import invalidiert Sitzungen des vorherigen Datenstands.
- Beschreibung, Teaser, Ablauf, Material und ALBA-Tipp stammen nur aus der Tabelle. Kein Nachladen externer Spielbeschreibungen und keine Ergänzung durch die früheren zehn Testprofile.
- 74 Einträge haben einen eindeutigen, normalisierten Titelabgleich mit dem historischen öffentlichen Katalog. Nur deren bestehende Links und Bilder werden übernommen. 55 Einträge bleiben ohne zugeordneten Original-Link/Bild; es werden keine URLs geraten. Die vollständige Anleitung ist weiterhin direkt aus der Tabelle lesbar, sofern vorhanden.
- 41 Einträge haben mindestens eine offene Angabe bei Mindestalter, Gruppengrenzen, Vorbereitung, Niveau, Ablauf oder Material. Das bedeutet nicht, dass alle 41 vollständig ausgeschlossen sind: Ein fehlender Ablauf wird angezeigt, verhindert aber allein nicht die Metadaten-Vorauswahl. Eine Durchführungsgeschichte darf fehlende Abläufe nicht erfinden.

## Aktivierte Regeln

| Rolle | Vorbereitung | Niveau |
| --- | --- | --- |
| Erzieher:in ohne Sportqualifikation | minimal | Einsteiger |
| Vereinstrainer:in ohne / mit wenig Kita-Erfahrung | minimal | Einsteiger |
| Erzieher:in mit Sportqualifikation in Kita | bis einschließlich 10 Minuten | Einsteiger, Fortgeschrittene |
| Vereinstrainer:in mit Erfahrung in Kita | bis einschließlich 10 Minuten | Einsteiger, Fortgeschrittene, Experte |

Das Profil wird getrennt von Gruppendaten angeboten, gerätelokal gespeichert und kann auch im Coach geändert werden. Ein bloßes Erwähnen von „Kita“ im Chat ändert nicht die Persona.

Für alle Rollen gelten die dokumentierte Mindest-/Maximalgruppengröße und das Mindestalter. Das Mindestalter des Spiels muss höchstens sechs Jahre und höchstens das jüngste eingegebene Alter sein. Ein dokumentiertes Höchstalter wird zusätzlich respektiert; eine leere Höchstalterszelle bleibt unbekannt. Bei Eingabe über sechs Jahren werden keine KITA-Empfehlungen ausgegeben.

Im **Funktionsraum Kita** sind über zwölf Kinder ein Ausschluss mit Hinweis auf Sporthalle oder Außengelände. In der **Sporthalle** gilt keine zusätzliche Ortsbeschränkung über die Gruppengrenzen der Tabelle hinaus. Für das **Außengelände** müssen sowohl „draußen“ als auch „Laufspiel“ oder „Fangspiel“ eindeutig markiert sein. Die alte pauschale Outdoor-Pflicht ab 13 Kindern und die alte Viertel-Hallenkapazität sind entfernt.

Die aktuelle Zuordnung erfolgt nach geprüften Überschriften: L Vorbereitung, M/N Alter, O/P Gruppengröße, T Niveau, V Fangspiel, W Laufspiel, AD Materialgewöhnung, AH draußen, I Materialien. `x (?)`, leere oder kommentierte Kategorie-Markierungen sind keine sichere Freigabe.

Unstrittige Schreibweisen werden vereinheitlicht: `Minimal`, `minimal ` und `mimimal` zu minimal; `Fortgeschritten` zu Fortgeschrittene; verschiedene 5-/10-Minuten-Schreibweisen zur oberen Zeitgrenze. Die Rohwerte bleiben daneben erhalten. `VSK` wird nicht in ein geratenes Zahlenalter übersetzt. Bedingte Niveautexte wie „Einsteiger bei …, Fortgeschritten wenn …“ erhalten ohne geklärte Variante keine Empfehlung.

## Coach und Grenzen

1. Situation beschreiben, bis zu sechs geprüfte Spiele erhalten.
2. Eine Karte auswählen; die Auswahl bleibt in der Sitzung erhalten.
3. Themenwelt angeben. Mit API-Key liest der Coach den Tabellen-Ablauf und kann eine ausdrücklich als KI-Rahmung bezeichnete Bewegungsgeschichte formulieren. Ohne Key wird keine KI-Geschichte vorgetäuscht.
4. Optional ein Folgespiel erfragen. Die beiden Einstiegsrollen nutzen Materialgewöhnung → Laufspiel oder umgekehrt bei identischen normalisierten Materiallisten sowie Laufspiel ohne Material → Fangspiel ohne Material, jeweils auf Einsteiger-Niveau. Für die qualifizierte Erzieher- und erfahrene Trainer-Persona sind zusätzliche Kategorienwechsel aktiviert. Beide Spiele müssen zu den aktuellen Gruppenbedingungen passen und unterschiedliche Familien haben. Siehe [Zuordnung, Annahmen und genaue Regeln](KITA-REGELANNAHMEN.md).

Finder, lokale Coach-Suche und serverseitige KI-Werkzeuge verwenden denselben Katalog und dieselbe Regelprüfung. Die API akzeptiert keine Grundschul-/Vereins-Personas, alten numerischen Spiel-IDs oder Sitzungen des früheren Katalogs. Alte Merkliste und Chatdaten werden nicht in den KITA-Teststand migriert; sie bleiben für die frühere Version unberührt.

Bestehende freie Einheiten sind weiterhin auf ausdrücklichen Wunsch möglich, einschließlich Ersetzen, Rücknahme und Drucken. Sie sind **keine Umsetzung der noch unklaren ALBA-Einheitenregeln**. Zeitaufteilung und Reihenfolge sind als eigene Planungsvorschläge markiert. Die bloße Angabe „30 Minuten“ erzeugt keine automatische Einheit.

Die Erzeugung freier KI-Texte ist keine mathematische Garantie für fachlich korrekte Geschichten. Die Daten- und Planprüfung ist deterministisch; die sprachliche Rahmung muss mit ALBA fachlich getestet werden. Favoriten sind eine Merkliste, kein trainierender oder langfristig lernender Algorithmus.

## Mit dem Auftraggeber bestätigte offene Punkte

Am 23.09.2026 wurde zunächst bestätigt: eindeutige Regeln umsetzen und unklare Regeln vorerst nicht aktivieren. Anschließend beauftragte der Auftraggeber ausdrücklich die logisch rekonstruierbaren Zuordnungen als dokumentierte Annahmen. Das ersetzt die anfängliche pauschale Deaktivierung buchstabenabhängiger Ketten; eine fachliche Bestätigung durch ALBA steht noch aus.

- Die Buchstaben AF/AG/AH/AK/AO/AN/AM/AP/AR bezeichnen in der gelieferten Tabelle nicht die im Persona-Dokument gemeinten Spielkategorien. Beispielsweise ist AF „schnell vorbereitet“, AG „kleine Halle“, AM „Leibchen“ und AN „Bälle“.
- S ist „Platzbedarf pro Kind“, nicht Sportgerät. Die Materialketten verwenden I „Materialien“, konservativ mit vollständiger Materialübereinstimmung. Neun rekonstruierte Bezüge werden zentral über benannte Felder angewendet, nicht durch pauschales Verschieben von Buchstaben.
- Bei genau 30 Minuten steht für die erfahrene Trainer-Persona sowohl Dreier-Einheit als auch Spielesammlung. Keine dieser widersprüchlichen Automatikregeln wird bevorzugt.
- AP und AR lassen sich nicht als Spielkategorien rekonstruieren. Davon abhängige Automatiken bleiben aus.
- Die Fortgeschrittenen-Ketten sind mit konservativer Einsteiger-Abschlussregel aktiviert. Zuordnung und Auslegungen sind im [Annahmenprotokoll](KITA-REGELANNAHMEN.md) als zu bestätigende Festlegungen dokumentiert.

## Prüfstand

Aktuelle Regelkorrektur vom 23.09.2026: 55 automatisierte Tests, vinext-Build, Next-TypeScript und ESLint erfolgreich. Sieben zusätzliche Tests prüfen die rekonstruierte Zuordnung, Persona-Ketten, Materialgleichheit, Alters-/Zeitgrenzen und konsistente lokale/API-Werkzeugausführung. Die neuen API-Prüfungen sind simuliert, keine erneuten Live-KI-Dialoge. Die zwei Handouts unter `docs/uebergabe` wurden aktualisiert und alle neun Seiten visuell geprüft; die eingebetteten Screenshots dokumentieren die vorherigen Live-Tests auf c1426ee.

Aktualisierung: Der anschließende Coach-first-Umbau ergänzt vier Tests (jetzt 34) und eine visuelle Browserprüfung. Aktueller Oberflächenstand und Screenshots: [Coach-first-Prüfung](kita-coach-first-review.md). Die folgenden Angaben beschreiben die ursprüngliche KITA-Auslieferung.

30 automatisierte Tests decken Datenabgrenzung, vier Personas, Alter und Gruppen-/Ortsgrenzen, unbekannte Werte, Materialfilter, freie Planversionen, Erklärungsfragen, Spielauswahl und Themenwelt sowie Quellenbindung ab. API-Tests verwenden kontrollierte Responses-Antworten, keine echten API-Aufrufe. Die Netlify-Zugangsschutztests bleiben erhalten.

Zusätzlich geprüft: TypeScript der Next-Anwendung, ESLint, Produktionsbuild und erfolgreicher lokaler Seitenaufruf. Keine neue visuelle Browser-Abnahme und keine Messung realer OpenAI-Antwortzeiten für diesen Stand. Historische Screenshots im Repository dokumentieren den früheren Gesamtkatalog, nicht diesen KITA-Stand.

## Separate Testvorschau

Auf anschließenden ausdrücklichen Wunsch wurde der Feature-Branch am 23.09.2026 nach GitHub gepusht und als geschützter Netlify-Entwurf bereitgestellt: [KITA-Personas testen](https://kita-personas-test--albathek-match.netlify.app). Die produktive Website bleibt unverändert.

Bereitgestellter App-Commit: `90411fabc86d5c6c69ea519438cf742a2c3381a7`. Netlify-Deploy: `6ab375b14164343c78500495`, Kontext `deploy-preview`, Next.js Runtime 5.16.0. Zugang mit dem bisherigen Benutzernamen `alba` und dem separat geteilten Passwort. Keine Zugangsdaten im Repository.
