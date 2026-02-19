const VoteBar = ({ ja, nein, enthaltungen }: { ja: number; nein: number; enthaltungen: number }) => {
  const total = ja + nein + enthaltungen;
  const jaPercent = (ja / total) * 100;
  const neinPercent = (nein / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-4 bg-secondary">
        <div className="bg-success transition-all duration-700" style={{ width: `${jaPercent}%` }} />
        <div className="bg-destructive transition-all duration-700" style={{ width: `${neinPercent}%` }} />
      </div>
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-muted-foreground">Ja</span>
          <span className="font-semibold text-foreground">{ja}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Nein</span>
          <span className="font-semibold text-foreground">{nein}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
          <span className="text-muted-foreground">Enth.</span>
          <span className="font-semibold text-foreground">{enthaltungen}</span>
        </span>
      </div>
    </div>
  );
};

export default VoteBar;
