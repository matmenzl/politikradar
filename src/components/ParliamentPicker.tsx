import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { groupBodiesByLevel, getBodyLabel, LEVEL_LABELS, type Body } from "@/lib/api/openparldata";

interface ParliamentPickerProps {
  bodies: Body[];
  value: string;
  onValueChange: (key: string) => void;
  loading?: boolean;
}

const LEVEL_ORDER = ["national", "cantonal", "communal", "other"];

export default function ParliamentPicker({ bodies, value, onValueChange, loading }: ParliamentPickerProps) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const g = groupBodiesByLevel(bodies);
    return LEVEL_ORDER
      .filter((level) => g[level]?.length)
      .map((level) => ({
        level,
        label: LEVEL_LABELS[level] || level,
        bodies: g[level].sort((a, b) => getBodyLabel(a).localeCompare(getBodyLabel(b))),
      }));
  }, [bodies]);

  const selectedBody = useMemo(() => bodies.find((b) => b.key === value), [bodies, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-auto min-w-[220px] h-9 justify-between text-sm font-normal"
          disabled={loading}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            {loading
              ? "Lade…"
              : selectedBody
                ? getBodyLabel(selectedBody)
                : "Parlament wählen…"}
          </div>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command filter={(value, search) => {
          const body = bodies.find((b) => b.key === value);
          if (!body) return 0;
          const label = getBodyLabel(body).toLowerCase();
          const canton = (body.canton_key || "").toLowerCase();
          const s = search.toLowerCase();
          if (label.includes(s) || canton.includes(s) || value.toLowerCase().includes(s)) return 1;
          return 0;
        }}>
          <CommandInput placeholder="Parlament suchen…" />
          <CommandList>
            <CommandEmpty>Kein Parlament gefunden.</CommandEmpty>
            {grouped.map(({ level, label, bodies: levelBodies }) => (
              <CommandGroup key={level} heading={label}>
                {levelBodies.map((body) => (
                  <CommandItem
                    key={body.key}
                    value={body.key}
                    onSelect={() => {
                      onValueChange(body.key);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-3.5 w-3.5", value === body.key ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{getBodyLabel(body)}</span>
                    {body.canton_key && (
                      <span className="text-xs text-muted-foreground ml-2">{body.canton_key}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
