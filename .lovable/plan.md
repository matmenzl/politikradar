


# PolitikRadar Weekly – Implementierungsplan

## Überblick
Ein visuell hochwertiger Web-Prototyp, der eine Wochenübersicht parlamentarischer Aktivitäten darstellt. Minimalistisches Design, Mobile First, mit **Live-Daten von OpenParlData.ch API**.

---

## Seite 1: Landing Page ✅
- Hero-Bereich mit Claim
- CTA-Button zur Weekly Overview

## Seite 2: Weekly Overview ✅
- **Live-Daten** von api.openparldata.ch (öffentliche API, kein Key)
- **Wochennavigation** (vor/zurück)
- Vier Cards:
  1. **Gesamtaktivität** – Geschäfte, Abstimmungen, Sitzungen (echte Zahlen)
  2. **Knappste Abstimmung** – Voting mit kleinstem Margin + VoteBar
  3. **Abstimmungsergebnisse** – Liste aller Votings der Woche
  4. **Parlamentarische Geschäfte** – Neueste Affairs der Woche

## Seite 3: Detail-Seite ✅
- Voting-Detailansicht mit Ergebnis, VoteBar, Metadaten
- Link zu parlament.ch

## Daten
- **Live-API**: https://api.openparldata.ch/v1 (CC BY 4.0)
- Client-seitige Datumsfilterung (API-Filter unzuverlässig)
- Endpunkte: /votings, /affairs, /meetings

## Nächste Schritte
- [ ] Direkte Wochenauswahl (Dropdown statt nur Pfeile)
- [ ] Caching mit React Query
- [ ] Dark Mode Toggle
