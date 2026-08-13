const VoteBar = ({ ja, nein, enthaltungen, compact = false }: { ja: number; nein: number; enthaltungen: number; compact?: boolean }) => {
  const total = ja + nein + enthaltungen || 1;
  const jaPercent = (ja / total) * 100;
  const neinPercent = (nein / total) * 100;
  const enthPercent = (enthaltungen / total) * 100;

  if (compact) {
    return (
      <div className="flex overflow-hidden h-1.5 w-16 bg-secondary">
        <div className="bg-brand-green" style={{ width: `${jaPercent}%` }} />
        <div className="bg-brand-red" style={{ width: `${neinPercent}%` }} />
      </div>
    );
  }

  const legend = [
    { label: "Ja", value: ja, color: "bg-brand-green" },
    { label: "Nein", value: nein, color: "bg-brand-red" },
    { label: "Enth.", value: enthaltungen, color: "bg-hairline" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex overflow-hidden h-4 border border-ink/15 bg-secondary">
        <div className="bg-brand-green transition-all duration-700" style={{ width: `${jaPercent}%` }} />
        <div className="bg-brand-red transition-all duration-700" style={{ width: `${neinPercent}%` }} />
        <div className="bg-hairline transition-all duration-700" style={{ width: `${enthPercent}%` }} />
      </div>
      <div className="flex justify-between text-sm">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 ${l.color}`} />
            <span className="text-muted-foreground text-xs font-medium">{l.label}</span>
            <span className="font-serif font-semibold text-foreground tabular-nums">{l.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default VoteBar;
