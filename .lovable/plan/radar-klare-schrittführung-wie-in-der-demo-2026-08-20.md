# Radar: klare Schrittführung wie in der Demo

Im Radar stehen „Ereignisse bewerten“ und „Nur Daten laden“ unkommentiert nebeneinander. Unklar bleibt, welcher Schritt die Themen erzeugt und wann der Themenfilter greift. Die Demo-Seite löst das bereits gut mit nummerierten Schritten — dieselbe Logik kommt in den Radar.

## Was tatsächlich passiert

- **Schritt 1 – Daten laden:** holt Geschäfte und Abstimmungen aus OpenParlData und vergibt sofort Themen per Stichwortlogik. Der Themenfilter funktioniert direkt danach.
- **Schritt 2 – Bewerten:** ergänzt die KI-Scores (Relevanz, Social-Potenzial, Confidence) und verfeinert die Themen; sie werden nicht neu erfunden.

## Umbau der Kopfleiste im Radar

Die bisherige Button-Reihe wird zu einer Schrittleiste im Demo-Stil:

```text
[1] Daten laden            [2] Bewerten             [3] Filtern & auswählen
    Zeitraum + Import          KI-Scores                Thema, Ebene, Relevanz
    Themen entstehen hier      Themen verfeinert        Liste unten
```

- Schritt-Karten mit Nummer, Titel, einem Satz Erklärung und der jeweiligen Aktion.
- Schritt 1: Von/Bis-Felder plus Button „Daten laden“.
- Schritt 2: Button „Bewerten“ — sichtbar inaktiv (abgeblendet), solange im Zeitraum keine Ereignisse vorliegen.
- Schritt 3: keine Aktion, verweist auf die Filterleiste; zeigt an, wie viele Ereignisse bewertet bzw. noch unbewertet sind.
- Der bisherige Kombi-Button bleibt als „Beides ausführen“ erhalten, damit der Ein-Klick-Ablauf nicht verloren geht; während des Laufs markiert die Schrittleiste den aktiven Schritt (wie in der Demo).
- Erledigte Schritte werden nach dem Durchlauf als erledigt markiert.

## Weitere Klarstellungen

- Hinweiszeile beim Themenfilter: „Themen entstehen beim Laden, die KI-Bewertung verfeinert sie.“
- Abschluss-Toast trennt die Schritte: „X Ereignisse geladen (inkl. Themen), Y bewertet, Z ausgeschlossen.“
- Info-Hint erklärt beide Schritte statt nur die Bewertung.

## Technisch

Nur `src/pages/Radar.tsx` (Präsentation): Schrittleiste analog zum Muster in `src/pages/Demo.tsx`, Labels, Hinweistexte, Toast-Texte, abgeleitete Zähler aus den bereits geladenen Events. Keine Änderungen an Edge Functions, Datenmodell oder Filterlogik.
