# Diagnose: Einzelspiele statt Einheiten

23.09.2026 · ursprüngliche Diagnose gegen Commit d7f5d6f; anschließend auf Nutzerwunsch korrigiert

## Umgesetzte Korrekturen

- Sport-/Bewegungs-/Trainingsstunde werden als Einheitenwunsch erkannt; zusätzliche Themenwünsche verdrängen einen Planauftrag nicht.
- Erklärungsfragen, Negation und reine Zeitangaben bleiben ohne Planänderung.
- Nach der Suche wird bei Planaufträgen das Planwerkzeug ausdrücklich angefordert. Vor Abschluss gilt: validierter Plan oder konkrete Rückfrage. Ein separater regelbasierter Rückfall ist nur nach erfolgreicher Suche der aktuellen Bedingungen zulässig.
- Planbestätigungen werden aus dem validierten Plan erzeugt. Nicht geprüfte Modellbehauptungen werden bei Planaufträgen nicht vorab in den Chat gestreamt. Werkzeugverlauf und die tatsächliche Bestätigung bleiben im Sitzungskontext erhalten.
- Bei Orts-/Altersausschluss erscheinen die konkreten Regeln; sonst die verbleibende Familienzahl und häufige tatsächliche Ausschlussgründe. Keine automatische Lockerung.
- Mobile Ansicht wechselt nach einem neuen Plan auf „Einheit“.
- Zehn neue Regressionstests, insgesamt 44 erfolgreich. Darunter kontrollierte API-Abfolgen mit vorzeitigem Modellabschluss, ungültigem Auftrag, fehlender Suche, unmöglicher Einheit und gezieltem Ersatz.

### Ergänzende Live-Prüfung am 23.09.2026

Im lokalen Coach mit echtem OpenAI-Aufruf und mobiler Ansicht (390 × 844 px):

1. „Plane eine Sportstunde für 10 Kinder, 5 Jahre, 30 Minuten in der Sporthalle, in der Themenwelt Waldtiere.“ erzeugt eine validierte Einheit mit 6 / 18 / 6 Minuten. Die mobile Ansicht öffnet unmittelbar „Einheit“.
2. „Ersetze nur den Einstieg durch etwas Ruhigeres.“ ersetzt den Einstieg durch „Reifen rollen: Wer hat den Dreh raus?“. „Kartonwald“ als Hauptteil und „Fliegende Pünktchen“ als Abschluss sowie alle Abschnittsdauern bleiben erhalten. Der bestehende Gesprächskontext wird erfolgreich weiterverwendet.

Die Themenwelt ist ein Wunsch, keine Garantie für drei thematisch passende Katalogspiele. Die Durchführungsgeschichte wird weiterhin separat entwickelt. Dieser Zweischritt prüft Funktion und Zustandserhalt, nicht die pädagogische Qualität aller möglichen Ergebnisse oder eine statistische Zuverlässigkeit. Es wurde keine präzise Latenzmessung vorgenommen.

Screenshot: [Mobile Einheit nach echtem KI-Aufruf](screenshots/kita-coach-first/mobile-unit-fix-live.png).

Screenshot: [Gezielt ersetzter Einstieg](screenshots/kita-coach-first/mobile-unit-replacement-live.png).

Veröffentlicht ausschließlich auf der geschützten KITA-Vorschau: Netlify-Deployment `6ab391bf85b6212cbd878353`. Produktionsseite unverändert.

Die technische Werkzeugsteuerung folgt der [offiziellen OpenAI-Dokumentation](https://developers.openai.com/api/docs/guides/function-calling#tool-choice). Der entscheidende Abschlusscheck wird zusätzlich von der Anwendung durchgesetzt.

## Nachgestellt

Mit dem lokalen Entscheidungsweg und Standardprofil:

| Nachricht | Erkannter Auftrag | Ergebnis |
| --- | --- | --- |
| 10 Kinder, 5 Jahre, 30 Minuten in der Sporthalle. | Suche | 6 Spiele, kein Plan – beabsichtigt |
| Plane eine Sportstunde für 30 Minuten. | Suche | 6 Spiele, kein Plan – Erkennungslücke |
| Erstelle eine Einheit für 30 Minuten in der Themenwelt Waldtiere. | Erklärung | Kein Plan – Prioritätsfehler |
| Mach daraus eine freie Einheit für 30 Minuten. | Plan | 1 Plan mit 3 Abschnitten |
| Mach eine Einheit für 18 Kinder, 5 Jahre, im Bewegungsraum. | Plan | Kein Plan – Ausschluss durch Ortsregel, generische Fehlermeldung |

Zusätzlich kontrollierte API-Reproduktion, ohne echten Provider-Aufruf: ausdrücklicher Planauftrag → erzwungenes search_games → normale Modell-Textantwort ohne propose_plan. Der Endpunkt meldet erfolgreich done mit sechs Treffern und null Plänen. Das zeigt eine fehlende Abschlussprüfung; es ist keine Messung der Häufigkeit im echten Modellbetrieb.

## Ursachen im Code

1. app/lib/kita.ts: Alle vier Persona-Anweisungen beginnen aktuell mit einer Spielesammlung. Unklare ursprüngliche Einheitenregeln sind bewusst deaktiviert.
2. app/lib/coach.ts, actionFor: Planerkennung über wenige Schlüsselwörter. „Sportstunde“ fehlt; Themenwelt/Geschichte werden vor Einheit/Trainingsplan als Erklärung eingeordnet.
3. app/api/coach/route.ts: Jeder Nicht-Erklärungsauftrag erzwingt zunächst search_games. Die folgende Werkzeugwahl ist auto. Nach einer reinen Textantwort wird die Schleife beendet; ein erkannter Planauftrag ohne validierten Plan wird nicht gesondert abgefangen. search_games setzt den Antworttyp wieder auf results.
4. makePlan akzeptiert derzeit genau drei geeignete Spiele, standardmäßig unterschiedliche Familien. Bei weniger Kandidaten bleibt nur eine generische Rückmeldung.
5. CoachAI.tsx setzt beim Senden den mobilen Tab auf Chat; nach erfolgreichem Plan wird nur workTab auf Einheit gesetzt. Dies schaltet die Desktopansicht um, aber nicht den mobilen Tab.

## Ursprünglich empfohlene Korrektur

- Suche, explizite Planung und Erklärung verlässlich unterscheiden; thematische Wünsche sollen einen ausdrücklichen Planauftrag nicht verdrängen.
- Bei erkanntem Planauftrag verbindlich mit validiertem Plan oder konkreter Rückfrage enden, nicht still mit einer Spielesammlung.
- Wenn keine Einheit möglich ist, die tatsächlichen Ausschlussgründe nennen, ohne fachliche Regeln automatisch zu lockern.
- Neue Einheit mobil deutlich ankündigen und einen direkten Wechsel anbieten.
- Mit mehrstufigen echten KI-Dialogen ergänzend prüfen. Die konkreten letzten Nutzereingaben sind nicht vorhanden; ihre jeweilige Ursache lässt sich daher nicht abschließend zuordnen.
