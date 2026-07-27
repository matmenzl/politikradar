## Problem

Die gewählte Kalenderwoche lebt nur im lokalen State der Startseite. Jede andere Seite berechnet ihre Woche selbst neu:

- `WeeklyDigest.tsx:56` — `useState(getCurrentISOWeek())`, die Woche steht nicht in der URL.
- `WeeklyOverview.tsx:28` — eigener State, ebenfalls aus `getCurrentISOWeek()`.
- `ListVotings.tsx:24`, `ListAffairs.tsx:21`, `ListMeetings.tsx:21`, `ListBodies.tsx:28` — fest `getCurrentISOWeek()`, kein Parameter, kein State.
- Die Links von der Startseite in die Listen (`/list/votings` usw.) und nach `/weekly` übergeben keine Woche.
- `WeeklyOverview` ruft `setSearchParams({ body: key })` auf und löscht dabei alle anderen URL-Parameter.

Ergebnis: Sobald man navigiert, springt jede Seite auf die aktuelle Woche zurück.

## Lösung: Woche als URL-Parameter, analog zur Parlaments-Auswahl

Die Woche wird wie `body` in der URL geführt (`?year=2026&week=30`) und beim Navigieren mitgegeben. Ohne Parameter gilt weiterhin die aktuelle Woche — bestehende Links und Bookmarks bleiben gültig.

### 1. Gemeinsamer Hook `src/hooks/use-week.ts`
- `useWeekParam()` liest `year`/`week` aus der URL, fällt auf `getCurrentISOWeek()` zurück, validiert (Woche 1–53, plausibles Jahr).
- Liefert `{ year, week, setWeek(year, week), isCurrentWeek }`; `setWeek` schreibt per `replace` in die URL und **merged** mit bestehenden Parametern (`tab`, `body`).
- Zusätzlich `weekQuery(year, week)` — hängt die Woche nur an, wenn sie nicht die aktuelle ist, damit Standard-Links sauber bleiben.

### 2. Startseite (`WeeklyDigest.tsx`)
- Lokalen `year`/`week`-State durch den Hook ersetzen; Vor/Zurück-Buttons schreiben in die URL.
- Die vier Stat-Karten-Links (`/list/bodies`, `/list/votings`, `/list/affairs`, `/list/meetings`) und die Links auf „Aktivste Parlamente" (`/weekly?body=…`) bekommen die Woche angehängt.

### 3. Listenseiten (`ListVotings`, `ListAffairs`, `ListMeetings`, `ListBodies`)
- `getCurrentISOWeek()` durch `useWeekParam()` ersetzen; der bereits angezeigte „KW x · Datum"-Header stimmt dann mit der gewählten Woche überein.
- Der Datenabruf hängt an `from`/`to` der gewählten Woche (Abhängigkeiten der `useEffect`-Hooks entsprechend ergänzen — aktuell mit leerem Array).
- „Zurück"-Link führt auf `/` inklusive Woche.

### 4. Wochenansicht (`WeeklyOverview.tsx`)
- Woche aus dem Hook statt lokalem State; die Wochen-Navigation dort schreibt ebenfalls in die URL.
- `setBodyKey` so anpassen, dass es die bestehenden Parameter erhält statt sie zu überschreiben.

### 5. Detailseite (`DetailPage.tsx`)
- Beim Zurücknavigieren die Woche im Link mitführen, damit man in derselben Woche landet.

## Technische Hinweise
- Kein Backend- oder Datenmodell-Change; rein Routing- und State-Ebene.
- Der Admin-Tab-Parameter (`tab=admin`) und `body` bleiben beim Wochenwechsel erhalten, weil alle Schreibzugriffe über denselben Merge-Helper laufen.
- Ungültige oder fehlende Parameter fallen still auf die aktuelle ISO-Woche zurück (`getCurrentISOWeek`, unverändert).
