# ALBAthek Match · KITA-Teststand

Dieser Feature-Branch setzt ALBAs Wunsch vom 22.09.2026 um: **ausschließlich die Spiele der gelieferten KITA-Content-Tabelle und die vier ausgearbeiteten KITA-Personas**.

129 benannte Spiele und Varianten bilden den Testkatalog. Die früheren 657 öffentlichen Einträge und zehn Testprofile sind nicht mehr als Inhaltsquellen aktiv. Fehlende Daten bleiben sichtbar, damit ALBA die Content-Tabelle gezielt überarbeiten kann.

[Regeln, Quellen und offene Fragen](docs/KITA-TESTSTAND.md) · [Entscheidungsverlauf](docs/GESPRAECHSVERLAUF.md)

[Testeinführung für ALBA](docs/ALBA-TESTEINFUEHRUNG.md) · [Einheiten: Diagnose und Korrekturen](docs/DIAGNOSE-EINHEITEN.md)

## Für Nutzende

1. **Direkt im Coach starten:** Kein zusätzlicher Einstieg und keine separaten Startseiten-Filter.
2. **Angaben bearbeiten:** Profil, Alter, Kinderzahl, Ort, Zeit und Material direkt im Coach einstellen und übernehmen. Chat und Datenprüfung verwenden denselben Gruppenstand; erkannte neue Angaben im Chat aktualisieren die Zusammenfassung. Das bestätigte Profil bleibt gerätelokal gespeichert.
3. **Spiele finden:** Situation senden. Ohne Schlüssel erfolgt eine regelbasierte Suche. Mit Schlüssel zeigt der Coach den tatsächlichen Verarbeitungsschritt und „Abbrechen“. Früh sichtbare lokale Treffer sind als Vorauswahl markiert; sie sind noch keine fertige KI-Antwort.
4. **Spiel auswählen und Themenwelt entwickeln:** Eine Spielkarte auswählen und eine Themenwelt angeben. Mit OpenAI-Key kann der Coach daraus eine Bewegungsgeschichte als eigene sprachliche Rahmung entwickeln; Originalregeln dürfen nicht verändert oder ergänzt werden.
5. **Nachfragen:** Aufbau erklären lassen oder ein Folgespiel nach den eindeutig beschriebenen Regeln erfragen. Freie Einheiten mit Ersetzen, Rücknahme und Drucken bleiben auf ausdrücklichen Wunsch möglich.
6. **Merken:** Favoriten bleiben gerätelokal. Der Teststand nutzt eine eigene Merkliste und übernimmt keine Spiele aus dem alten Katalog.

Über **Datenbasis prüfen** bleiben alle 129 Einträge und die Merkliste zugänglich. „Anleitung & Datenprüfung“ zeigt Originalablauf, Material, Tabellenzeile und mögliche Datenlücken. „Zum Coach“ kehrt ohne Verlust des Gesprächs zurück. Eine Änderung im Formular startet keine kostenpflichtige KI-Anfrage: Erst eine gesendete Nachricht ruft den Coach auf.

Ohne API-Key funktionieren Suche, Tabellen-Anleitungen und regelbasierte freie Planung. Eine echte KI-Beratung oder Bewegungsgeschichte wird nicht vorgetäuscht.

Im Coach unter **Einstellungen** einen eigenen OpenAI-Key eintragen. Schlüssel und Gespräch liegen im `sessionStorage`; die Persona und Merkliste liegen im `localStorage`. Beim KI-Aufruf gehen Gespräch und ausgewählte KITA-Daten über den eigenen Server an OpenAI. Keine Chattexte oder Schlüssel in Anwendungslogs, keine personenbezogenen Daten von Kindern eingeben.

## Bewusst offen

Die plausibel rekonstruierbaren Spaltenbezüge sind als dokumentierte Annahmen umgesetzt, einschließlich erweiterter Folgespiel-Regeln. Offen bleiben AP/AR, die widersprüchliche automatische 30-Minuten-Vorgabe und redaktionelle Datenfragen. Details: [Regelannahmen und offene Fragen](docs/KITA-REGELANNAHMEN.md). Freie Einheiten sind eigene Planungsvorschläge, keine Umsetzung des vollständigen ALBA-Regelsystems.

Übergabe an ALBA: [Begleitmail](docs/uebergabe/ALBA_Begleitmail.md), [kurze Anleitung mit bebildertem Beispiel](docs/uebergabe/ALBA_Coach_Funktionen_und_Testbeispiel.docx) (2 Seiten) und [Handout mit Annahmen und offenen Fragen](docs/uebergabe/ALBA_Unterlagen_Findings_und_Klaerungsbedarf.docx) (1 Seite).

Projektgespräche: [Entscheidungsverlauf](docs/GESPRAECHSVERLAUF.md) und [bereinigter Export der lokal verfügbaren Nachrichten](docs/GESPRAECHSEXPORT.md). Der Export enthält keine Zugangsdaten, internen Arbeitsnotizen oder privaten Originalanhänge; bekannte Vollständigkeitsgrenzen stehen im Dokument.

