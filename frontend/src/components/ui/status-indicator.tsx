import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Radio } from "lucide-react";

export type StatusLevel = "online" | "offline" | "critical" | "warning" | "active";

export interface StatusIndicatorProps {
  status: StatusLevel;
  label?: string;
  ping?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  ping = true,
  className,
}: StatusIndicatorProps) {
  const getDotColor = () => {
    switch (status) {
      case "online":
      case "active":
        return "bg-positive";
      case "critical":
        return "bg-destructive";
      case "warning":
        return "bg-attention";
      case "offline":
      default:
        return "bg-muted-foreground";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "critical":
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-attention" />;
      case "online":
      case "active":
        return <CheckCircle2 className="w-3.5 h-3.5 text-positive" />;
      case "offline":
      default:
        return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2 font-mono text-xs", className)}>
      <span className="relative flex h-2 w-2">
        {ping && (status === "online" || status === "active" || status === "critical") && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              getDotColor()
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", getDotColor())}
        />
      </span>
      {label && <span className="text-muted-foreground uppercase tracking-wider text-[11px]">{label}</span>}
    </div>
  );
}
