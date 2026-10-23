import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  Languages,
  User,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
}

export function Topbar({
  onOpenMobileSidebar,
  onOpenCommandPalette,
}: TopbarProps) {
  const location = useLocation();
  const [lang, setLang] = useState<"EN" | "KN">("EN");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Compute Breadcrumb from route
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSection = pathParts[0]
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
    : "Overview";

  return (
    <header className="h-14 border-b border-border bg-sidebar/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left: Mobile Toggle & Breadcrumbs & Workspace Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Tactical Workspace Context Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="tactical" className="px-2 py-0.5 text-[10px]">
            COMMAND SOC
          </Badge>
          <span className="text-border">/</span>
          <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
            {currentSection}
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-border/60">
          <StatusIndicator status="active" label="SURVEILLANCE GRID ACTIVE" ping={true} />
        </div>
      </div>

      {/* Center: Global Search Entry Point / Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between rounded-md border border-border bg-surface-elevated/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-surface-elevated transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-xs text-muted-foreground truncate">
              Search FIR #, Suspect Alias, IPC Section...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Language, Notifications, Mission Status & Account */}
      <div className="flex items-center gap-2">
        {/* Language Selector (KN/EN) */}
        <button
          onClick={() => setLang(lang === "EN" ? "KN" : "EN")}
          className="flex items-center gap-1 rounded border border-border bg-surface-elevated/60 px-2 py-1 text-xs font-mono text-foreground hover:border-primary/40 transition-colors"
          title="Toggle Language: Kannada / English"
        >
          <Languages className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-[10px]">{lang}</span>
        </button>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-elevated/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="Operational Alerts"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card p-3 shadow-xl z-50 animate-fade-in font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Tactical Alerts
                </span>
                <span className="text-[10px] text-muted-foreground">3 NEW</span>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-[11px]">
                  <div className="text-destructive font-bold mb-0.5">PRIORITY 1 // BURGLARY SURGE</div>
                  <div className="text-muted-foreground font-sans">
                    3 incidents flagged in Indiranagar within 48h. MO latch match.
                  </div>
                </div>
                <div className="rounded border border-attention/30 bg-attention/10 p-2 text-[11px]">
                  <div className="text-attention font-bold mb-0.5">ALERT // SUSPECT PROXIMITY</div>
                  <div className="text-muted-foreground font-sans">
                    Vehicle KA-04-E-1234 flagged at Hebbal toll checkpoint.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-foreground hover:border-primary/40 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 text-primary border border-primary/30">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-mono text-[10px] font-bold text-foreground leading-tight">
                INSP. SHARMA
              </span>
              <span className="font-mono text-[9px] text-muted-foreground leading-tight">
                BADGE #KSP-4491
              </span>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-2 shadow-xl z-50 animate-fade-in font-mono text-xs space-y-1">
              <div className="px-2 py-1 border-b border-border/60 mb-1">
                <div className="text-foreground font-bold">Investigator Session</div>
                <div className="text-[10px] text-muted-foreground">Karnataka State Police</div>
              </div>
              <button
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground text-[11px]"
              >
                Profile & Clearance
              </button>
              <button
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground text-[11px]"
              >
                Station Audit Logs
              </button>
              <div className="border-t border-border/40 my-1" />
              <button
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-destructive/10 text-destructive text-[11px]"
              >
                Secure Lock Deck
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
