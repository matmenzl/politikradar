

# Stories der Woche als zentrales Element

## Analyse

Aktuell ist die Landing Page (`WeeklyDigest`) datengetrieben aufgebaut: Statistik-Cards oben, Stories als eine von vielen Sektionen dazwischen. Die Stories erscheinen erst nach den Zahlen — obwohl sie das eigentliche Kernprodukt sind.

## Konzept

Die Stories werden zum Hero-Element der Startseite. Statt einer kleinen horizontalen Scroll-Leiste bekommen sie eine prominente, visuell dominante Darstellung direkt nach dem Titel.

## Geplante Änderungen

### 1. Neues Layout der Landing Page (`WeeklyDigest.tsx`)

Neue Reihenfolge der Sektionen:

1. **Header** (bleibt)
2. **Kompakter Wochen-Header** — Titel, KW-Navigation, Datumsbereich (Hero-Text wird gekürzt, der grosse Marketingblock oben wird entfernt oder stark reduziert)
3. **Stories der Woche** (NEU: prominent, gross, zentrales Element)
4. KI-Zusammenfassung
5. Statistik-Cards (kompakt, eine Zeile)
6. Knappste Abstimmungen
7. Themen-Radar
8. Aktive Parlamente
9. Parliament Browser

### 2. Neues `StoriesCarousel`-Design

- Grössere Story-Karten (statt 160px/200px → 220px/280px)
- Kein Card-Wrapper mehr — die Stories stehen frei und visuell dominant
- Überschrift wird prominenter: "Stories der Woche" als grosse Serif-Headline
- Kurzer Einleitungstext: "Politische Entscheide, einfach erklärt"
- Bei 0 Stories: Hinweis statt komplett ausblenden

### 3. Hero-Bereich vereinfachen

- Den grossen Hero-Text ("Was diese Woche in Schweizer Parlamenten...") entfernen oder auf einen Einzeiler reduzieren
- Die drei Bullet-Punkte (Datenbasiert, Wöchentlich, Neutral) entfernen
- Der Wochen-Header wird zum primären Einstieg

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/WeeklyDigest.tsx` | Hero entfernen, Sektions-Reihenfolge ändern, Stories nach oben |
| `src/components/StoriesCarousel.tsx` | Grösseres, prominenteres Design ohne Card-Wrapper |

## Nicht betroffen

- Story-Generierung, Admin-Seite, StorySlideCard, StoryPreviewModal — bleiben unverändert
- Datenbank/Backend — keine Änderungen nötig

