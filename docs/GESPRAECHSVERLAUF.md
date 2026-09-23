# Gesprächs- und Entscheidungsverlauf

Stand: 23.09.2026 (Juli-Verlauf mit September-Fortsetzung)

## KITA-Personas und begrenzter Evaluationskatalog · 23.09.2026

Auftrag: aktuellen GitHub-Stand abrufen, Änderungen prüfen, einen neuen Feature-Branch anlegen und den Prototyp gemäß ALBAs letzter Mail ausschließlich mit der angehängten KITA-Content-Tabelle und ausgearbeiteten Personas betreiben.

Der Abgleich ergab keinen neuen Commit auf main. Prototype_V1 zeigt auf einen älteren Stand. Neuer Branch: `codex/kita-personas-alba` vom aktuellen main.

Die bereitgestellten Mails und Anhänge wurden ausgewertet. Maßgeblich ist die Mail vom 22.09.2026. Wegen abweichender Spaltenbuchstaben und widersprüchlicher Zeitregeln wurde nachgefragt. Bestätigung des Nutzers: **„Ja, eindeutige Regeln umsetzen; Unklarheiten kennzeichnen“**.

Umsetzung: 129 benannte Tabellen-Einträge, vier KITA-Personas in drei Regelgruppen, gemeinsame Regeln für Finder und Coach, sichtbare Datenlücken, Spielauswahl und Themenwelt. Alte Testprofile und breiter öffentlicher Katalog sind nicht mehr aktive Quellen. Unklare spaltenabhängige Ketten-/Einheitenregeln bleiben deaktiviert. Private Mails und Kontaktdaten werden nicht in dieses Protokoll übernommen. Details und Prüfgrenzen: [KITA-Teststand](KITA-TESTSTAND.md).

Dieses Protokoll sichert die **sichtbaren Projektgespräche** und die daraus entstandenen Produktentscheidungen. Interne Systemhinweise, Werkzeugausgaben, Zugangsdaten und nicht sichtbare Arbeitsnotizen sind bewusst nicht enthalten. Formulierungen des Assistenten sind dort zusammengefasst, wo der vollständige technische Arbeitsstrom für die Projektübergabe keinen Mehrwert bietet.

## Ausgangspunkt

**Nutzer:**

> wie umsetzen?
>
> 1. ALBAthek-Personalisierung: Intelligente Spielideen-Empfehlung
>
> ALBA BERLIN betreibt bereits eine digitale Plattform, die ALBAthek.de. Dort finden sich über 600 Spielideen für Menschen, die Sport- und Bewegungsangebote mit Kindern anleiten. Die Challenge besteht darin, die bestehenden Inhalte zielgerichteter und individueller zugänglich zu machen. Nutzerinnen und Nutzer der Website sollen einfacher und schneller die Inhalte finden, die zu ihren individuellen Bedürfnissen, Anforderungen und Gegebenheiten passen.

**Ergebnis des gemeinsamen Lösungsplans:**

- alltagsnahe Kriterien statt komplizierter Katalogfilter
- gewichtete Empfehlungen mit verständlichen Gründen
- schneller Zugang zur originalen ALBAthek-Spielanleitung
- lernfähige Perspektive über Favoriten, Feedback und spätere Nutzungsdaten
- datensparsame Umsetzung ohne Profile von Kindern

## Auftrag zum Prototyp

**Nutzer:**

> kannst du basoerend auf den momentanen daten einfach eine neue oberfläche mti den aktuellen inhalten basierend auf deinem plan bauen? danke!

**Umsetzung:**

Es entstand eine responsive neue Oberfläche im ALBA-nahen Erscheinungsbild. Acht reale Spielideen bilden eine kuratierte Prototyp-Stichprobe. Alter, Gruppengröße, Dauer, Ziel und Material verändern das Ranking unmittelbar. Treffer zeigen Match-Wert und Begründung; Volltextsuche, Merkliste, Ausblenden und Links zu ALBAthek.de ergänzen den Kernfluss.

## Auftrag zur KI-Funktion

**Nutzer:**

> und anschließend bitte noch einen KI funktion, dafür dann in einen settings openai vorsehen. den api key soll man dann eintragen können! sei wild, intuitiv, modern, überracsh uns! bleib aber auch gleich im alba ci/cd!

**Umsetzung:**

Coach AI wurde als eigenständiges „Match-Lab“ ergänzt. Eine freie Situationsbeschreibung wird in eine komplette Einheit mit den Phasen Ankommen, Action und Landen übersetzt. Ohne API-Key arbeitet die Oberfläche im Demo-Modus. Ein eigener OpenAI-Key kann über Settings für die aktuelle Browsersitzung hinterlegt und wieder entfernt werden. Live-Ausgaben sind über ein striktes JSON-Schema auf vorhandene Spiele und drei Phasen begrenzt.

