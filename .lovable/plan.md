## Ziel

Die Startseite (`/`) wird in zwei klar getrennte Hauptbereiche gegliedert, umschaltbar über zwei Tabs direkt unter dem Wochen-Header.

```text
┌──────────────────────────────────────────┐
│ Header: Logo · PolitikRadar              │
├──────────────────────────────────────────┤
│ ‹ KW 31 ›  Politikwoche · 27.7.–2.8.2026 │
├──────────────────────────────────────────┤
│ [ Politikwoche ]  [ Admin ]              │
└──────────────────────────────────────────┘
```

## Bereich 1 – Politikwoche (Standard-Tab)

Reihenfolge der Blöcke:

1. Stories der Woche (Carousel, bleibt Einstieg)
2. Kennzahlen-Kacheln: Aktive Parlamente, Abstimmungen, Geschäfte, Sitzungen
3. Wochenzusammenfassung (KI)
4. Themen-Radar
5. Knappste Abstimmungen
6. Aktivste Parlamente
7. Verfügbare Parlamente (ParliamentBrowser)

Inhaltlich unverändert, nur gruppiert und mit leichten visuellen Trennern/Abschnittsüberschriften, damit die lange Liste übersichtlicher wirkt.

## Bereich 2 – Admin

Nur nach PIN-Eingabe sichtbar (gleiche Prüfung wie heute unter `/admin`, Edge Function `verify-admin-pin`). Vor der Eingabe zeigt der Tab nur das PIN-Formular.

Nach dem Entsperren, in dieser Reihenfolge:

1. **Social-Media-Posts dieser Woche** – Liste aller Stories der aktuellen Kalenderwoche mit Status (Entwurf / Veröffentlicht), Titel, Parlament, Datum. Aktionen pro Eintrag: Vorschau (bestehendes `StoryPreviewModal`), Veröffentlichen bzw. Zurückziehen, Löschen.
2. **KI-Vorschläge** – Button „Vorschläge analysieren“, Ergebnisliste mit Score, Begründung und Hook, pro Vorschlag „Story generieren“.
3. **Geschäfte & Abstimmungen durchsuchen** – bestehende Such-/Filteransicht zum manuellen Anlegen von Stories.

## Technische Umsetzung

- `src/pages/WeeklyDigest.tsx` wird zur Shell: Header, Wochen-Navigation, `Tabs` (shadcn) mit den Werten `woche` und `admin`. Der aktive Tab wird als URL-Parameter (`?tab=admin`) gehalten, damit Reload und Deep-Links funktionieren.
- Inhalt von Bereich 1 wandert unverändert in eine neue Komponente `src/components/home/PolitikwocheSection.tsx` (bekommt `data`, `loading`, `error` als Props).
- Der bestehende Admin-Code wird aus `src/pages/AdminPage.tsx` in wiederverwendbare Komponenten unter `src/components/admin/` ausgelagert (PIN-Gate, Story-Liste der Woche, KI-Vorschläge, Suche). `WeeklyDigest` rendert diese im Admin-Tab.
- Die Route `/admin` bleibt bestehen und rendert dieselben Komponenten, damit bestehende Links weiter funktionieren.
- Der Admin-Tab lädt seine Daten erst beim ersten Öffnen (lazy), damit die Startseite nicht langsamer wird.
- Der PIN-Status wird wie bisher nur im Komponenten-State gehalten (keine Speicherung im Browser).
- Mobil: Tabnavigation einbauen. User kann wechseln zwischen Bereich 1 und Bereich 2. 

## Hinweis

Der Admin-Tab ist für jeden Besucher sichtbar (nur der Inhalt ist PIN-geschützt). Falls der Tab für normale Besucher gar nicht erscheinen soll, kann er stattdessen nur bei `?tab=admin` eingeblendet werden – sag Bescheid, wenn du das bevorzugst.