

## Stories auf der Startseite + Admin-Bereich

### Übersicht

1. **Neue DB-Tabelle `story_posts`** speichert kuratierte Stories (welche Affair/Voting, generierte Slides, Status)
2. **Admin-Seite `/admin`** mit einfachem PIN-Schutz, wo Abstimmungen/Geschäfte ausgewählt und Stories generiert/veröffentlicht werden
3. **Stories-Karussell auf der Startseite** zeigt veröffentlichte Stories im Instagram-Look

### Datenbank

Neue Tabelle `story_posts`:

```sql
CREATE TABLE public.story_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  affair_id text,
  voting_id text,
  title text NOT NULL,
  body_key text,
  slides jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  published_at timestamptz
);

ALTER TABLE public.story_posts ENABLE ROW LEVEL SECURITY;

-- Jeder kann veröffentlichte Stories lesen
CREATE POLICY "Anyone can read published stories"
  ON public.story_posts FOR SELECT TO public
  USING (status = 'published');

-- Insert/Update/Delete ohne Auth (PIN-Schutz erfolgt client-seitig, kein User-Auth)
-- Alternativ: Service-Key in Edge Function für Schreibzugriff
CREATE POLICY "Anyone can manage stories"
  ON public.story_posts FOR ALL TO public
  USING (true) WITH CHECK (true);
```

### Admin-Bereich (`/admin`)

- **PIN-Schutz**: Beim Aufrufen wird ein Passwort abgefragt (gespeichert als Secret `ADMIN_PIN`, geprüft via Edge Function). Session wird in `sessionStorage` gehalten.
- **Edge Function `verify-admin-pin`**: Nimmt PIN entgegen, vergleicht mit dem Secret, gibt `{ valid: true/false }` zurück.
- **Geschäfte/Abstimmungen suchen**: Suchfeld, das die OpenParlData API nach Geschäften/Abstimmungen durchsucht.
- **Story generieren**: Klick auf ein Ergebnis ruft die bestehende `generate-story` Edge Function auf und speichert die Slides in `story_posts` mit Status `draft`.
- **Veröffentlichen/Entfernen**: Draft-Stories können veröffentlicht oder gelöscht werden.
- **Übersicht**: Liste aller story_posts mit Status-Badge.

### Startseite (WeeklyDigest)

- Neuer Abschnitt **"Stories der Woche"** nach den Stats-Cards
- Horizontales Karussell mit veröffentlichten Stories (Mini-Vorschau der ersten Slide)
- Klick öffnet den bestehenden `StoryPreviewModal` mit allen Slides
- Daten werden via `supabase.from('story_posts').select().eq('status', 'published').order('published_at', { ascending: false }).limit(10)` geladen

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/AdminPage.tsx` | Admin-Bereich mit PIN-Gate, Suche, Story-Verwaltung |
| `src/components/StoriesCarousel.tsx` | Horizontales Stories-Karussell für die Startseite |
| `supabase/functions/verify-admin-pin/index.ts` | PIN-Verifizierung via Secret |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/App.tsx` | Route `/admin` hinzufügen |
| `src/pages/WeeklyDigest.tsx` | StoriesCarousel-Komponente einbinden |
| `supabase/config.toml` | `verify-admin-pin` Function registrieren |

