# Civic Coding-Accelerator 2026 – Bewerbungsentwurf

Stand: 28.07.2026

Einreichungsfrist: 31.07.2026

Challenge: 1 – ALBAthek-Personalisierung: Intelligente Spielideen-Empfehlung

Dieses Dokument ist die redaktionelle Sicherung der Formularinhalte. Mit `⚠️` markierte Angaben müssen vor dem Absenden vom einreichenden Team ergänzt oder bestätigt werden.

## Name deines Projekts

**ALBAthek Match – Coach AI für passende Bewegungsspiele**

## Rechtsform

⚠️ **Noch anzugeben.** Falls keine eigene Organisation hinter dem Projekt steht, im Formular die tatsächliche Form als Einzelperson beziehungsweise Projektteam ohne eigene Rechtsform angeben.

## Beschreibe dein Projekt kurz.

ALBAthek Match ist eine intelligente Empfehlungs- und Assistenzoberfläche für den bestehenden Spielekatalog von ALBA BERLIN. Menschen, die Sport- und Bewegungsangebote mit Kindern anleiten, finden anhand von Alter, Gruppengröße, verfügbarer Zeit, pädagogischem Ziel und Material schneller passende Spielideen. Ein erklärbares Ranking zeigt nicht nur Treffer, sondern begründet, warum ein Spiel zur konkreten Situation passt. Ergänzend übersetzt Coach AI freie Alltagsschilderungen in eine direkt nutzbare Einheit aus Ankommen, Action und Landen. Zielgruppen sind insbesondere Übungsleitende, Erziehende, Lehrkräfte und Ehrenamtliche. So wird aus einem großen, wertvollen Inhaltsangebot eine niedrigschwellige Entscheidungshilfe für den realen Bewegungsalltag.

## Für welche der Challenges bietet dein KI-Projekt eine Lösung?

**Challenge 1 – ALBAthek-Personalisierung: Intelligente Spielideen-Empfehlung**

## Wie sieht dein Lösungsansatz für Challenge 1 aus?

Wir kombinieren zwei komplementäre Zugänge. Der schnelle Finder priorisiert den vorhandenen ALBAthek-Katalog anhand weniger alltagsnaher Angaben und macht mit Match-Werten und Begründungen transparent, warum ein Spiel passt. Coach AI nimmt Situationen auf, die sich nicht gut in Filter übersetzen lassen, etwa „25 müde Kinder, kleine Halle, nur zwei Bälle“, und erstellt daraus einen strukturierten Ablauf mit ausschließlich redaktionell freigegebenen ALBAthek-Spielen. Die Originalanleitung bleibt die verlässliche Inhaltsquelle; die neue Oberfläche reduziert Suchaufwand und Entscheidungslast. Der Ansatz kann in die bestehende ALBAthek integriert werden, statt eine konkurrierende Inhaltsplattform aufzubauen.

## In welcher Entwicklungsphase befindet sich dein Projekt?

**Prototyping & Testing**

Begründung: Es existiert ein funktionsfähiger, online nutzbarer End-to-End-Prototyp. Die nächste Phase ist die gemeinsame Validierung mit ALBA und realen Nutzerinnen und Nutzern sowie die technische Anbindung des vollständigen Katalogs.

## Beschreibe kurz den aktuellen Stand deines Prototyps oder deines Produkts.

Der responsive Web-Prototyp ist online und deckt den zentralen Nutzerfluss vollständig ab: Kriterien wählen, gewichtete und begründete Empfehlungen erhalten, suchen, Spiele merken oder ausblenden und die Originalanleitung auf ALBAthek.de öffnen. Coach AI funktioniert ohne Einrichtung im Demo-Modus und optional live über die OpenAI Responses API mit eigenem, nur sitzungsbezogen gehaltenem API-Key. Structured Outputs begrenzen die KI auf einen freigegebenen Spielkatalog und einen klaren Drei-Phasen-Ablauf. Aktuell sind acht echte ALBAthek-Spiele als repräsentative Stichprobe integriert. Quellcode, technische Dokumentation und Screenshots sind vorhanden. Noch offen sind die vollständige Daten-/CMS-Anbindung, gemeinsame Metadaten- und Ranking-Validierung, Nutzertests, Barrierefreiheitsprüfung und Produktionsbetrieb.

