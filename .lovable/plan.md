

# Parlament-Auswahl: UX bereinigen

## Problem
1. **Kein klarer Hinweis** auf das vorausgewählte Parlament (Schweizerische Eidgenossenschaft) beim Direktzugriff auf `/weekly`
2. **Redundanz** zwischen Landing Page (Parlament-Karten) und Weekly Overview (Dropdown) -- zwei verschiedene UI-Patterns fuer dieselbe Aktion
3. **Body-Key statt Name** wird kurz angezeigt, bevor die Bodies geladen sind

## Loesung

### 1. Seitentitel deklariert das aktive Parlament
- Unter der Wochennavigation (KW-Header) wird der **vollstaendige Parlamentsname** prominent als Untertitel angezeigt
- Statt nur "CHE" im kleinen Dropdown steht z.B. **"Schweizerische Eidgenossenschaft"** klar sichtbar als Kontext
- Das Label "Parlament" mit dem Dropdown bleibt, wird aber als **Wechsel-Option** positioniert, nicht als primaerer Kontext

### 2. Dropdown besser beschriftet
- SelectTrigger zeigt den **vollen Namen** des aktuell gewaehlten Parlaments (tut es bereits, wenn Bodies geladen)
- Waehrend die Bodies noch laden: Platzhalter "Parlament wird geladen..." statt den rohen Key "CHE"
- Ueber dem Dropdown ein klarerer Label-Text: **"Parlament wechseln"** statt nur "Parlament"

### 3. Default deutlich machen
- Wenn kein `?body=` Parameter vorhanden ist (Direktzugriff), wird ein dezenter Hinweis angezeigt:
  *"Standardmaessig: Nationales Parlament. Waehle ein anderes Parlament im Dropdown."*
- Dieser Hinweis verschwindet, sobald der User aktiv ein Parlament gewaehlt hat

### 4. URL-Sync
- Wenn der User im Dropdown ein Parlament wechselt, wird der `?body=`-Parameter in der URL aktualisiert (mit `useSearchParams`), damit die Auswahl teilbar und bookmarkbar ist

## Technische Aenderungen

### `src/pages/WeeklyOverview.tsx`
- `useSearchParams` statt nur `useState` fuer `bodyKey`, damit URL und State synchron bleiben
- Label-Text von "Parlament" zu "Parlament wechseln" aendern
- Prominenten Parlamentsnamen im Seitenkopf anzeigen (neben/unter dem Datums-Header)
- Hinweistext bei Default-Auswahl (kein URL-Parameter) hinzufuegen
- Ladezustand abfangen: Solange Bodies nicht geladen, "Lade Parlament..." anzeigen statt den Key

### Keine Aenderungen an der Landing Page
Die Landing Page bleibt wie sie ist -- sie dient als Einstiegspunkt und leitet korrekt mit `?body=X` weiter.
