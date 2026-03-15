

# KI-Vorschläge von 5 auf 10 erhöhen

## Änderung

Eine einzige Stelle muss angepasst werden:

**`supabase/functions/suggest-stories/index.ts`** (Zeile 64):
- System-Prompt ändern von "Wähle die Top 5 aus" → "Wähle die Top 10 aus"

Das reicht, da das Frontend die Vorschläge dynamisch rendert und keine Hardcoded-Limite hat.

