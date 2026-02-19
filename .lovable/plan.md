

## Problem: Nationale Parlament-Auswahl funktioniert nicht korrekt

### Analyse der API

Durch direkte API-Tests habe ich folgende Probleme identifiziert:

1. **CHE (Schweiz) fehlt in der Bodies-Liste**: Der Endpunkt `/bodies` (paginiert) liefert das nationale Parlament "Schweiz" (body_key: `CHE`, id: 42) **nicht** zurueck. Es existiert aber unter `/bodies/42`. Das bedeutet, `fetchBodies()` laedt die Schweiz nie in die Bodies-Liste, und der Parlament-Picker kann sie nicht anzeigen.

2. **cmdk Lowercase-Problem**: Die `cmdk`-Bibliothek wandelt `value` intern in Kleinbuchstaben um. Wenn ein Kanton wie `ZH` ausgewaehlt wird, erhaelt `onSelect` den Wert `zh`. Der bisherige Fix mit `body.key?.toLowerCase() === value?.toLowerCase()` im Filter hilft, aber die Auswahl selbst (der angezeigte Wert und der gespeicherte State) wird trotzdem korrekt ueber `body.key` direkt gesetzt.

3. **Fehlende CHE-Fallback**: Da CHE nie in der Bodies-Liste auftaucht, zeigt der Picker "Parlament waehlen..." statt "Schweiz" an, auch wenn `bodyKey === "CHE"` korrekt gesetzt ist.

### Loesung

#### 1. CHE manuell in die Bodies-Liste einfuegen (`src/lib/api/openparldata.ts`)

Nach dem Laden aller Bodies pruefen, ob CHE vorhanden ist. Falls nicht, wird das nationale Parlament manuell hinzugefuegt:

```typescript
const CHE_BODY: Body = {
  id: 42,
  key: "CHE",
  name_de: "Schweiz",
  name_fr: "Suisse",
  name_it: "Svizzera",
  name_en: "Switzerland",
  type: "country",
};
```

In `fetchBodies()` nach dem Laden pruefen:
```typescript
if (!allBodies.find(b => b.key === "CHE")) {
  allBodies.unshift(CHE_BODY);
}
```

#### 2. Body-Interface um fehlende Felder erweitern (`src/lib/api/openparldata.ts`)

Das `Body`-Interface hat kein `key`-Feld -- die API liefert es als `body_key`. Pruefen ob das Mapping korrekt laeuft, ggf. `body_key` auf `key` mappen im Fetch.

#### 3. Nur indexierte Parlamente laden (Performance)

Die API liefert 1405 Bodies, aber viele davon haben keine Daten (`indexed: false`). Nur `indexed: true` Bodies haben tatsaechlich parlamentarische Daten. Dies wuerde die Liste von ~1400 auf ~50 reduzieren und die Performance massiv verbessern.

```typescript
// Nur Bodies mit Daten laden
const res = await fetchApi<Body>("/bodies", { 
  limit: String(limit), 
  offset: String(offset),
  indexed: "true"  // Falls die API das unterstuetzt
});
```

Falls die API keinen `indexed`-Filter unterstuetzt, clientseitig filtern.

### Technische Schritte

1. **`src/lib/api/openparldata.ts`**: 
   - API-Antwort-Felder korrekt auf `Body`-Interface mappen (insbesondere `body_key` zu `key`)
   - CHE als Fallback hinzufuegen falls nicht in der Liste
   - Optional: Nur indexierte Bodies laden/filtern fuer bessere Performance

2. **`src/components/ParliamentPicker.tsx`**: 
   - Keine Aenderungen noetig, sofern die Bodies-Liste korrekt befuellt wird

3. **Kein Breaking Change**: Die Abstimmungs-/Geschaefts-API-Aufrufe verwenden `body_key` korrekt und funktionieren bereits mit jedem gültigen Key.

