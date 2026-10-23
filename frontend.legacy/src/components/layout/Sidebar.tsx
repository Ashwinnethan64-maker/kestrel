import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BrainCircuit,
  FolderSearch,
  Network,
  Map,
  ChartNoAxesCombined,
  FileText,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KestrelLogo } from "./KestrelLogo";
import { useTranslation } from "@/lib/i18n";

export interface NavItem {
  id: string;
  labelKey: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  accentColor: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", labelKey: "nav.dashboard", path: "/overview", icon: LayoutDashboard, accentColor: "#D4AF37" },
  { id: "copilot", labelKey: "nav.copilot", path: "/copilot", icon: BrainCircuit, badge: "AI", accentColor: "#63E6D2" },
  { id: "cases", labelKey: "nav.cases", path: "/cases", icon: FolderSearch, accentColor: "#69A9FF" },
  { id: "network", labelKey: "nav.network", path: "/network", icon: Network, accentColor: "#D4AF37" },
  { id: "gis", labelKey: "nav.gis", path: "/gis", icon: Map, accentColor: "#F85149" },
  { id: "analytics", labelKey: "nav.analytics", path: "/analytics", icon: ChartNoAxesCombined, accentColor: "#69A9FF" },
  { id: "reports", labelKey: "nav.reports", path: "/reports", icon: FileText, accentColor: "#A78BFA" },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  { id: "profile", labelKey: "nav.profile", path: "/profile", icon: User, accentColor: "#D4AF37" },
  { id: "settings", labelKey: "nav.settings", path: "/settings", icon: Settings, accentColor: "#B5B0A8" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { t } = useTranslation();
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleItemMouseEnter = (id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredItemId(id);
  };

  const handleItemMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItemId(null);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isHovered = hoveredItemId === item.id;
    const label = t(item.labelKey);

    return (
      <div
        key={item.path}
        className="relative flex items-center justify-center w-full py-1"
        onMouseEnter={() => handleItemMouseEnter(item.id)}
        onMouseLeave={handleItemMouseLeave}
      >
        <NavLink
          to={item.path}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            cn(
              "relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 select-none",
              isActive
                ? "bg-primary/15 text-primary border border-primary/40 shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                : isHovered
                ? "bg-surface-elevated text-foreground border border-border shadow-md"
                : "text-sidebar-muted hover:text-foreground hover:bg-surface-elevated/60"
            )
          }
          style={isHovered ? { borderColor: item.accentColor } : undefined}
          aria-label={label}
        >
          <Icon className="h-5 w-5 shrink-0 transition-transform duration-200" />
          {item.badge && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 border border-primary/50 px-1 text-[8px] font-mono font-bold text-primary">
              {item.badge}
            </span>
          )}
        </NavLink>

        {/* Hover-reveal label pill with smooth slide-out and subtle wave reveal */}
        <div
          className={cn(
            "pointer-events-none absolute left-14 z-50 flex items-center whitespace-nowrap rounded-md border border-border/80 bg-popover/95 px-3 py-1.5 shadow-2xl backdrop-blur-md transition-all duration-200 ease-out",
            isHovered
              ? "opacity-100 translate-x-1 visible scale-100"
              : "opacity-0 -translate-x-2 invisible scale-95"
          )}
          style={{ borderColor: item.accentColor }}
        >
          <span className="text-xs font-semibold tracking-wide text-foreground font-sans">
            {label}
          </span>
          {item.badge && (
            <span className="ml-2 rounded bg-primary/10 border border-primary/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary">
              {item.badge}
            </span>
          )}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full w-16 flex-col justify-between bg-sidebar border-r border-sidebar-border select-none shrink-0 py-3">
      {/* Top Section: Logo */}
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-full items-center justify-center border-b border-sidebar-border/60 pb-3">
          <KestrelLogo showWordmark={false} size={28} />
        </div>

        {/* Tactical Main Nav */}
        <nav className="mt-4 flex flex-col items-center gap-1.5 w-full px-2">
          {MAIN_NAV_ITEMS.map(renderNavItem)}
        </nav>
      </div>

      {/* Bottom Section: Profile & Settings */}
      <div className="flex flex-col items-center border-t border-sidebar-border/60 pt-3 gap-1.5 px-2">
        {UTILITY_NAV_ITEMS.map(renderNavItem)}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Width Icon Rail (64px / w-16) - NEVER overlaps content */}
      <aside className="hidden md:flex h-full w-16 shrink-0 relative z-30 bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full shadow-2xl animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
