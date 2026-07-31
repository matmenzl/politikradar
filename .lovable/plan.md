# Startseite: Dreiteilung in Politikwoche, KI-Analyse und Redaktion

Die Startseite hat heute zwei Tabs ("Politikwoche" und "Admin"). Der Admin-Tab bündelt alles: KI-Vorschläge, Geschäfte-Browser, API-Suche und Story-Verwaltung. Das wird in drei klar getrennte Bereiche aufgeteilt.

## Bereich 1 – Politikwoche (öffentlich)

Bleibt inhaltlich wie heute, ergänzt um Recherche:
- Wochennavigation, Kennzahlen (Parlamente, Abstimmungen, Geschäfte, Sitzungen)
- Wochenzusammenfassung, Themen-Radar, Aktivste Parlamente, Parlaments-Browser
- Neu: Suche nach Geschäften und Abstimmungen (Volltextsuche über OpenParlData, Filter nach Parlament). Treffer verlinken auf die Detailseite – ohne Story-Generierung, das gehört in Bereich 3.
- Stories der Woche erscheinen hier nicht automatisch. Sichtbar wird eine Story nur, wenn sie in der Redaktion (Bereich 3) explizit für die Startseite freigegeben wurde. Ist keine Story freigegeben, entfällt der Block komplett.

## Bereich 2 – KI-Analyse (PIN-geschützt)

Fokus: Material mit Social-Media-Potenzial finden.
- Zeitraum-Auswahl (Von/Bis) wie bisher
- Button "KI-Vorschläge analysieren" mit Score-Liste, Begründung und Empfehlung
- Liste der analysierten Geschäfte/Abstimmungen mit Score-Badges
- Aus jedem Vorschlag heraus: "Story generieren" → erzeugt einen Entwurf und wechselt in Bereich 3

## Bereich 3 – Redaktion (PIN-geschützt)

Fokus: Stories sehen, erstellen, prüfen, veröffentlichen, löschen.
- Stories der gewählten Kalenderwoche (mit Live/Entwurf-Status)
- Ältere Stories in eigenem Block
- Pro Story: Vorschau (Slide-Editor inkl. Bild-Prompts), Veröffentlichen/Zurückziehen, Löschen
- Neu pro Story: Schalter "Auf Startseite zeigen". Nur damit erscheint die Story für Besucher in Bereich 1. Der Schalter ist nur bei veröffentlichten Stories aktiv; wird eine Story zurückgezogen, verschwindet sie automatisch auch von der Startseite.
- Manuelles Anlegen: Suche nach Geschäft/Abstimmung → "Story generieren"
- Empty-State mit Hinweis auf die KI-Analyse

## Navigation

Drei Tabs auf der Startseite: `Politikwoche` · `KI-Analyse` · `Redaktion`, gesteuert über `?tab=woche|ki|redaktion`. Der PIN-Login gilt gemeinsam für Tab 2 und 3 (eine Session, wie bisher über `sessionStorage`). Beim Wechsel auf einen geschützten Tab erscheint die PIN-Abfrage, danach bleibt der Zugang bestehen.

## Technische Umsetzung

- `src/pages/WeeklyDigest.tsx`: `TabsList` von zwei auf drei Trigger erweitern, Tab-Parsing auf `woche | ki | redaktion`, Lazy-Mount für die geschützten Tabs beibehalten.
- `src/components/admin/AdminSection.tsx` (1127 Zeilen) in drei Dateien aufteilen:
  - `admin/AdminGate.tsx` – PIN-Abfrage + Session, rendert `children`
  - `admin/AiAnalysisSection.tsx` – bisherige `AISuggestionsSection` inkl. Zeitraum-State und Datenladen (`fetchAffairsForWeek`/`fetchVotingsForWeek`)
  - `admin/EditorialSection.tsx` – Story-Liste (Woche/älter), `StoryRow`, `StoryPreviewModal`, `generateStory`, `togglePublish`, `deleteStory`, API-Suche
  - Gemeinsame Typen und `generateStory` in `admin/shared.ts`, damit beide Bereiche Stories anlegen können
- Der bisherige `BrowseSection` (Geschäfte/Abstimmungen der Woche mit Filter) zieht in Bereich 1 als öffentliche Recherche-Komponente `src/components/AffairSearch.tsx` um – ohne den "Story"-Button.
- `StoriesCarousel` (Stories der Woche) wird in Bereich 3 eingebunden; die Wochenauswahl kommt weiterhin aus `useWeekParam`.
- Keine Änderungen an Datenbank oder Edge Functions.

## Offene Frage

Sollen die veröffentlichten "Stories der Woche" für normale Besucher weiterhin oben in der Politikwoche sichtbar bleiben (Leseansicht), oder komplett in die Redaktion wandern? Standard im Plan: sie bleiben in Bereich 1 als Leseansicht sichtbar, die Verwaltung passiert in Bereich 3.
