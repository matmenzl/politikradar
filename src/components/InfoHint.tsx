import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InfoHintProps {
  /** Accessible label for the trigger. */
  label: string;
  children: ReactNode;
  /** Optional custom trigger content (defaults to an info icon). */
  trigger?: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Touch-first hint: opens on tap/click (never on hover), closes on
 * outside tap, scroll, Escape or a second tap on the trigger.
 */
const InfoHint = ({
  label,
  children,
  trigger,
  className,
  contentClassName,
  side = "top",
}: InfoHintProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when the page scrolls away under the finger.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={label}
          aria-expanded={open}
          onPointerDown={(event) => {
            // Handle the tap immediately so touch devices need no second tap.
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.preventDefault();
            setOpen((v) => !v);
          }}
          onClick={(event) => event.preventDefault()}
          className={cn(
            "inline-flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] -m-2.5 p-2.5 touch-manipulation",
            "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "text-foreground",
            className,
          )}
        >
          {trigger ?? <Info className="w-4 h-4" aria-hidden="true" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        collisionPadding={12}
        // Keep focus on the trigger so mobile keyboards/scroll jumps stay away.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className={cn("w-[min(20rem,calc(100vw-2rem))] text-sm", contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default InfoHint;
