

# PolitikRadar Weekly – Implementierungsplan

## Überblick
Ein visuell hochwertiger Web-Prototyp, der eine Wochenübersicht parlamentarischer Aktivitäten darstellt. Minimalistisches Design, Mobile First, mit Mock-Daten.

---

## Seite 1: Landing Page
- **Hero-Bereich** mit Claim: *„Was diese Woche im Parlament wirklich wichtig war – visuell und datenbasiert."*
- Kurze Erklärung des Konzepts
- CTA-Button zur Weekly Overview
- Minimalistisches Design mit viel Weißraum und klarer Typografie

## Seite 2: Weekly Overview
Vier visuell aufbereitete Cards für die Woche (z.B. "2026-W05"):

1. **Dominierendes Thema der Woche** – Themenname, Anzahl Geschäfte, Events, Dokumente, Abstimmungen
2. **Knappste Abstimmung** – Thema mit Ja/Nein-Stimmen, visuelle Darstellung des Abstimmungsergebnisses (z.B. Balkendiagramm)
3. **Thema mit Momentum** – Thema mit Veränderungswert (Delta), visueller Trend-Indikator
4. **Gesamtaktivität** – Aggregierte Zahlen (Geschäfte, Abstimmungen) als kompakte Statistik-Card

### Interaktionen
- Hover-Effekte auf den Cards für zusätzliche Details
- Share-Button mit Mock-Modal (Links kopieren, Social-Media-Icons)
- Details-Button pro Card → führt zu einer Mock-Detailseite

## Seite 3: Mock-Detailseite
- Einfache Detailansicht für ein Thema mit erweiterten Mock-Informationen
- Zurück-Navigation zur Übersicht

## Daten
- Mock-JSON-Datei mit der im PRD definierten Struktur
- Zentral importiert und an alle Komponenten weitergegeben

## Design
- Minimalistisch, neutral, keine Parteifarben
- Viel Weißraum, klare Typografie
- Mobile First Layout
- Neutrale Farbpalette (Grautöne, dezente Akzentfarbe)

