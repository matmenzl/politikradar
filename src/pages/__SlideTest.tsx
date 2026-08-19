import SlideCard from "@/components/story/SlideCard";
import type { SlideRow } from "@/lib/mvp";

const slides = [
  { position: 0, slide_type: "hook", headline: "Entscheidung im **Grossen Rat**", body: "Der Grosse Rat des Kantons Aargau hat am 30. Juni 2026 über eine Änderung des Steuergesetzes entschieden.", visualization: {} },
  { position: 1, slide_type: "context", headline: "Umsetzung der **Steuerstrategie**", body: "Die Vorlage betrifft die Umsetzung von TAXOPTIMA. Dabei geht es um die Leitsätze 18 bis 20 der kantonalen Steuerstrategie. Der Rat behandelte den Bericht und den Entwurf zur ersten Beratung.", visualization: {} },
  { position: 2, slide_type: "decision", headline: "Antrag **angenommen**", body: "Der Grosse Rat hat dem Antrag gemäss der Botschaft zugestimmt. Damit wurde die Änderung des Steuergesetzes in der ersten Beratung angenommen.", visualization: {} },
  { position: 3, slide_type: "vote", headline: "Das **Abstimmungsergebnis**", body: "Das Parlament stimmte mit 125 Ja-Stimmen zu 10 Nein-Stimmen ab. Es gab keine Enthaltungen. Insgesamt wurden 135 Stimmen abgegeben.", visualization: { type: "vote", yes: 125, no: 10, abstention: 0, result: "Angenommen" } },
  { position: 4, slide_type: "positions", headline: "Positionen der **Fraktionen**", body: "Die vorliegenden Daten enthalten keine detaillierten Angaben dazu, welche Fraktionen oder Parteien dafür oder dagegen gestimmt haben.", visualization: {} },
  { position: 5, slide_type: "outlook", headline: "Weiteres **Vorgehen**", body: "Nach der Annahme in der ersten Beratung folgt das weitere gesetzlich vorgesehene Verfahren im Grossen Rat des Kantons Aargau.", visualization: {} },
  { position: 6, slide_type: "sources", headline: "Quellenangabe", body: "Offizielles Protokoll des Grossen Rats des Kantons Aargau (Dokument ID: 6949567).", visualization: { type: "sources", label: "Parlamentsseite", url: "https://www.ag.ch/grossrat" } },
] as unknown as SlideRow[];

const SlideTest = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 300px)", gap: 16, padding: 16 }}>
    {slides.map((s, i) => (
      <SlideCard key={i} slide={s} index={i} total={slides.length} />
    ))}
  </div>
);

export default SlideTest;
