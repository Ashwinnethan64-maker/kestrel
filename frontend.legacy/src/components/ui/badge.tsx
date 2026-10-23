import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/40 bg-destructive/15 text-destructive",
        outline: "text-foreground border-border",
        attention:
          "border-attention/40 bg-attention/15 text-attention",
        positive:
          "border-positive/40 bg-positive/15 text-positive",
        tactical:
          "border-primary/30 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "destructive" && "bg-destructive animate-pulse",
            variant === "attention" && "bg-attention",
            variant === "positive" && "bg-positive animate-ping",
            variant === "tactical" && "bg-primary",
            !variant || variant === "default" ? "bg-primary-foreground" : ""
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
