# Rückbau auf das PolitikRadar-MVP

Die App wird von einer öffentlichen Politik-Plattform auf ein reines Redaktions-Werkzeug mit drei Ansichten reduziert: **Radar**, **Story Studio**, **Redaktion**. Alles Öffentliche entfällt, das Datenmodell wird nach der Spezifikation neu aufgebaut, bestehende Stories werden verworfen.

## Die drei Ansichten

### 1. Radar – "Was ist relevant?"
- Liste erkannter Ereignisse mit Political Relevance, Social Potential und Editorial Confidence
- Gruppierung nach Priorität: Top Story (beide ≥70), Prüfen (≥60), Niedrige Priorität
- Filter nach Parlament, politischer Ebene und Datum; Sortierung nach Score
- Pro Ereignis: Faktoren-Aufschlüsselung, Ausschlussgrund bei gefilterten Ereignissen, Quelle öffnen
- Aktionen: "Story erstellen", "Ablehnen", auch bei tiefem Score produzierbar
- Ereignisse werden über einen Zeitraum aus den Parlamentsdaten geladen, hart gefiltert (kein Ereignis, nur Dokument, keine Quelle, rein administrativ) und danach bewertet

### 2. Story Studio – "Was machen wir daraus?"
- Fact Layer: strukturierte Fakten (Ereignis, Datum, Ergebnis, Ja/Nein/Enthaltungen, Geschäft, Quelle) – Fakten sind eigene Datensätze mit Quellenlink, nicht frei überschreibbarer Fliesstext
- Story Outline nach MVP-Struktur: Was ist passiert / Worum geht es / Was wurde beschlossen / Wie wurde abgestimmt / Wer war dafür-dagegen / Was passiert jetzt / Quellen
- KI generiert nur Formulierungen aus dem Fact Layer, keine neuen Zahlen
- Slide-Editor: Texte ändern, Slides hinzufügen/löschen/sortieren, Quelle bleibt gebunden
- Carousel-Vorschau im PolitikRadar-Design plus PNG-Export

### 3. Redaktion – "Was ist der Status?"
- Statusliste: Entwurf → KI erstellt → In Prüfung → Freigegeben → Publiziert
- Freigabe und Zurücksetzen pro Story, Löschen, Sprung ins Story Studio

## Was entfernt wird

Öffentlicher Bereich komplett: Politikwoche-Startseite, Wochenübersicht, Listenseiten (Abstimmungen, Geschäfte, Sitzungen, Gremien), Detailseite, Personenprofile, Embed-Seite und Embed-Code, öffentliche Story-Seite, Stories-Carousel, Themen-Radar, Wochen-Digest, Zugangscodes samt Nutzungsstatistik, Instagram-/Feed-Karussell-Editor, Bild-Generierung via Pollinations, Template-Galerie und Visual-Regression-Tests.

Zugang: ein einziges PIN-Login für die gesamte App. Zugangscode-System und Nutzungsstatistik entfallen.

## Technische Umsetzung

**Datenbank (neu, alte Tabellen verworfen)**
- `events` – parliament, political_level, canton, municipality, business_id, event_type, event_date, title, description, source_id, political_relevance, social_potential, editorial_confidence, score_factors (jsonb), selection_status (`new` | `excluded` | `selected` | `rejected`), exclusion_reason
- `facts` – event_id, fact_type, value, source_id, verified
- `sources` – url, label, source_type
- `stories` – event_id, status, headline, summary, die drei Scores
- `slides` – story_id, position, slide_type, headline, body, visualization (jsonb), source_id
- Alle Tabellen mit GRANTs und RLS; Zugriff über Edge Functions mit service_role, kein direkter anon-Schreibzugriff

Zu löschen: `story_posts`, `weekly_digests`, `affair_summaries`, `access_codes`, `access_code_events`.

**Edge Functions**
- Neu `detect-events`: lädt Geschäfte/Abstimmungen aus OpenParlData für einen Zeitraum, extrahiert Ereignisse idempotent (Dedupe über parliament + business_id + event_type + event_date), speichert Fakten und Quellen
- Neu `score-events`: Hard Filter, dann gewichtetes Scoring (Relevance 30/25/20/15/10, Social 20/20/20/15/10) plus Confidence; Gewichte und Schwellwerte als Konstanten in einer geteilten Konfigurationsdatei
- Umbau `generate-story` → erzeugt Outline und Slide-Texte ausschliesslich aus dem Fact Layer
- Löschen: `suggest-stories`, `summarize-affair`, `tag-affairs`, `weekly-digest`, `persist-story-images`, `manage-access-codes`, `verify-access-code`

**Frontend**
- Routen: `/` (Radar), `/story/:id` (Story Studio), `/redaktion`, alles hinter dem PIN-Gate
- Neu: `src/pages/Radar.tsx`, `src/pages/StoryStudio.tsx`, `src/pages/Redaktion.tsx`, `src/components/PinGate.tsx`
- Gelöscht: `WeeklyDigest`, `WeeklyOverview`, `List*`, `DetailPage`, `PersonProfile`, `EmbedDetailPage`, `StoryPage`, `TemplateGallery`, `AdminPage`, `StoriesCarousel`, `StoryPreviewModal`, `FeedCarouselEditor`, `AccessCodesPanel`, `AiAnalysisSection`, `EditorialSection`, `AdminSection`, `AffairSearch`, `ParliamentBrowser`, `PartyOverviewCard`, `VotingPartyBreakdown`, `WeekContextBar`, `ShareModal`, `EmbedCodeModal`, `SiteGate` sowie `use-week`, `use-range-items`, `pollinations`, `storyFixtures`, `tests/visual`
- Behalten und angepasst: `src/lib/api/openparldata.ts` (nur noch die Range-Abfragen), Slide-Rendering und Export
- Slide-Design: schlichtes Carousel nach Spezifikation (Titel, Text, Datenvisualisierung, Abstimmungsergebnis, Quellen, Branding). `storyVariants` und die Sprechblasen-Varianten entfallen, `storyTheme` wird auf ein festes Layout reduziert.

**Nicht in diesem Schritt**: Neutralitätsprüfung (US-12) und Fact Check gegen Quellen (US-13) folgen als zweiter Ausbauschritt; die Slide- und Fakten-Struktur wird bereits so angelegt, dass beides später andocken kann.

## Reihenfolge

1. Migration: neue Tabellen anlegen, alte entfernen
2. Edge Functions `detect-events` und `score-events`, `generate-story` umbauen, alte löschen
3. Frontend abräumen und die drei neuen Ansichten bauen
4. PIN-Gate einsetzen, Routing bereinigen, Durchlauf testen
