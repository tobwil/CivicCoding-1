# ALBA-Coach: Hinweise für euren Test

Stand: 23.09.2026 · KITA-Testversion

Hallo zusammen,

der aktuelle Prototyp ist bewusst auf eure KITA-Unterlagen begrenzt. Wir möchten damit gemeinsam prüfen, wie gut die hinterlegten Angaben und Persona-Regeln passende Spiele liefern, wie hilfreich der Dialog ist und wo Daten oder Umsetzung noch nachgeschärft werden müssen.

Testzugang: https://kita-personas-test--albathek-match.netlify.app/

Die Zugangsdaten erhaltet ihr separat.

## Was ihr erwarten könnt

- Ausschließlich die 129 benannten Einträge aus eurer KITA-Content-Tabelle. Der frühere Gesamtkatalog und die alten Testprofile werden nicht als Spielquellen verwendet.
- Vier hinterlegte Rollen: Erzieher:innen mit bzw. ohne Sportqualifikation sowie Vereinstrainer:innen mit bzw. ohne/viel geringer Kita-Erfahrung.
- Einen gemeinsamen Stand für Profil und Gruppendaten. Über „Angaben bearbeiten“ könnt ihr Alter, Kinderzahl, Ort, Zeit und Material einstellen. Erkannte neue Angaben im Gespräch aktualisieren die Zusammenfassung.
- Zunächst bis zu sechs unterschiedliche Spielideen. Ihr könnt ein Spiel auswählen, den Aufbau erklären lassen, eine Themenwelt angeben oder nach einem passenden Folgespiel fragen.
- Mit einem gültigen OpenAI-Schlüssel: KI-Dialog und eine sprachliche Bewegungsgeschichte zu einem ausgewählten Spiel. Ohne Schlüssel: regelbasierte Suche, vorhandene Tabellen-Anleitungen und einfache freie Planung – keine echte KI-Beratung.

## So könnt ihr sinnvoll testen

1. Wählt ein Profil und kontrolliert die Gruppendaten. Bereits angezeigte Werte gelten auch dann, wenn ihr sie in eurer Nachricht nicht wiederholt.
2. Beginnt beispielsweise mit: „Wir sind 10 Kinder im Alter von 4 bis 5 Jahren und haben 20 Minuten in der Sporthalle. Zeig uns Spiele mit Reifen.“
3. Fragt nach: „Erklär mir den Aufbau von Spiel 2.“ Prüft, ob die Antwort das richtige Spiel betrifft und der Tabelle entspricht.
4. Wählt ein Spiel aus und gebt eine Themenwelt an, etwa „Waldtiere“. Prüft bei einer KI-Geschichte, ob Material und Originalablauf erhalten bleiben.
5. Ändert eine Bedingung, beispielsweise die Kinderzahl. Kontrolliert die Zusammenfassung und ob die neue Auswahl nachvollziehbar ist.
6. Prüft unter „Datenbasis prüfen“ die Originalangaben, Tabellenzeile und Hinweise auf fehlende Daten. Dort bleiben auch nicht empfohlene Einträge zugänglich.

Eine Änderung im Formular ruft die KI noch nicht auf. Erst das Senden einer Nachricht oder das direkte Starten eines Beispiels beziehungsweise einer Anschlussfrage löst die Verarbeitung aus.

## Was im Hintergrund passiert

Die Anwendung prüft Spiele nach den eindeutig umsetzbaren Persona-Regeln: beispielsweise Alter, Gruppengröße, Vorbereitungsaufwand, Niveau, Ort und Material. Suchbegriffe beeinflussen anschließend die Reihenfolge.

Mit KI-Zugang interpretiert das Sprachmodell die Nachricht und kann gezielt die Tabelle durchsuchen, Originalinformationen lesen, Folgespiele prüfen oder eine Planänderung anfordern. Die Anwendung führt diese Schritte aus und prüft vorgeschlagene Pläne. Es werden keine zusätzlichen Spielanleitungen aus dem Internet nachgeladen.

Während einer Anfrage zeigen Statusmeldungen den Bearbeitungsschritt. Früh sichtbare Karten können zunächst eine regelbasierte Vorauswahl sein; diese ist noch keine abgeschlossene KI-Antwort. Die Anfrage lässt sich abbrechen.

## Warum zunächst Einzelspiele statt einer Einheit?

Der Standardablauf ist derzeit: Spielideen finden → ein Spiel auswählen → Themenwelt entwickeln. Die Angabe „30 Minuten“ bedeutet deshalb noch nicht automatisch „Erstelle eine komplette Einheit“.

Freie Einheiten sind auf ausdrücklichen Wunsch vorgesehen, etwa mit „Mach daraus eine freie Einheit für 30 Minuten.“ Sie bestehen aktuell aus drei Abschnitten. Deren Reihenfolge und Zeitaufteilung sind eigene Planungsvorschläge, keine bereits vollständig umgesetzte ALBA-Einheitensystematik.

**Direkter Weg:** Nach dem Einstieg steht im Chat und im noch leeren Einheitenbereich „20-Minuten-Einheit erstellen“ – beziehungsweise eure aktuell eingestellte Dauer. Der Button übernimmt die Gruppenbedingungen. Eine vorherige Spielauswahl oder Themenwelt ist nicht notwendig; der Chat bleibt frei bedienbar. „Neue Einheit“ leert dagegen einen bereits vorhandenen Plan.

