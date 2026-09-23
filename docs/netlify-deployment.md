# Netlify-Bereitstellung

## KITA-Regelkorrektur vom 23. September 2026

- Feature-Branch: `codex/kita-personas-alba`; veröffentlichter App-Commit `aa1a16ba2b125a6713e2fdca5d1eee4225ebe352`.
- Geschützte Testvorschau: https://kita-personas-test--albathek-match.netlify.app/
- Deploy `6ab3bb0f4f4ff97b68a04825`, Kontext `deploy-preview`, vollständiger Next.js-Build mit Runtime 5.16.0. Keine Produktionsveröffentlichung.
- 55 Tests, TypeScript, ESLint sowie vinext- und Next.js-Build erfolgreich.
- Veröffentlicht geprüft: vier anonyme Pfade (Startseite, Coach-API, Bild und interne Funktionsroute) liefern 401; gültige Anmeldung liefert 200 und `private, no-store`. Der aktualisierte Regelhinweis ist im ausgelieferten JavaScript vorhanden. Authentifizierter API-Aufruf ohne OpenAI-Schlüssel liefert erwartungsgemäß 400 JSON. Kein neuer Live-OpenAI-Aufruf.
- Handouts unter `docs/uebergabe`: Funktionen mit vorherigen Live-Screenshots sowie aktualisierte Annahmen und offene Fragen. Alle neun Dokumentseiten visuell geprüft.

## Ursprüngliche Einrichtung

7. September 2026 · Projekt `albathek-match` · Team `tobwil`.

## Architektur

- Native Next.js-Bereitstellung mit `npm run build:netlify` und Netlify Next.js Runtime v5.15.13.
- Dynamische Startseite und `/api/coach`; kein reiner statischer Export.
- Der Cloudflare-/Sites-Build `npm run build` bleibt erhalten.
- Der bisher exportierte interne `coachTools`-Wert ist nun modulprivat, damit Next.js ausschließlich gültige Route-Exports vorfindet. Inhalt und KI-Verhalten sind unverändert.
- Keine neue Datenbank und keine auf Netlify gespeicherten OpenAI-Schlüssel.

## Zugangsschutz

Die Netlify Edge Function `password-gate` läuft vor allen Pfaden, inklusive statischer
Dateien und Funktionen. HTTP-Basic-Benutzername: `alba`. Das Passwort ist nicht im
Repository, sondern als geheime Netlify-Variable gespeichert. Fehlende Variable,
falsche Zugangsdaten oder ein Fehler in der Zugangskontrolle geben keine Inhalte frei.
Die Antworten werden nicht öffentlich gecacht.

Das vorhandene Free-Konto unterstützt den eingebauten Site-Passwortschutz nicht.
Es wurde kein Tarifwechsel vorgenommen. Der eigene serverseitige Schutz nutzt die
verfügbaren Edge Functions. Die Variable ist geheim und für die Kontexte Produktion,
Deploy-Preview und Branch-Deploy eingerichtet; aktuell umfasst sie Builds, Functions
und Runtime. Eine nachträgliche Scope-Einschränkung wurde durch die lokale
Sicherheitsprüfung blockiert, nicht angewendet und nicht umgangen.

Netlify friert Umgebungswerte je Deploy ein. Bei Passwortrotation auch ältere
Deploy-URLs berücksichtigen; siehe README. Dieser Schutz ersetzt keine individuellen
Benutzerkonten und ist nicht für die Ablage sensibler Kinder-/Personendaten gedacht.

## Prüfungen

- Nativer Next.js-Build einschließlich TypeScript erfolgreich.
- Bisheriger vinext-Build, Lint und 29 Tests erfolgreich (26 bestehende, drei neue Zugangsschutztests).
- Geschützter Netlify-Entwurf: ohne Zugangsdaten liefern `/`, `/api/coach`, `/og.png`
  und `/.netlify/functions/___netlify-server-handler` jeweils HTTP 401 mit Basic-Auth-Anforderung.
- Mit gültiger Anmeldung: Startseite HTTP 200 und `Cache-Control: private, no-store`.
- Authentifizierter POST an `/api/coach` ohne OpenAI-Key: erwartete JSON-Validierungsantwort HTTP 400.
- Kein Live-OpenAI-Aufruf für diese Hosting-Prüfung; kein API-Key übertragen.
- Auch auf der produktiven Hauptadresse bestätigt: fehlendes/falsches Passwort HTTP 401,
  gültige Anmeldung HTTP 200, JavaScript-Datei mit Anmeldung HTTP 200 und ohne HTTP 401,
  Coach-API mit Anmeldung ohne OpenAI-Key erwartungsgemäß HTTP 400 (JSON).

Produktions-Deploy: `6a9ec6db70febe558b6a4d0c`.
[Deployment-Protokoll](https://app.netlify.com/projects/albathek-match/deploys/6a9ec6db70febe558b6a4d0c).

Frontend-Screenshots: [Coach-UI-Prüfbericht](coach-ui-review.md).

## Betrieb

- Website: https://albathek-match.netlify.app
- Verwaltung: https://app.netlify.com/projects/albathek-match
- Deployment erfolgt per CLI; keine automatische GitHub-Build-Verknüpfung eingerichtet.
- Immer den vollständigen `netlify deploy --prod`-Build verwenden. `--no-build`
  überspringt die notwendigen Aufbereitungsschritte des Next.js-Adapters und kann
  interne `.next`-Build-Dateien als öffentliche Artefakte auswählen.
- `PUPPETEER_SKIP_DOWNLOAD=true` kann beim lokalen Netlify-Build nötig sein, wenn
  ein automatisch geladenes Netlify-Plugin einen Browser-Download anstößt. Für die
  Anwendung ist dieser Browser nicht erforderlich.
