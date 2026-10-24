import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface StateViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: "empty" | "error" | "loading";
}

export function StateView({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "empty",
}: StateViewProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center animate-fade-in",
        variant === "error" && "border-destructive/30 bg-destructive/5",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground border border-border/80 mb-3">
        {icon ? (
          icon
        ) : variant === "error" ? (
          <AlertCircle className="h-6 w-6 text-destructive" />
        ) : variant === "loading" ? (
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-mono text-sm font-semibold tracking-wide text-foreground uppercase mb-1">
        {title}
      </h3>
      {description && (
        <p className="max-w-md text-xs text-muted-foreground mb-4 leading-relaxed font-sans">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="tactical" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
