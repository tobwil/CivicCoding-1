# Finale Prototypkorrektur vom 23.09.2026

## Anlass und Abgrenzung

Der gemeldete Dialog (10 Kinder, 4–5 Jahre, 20 Minuten, Sporthalle) führte wiederholt über Spielauswahl und Folgespielsuche in eine Sackgasse. Die Planlogik konnte eine freie Einheit erstellen; der sichtbare Weg dorthin war unklar. Die Prototypanforderung wird als KITA-begrenzter, persona-basierter Dialog mit Suche, Quelleninformationen und ausdrücklich beauftragter freier Planung verstanden, nicht als fachlich freigegebene vollständige ALBA-Einheitensystematik.

## Änderungen

- Gelber Einheiten-Button im Gespräch und im leeren Einheitentab übernimmt die aktuelle Dauer und den Sitzungskontext. Keine Pflicht zu vorheriger Spielauswahl oder Themenwelt, keine erzwungenen 30 Minuten.
- „Neue Einheit“ erscheint nur bei vorhandenem Plan und bleibt eine Rücksetzfunktion.
- Folgespiele werden weiterhin nach den dokumentierten engen Kettenregeln geprüft. Eine app-seitig formulierte Rückmeldung erklärt fehlende Verbindungen und bietet nur bei mindestens drei geeigneten Spielfamilien eine freie Zusammenstellung an. Sonst werden tatsächliche Einschränkungen genannt. Keine automatische Planänderung.
- KI-Folgespielanfragen benötigen nach einem erfolgreichen Werkzeugaufruf keine zusätzliche Formulierungsrunde. Vollständige Werkzeugpaare bleiben im Verlauf erhalten.
- Nur ein Verarbeitungsstatus mit Abbrechen am Eingabefeld; keine zweite Denkblase und kein zusätzlicher „KI arbeitet“-Text im Kopf.
- Vorbereitungsangaben stehen in Spielkarten, Suchwerkzeug-Ausgaben und Originalinformationen. `minimal` bzw. 0 bedeutet minimale Vorbereitung, nicht unbekannt.
- Regelbasierte Erstplanung bevorzugt als Abschluss ein geeignetes Spiel mit explizitem Ruhe-/Entspannungshinweis aus Titel/Kurztext. Kein pauschales Verbot anderer Spiele; bei fehlendem Beleg erscheint eine Warnung. KI-Auswahlen erhalten denselben Quellenhinweis und werden weiterhin vollständig validiert. Drei Abschnitte bleiben die technische Grenze.

## Prüfung

62 automatisierte Tests, TypeScript-Prüfung, ESLint und vinext-Produktionsbuild erfolgreich. Der lokale Seitenaufruf liefert HTTP 200.

Der gemeldete Ablauf wird mit allen vier Personas reproduziert: Einzelspiel → kein bestätigtes Folgespiel → explizite freie 20-Minuten-Einheit. Regressionen prüfen Dauerwechsel über Formular und Chat, Beibehaltung der Gruppenangaben, Ausschlussregeln, weiche Abschlusspräferenz, unveränderte gezielte Ersetzungen, Vorbereitung als 0, vollständige API-Werkzeugpaare und die einzelne Statusanzeige im Komponentencode.

Diese Prüfung verwendet kontrollierte KI-Antworten und lokale Logik, keinen neuen Live-OpenAI-Aufruf und keine neue Browser-Screenshot-Abnahme. Historische Handout-Screenshots bleiben als frühere Live-Beispiele gekennzeichnet. Der Ergänzungstext zur Bedienung steht in `ALBA-TESTEINFUEHRUNG.md`.

Technische Referenz: [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling); strukturierte Werkzeugergebnisse bleiben an die jeweilige `call_id` gebunden. Keine Änderung von Modell, API-Schlüsselspeicherung oder Sitzungsformat.