## Link zum Prototyp oder zum Produkt

**Live:** https://albathek-match.dahoooo.chatgpt.site

**Quellcode und Dokumentation:** https://github.com/tobwil/CivicCoding-1

Hinweis: Falls die Live-Demo beim Review eine Anmeldung verlangt, dokumentiert das öffentliche Repository den gesamten Prototyp mit vier Screenshots.

## Welche konkreten KI-Technologien nutzt du in deinem Projekt?

**Generative KI / Large Language Models (LLM)**

Auswahl im Formular: **Generative KI, Large Language Models (LLM), Natural Language Processing (NLP), Recommender System und Virtuelle Assistenten.**

Technisch nutzen wir die OpenAI Responses API, promptbasiertes Reasoning mit geringer Latenz, kontextgebundene Katalogauswahl und Structured Outputs per strengem JSON-Schema. Ergänzend arbeitet ein deterministisches, erklärbares Scoring als robuste Basis der Personalisierung. In einer nächsten Ausbaustufe sind semantische Suche beziehungsweise Embeddings, Retrieval über den vollständigen ALBAthek-Katalog und systematische LLM-Evaluationen vorgesehen.

## Einsatz von KI

Die KI übersetzt eine frei formulierte, oft unvollständige Alltagssituation in eine konkrete, sofort durchführbare Bewegungseinheit. Sie berücksichtigt Zeit, Gruppengröße, Alter, Ziel und Material, wählt ausschließlich Spiele aus einem bereitgestellten ALBAthek-Katalog und strukturiert das Ergebnis in Ankommen, Action und Landen. Zu jedem Baustein liefert sie eine kurze Begründung und einen Praxistipp. Die generative KI ersetzt weder die redaktionelle Spielbeschreibung noch die Entscheidung der anleitenden Person. Sie ergänzt ein deterministisches Ranking dort, wo starre Filter die Realität nicht ausreichend abbilden. KI-Inhalte und Live-Modus werden in der Oberfläche sichtbar gekennzeichnet.

## Übertragbarkeit der Ergebnisse

Die Architektur trennt Inhaltskatalog, Metadaten, Ranking und dialogische Assistenz. Dadurch lässt sich der Ansatz auf weitere Sportvereine, offene Ganztage, Kitas, Schulen, Jugendverbände und Bewegungsinitiativen übertragen. Ebenso ist das Muster für andere kuratierte Wissensbestände nutzbar, bei denen Menschen unter Zeitdruck ein passendes Angebot finden müssen. Übertragbar sind insbesondere das erklärbare hybride Ranking, das auf einen freigegebenen Katalog begrenzte LLM, das Structured-Output-Schema, die datensparsame Bedienlogik und ein gemeinsames Evaluationsset. Organisationsspezifische Inhalte und Rechte bleiben dabei sauber getrennt.

## Verfolgt das Projekt einen Open-Source-Ansatz oder hat dies vor?

**Formularauswahl: Nein, aber wir haben es vor.**

Der Quellcode wird öffentlich zur Prüfung und kollaborativen Weiterentwicklung bereitgestellt. Eine konkrete Open-Source-Lizenz ist jedoch noch nicht vergeben. Gemeinsam mit ALBA möchten wir eine passende permissive Code-Lizenz und klare Contribution-Regeln festlegen. Marken, Bilder und redaktionelle ALBAthek-Inhalte werden separat behandelt und nicht pauschal unter eine Code-Lizenz gestellt. So verbinden wir Wiederverwendbarkeit mit dem Schutz bestehender Rechte.

## In welche Risikoklasse im Sinne des AI Acts ordnest du deine KI-Anwendung ein?