„Folgespiel finden“ prüft eine eng definierte Persona-Kette und ist nicht gleichbedeutend mit „Einheit erstellen“. Gibt es keine bestätigte Verbindung, nennt der Coach die Grenzen und bietet bei ausreichender Auswahl die freie Zusammenstellung an. Das ausgewählte Einzelspiel wird dabei nicht automatisch übernommen; andere Materialien können nötig sein. Harte Eignungsregeln werden nicht gelockert.

Für den Abschluss bevorzugt die regelbasierte Erstplanung Spiele mit Ruhe-/Entspannungshinweisen im Originaltitel oder Kurztext. Das ist eine weiche Präferenz, keine pädagogische Freigabe. Fehlt ein solcher Beleg im vorgeschlagenen Abschluss, wird das kenntlich gemacht. Eine gezielte Planänderung erhält weiterhin die übrigen Abschnitte.

**Korrigiert:** „Plane eine Sportstunde“ und Einheitenwünsche mit zusätzlicher Themenwelt werden als Planauftrag erkannt. Ein erkannter Planauftrag endet nach abgeschlossener Verarbeitung mit einer geprüften Einheit oder einer konkreten Rückfrage. Liefert die KI nach einer erfolgreichen Suche keinen Plan, versucht die Anwendung einen gesondert geprüften regelbasierten Vorschlag. Dieser wird entsprechend bezeichnet. Technische Ausfälle werden weiterhin als Fehler angezeigt.

Sind weniger als drei geeignete unterschiedliche Spiele verfügbar, kann die aktuelle freie Planung keine Einheit erstellen. Die Rückfrage nennt die Verfügbarkeit und geprüfte Ausschlussgründe. Fachliche Regeln werden dafür nicht gelockert. Auf dem Handy öffnet sich nach erfolgreicher Erstellung automatisch der Tab „Einheit“.

Eine gewünschte Themenwelt verhindert die Planerstellung nicht. Eine dazu passende ausführliche Bewegungsgeschichte ist damit aber noch nicht ausgearbeitet: Dafür anschließend ein Spiel auswählen und die Themenwelt vertiefen.

Wenn ihr parallel Suchtreffer und eine Einheit vorliegen habt, könnt ihr eindeutig nach „Spiel 2 aus den Treffern“ oder „Spiel 2 der Einheit“ fragen. Bei geänderter Zeit weist die bestehende Einheit auf eine abweichende Dauer hin; mit „Verkürze die Einheit auf 15 Minuten, behalte die Spiele bei“ könnt ihr die Anpassung ausdrücklich beauftragen.

## Grenzen des Teststands

- Plausible Spaltenbezüge und erweiterte Folgespiel-Regeln sind als dokumentierte Annahmen umgesetzt. Bitte die [Zuordnung und konservativen Auslegungen](KITA-REGELANNAHMEN.md) bestätigen und die Verweise in den Unterlagen aktualisieren. AP/AR und die widersprüchliche automatische Zeitlogik bleiben offen; die davon abhängigen Automatiken sind weiterhin aus.
- Fehlende notwendige Auswahlkriterien können Empfehlungen verhindern. Fehlende Abläufe dürfen nicht durch erfundene Originalregeln ersetzt werden.
- Materialangaben sind noch keine vollständige Inventarprüfung. Ein Treffer mit Reifen kann zusätzlich andere Geräte benötigen; nicht dokumentierte Mengen bleiben offen.
- Die freie Planung verwendet eine einfache Zeitaufteilung, keine aus den Originalen belegten Spieldauern.
- KI-Texte können trotz Vorgaben Fehler enthalten. Bitte Geschichten, Erklärungen und Pläne vor der Durchführung fachlich prüfen.
- Es gibt kein langfristig lernendes persönliches Profil. „Merken“ speichert Favoriten, trainiert aber kein Modell.
- Fehlende Bilder oder Links bedeuten nicht automatisch, dass das Spiel nicht verfügbar ist: Der Tabelleninhalt bleibt die maßgebliche Quelle.

## Gespräch und Datenschutz

Gespräch und API-Schlüssel werden für die Browsersitzung gespeichert; Profil und Merkliste gerätelokal. Bei nicht verfügbarem Speicher erscheint ein Hinweis. Es gibt kein Benutzerkonto und kein dauerhaftes Chatarchiv der Anwendung.

Bei KI-Anfragen werden Gesprächskontext und passende KITA-Daten über den Anwendungsserver an OpenAI übertragen. Der Schlüssel wird dafür ebenfalls an den Anwendungsserver übermittelt. Bitte keine Namen oder anderen personenbezogenen Angaben zu Kindern eingeben. Die Anwendung schreibt Chattexte und Schlüssel nicht in ihre Anwendungslogs.

## Welches Feedback besonders hilft

Bitte notiert das gewählte Profil, die Gruppendaten, die genaue Nachricht und relevante vorherige Nachrichten. Ergänzt einen Screenshot, das erwartete Ergebnis und was tatsächlich passiert ist – ohne API-Schlüssel oder personenbezogene Kinderdaten.

Besonders hilfreich sind Beispiele für unpassende Spiele, unerwartet ausgeschlossene Spiele, Abweichungen von Originalregeln, missverstandene Nachfragen und fehlende Einheiten trotz ausdrücklichem Wunsch. So können wir Datenfragen, offene fachliche Regeln und technische Fehler gezielt auseinanderhalten.
