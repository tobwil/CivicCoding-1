# ALBA-Integration vom 07.09.2026

## Verwendete Quellen

| Quelle | Übernommene Inhalte | Umsetzung |
| --- | --- | --- |
| Contenttabelle ALBAthek neu_10 Testspiele.xlsx, Blatt Contenttabelle, A1:AG11 | 10 Spiele, 33 Metadatenfelder, nummerierte Abläufe, Tipps, Trainer:innen, Erfahrungsstufen | `app/data/alba-games.json`, Details im Finder und im Spielplan |
| Regelübersicht_KITA_GS_VEREIN.xlsx, Blätter KITA, GRUNDSCHULE, VEREIN | Professionen, Alters-/Gruppen-/Raumregeln, Bewegungsband, Kalender, Sportkleidung | Gemeinsame Auswahlprüfung in `app/lib/alba.ts` für Oberfläche und API |
| Schwerpunktthema Sport – Rahmenwerk für Coaches, SPORT VERNETZT, 12.06.2026 | Hohe Bewegungszeit, kurze Erklärungen, Mitspielen, Motivation; altersabhängige Lernziele; Wahrnehmung–Entscheidung–Umsetzung; Spielentwicklung und Reflexion | Dynamische Coach-Hinweise, Offline-Plan und KI-Instruktionen; insbesondere PDF-Seiten 8–11, 14–18, 19–35 |

Die Originaldateien bleiben unverändert. Sie werden nicht als Downloads oder vollständige Dateien in das öffentliche Repository kopiert. Die App verwendet den für die Funktion erforderlichen Spielkatalog. Der Importer liest die Contenttabelle; JSON enthält pro Spiel die ursprüngliche Zeilennummer. Originaltext, Tipp, Materialien und Leerwerte bleiben erhalten. Die acht bisherigen Spiele sind separat gespeichert und werden wegen fehlender neuer Metadaten nicht als regelgeprüfte Empfehlungen oder KI-Planbausteine ausgegeben.

## Fachliche Entscheidungen bei offenen Angaben

- **Einsteigermodus:** Die vier Kriterien „wenige Regeln“, „minimale Vorbereitung“, „Knaller“ und „kleines Spiel“ werden gemeinsam angewandt. Keines der zehn Testspiele erfüllt alle vier Kriterien. Das wird erklärt; Kriterien werden nicht still gelockert.
- **30 Minuten:** Die Übersicht enthält sowohl „bis 30“ als auch „ab 30“ und „über 30“. Die App verwendet **ab 30 Minuten** als Grenze für den zusätzlichen Kalenderverweis. Die Spielsuche bleibt verfügbar.
- **Einheitsstruktur:** Ankommen/Action/Landen und die 20/60/20-Zeitaufteilung sind Vorschläge des Prototyps. ALBAs Übersicht markiert die genaue Einheitensystematik noch als offen. Die Summe entspricht stets exakt der gewählten Zeit; Vorbereitungszeit ist separat ausgewiesen.
- **Bewegungsraum in der Kita:** Maximale Kinderzahl = abgerundete Hallenkapazität / 4. Die spielbedingte Mindestzahl bleibt erhalten, damit Teamspiele nicht ohne fachliche Freigabe verkleinert werden. Diese Interpretation der Kurznotiz ist mit ALBA zu validieren.
- **„Kleine Gruppe“:** Für den Raumzusatz „bei kleiner Gruppe“ verwenden wir höchstens 12 Kinder, entsprechend der ersten beiden Gruppenbänder in der Regelübersicht. Die strengere Viertelregel hat in der Kita Vorrang.
- **Raumspalte:** Die Contenttabelle liefert Räume nur unter „Kontext Kita“. Bis eigene Raumangaben für Schule/Verein vorliegen, wenden wir diese Räume konservativ auch dort an. Eine Sporthalle wird nicht als Ersatz für einen ausschließlich genannten Bewegungsraum ausgegeben.
- **GS-Alter:** Reine 3–4-Jahre-Spiele werden über eine Obergrenze der vorhandenen Einstiegsschwellen angenähert (selbstorganisiert ab höchstens 4 Jahren). Die Tabelle enthält keine ausdrücklichen Alters-Obergrenzen. Deshalb werden Spiele mit niedrigem Einstiegsalter, aber Eignung für ältere Kinder nicht pauschal entfernt.
- **Unbekannte Werte:** Fehlende Mindestgruppengröße bleibt unbekannt und wird angezeigt. Fehlende Sportkleidungsangabe zählt nicht als „ohne Sportkleidung geeignet“. Bei „Sportkleidung vorhanden“ ist dieser offene Wert ein Hinweis, kein Ausschluss.
- **Sportkleidung im Verein:** Gemäß Regelblatt immer vorausgesetzt und in der Oberfläche als Voraussetzung sichtbar.
- **Übergang Kita × Grundschule:** Nur für erfahrene Professionen; keine aufwendige Vorbereitung, kein hoher Regelumfang, Kapazität größer als 10. Im Grundschulsetting werden Schreibvarianten der Übergangsangaben normalisiert.
- **Zielranking:** Ziele werden aus Kategorie, Beschreibung, Technik und Sozialform abgeleitet. Sie priorisieren, sind aber keine von ALBA gelieferten Messwerte. Es gibt keine erfundenen Match-Prozentwerte mehr.
- **Kalender:** Die übergebenen Kalenderübersichten werden verlinkt. Es gibt keine erfundenen Monats-Deep-Links und keinen Hintergrundabruf der kompletten Kalender.
- **Fehlende Anhänge:** Die Tabellen verweisen auf nicht mitgelieferte Taxonomie-/Bewegungsband-Anhänge. Vorhandene Textwerte werden genutzt; fehlende Definitionen werden nicht ergänzt oder als ALBA-Vorgabe ausgegeben.
- **Thematische Unstimmigkeit:** „Schmuggel-Ei“ beschreibt Ostern, ist aber unter Wald/Grüffelos/Kobolde verschlagwortet. Beide Originalangaben bleiben erhalten und durchsuchbar; keine stille redaktionelle Korrektur.