**Begrenztes Risiko / Transparenzrisiko**

## Begründung und Umgang mit der Selbsteinordnung

Die Anwendung unterstützt erwachsene Anleitende bei der Auswahl von Bewegungsspielen. Sie entscheidet weder über den Bildungszugang noch bewertet sie Kinder, erstellt keine biometrischen oder sensiblen Profile und hat keine rechtliche oder vergleichbar erhebliche Wirkung. Damit sehen wir keinen Hochrisiko-Anwendungsfall. Weil Nutzende mit einer generativen Assistenz interagieren und KI-Ausgaben erhalten, behandeln wir das System vorsorglich als Transparenzrisiko. Coach AI und Live-Modus werden klar gekennzeichnet; die Originalanleitung bleibt sichtbar verlinkt; die endgültige Entscheidung verbleibt beim Menschen. Wir erheben keine personenbezogenen Daten über Kinder, begrenzen die KI auf freigegebene Spiel-IDs, nutzen strukturierte Ausgaben, führen Testfälle und Fehleranalysen ein und planen Dokumentation, Feedbackweg, Monitoring sowie regelmäßige Risiko- und Barrierefreiheitsreviews. Diese Einordnung ist eine projektbezogene Selbsteinschätzung und wird vor dem Produktivbetrieb rechtlich und gemeinsam mit ALBA überprüft.

## Standort(e) des Projekts

⚠️ **Noch anzugeben.**

## Kontakt

- Vorname: ⚠️
- Nachname: ⚠️
- E-Mail: ⚠️
- Telefonnummer: ⚠️

## Team-Mitglieder

⚠️ **Noch anzugeben oder „keine weiteren Teammitglieder“ eintragen.**

## Erwartungen an das Programm

Wir möchten den funktionalen Prototyp gemeinsam mit ALBA BERLIN in einen validierten, übergabefähigen Produktbaustein überführen. Dafür erwarten wir vor allem direkten Kontakt zu Produktverantwortlichen, Redaktion und späteren Nutzergruppen, um Kataloganbindung, Metadaten, Rankinglogik und Coach-Antworten im echten Anwendungskontext zu testen. Die Projektberatung soll uns bei Datenschutz, AI-Act-Governance, Barrierefreiheit, Wirkungsmessung, technischem Betrieb und einer realistischen Integrations- und Verstetigungsstrategie unterstützen. Ebenso wichtig sind der Austausch mit anderen gemeinwohlorientierten KI-Projekten und ein Netzwerk aus Zivilgesellschaft, Forschung, Verwaltung und Tech-Community. Konkretes Ziel bis Programmende ist ein mit ALBA abgestimmter Pilot- und Rolloutplan einschließlich Verantwortlichkeiten, Datenzugang, Evaluationskriterien, Kostenmodell und Open-Source-Strategie — idealerweise verbunden mit einer Übergabe beziehungsweise Integration der neuen Suche und Coach-AI-Funktion in die bestehende ALBAthek.

## Datenschutz und Weitergabe

Diese beiden Angaben sind persönliche Einwilligungen und dürfen nicht automatisiert vorausgewählt werden:

- ⚠️ Datenschutzhinweise gelesen und Zustimmung erteilt
- ⚠️ Entscheidung, ob Name und E-Mail zur Vernetzung weitergegeben werden dürfen

## Vor dem Absenden

- [ ] Rechtsform bestätigen
- [ ] Standort ergänzen
- [ ] Kontaktangaben ergänzen
- [ ] Teamangaben bestätigen
- [ ] Erreichbarkeit der Live-Demo ohne internes Konto prüfen
- [ ] öffentlichen GitHub-Link prüfen
- [ ] Datenschutzerklärungen selbst lesen und Einwilligung erteilen
- [ ] Datenweitergabe selbst auswählen
- [ ] alle Texte im Formular gegenlesen
- [ ] Absenden ausdrücklich bestätigen
