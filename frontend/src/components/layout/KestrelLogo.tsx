import React from "react";
import { cn } from "@/lib/utils";

interface KestrelLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function KestrelLogo({
  className,
  size = 28,
  showWordmark = true,
}: KestrelLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Abstract Kestrel Falcon / Intelligence Emblem */}
      <div
        className="relative flex items-center justify-center rounded-lg bg-surface-elevated border border-primary/30 p-1.5 shadow-[0_0_12px_-2px_rgba(99,230,210,0.25)]"
        style={{ width: size + 10, height: size + 10 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          {/* Stylized Kestrel Wings & Sight Crosshair */}
          <path
            d="M12 2L4 7V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V7L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          />
          <path
            d="M12 5L15 10H9L12 5Z"
            fill="currentColor"
            className="text-secondary"
          />
          <path
            d="M6 11L12 14L18 11L12 17L6 11Z"
            fill="currentColor"
            className="text-primary"
          />
          <circle cx="12" cy="14" r="1.5" fill="#F3F6FB" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold tracking-widest text-foreground uppercase">
              KESTREL
            </span>
            <span className="rounded bg-primary/10 border border-primary/30 px-1 py-0.2 text-[9px] font-mono font-semibold text-primary">
              v1.0
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            Crime Intel OS
          </span>
        </div>
      )}
    </div>
  );
}
