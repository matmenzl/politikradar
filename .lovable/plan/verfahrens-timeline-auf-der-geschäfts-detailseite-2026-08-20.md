# Verfahrens-Timeline auf der Geschäfts-Detailseite

Auf der Detailseite eines Geschäfts soll sichtbar sein: Wo steht das Geschäft heute, welche Schritte sind bereits erfolgt und welche folgen voraussichtlich noch.

## Datengrundlage (geprüft)

OpenParlData liefert pro Geschäft eine echte Verfahrenshistorie unter `/v1/affairs/{id}/events`:
Datum, Reihenfolge (`position`), Bezeichnung (`title_harmonized`, z. B. „Eingereicht"), Akteur und ein `last`-Flag für den aktuellsten Schritt. Zusätzlich hat jedes Geschäft ein Statusfeld (`state_name_de`, z. B. „Eingereicht", „In Bearbeitung", „Spruchreif", „Beschlossen"). Diese Felder werden aktuell nicht importiert.

Zukünftige Schritte liefert die API nicht — sie werden aus einem hinterlegten Standard-Ablauf je Geschäftstyp (Motion, Postulat, Interpellation, Anfrage, Regierungsgeschäft …) abgeleitet und klar als „voraussichtlich" gekennzeichnet.

## Was gebaut wird

1. **Timeline-Daten holen und speichern**
   - Neue Spalten auf `events`: `affair_state` (aktueller Status) und `timeline` (Liste der Verfahrensschritte mit Datum, Titel, Akteur) plus Zeitstempel der letzten Aktualisierung.
   - Neue Edge Function `affair-timeline`: holt die Schritte für ein Geschäft bei OpenParlData, schreibt sie in die Datenbank und gibt sie zurück. Wird beim Öffnen der Detailseite aufgerufen und nur nachgeladen, wenn die gespeicherten Daten älter als 24 Stunden sind (schont die API und hält die Seite schnell).
   - Beim Laden der Daten (Schritt 1 im Radar) wird der Status `state_name_de` direkt mitgespeichert, damit er ohne Zusatzabfrage in Listen sichtbar ist.

2. **Standard-Ablauf je Geschäftstyp**
   - Eine Ablauf-Tabelle im Code: pro Geschäftstyp eine geordnete Liste kanonischer Etappen (z. B. Motion: Eingereicht → Stellungnahme Regierung → Behandlung im Parlament → Entscheid → Umsetzung).
   - Die realen Schritte aus der API werden diesen Etappen zugeordnet; nicht zuordenbare Schritte erscheinen trotzdem chronologisch, damit nichts verloren geht.
   - Ist der Geschäftstyp unbekannt, wird nur die reale Historie gezeigt — ohne erfundene Folgeschritte.

3. **Timeline-Komponente**
   - Vertikale Timeline im bestehenden Designsystem (keine neuen Farben): erledigte Schritte mit Datum und ausgefülltem Punkt, der aktuelle Stand hervorgehoben mit Label „Aktueller Stand", geplante Schritte gedämpft mit Hinweis „voraussichtlich".
   - Mobile-first, ein Info-Hint erklärt, dass künftige Schritte eine typische Abfolge sind und keine Terminzusage.
   - Fallback, wenn die API keine Schritte kennt: nur Eingangsdatum und aktueller Status.

4. **Einbau an beiden Detailansichten**
   - Öffentliche Geschäftsseite `/g/:id` (unterhalb der Fakten).
   - Detailansicht eines Ereignisses im Radar, damit die Redaktion den Verfahrensstand beim Auswählen sieht.

## Technische Details

- Migration: `alter table public.events add column affair_state text, add column timeline jsonb not null default '[]', add column timeline_synced_at timestamptz;` — bestehende RLS-Policies gelten unverändert weiter, keine neuen Grants nötig.
- Edge Function `affair-timeline` (public, CORS): Input `{ event_id }`, liest `affair_id`, ruft `GET /v1/affairs/{affair_id}/events?lang=de&lang_format=flat`, normalisiert auf `{ date, title, actor, position, last }`, schreibt via Service Role zurück und antwortet mit Timeline + Status. Kein API-Key erforderlich.
- Neue Dateien: `supabase/functions/affair-timeline/index.ts`, `src/lib/affairStages.ts` (Etappenmodell + Zuordnung), `src/components/AffairTimeline.tsx`.
- Angepasst: `supabase/functions/detect-events/index.ts` (Status mitschreiben), `src/pages/PublicEvent.tsx`, Detailansicht in `src/pages/Radar.tsx`, `src/lib/mvp.ts` (Typen).
