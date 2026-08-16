# Ein Button: „Ereignisse bewerten“

Der Datenimport wird zum Zwischenschritt der Bewertung — der User klickt nur noch einen Knopf.

## Ablauf

```text
[Ereignisse bewerten]
  Schritt 1/2: OpenParl-Daten laden   -> detect-events (from, to)
  Schritt 2/2: KI-Bewertung           -> score-events  (from, to)
  Liste neu laden + Erfolgsmeldung
```

- Ein primärer Button „Ereignisse bewerten“ ersetzt die beiden bisherigen Buttons.
- Während des Laufs zeigt der Button den aktuellen Schritt („Daten laden…“ / „Bewerten…“).
- Abschlussmeldung fasst beides zusammen: „X neue Ereignisse geladen, Y bewertet, Z ausgeschlossen.“
- Schlägt der Import fehl, wird trotzdem bewertet (bereits vorhandene Daten), mit Hinweis-Toast.
- Tooltip erklärt: lädt Geschäfte/Abstimmungen aus OpenParlData für den gewählten Zeitraum und bewertet sie danach per KI nach politischer Relevanz und Social-Potenzial.
- „OpenParl-Daten laden“ bleibt als sekundäre Aktion im Sinne eines dezenten Menü-/Textlinks erhalten, falls nur importiert werden soll — optional, sonst ganz entfernen.

## Technisch

- Nur `src/pages/Radar.tsx`: `detect()` und `score()` werden in eine Funktion `refreshAndScore()` sequenziell zusammengezogen; ein State `step` (`idle | detecting | scoring`) steuert Label und Disabled-Zustand.
- Keine Änderungen an den Edge Functions `detect-events` / `score-events`.
- Die bisherige Disabled-Logik über „keine unbewerteten Ereignisse“ entfällt, da der Import neue Ereignisse erzeugen kann.
