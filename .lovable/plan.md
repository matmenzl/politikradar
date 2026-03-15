

## Kurzform-Parteinamen für Story-Slides

### Problem
Die Partei-Slide in den Instagram Stories zeigt die vollen Parteinamen (z.B. "Fraktion der Schweizerischen Volkspartei" oder "Sozialdemokratische Partei"), was zu lang für das kompakte Slide-Format ist.

### Lösung
In `src/pages/DetailPage.tsx` eine Mapping-Funktion hinzufügen, die bekannte Schweizer Partei-/Fraktionsnamen auf ihre Kurzform abbildet (SVP, SP, FDP, Grüne, GLP, Mitte, EVP, EDU, etc.), und diese beim Aufbau der `partyData` anwenden (Zeile ~223).

### Änderung

**`src/pages/DetailPage.tsx`**:
- Neues Mapping `PARTY_SHORT_NAMES` mit Einträgen wie `"Fraktion der Schweizerischen Volkspartei" → "SVP"`, `"Sozialdemokratische" → "SP"`, etc.
- Hilfsfunktion `shortenPartyName(name)` die per Substring-Match die Kurzform zurückgibt
- Anwendung auf Zeile 223: `const party = shortenPartyName(v.person_party_de || v.person_parliamentary_group_name_de || "Unbekannt")`

Das gleiche Mapping existiert teilweise bereits in `VotingPartyBreakdown.tsx` (`PARTY_COLORS`), kann als Referenz für die korrekten Kürzel dienen.

