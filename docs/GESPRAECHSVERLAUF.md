# Gesprächs- und Entscheidungsverlauf

Stand: 28.07.2026

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

## Verweise

- [Projektübersicht](../README.md)
- [Bewerbungsentwurf](BEWERBUNG.md)
- [Screenshots](screenshots/)
- Live-Prototyp: https://albathek-match.dahoooo.chatgpt.site
