import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 font-sans text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-background",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-brand-red-soft text-brand-red",
        success: "border-transparent bg-brand-green-soft text-brand-green",
        info: "border-transparent bg-brand-blue-soft text-brand-blue",
        topic: "border-transparent bg-brand-purple-soft text-brand-purple",
        outline: "border-[1.5px] border-ink text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);


export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
