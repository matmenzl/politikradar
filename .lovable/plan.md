# Klarheit: „Daten laden“ vs. „Bewerten“ beim Themenfilter

Heute stehen im Radar zwei Aktionen nebeneinander („Ereignisse bewerten“, „Nur Daten laden“), ohne dass erkennbar ist, was davon die Themen setzt. Das führt zu der Annahme, der Themenfilter greife erst nach der KI-Bewertung.

## Was tatsächlich passiert

- **Daten laden** holt Geschäfte und Abstimmungen aus OpenParlData und vergibt sofort Themen per Stichwortlogik. Der Themenfilter funktioniert also direkt nach dem Laden.
- **Bewerten** ergänzt die KI-Scores (Relevanz, Social-Potenzial, Confidence) und präzisiert die Themen, ersetzt sie aber nicht.

## Änderungen im UI (nur `src/pages/Radar.tsx`)

1. Beide Buttons klarer benennen und trennen:
   - Primär: „Laden & bewerten“
   - Sekundär: „Nur laden (ohne KI)“
2. Der Info-Hint neben den Buttons erklärt beide Schritte in zwei kurzen Zeilen:
   - Laden = Ereignisse + Themen (Stichwortlogik), sofort filterbar
   - Bewerten = KI-Scores + Themen-Feinschliff
3. Kleiner Hinweistext direkt beim Themenfilter: „Themen entstehen beim Laden, die KI-Bewertung verfeinert sie.“
4. Abschluss-Toast unterscheidet die Schritte klar: „X Ereignisse geladen (mit Themen), Y bewertet.“

## Technisch

Rein Frontend/Text: Labels, Info-Hint-Inhalt, Filter-Hinweis und Toast-Texte in `src/pages/Radar.tsx`. Keine Änderungen an Edge Functions, Datenmodell oder Filterlogik.
