

# Instagram Story-Generator für parlamentarische Geschäfte

## Konzept

Auf der Detail-Seite wird ein neuer Button "Instagram Stories generieren" angeboten. Beim Klick werden:

1. **KI-Storytelling** generiert: Eine Edge Function erstellt einen 3–5-Slide-Storytelling-Vorschlag (Hook → Kontext → Ergebnis → Einordnung → Call-to-Action)
2. **Story-Slides als HTML-Karten** gerendert: Visuell ansprechende, im Instagram-Story-Format (9:16, 1080×1920) gestaltete Karten, die der Nutzer als Screenshots exportieren kann

## Architektur

```text
┌─ DetailPage.tsx ──────────────────────────┐
│  [📱 Instagram Stories generieren]        │
│         ↓ Klick                           │
│  Edge Function: generate-story            │
│    → KI generiert Storytelling-Slides     │
│         ↓ Response                        │
│  StoryPreviewModal.tsx                    │
│    → Rendert Slides im 9:16 Format       │
│    → "Screenshot speichern" per Slide     │
└───────────────────────────────────────────┘
```

## Neue Dateien

### 1. Edge Function `supabase/functions/generate-story/index.ts`

- Erhält: Titel, Typ, Status, Abstimmungsergebnisse, Zusammenfassung
- Nutzt Lovable AI (Gemini) mit Tool Calling, um strukturierten Output zu liefern:
  - Array von 3–5 Slides, jeweils mit `headline`, `body`, `emoji`, `slide_type` (hook/context/result/insight/cta)
- Rückgabe: JSON-Array der Slides

### 2. Komponente `src/components/StoryPreviewModal.tsx`

- Dialog/Modal mit horizontalem Karussell der Story-Slides
- Jeder Slide wird als HTML-Karte im 9:16-Verhältnis gerendert (AspectRatio)
- Design pro Slide-Typ:
  - **Hook**: Grosser Emoji + Frage/Aussage, dunkler Hintergrund
  - **Context**: Geschäftstyp + Erklärtext
  - **Result**: VoteBar-Visualisierung + Ja/Nein-Zahlen
  - **Insight**: KI-Einordnung
  - **CTA**: "Mehr auf politikradar.ch" + QR-Code oder Link
- Export: `html2canvas` oder nativer Browser-Screenshot-Hinweis ("Rechtsklick → Bild speichern")
- Branding: "politikradar.ch" Wasserzeichen unten

### 3. Anpassung `src/pages/DetailPage.tsx`

- Neuer Button neben "Einbetten" im Header oder im AI-Summary-Bereich
- State für Story-Slides und Loading
- Aufruf der Edge Function beim Klick

## Beispiel-Output (5 Slides)

```text
Slide 1 (Hook):
  🏛️
  "Soll die Schweiz mehr in
   erneuerbare Energien investieren?"

Slide 2 (Context):
  PARLAMENTARISCHE INITIATIVE
  Eingereicht am 12.03.2025
  "Förderung erneuerbarer Energien
   in Berggebieten"

Slide 3 (Result):
  ABSTIMMUNG
  ████████░░  126 Ja
  ░░████████   68 Nein
  ANGENOMMEN ✅

Slide 4 (Insight):
  "Das Parlament setzt ein klares
   Zeichen für die Energiewende.
   Die Vorlage wurde mit breiter
   Unterstützung angenommen."

Slide 5 (CTA):
  Mehr erfahren auf
  politikradar.ch
  📱 @politikradar
```

## Technische Details

- **html2canvas** als Dependency für den Bild-Export (PNG-Download pro Slide)
- **config.toml** erweitern um `[functions.generate-story]` mit `verify_jwt = false`
- KI-Prompt auf der Edge Function, nicht client-seitig
- Tool Calling für strukturierten Output (Array von Slide-Objekten)