41 Tabellen-Einträge enthalten mindestens eine offene oder uneindeutige Angabe. Notwendige Auswahlkriterien werden nicht geraten. 74 Einträge besitzen einen eindeutig zugeordneten vorhandenen ALBAthek-Link samt Bild, 55 bleiben ohne Verlinkung/Bild. Anleitungstexte werden ausschließlich aus der Tabelle gelesen, nie aus dem alten Katalog oder durch Web-Nachladen ergänzt.

## Technik

React 19, TypeScript, Next.js / vinext / Vite. Keine Datenbank. Der bestehende Cloudflare-/Sites-Build und native Netlify-Build bleiben erhalten.

| Datei | Aufgabe |
| --- | --- |
| `app/data/kita-games.json` | Import mit Rohwerten, Tabellenzeilen und SHA-256 der Quelle |
| `app/lib/kita.ts` | Vier Personas, gemeinsame Regeln und eindeutige Folgespielprüfung |
| `app/lib/catalog.ts` | Ausschließlich KITA-Katalog und Suche |
| `app/lib/coach.ts` | Dialogzustand, lokale Suche, geprüfte Planversionen |
| `app/lib/coach-presentation.ts` | Explizite Formularübernahme und sichere Absatz-/Listenformatierung |
| `app/lib/coach-source.ts` | Originalinformationen aus der Tabelle, kein externer Abruf |
| `app/api/coach/route.ts` | Gestreamter Dialog und validierte Werkzeuge |
| `scripts/import-kita.py` | Reproduzierbarer, lesender XLSX-Import |

Die Werkzeuge `search_games`, `read_game`, `next_games` und `propose_plan` werden von der Anwendung ausgeführt und geprüft. Grundlage ist [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling). Die Responses API läuft weiterhin mit `store: false`, letzten zwölf vollständigen Werkzeug-/Gesprächsrunden und maximal zwei Werkzeugrunden pro Nachricht.

Der Sitzungsstand ist separat versioniert und an den Quellen-Hash gebunden. Alte Katalog-IDs, fremde Personas und Sitzungen eines anderen Imports werden abgelehnt. Die historischen JSON-Dateien bleiben für Nachvollziehbarkeit und den Bild-/Link-Abgleich des Importers im Repository, sind aber keine Laufzeit-Inhaltsquellen.

### Lokal starten und prüfen

Node.js ≥ 22.13.0:

```bash
npm install
npm run dev
npm test
npm run lint
npm run build:netlify
npx tsc --noEmit -p tsconfig.next.json
```

API-Tests arbeiten mit kontrollierten Antworten und benötigen keine Credits. Echte KI-Antwortqualität und reale Wartezeiten müssen mit ALBA separat abgenommen werden. Der allgemeine Cloudflare-Typecheck benötigt weiterhin die Umgebungstypen der vorhandenen Starterdateien; der Next-App-Typecheck nutzt `tsconfig.next.json`.

### KITA-Tabelle aktualisieren

Python mit `openpyxl`:

```bash
python scripts/import-kita.py /pfad/zur/Content-Tabelle_Kita.xlsx
```

Der Import verändert die Originaldatei nicht. Nach Änderungen Kopfzeilen, Zuordnungen, offene Werte und Tests prüfen. Keine Spaltenbezüge aus einer anderen Tabellenversion ungeprüft übernehmen. Keine automatische CMS-Synchronisierung.

## Hosting und bisherige Aufnahmen

Dieser Branch ist als separate, passwortgeschützte Testvorschau verfügbar. Die produktive Website und der bisherige Sites-Prototyp bleiben unverändert.

- [KITA-Testvorschau](https://kita-personas-test--albathek-match.netlify.app) · Benutzername `alba`, bisheriges separat geteiltes Passwort.
- [Feature-Branch auf GitHub](https://github.com/tobwil/CivicCoding-1/tree/codex/kita-personas-alba)

- [Bisheriger Sites-Prototyp](https://albathek-match.dahoooo.chatgpt.site)
- [Bisheriger geschützter Netlify-Prototyp](https://albathek-match.netlify.app)
- [Netlify-Betriebsdokumentation](docs/netlify-deployment.md)
- [Historische Coach-Screenshots und UI-Abnahme](docs/coach-ui-review.md) – noch nicht der KITA-Teststand.
- [Aktuelle Coach-first-Prüfung und Screenshots](docs/kita-coach-first-review.md)

Netlify bleibt durch die Edge-Funktion geschützt. Das Passwort liegt nur in der geheimen Variable `COACH_SITE_PASSWORD`, niemals im Repository oder in `NEXT_PUBLIC_*`. Es gibt keinen serverseitig gespeicherten OpenAI-Key. Für einen später beauftragten Deploy die Betriebsdokumentation beachten.

## Rechte und Übergabe

Unabhängiger Challenge-Prototyp, kein offizielles Produkt von ALBA BERLIN. Inhalte, Bilder und Marken bleiben bei den Rechteinhabern. Originalmails, DOCX und XLSX werden nicht als vollständige Anhänge veröffentlicht. Eine öffentliche Codeablage ist keine pauschale Nutzungslizenz für ALBA-Inhalte.

[Historischer Bewerbungsentwurf](docs/BEWERBUNG.md) und ältere Quellenberichte bleiben als Projektgeschichte erhalten. Für die aktuelle fachliche Bewertung gilt ausschließlich [KITA-TESTSTAND.md](docs/KITA-TESTSTAND.md).
