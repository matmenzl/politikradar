

# Erklärtext für die KI-Zusammenfassung anzeigen

## Ziel

Unter dem "Zusammenfassung generieren"-Button einen kurzen Erklärtext einfügen, der dem Nutzer beschreibt, was die Funktion tut, bevor er sie nutzt.

## Umsetzung

**Datei:** `src/pages/DetailPage.tsx`

Im AI-Summary-Bereich (Zeilen 204–236) wird unterhalb des Buttons ein erklärender Absatz ergänzt:

- Kurzer Text in `text-xs text-muted-foreground`, z.B.:
  *"Diese Funktion erstellt mithilfe von Künstlicher Intelligenz eine kurze, allgemeinverständliche Zusammenfassung des parlamentarischen Geschäfts. Die Zusammenfassung basiert auf den verfügbaren Daten wie Titel, Geschäftstyp, Status und Abstimmungsergebnissen."*
- Der Text erscheint nur im Initialzustand (vor dem Klick), also innerhalb des `!summary && !summaryLoading`-Blocks, direkt unter dem Button.

### Ergebnis

```text
┌──────────────────────────────────────────┐
│  [✨ Zusammenfassung generieren]         │
│                                          │
│  Diese Funktion erstellt mithilfe von    │
│  Künstlicher Intelligenz eine kurze,     │
│  allgemeinverständliche Zusammenfassung  │
│  des parlamentarischen Geschäfts. ...    │
└──────────────────────────────────────────┘
```

Keine weiteren Dateien betroffen.