**Produktentscheidungen:**

- KI als Ergänzung zur robusten, erklärbaren Basissuche
- deutliche Kennzeichnung von Demo- und Live-Modus
- keine persistente Speicherung des API-Keys im Prototyp
- keine frei erfundenen Spiele; Auswahl nur aus dem freigegebenen Katalog
- Mensch behält die finale Entscheidung über Eignung und Sicherheit

## Auftrag zur Übergabe und Accelerator-Bewerbung

**Nutzer:**

> bitte nach github pushen: [tobwil/CivicCoding-1.git](https://github.com/tobwil/CivicCoding-1.git)
>
> daneben brauchen wir eine aussagefähige readme für nutzer und auch für die technische perspektive.
>
> bitte screenshots hinzufügen
>
> bitte auch unsere gesprächshistorie mit speichern.
>
> und dann müssen wir auch noch das formualr ausfüllen um die challenge abgeben zu können. das frontend ist ja ready to use. erwartungshaltung ist kontakt und übergabe des frontends mit der neuen suchfunktion + netzwerk (sonst noch was)

Danach wurden sämtliche Felder des Civic-Coding-Formulars als Arbeitsgrundlage übermittelt.

**Ergebnis:**

- vier geprüfte Produktscreenshots
- README für Nutzung, Technik, Datenschutz, Grenzen und Übergabe
- ausformulierter Bewerbungsentwurf mit AI-Act-Selbsteinordnung
- geschärfte Programmerwartungen: Kontakt und Co-Creation mit ALBA, Katalog-/CMS-Integration, Nutzertests, Governance, Barrierefreiheit, Wirkungsmessung, Betrieb, Rollout und Netzwerk
- persönliche Pflichtfelder und Einwilligungen bewusst zur Bestätigung durch das einreichende Team offengelassen

## Aktueller Übergabestand

Der Prototyp ist als Frontend end-to-end nutzbar. Für den produktiven Einsatz sind insbesondere der vollständige Datenzugang, die gemeinsame Validierung mit ALBA, ein Produktionskonzept für die KI, rechtliche Klärungen sowie Pilot- und Wirkungstests nötig. Diese Punkte sind nicht bloß Restarbeiten, sondern die geeigneten Inhalte für den Co-Creation-Prozess im Accelerator.

## Ausbau mit ALBA-Unterlagen · 07.09.2026

**Nutzer:**

> bitte funktion ausbauen, mehr spiele involvieren und den neuen input von alba mit verwenden

Bereitgestellt wurden die Contenttabelle mit zehn Testspielen, die Regelübersicht für Kita/Grundschule/Verein und das SPORT-VERNETZT-Rahmenwerk für Coaches.

**Umsetzung:** Zehn vollständige ALBA-Spielanleitungen ergänzen die acht bisherigen Spiele. Profession, Erfahrungsstufe, Räume, exakte Gruppengrößen, Sportkleidung und Bewegungsanlässe bestimmen die Auswahl. Ausschlussgründe sind sichtbar. Coach AI analysiert die Situation, lässt die Regeln erneut prüfen und plant nur aus zulässigen Spielen. Das Rahmenwerk prägt altersabhängige Coach-Hinweise und die Planung. Die genauen Quellzuordnungen, Datenlücken und fachlichen Interpretationen stehen in [ALBA-INPUT.md](ALBA-INPUT.md).

## Verweise auf Dokumentation

## Nutzerkorrektur und Überarbeitung · 07.09.2026

Der Nutzer beanstandete sechs Punkte: fehlende Breite des ALBAthek-Katalogs; zu dominante Testspiele; uneinheitlich gefärbte Kacheln; überlagerte Navigation; die lange Altersauswahl unter „Was passt heute?“; langsame Coach-Antworten mit doppelten Spielen. Drei Screenshots dokumentierten die Fehler.

**Korrektur:** 657 öffentlich gelistete Spiele und Variationen mit echten Bildern, Original-Links, Kurzbeschreibungen und Materialien eingebunden. Die zehn Testprofile sind separat und optional im ALBA-Labor, neun mit öffentlichen Spielen verknüpft. Merkliste und Navigation sind entkoppelt, Alter/Kinderzahl über direkte Eingaben und Plus/Minus bedienbar, Zeit und Ort über kurze Auswahlknöpfe. Der Coach zeigt einen unmittelbaren regelbasierten Vorschlag, benötigt nur noch einen optionalen KI-Aufruf und akzeptiert keine doppelte Spielfamilie. Die breitere Sammlung besitzt noch keine vollständigen Detailmetadaten; deshalb sind Vorschläge als Vorauswahl gekennzeichnet.

**Prüfung und Dokumentation:** 19 automatisierte Verhaltenstests, Produktionsbuild, Lint sowie Browserprüfung von Navigation, Suche, Merkliste, Bildern und Sofortplan. Vier neue Screenshots dokumentieren den korrigierten Stand. Die echte Modelllatenz wurde nicht gemessen. README und technische Quellenbeschreibung aktualisiert.

## Ausbau zum dialogfähigen ALBA-Coach · 07.09.2026

**Nutzer:**

> wie die ki suche sinnvoll und vorallem funktionierend gestalten?
>
> und mit einem coach sollte man interagieren können. nicht nur ein vorschlag. der erzieher, oder trainer o.ä. sollte die möglichkeit haben mit dem coach zu chatten um mehr infos oder einen besseren trainingsplan zu bekommen.

Danach wurde ein detaillierter Umsetzungsplan beauftragt: eigenständiger Chat mit Arbeitsbereich, sitzungsbezogener Kontext, nachvollziehbare Suche über 657 öffentliche Spiele, Originalquellen, gezielte Planänderungen, Rückgängig, Streaming, robuste Fehlerbehandlung und echte Mehrschritt-Abnahme.

**Umsetzung:** Der Coach ist jetzt ein fortlaufender Dialog. Alltagssprache aktualisiert verbindliche Gruppendaten; neue Angaben überschreiben alte. Sechs Treffer bleiben sichtbar, bis eine neue Suche sie ersetzt. Erklärungsfragen ändern keinen Plan. Planstände sind versioniert, gezielte Änderungen erhalten nicht betroffene Abschnitte und Zeitanteile. Gespräch und Plan liegen nur im `sessionStorage`; ohne Speicher gibt es einen gekennzeichneten Arbeitsspeicher-Fallback.

Die KI arbeitet über drei validierte Katalogfunktionen: Suchen, eine bereits referenzierte ALBA-Originalanleitung lesen und einen Plan bzw. eine gezielte Änderung vorschlagen. Originalinformationen und eigene Coaching-Vorschläge werden unterschieden. Die Anwendung akzeptiert ausschließlich Katalog-IDs und geprüfte `albathek.de/spiele/`-Links, prüft Materialwidersprüche, Spielfamilien und Dauer und übernimmt Änderungen erst nach erfolgreicher Gesamtprüfung. Ohne Key stehen ehrlich gekennzeichnete Basissuche und regelbasierte Planung bereit.

**Abnahme:** 26 automatisierte Tests plus reale Mehrschritt-Dialoge. Geprüft wurden Fußballbezug, unbekannte und konkrete Ballanzahl, sechs synchrone Treffer, 30-Minuten-Plan, gezielter Einstiegstausch, unveränderte Erklärung, Rückgängig, Kinderzahlwechsel, Sitzungszustand, fehlende Quelldaten, Abbruch/Fehlererhalt, mobile Tabs und Tastaturbedienung. Der reale OpenAI-Lauf benötigte in dieser Umgebung etwa 16–28 Sekunden je geprüfter Antwort.

**Nutzer:** „bitte nochmal checken und dann push nach github“

Daraufhin wurden der komplette Live-Dialog erneut durchgespielt, Sitzungserhalt nach Schließen und Neuladen geprüft, Desktop- und Mobile-Aufnahmen aktualisiert sowie Produktionsbuild, Lint und alle 26 Tests wiederholt, bevor der Stand veröffentlicht wurde.

## Realistischeres Startbeispiel

**Nutzer:** „und das beispiel 11 Kinder meist fußballer, ball ist sehr schlecht, bitte durch ein real(eres) austauschen“

Das knappe Stichwortbeispiel wurde durch eine konkrete Alltagssituation ersetzt: „14 Kinder in der Grundschule, 7–9 Jahre, 30 Minuten in der Sporthalle. Wir haben 4 Bälle und Hütchen; alle sollen viel in Bewegung sein.“ Der Parser-Abgleich bestätigt Einrichtung, jüngstes Alter, Gruppengröße, Dauer, Raum und Ballanzahl; anschließend stehen sechs Katalogtreffer bereit.

### Verweise

- [Projektübersicht](../README.md)
- [Bewerbungsentwurf](BEWERBUNG.md)
- [Screenshots](screenshots/)
- Live-Prototyp: https://albathek-match.dahoooo.chatgpt.site
