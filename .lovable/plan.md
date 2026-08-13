# Styleguide-Delta: App + Social-Media-Templates

Der Styleguide (Sprechblasen-System) ist typografisch bereits umgesetzt: Newsreader 400 mit 600-Betonung, Hanken Grotesk als Body, Kicker 700/0.14em, Markenfarben als HSL-Tokens (`ink`, `paper`, `brand-red/blue/yellow/green/purple` + Soft-Varianten), Radius 0, keine Schatten.

Was fehlt, ist die **Formensprache**: Im gesamten App-Code gibt es aktuell keine einzige `clip-path`-Sprechblase ausserhalb der Story-Komponenten. Ausserdem weichen einige Story-/Karussell-Details vom Guide ab.

## Bereich 1 — Gemeinsame Grundlage

- Neue Utility-Klassen in `src/index.css` für die vier Sprechblasen-Formen aus dem Guide: `.bubble` (Blase mit Schwanz), `.bubble-chip` (Button/Chip mit Mini-Schwanz), `.bubble-plain` (leicht schiefes Rechteck), `.bubble-frame` (Rahmen-Variante) — jeweils als `clip-path`-Polygon.
- Token-Ergänzungen: `--brand-yellow-soft` (#F8D9D3-Familie vervollständigen), `--brand-pink` (#F2B8C6), `--brand-green-bright` (#63B348), `--brand-red-deep` (#B8331F) für Label-Kontraste, plus Registrierung in `tailwind.config.ts`.
- Neue Button-Variante `bubble` (Ink-Grund, Papier-Text, `bubble-chip`-Form, 700) für primäre Aktionen wie „Teilen ↗".

## Bereich 2 — App-Screens (Delta zum Guide)

| Element | Ist | Soll laut Guide |
|---|---|---|
| Header/Nav | einfache Border | 2px Ink-Unterkante, Wortmarke Newsreader 600 mit rotem Punkt, Parlaments-Picker als 1.5px-Ink-Box, „Teilen" als Ink-Sprechblasen-Chip |
| Wochen-Hero | Standard-Text | Pfeil-Quadrate 34px mit Ink-Border, Kicker „Kalenderwoche 33 · 2026" in Brand-Blau, Datum Newsreader 400/64px mit 600-Jahr, Quellenzeile in Muted |
| Kennzahlen-Kacheln | flache Boxen | Soft-Farbflächen (rot/blau/grün) mit `bubble-plain`-Form, Zahl Newsreader 600, Label 600 in Brand-Farbe |
| Cards | 1.5px Ink | bleibt, zusätzlich farbiger Kicker je Modul (rot = knappste Abstimmung, blau = Abstimmungen, violett = Geschäfte) |
| Listenzeilen | gemischt | 1px Trennlinie `#E3E0D6`, Titel 16px, Meta 13px Muted, Ergebnis-Pill rechts (grün-soft / rot-soft, 22px Radius, 700) |
| Ergebnis-Balken | Standard-Bar | dreiteiliger Balken 22px (grün / rot / violett) + Legende mit Farbquadraten |
| Parteiverhalten | helle Card | Vollton-Grün-Card mit `bubble`-Form, gelber Kicker, Balken Hellgrün/Rot auf transparentem Track, Fraktionsname 700 |
| Themen-Tags | Badge default | Aktiv = Ink-Pill, sonst violett-soft Pill, 600, 22px Radius |

Betroffene Dateien: `WeeklyOverview.tsx`, `WeeklyDigest.tsx`, `WeekContextBar.tsx`, `ParliamentPicker.tsx`, `ParliamentBrowser.tsx`, `VoteBar.tsx`, `VotingPartyBreakdown.tsx`, `PartyOverviewCard.tsx`, `AffairSearch.tsx`, Listenseiten (`ListAffairs/ListVotings/ListMeetings/ListBodies`), `DetailPage.tsx`, `PersonProfile.tsx`, Admin-Panels (`AdminSection`, `AiAnalysisSection`, `EditorialSection`), `SiteGate.tsx`.

Mobile: gleiche Sprache mit den kleineren Werten aus dem Guide (Datum 34px zentriert, Kacheln nebeneinander, Kicker 11–12px/0.12em).

## Bereich 3 — Social-Media-Templates (Delta)

`StorySlideCard.tsx` (9:16):
- `rounded-2xl` entfernen — der Guide hat scharfe Kanten.
- Headline-Betonung: `**text**` als Semibold-Span rendern; beim Hook zusätzlich in Akzentfarbe (Gelb).
- Insight-Slide: Zitat in Newsreader **italic**, danach 100×8px Trennstrich in Rosa, dann Fliesstext — statt der generischen Headline/Trenner/Body-Struktur.
- Result-Slide: Status-Sprechblase („Angenommen"/„Abgelehnt", Newsreader 600, grün/rot) plus drei horizontale Balken mit Label/Zahl-Zeile (Ja/Nein/Enthaltungen) statt reinem Fliesstext.
- Hook-Bild-Bubble beibehalten; Bildhöhe/Position an Guide-Proportionen angleichen.

`CarouselSlideCard.tsx` (4:5 / 1:1):
- `rounded-2xl` entfernen.
- Cover 1:1-Variante mit Untertitelzeile ergänzen, Deko-Bubble-Positionen an den Guide angleichen.
- Result-Slide: Balkenwerte als „Ja / Nein / Enthaltungen" mit 34px-Zeilen wie im Guide.
- CTA-Slide: violetter Grund, Rahmen-Bubble, CTA-Chip 800 in Hellgrün.

## Bereich 4 — Logo

Der Guide zeigt vier Logo-Varianten (4a–4d). Aktuell ist 4a im Einsatz. Kein Delta, sofern 4a die gewählte Variante bleibt — sonst separat austauschen.

## Technische Hinweise

- Alle Farben laufen über Tailwind-Tokens; in den Social-Templates bleiben Hex-Werte, weil diese Karten exportiert/serverseitig gerendert werden und nicht am Theme hängen dürfen.
- Sprechblasen-Formen werden als CSS-Utilities zentral definiert, damit Story- und App-Seite dieselben Polygone nutzen.
- Keine Änderungen an Datenlogik, Edge Functions oder Datenbank.
