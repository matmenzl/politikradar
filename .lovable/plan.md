

## AI-Zusammenfassung fuer parlamentarische Geschaefte

### Uebersicht

Auf der Detailseite eines Geschaefts wird ein neuer "Zusammenfassung"-Bereich eingefuegt, der per Knopfdruck eine verstaendliche AI-Zusammenfassung generiert. Die Zusammenfassung erklaert das Geschaeft in einfacher Sprache, basierend auf den vorhandenen Daten (Titel, Typ, Status, Abstimmungsergebnisse).

### Funktionsweise

- Der Nutzer sieht einen Button "Zusammenfassung generieren" auf der Detailseite
- Beim Klick wird eine Backend-Funktion aufgerufen, die alle verfuegbaren Informationen zum Geschaeft (Titel, Typ, Abstimmungsergebnisse, Datum, Status) an Lovable AI sendet
- Die AI erstellt eine kurze, allgemeinverstaendliche Zusammenfassung auf Deutsch
- Die Zusammenfassung wird direkt in einer Karte angezeigt
- Waehrend des Ladens wird ein Skeleton/Spinner angezeigt

### Technische Umsetzung

#### 1. Neue Backend-Funktion: `supabase/functions/summarize-affair/index.ts`

- Empfaengt Geschaeftsdaten (Titel, Typ, Status, Abstimmungsergebnisse, Daten)
- Ruft Lovable AI (google/gemini-3-flash-preview) auf mit einem System-Prompt, der die Rolle eines Schweizer Politik-Erklaerers einnimmt
- Gibt eine kurze Zusammenfassung (3-5 Saetze) in einfacher Sprache zurueck
- Behandelt 429/402 Fehler korrekt

#### 2. Config: `supabase/config.toml`

- Neuer Eintrag fuer `summarize-affair` mit `verify_jwt = false`

#### 3. Detailseite: `src/pages/DetailPage.tsx`

- Neuer State: `summary` (string), `summaryLoading` (boolean)
- Neue Karte im Affair-Bereich mit:
  - Button "Zusammenfassung generieren" (Sparkles-Icon)
  - Nach dem Laden: Die Zusammenfassung als Fliesstext
  - Hinweis "Erstellt mit KI" am unteren Rand
- Die Zusammenfassung wird on-demand geladen (nicht automatisch), um API-Calls zu sparen
- Verfuegbar fuer alle Geschaefte (nicht nur Nationalparlament), solange genuegend Kontextdaten vorhanden sind

#### Datenfluss

Das Frontend sammelt alle verfuegbaren Daten und sendet sie an die Edge Function:

```text
DetailPage (Klick auf Button)
  --> supabase.functions.invoke("summarize-affair", {
        title, type, status, votingResults, date
      })
  --> Edge Function ruft Lovable AI auf
  --> Zusammenfassung wird zurueckgegeben und angezeigt
```

#### Prompt-Strategie (Backend)

Der AI-Prompt erhaelt:
- Geschaeftstitel
- Geschaeftstyp (Motion, Interpellation, etc.)
- Status (erledigt, haengig, etc.)
- Abstimmungsergebnisse (falls vorhanden)
- Datumsangaben

Die AI wird angewiesen, eine allgemeinverstaendliche Erklaerung in 3-5 Saetzen zu liefern, ohne Fachjargon.

