# Themen-Profil, Accounts und täglicher Themen-Alert

## Zur Frage: Gibt es Schlagwörter von OpenParlData?

Nein. Ein Abruf der Geschäfte (`/affairs`) zeigt: die API liefert pro Geschäft nur `title_*`, `title_long_*`, Geschäftstyp (`type_harmonized_de`, z.B. Motion), Status (`state_name_de`, z.B. Eingereicht), Datum, Parlament und Links. Es gibt kein Themen-, Sachgebiets-, Keyword- oder Tag-Feld. Ein exaktes Matching allein aus der Quelle ist damit nicht möglich.

Lösung: Themen werden bei uns beim Import erzeugt — die KI ordnet jedem Ereignis 1–3 Themen aus einer festen Liste zu und extrahiert zusätzlich 3–8 Stichwörter aus dem Titel. Damit ist das Matching stabil (feste Liste) und trotzdem fein (Stichwörter).

## Themenliste (fix, erweiterbar)

Verkehr & Mobilität · Gesundheit & Krankenkasse · Bildung & Schule · Migration & Asyl · Umwelt & Klima · Energie · Finanzen & Steuern · Wohnen & Raumplanung · Wirtschaft & Arbeit · Soziales & AHV · Sicherheit & Polizei · Landwirtschaft · Digitalisierung & Daten · Aussenpolitik & EU · Kultur & Sport · Gleichstellung · Justiz & Recht

## Was gebaut wird

**1. Accounts (nur für Profil und Newsletter)**
Radar, Story Studio und Redaktion bleiben hinter dem bestehenden PIN. Neu:
- `/login` mit E-Mail + Passwort und Google-Login, `/reset-password` für Passwort-Reset — beide öffentlich erreichbar.
- `/profil` nur mit Account.

**2. Profil mit Interessen**
Im Profil hinterlegt man:
- Parlamente (Mehrfachauswahl aus der bestehenden Parlamentsliste, inkl. „Alle“)
- Themen aus der festen Liste (Mehrfachauswahl)
- Optional eigene Stichwörter (Freitext, z.B. „Velo“, „F-35“)
- Mindest-Relevanz-Score (Standard 60)
- Abo-Schalter ein/aus, jederzeit abbestellbar

**3. Themen im Radar**
Themen-Filter und eine Stichwortsuche über Titel/Beschreibung in der Radar-Ansicht; die Themen-Chips erscheinen auf jeder Ereigniskarte.

**4. Automatischer Import per Cron**
Ein geplanter Job (täglich früh morgens) holt neue Geschäfte und Abstimmungen aus OpenParlData für alle relevanten Parlamente, bewertet sie mit dem bestehenden Scoring und klassifiziert dabei Themen und Stichwörter — unabhängig davon, ob jemand die App öffnet.

**5. Täglicher Digest**
Ein zweiter Cron-Job (z.B. 07:00) sammelt pro Abonnent alle seit dem letzten Versand neu bewerteten Ereignisse, die zum Profil passen (Parlament UND (Thema ODER Stichwort) UND Score ≥ Schwelle), und verschickt eine E-Mail mit den Treffern (Titel, Parlament, Datum, Score, Link zur Quelle). Keine Treffer = keine Mail. Jede Mail enthält einen Abmelde-Link.

## Technische Details

- **Datenbank**
  - `events`: neue Spalten `topics text[]`, `keywords text[]` (GIN-Index für schnelles Matching)
  - `profiles` (an Account gekoppelt): `display_name`, `email`
  - `user_preferences`: `user_id`, `parliaments text[]`, `topics text[]`, `keywords text[]`, `min_relevance int`, `digest_enabled bool`, `last_digest_at timestamptz`
  - `digest_log`: verschickte Digests + enthaltene Event-IDs, verhindert Doppelversand
  - RLS: jeder liest/schreibt nur eigene Zeilen; Edge Functions nutzen den Service-Zugang. GRANTs pro Tabelle in derselben Migration.
- **Edge Functions**
  - `score-events` wird erweitert: das KI-Schema liefert zusätzlich `topics` (aus fixer Liste) und `keywords`; beides wird gespeichert.
  - Neu `cron-import-events`: ruft `detect-events` + `score-events` für den Vortag über alle indexierten Parlamente.
  - Neu `send-topic-digest`: baut je Abonnent die Trefferliste und verschickt die Mail über das eingebaute Transaktionsmail-System von Lovable Cloud (kein externer Dienst).
  - Beide per pg_cron/pg_net geplant.
- **Frontend**
  - Neu: `src/pages/Login.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Profil.tsx`, `src/components/TopicPicker.tsx`, `src/hooks/use-auth.ts`
  - Angepasst: `src/App.tsx` (öffentliche Routen ausserhalb PinGate), `src/pages/Radar.tsx` (Themenfilter + Suche), `src/components/AppShell.tsx` (Profil-/Login-Link), `src/lib/mvp.ts` (Themenliste)
- **E-Mail-Versand** benötigt eine verifizierte Absender-Domain in Lovable Cloud; bis dahin ist der Digest technisch fertig, aber nicht zustellbar.

## Reihenfolge

1. Migration (Themenspalten, Profile, Präferenzen, Digest-Log, RLS)
2. Scoring um Themen/Stichwörter erweitern + Backfill bestehender Ereignisse
3. Auth-Routen und Profilseite
4. Themenfilter und Suche im Radar
5. Cron-Import
6. Digest-Function inkl. Absender-Domain-Setup und Abmelde-Link
