import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KPIStatCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  glow?: "teal" | "blue" | "red" | "none";
  targetRoute?: string;
  className?: string;
}

export function KPIStatCard({
  title,
  value,
  description,
  trend,
  icon,
  glow = "none",
  targetRoute,
  className,
}: KPIStatCardProps) {
  const content = (
    <Card
      glow={glow}
      className={cn(
        "group h-full transition-all duration-200",
        targetRoute && "hover:border-primary/50 hover:bg-surface-elevated/40 cursor-pointer",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-muted-foreground font-mono font-medium tracking-wider">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
            {targetRoute && (
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
          {value}
        </div>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 text-[11px] font-mono">
          <span className="text-muted-foreground truncate">{description}</span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 shrink-0 font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive && "text-positive bg-positive/10 border border-positive/20",
                trend.isPositive === false && "text-destructive bg-destructive/10 border border-destructive/20",
                trend.isNeutral && "text-muted-foreground bg-surface-elevated border border-border"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend.isPositive === false ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (targetRoute) {
    return <Link to={targetRoute} className="block h-full">{content}</Link>;
  }

  return content;
}