## Coach AI

Die Live-Planung hat zwei Schritte. Zuerst extrahiert die KI ausdrücklich genannte Änderungen für Alter, Kinderzahl, Zeit, Raum, Vorbereitung, Sportkleidung und Materialeinschränkungen. Profession, Setting und Gruppenerfahrung bleiben von der gewählten Vorwahl bestimmt. Zweitens berechnet die Anwendung selbst die zulässigen Spiele mit derselben Regelprüfung wie der Finder. Erst diese Auswahl geht zusammen mit Originalabläufen und Rahmenwerk-Hinweisen in die Planerstellung.

Rückfragen, ungeklärte Materialmengen und eine leere Auswahl führen zu einer verständlichen Meldung. Ausgeblendete Spiele werden ausgeschlossen. Die API prüft zurückgelieferte IDs und Phasen, übernimmt Titel aus dem Katalog und setzt die Zeitanteile selbst. Keine automatisch aufgefüllten Legacy-Spiele. Alle KI-Texte bleiben prüfbedürftige Vorschläge; die Anleitenden sehen die Originalmaterialien und Schritte direkt neben dem Ergebnis.

Ohne Key erstellt der Offline-Planer einen ausdrücklich regelbasierten Vorschlag. Er erkennt einfache Zahlen-/Raumangaben und Altersbereiche; freie semantische Interpretation und verlässliche Materialmengenprüfung sind dem Live-Modus vorbehalten. Eine Materialbeschränkung wird offline deshalb nicht als erfolgreich gelöst ausgegeben.

## Prüfungen

Die Tests führen die tatsächliche Auswahl- und Planlogik aus: Altersgrenzen, drei Erfahrungsstufen, Einsteigerfilter, Viertelkapazität, Outdoor-Grenze 12/13, Sportkleidung mit Leerwerten, Professionen, Suchbegriffe, Kalendergrenze, exakte Zeiten und Ausschlüsse. API-Tests verwenden kontrollierte OpenAI-Antworten, um ungültige Eingaben, erneute Regelprüfung nach der Situationsanalyse, Materialausschlüsse und kanonische Spieltitel zu prüfen. Sie verbrauchen keine API-Credits und ersetzen keinen Live-Test mit einem gültigen Key.

## Nächster Abgleich mit ALBA

Die Einsteiger-Schnittmenge, die Raumskalierung, Alters-Obergrenzen, fehlende Materialmengen und die konkrete Einheitensystematik sollten mit ALBA abgestimmt werden. GS- und Vereinsregeln sind in der gelieferten Datei als Entwurf gekennzeichnet. Die Umsetzung macht die getroffenen Interpretationen prüfbar.
