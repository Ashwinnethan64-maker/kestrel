import React from "react";
import { cn } from "@/lib/utils";

interface KestrelLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function KestrelLogo({
  className,
  size = 32,
  showWordmark = true,
}: KestrelLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Official Kestrel Eagle Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-md bg-surface-elevated/70 border border-primary/40 p-1 shadow-[0_0_15px_-3px_rgba(212,175,55,0.25)] overflow-hidden"
        style={{ width: size + 6, height: size + 6 }}
      >
        <img
          src="/branding/kestrel-mark.png"
          alt="KESTREL Eagle Emblem"
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold tracking-widest text-foreground uppercase">
              KESTREL
            </span>
            <span className="rounded bg-primary/10 border border-primary/30 px-1 py-0.2 text-[9px] font-mono font-semibold text-primary">
              v1.0
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase truncate">
            Crime Intel OS
          </span>
        </div>
      )}
    </div>
  );
}
