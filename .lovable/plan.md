## Ziel

Jeder Story-Slide bekommt ein KI-generiertes Hintergrundbild von Pollinations.ai (FLUX, kein API-Key). Admin kann den Bild-Prompt pro Slide editieren und neu würfeln; beim Publizieren wird das Bild dauerhaft im Backend-Storage gespeichert.

## Prüfung der Gemini-Anleitung

Grundsätzlich korrekt, aber drei Fehler/Lücken:
- Die URL im Code-Snippet ist als Markdown-Link verstümmelt (`[https://...]($){...}`) — muss ein einfaches Template-Literal sein.
- Die React-Komponente im Dokument ist unvollständig (JSX-Body fehlt) und wird so nicht übernommen.
- Nicht erwähnt: der PNG-Export läuft über `html2canvas`. Externe Bilder taint das Canvas bzw. brechen den Export, wenn CORS nicht greift. Lösung: vor dem Export das Bild als Data-URL einbetten (fetch → base64), bzw. nach dem Publizieren die eigene Storage-URL nutzen.

Zusätzlich: Pollinations-URLs sind langsam beim ersten Abruf (Generierung on demand) und liefern bei gleichem `seed` das gleiche Bild — Seed muss also mitgespeichert werden, sonst ändert sich das Bild bei jedem Reload.

## Umsetzung

**1. Helper `src/lib/pollinations.ts`**
- `buildPollinationsUrl(prompt, { width=1080, height=1920, model='flux', seed, nologo:true })`
- Style-Prefix: „Swiss editorial layout, clean graphic design, minimalist, no text, no letters, high quality" (kein Text im Bild, da Headline als Overlay kommt)
- `randomSeed()` Helper

**2. Datenmodell (kein Schema-Change nötig)**
`story_posts.slides` ist JSONB — pro Slide zusätzlich: `image_prompt`, `image_seed`, `image_url` (nach Publish die Storage-URL). Typ `StorySlide` in `StoryPreviewModal.tsx` erweitern.

**3. Prompt-Erzeugung**
`supabase/functions/generate-story/index.ts`: Tool-Schema um `image_prompt` (englisch, bildhaft, ohne Text/Logos/reale Personen) pro Slide ergänzen. Fallback im Client, falls das Feld fehlt: aus Headline + Thema ableiten.

**4. Rendering `StorySlideCard.tsx`**
- Hintergrundbild absolut, `object-cover`, darüber ein Gradient-/Dunkel-Overlay, damit Typo lesbar bleibt (bestehende Farbwelt bleibt als Fallback und Tönung erhalten).
- Skeleton/Spinner bis `onLoad`; bei `onError` sauberer Fallback auf den heutigen Gradient.
- `crossOrigin="anonymous"` für den Canvas-Export.

**5. Admin-Editor (`AdminSection.tsx` / Vorschau-Dialog)**
Pro Slide unter der Karte: Textfeld für den Bild-Prompt, Button „Neu generieren" (neuer Seed), Button „Bild übernehmen". Änderungen werden in den Slides des Drafts gespeichert (`story_posts.slides` update).

**6. Persistenz beim Publizieren**
- Öffentlicher Bucket `story-images` anlegen (+ RLS-Policies auf `storage.objects`: public read, insert via Service-Role).
- Neue Edge Function `persist-story-images`: nimmt `story_id`, lädt für jeden Slide die Pollinations-URL serverseitig, lädt sie als PNG in den Bucket (`{story_id}/{slide_index}.png`) und schreibt die öffentliche URL in `slides[i].image_url` zurück.
- Publizieren-Flow: erst `persist-story-images`, dann `status='published'`. Fehlerfall → Toast, Story bleibt Draft.

**7. Export**
`exportSlides.ts`: vor `html2canvas` alle `<img>` im Slide zu Data-URLs inlinen (fetch + FileReader), damit ZIP/PNG-Export mit Bildern zuverlässig funktioniert.

## Technische Hinweise

- Pollinations braucht keinen Key und kein Secret; Aufrufe erfolgen direkt vom Browser (Vorschau) bzw. aus der Edge Function (Persistenz).
- Erstgenerierung dauert typischerweise 3–10 s pro Bild; die Vorschau lädt Bilder daher lazy pro Slide.
- Bestehende, bereits publizierte Stories bleiben unverändert (kein `image_url` → alter Look).
