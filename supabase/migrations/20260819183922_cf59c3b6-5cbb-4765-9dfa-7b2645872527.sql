WITH pat(topic, re) AS (VALUES
 ('verkehr','verkehr|mobilit|strasse|straße|autobahn|bahn|zug |öv |velo|fahrrad|fussgäng|flughafen|luftfahrt|tram|bus |parkplatz'),
 ('gesundheit','gesundheit|spital|spitäl|krankenkasse|krankenversicherung|pflege|arzt|ärzt|medizin|patient|prämien|epidemi|pandemi|sucht|psychi'),
 ('bildung','bildung|schule|schul|gymnasi|universit|hochschul|lehrer|lehrperson|berufsbildung|lehrstell|kita|kinderbetreuung|forschung'),
 ('umwelt','umwelt|klima|co2|biodivers|natur|gewässer|luftreinhalt|lärm|abfall|recycling|wald|artenschutz|nachhaltig'),
 ('energie','energie|strom|elektrizit|solar|photovolta|windkraft|wasserkraft|kernkraft|atomkraft|gas|stromnetz|heizung'),
 ('wirtschaft','wirtschaft|arbeit|arbeitsmarkt|gewerbe|kmu|unternehmen|tourismus|handel|lohn|standortförder|innovation|arbeitslos'),
 ('finanzen','finanz|budget|steuer|mwst|mehrwertsteuer|abgabe|gebühr|staatsrechnung|jahresrechnung|kredit|subvention|schulden|voranschlag|nachtragskredit|beitrag'),
 ('migration','migration|asyl|flüchtling|ausländer|einbürger|integration|aufenthaltsbewilligung'),
 ('sicherheit','sicherheit|polizei|feuerwehr|zivilschutz|bevölkerungsschutz|armee|militär|waffen|kriminalit|gewaltschutz|notruf'),
 ('justiz','justiz|recht|gericht|staatsanwalt|strafrecht|zivilrecht|verfassung|strafvollzug|haft'),
 ('soziales','sozial|sozialhilfe|ahv|invaliden|ergänzungsleistung|altersvorsorge|pensionskasse|rente|familienzulage|armut|kinderzulage|behinder'),
 ('wohnen','wohn|miete|mietzins|raumplanung|zonenplan|nutzungsplan|bauordnung|baugesuch|siedlung|quartier|bodenrecht|leerstand'),
 ('landwirtschaft','landwirtschaft|bauern|bäuerin|agrar|direktzahlung|nutztier|tierschutz|ernte|hof '),
 ('digitalisierung','digital|informatik|software|e-government|cyber|künstliche intelligenz|datenschutz|datenbank|breitband|glasfaser|plattform'),
 ('kultur','kultur|sport|museum|theater|bibliothek|festival|denkmal|musik|film|sportanlage|verein'),
 ('aussenpolitik','aussenpolitik|außenpolitik|europa|eu-|bilateral|uno |international|entwicklungszusammenarbeit|sanktion|neutralit'),
 ('institutionen','verwaltung|organisation|reglement|geschäftsordnung|wahl|parlament|regierungsrat|gemeinderat|behörde|amtsdauer|kommission|petition|motion|interpellation|postulat')
), matched AS (
  SELECT e.id, (array_agg(p.topic ORDER BY p.topic))[1:3] AS topics
  FROM public.events e
  JOIN pat p ON (coalesce(e.title,'') || ' ' || coalesce(e.description,'')) ~* p.re
  WHERE cardinality(e.topics) = 0
  GROUP BY e.id
)
UPDATE public.events e SET topics = m.topics FROM matched m WHERE e.id = m.id;