import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] border",
  {
    variants: {
      variant: {
        default: "border-border bg-transparent text-foreground/80",
        secondary: "border-border bg-secondary text-foreground/80",
        outline: "border-border text-foreground/70",
        accent: "border-accent/40 bg-accent/10 text-accent",
        positive: "border-positive/40 bg-positive/10 text-positive",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
        warning: "border-warning/40 bg-warning/10 text-warning",
        live: "border-positive/40 bg-positive/10 text-positive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
