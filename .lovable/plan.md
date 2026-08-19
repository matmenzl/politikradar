# Landing Pages für Newsletter-Links

Heute ist jedes Geschäft im Themen-Alert nur Text: es gibt keine Seite auf politikradar.org, auf die man verlinken könnte, und die ganze App liegt hinter dem Login. Die Mail bleibt dadurch eine Sackgasse.

## Ziel

Jedes Element im Newsletter wird anklickbar und führt auf eine öffentliche, ohne Login lesbare Detailseite auf politikradar.org.

## Zwei neue öffentliche Seiten

**1. Geschäft-Seite `/g/:eventId`**
- Kicker mit Parlament, Datum, Ereignistyp
- Titel, Beschreibung
- Themen-Chips und Relevanz-Wert, kurz erklärt (Politische Relevanz / Social-Potenzial)
- Fakten-Liste aus dem Fact Layer (Label, Wert, verifiziert)
- Link auf die Originalquelle (Parlaments-Website)
- Falls eine veröffentlichte Story zum Geschäft existiert: Teaser-Karte mit Link auf die Story-Seite
- CTA unten: „Themen im Profil anpassen“ → `/profil`

**2. Story-Seite `/s/:storyId`**
- Nur Stories mit Status „published“ sind sichtbar; alles andere zeigt einen freundlichen Hinweis
- Headline, Summary, danach die Slides in Lesereihenfolge (Headline + Text, im bestehenden Sprechblasen-Design)
- Quellenangabe und Link zum zugehörigen Geschäft
- Gleicher CTA aufs Profil

Beide Seiten sind mobil-first, nutzen das bestehende Designsystem und liegen ausserhalb des Login-Gates. Die Datenbank erlaubt das bereits: Geschäfte, Fakten, Quellen und Slides sind öffentlich lesbar, Stories nur im Status „published“ — es braucht keine Datenbank-Änderung.

## Newsletter wird klickbar

- Jede Karte im Themen-Alert bekommt den Titel als Link auf `https://politikradar.org/g/<id>`
- Zusätzlich ein Button „Geschäft ansehen“ pro Eintrag bzw. ein Sammel-Button am Ende
- Existiert eine veröffentlichte Story, verlinkt der Eintrag direkt auf die Story-Seite statt auf das Geschäft
- Fussbereich erhält einen Link „Einstellungen ändern“ auf `/profil`

## Technische Details

- Neue Seiten `src/pages/PublicEvent.tsx` und `src/pages/PublicStory.tsx`, in `src/App.tsx` als Routen `/g/:id` und `/s/:id` **ausserhalb** von `AuthGate` registriert (wie `/login` und `/profil`).
- Gemeinsames leichtgewichtiges Layout `src/components/PublicShell.tsx` (Logo als Link auf `/`, minimaler Footer) statt `AppShell` (das enthält Redaktions-Navigation).
- Slide-Darstellung nutzt die Styles aus `src/lib/storyTheme.ts`; keine Bearbeitungs-Controls.
- SEO pro Seite: `document.title` und Meta-Description aus Headline/Titel, Canonical auf die jeweilige URL, semantisches Markup mit einer H1.
- `send-topic-alerts` ergänzt pro Item `url` (Story-URL falls vorhanden, sonst Geschäft-URL); Basis-URL als Konstante `https://politikradar.org` in der Function, damit Links auch in E-Mails aus Cron-Läufen stimmen. Die Funktion lädt dafür zusätzlich veröffentlichte Stories zu den getroffenen Geschäften.
- `topic-alert.tsx` erhält `Link`/`Button` aus React Email; Fallback: ohne `url` bleibt der Titel reiner Text.
- Nach den Änderungen werden `send-topic-alerts` und `preview-transactional-email` neu deployt und ein Testversand an die bekannte Adresse ausgelöst.
