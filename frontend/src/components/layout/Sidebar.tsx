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
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KestrelLogo } from "./KestrelLogo";
import { Tooltip } from "@/components/ui/tooltip";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "tactical" | "destructive" | "attention";
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/overview", icon: LayoutDashboard },
  { label: "AI Investigator", path: "/copilot", icon: BrainCircuit, badge: "AI" },
  { label: "Case Explorer", path: "/cases", icon: FolderSearch },
  { label: "Criminal Network", path: "/network", icon: Network },
  { label: "Crime Map", path: "/gis", icon: Map },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "Reports", path: "/reports", icon: FileText },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  { label: "Settings", path: "/settings", icon: Settings },
];

interface SidebarProps {
  isPinned: boolean;
  onTogglePin: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isPinned,
  onTogglePin,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Desktop active expansion state: either explicitly pinned open, or hovered, or focused via keyboard
  const isExpanded = isPinned || isHovered || hasKeyboardFocus;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Graceful 120ms exit debounce to prevent jitter when moving cursor near borders
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    const content = (
      <NavLink
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all select-none",
            isActive
              ? "bg-surface-elevated text-primary font-semibold border-l-2 border-primary shadow-sm"
              : "text-sidebar-muted hover:bg-surface-elevated/60 hover:text-foreground"
          )
        }
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            item.path === "/overview" && "text-primary group-hover:text-primary",
            item.path === "/copilot" && "text-[#63E6D2] group-hover:text-[#63E6D2]",
            item.path === "/cases" && "text-secondary group-hover:text-secondary",
            item.path === "/network" && "text-primary group-hover:text-primary",
            item.path === "/gis" && "text-destructive group-hover:text-destructive",
            item.path === "/analytics" && "text-secondary group-hover:text-secondary",
            item.path === "/reports" && "text-[#A78BFA] group-hover:text-[#A78BFA]",
            item.path === "/settings" && "text-sidebar-muted group-hover:text-foreground"
          )}
        />
        {isExpanded && (
          <span className="truncate flex-1 tracking-wide font-sans">{item.label}</span>
        )}
        {isExpanded && item.badge && (
          <span className="ml-auto rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-primary">
            {item.badge}
          </span>
        )}
      </NavLink>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={item.path} content={item.label} side="right">
          {content}
        </Tooltip>
      );
    }

    return <React.Fragment key={item.path}>{content}</React.Fragment>;
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-sidebar border-r border-sidebar-border select-none transition-all duration-200 ease-out",
        !isPinned && isHovered && "shadow-2xl shadow-black/80 border-r-border/80"
      )}
      onFocus={() => setHasKeyboardFocus(true)}
      onBlur={(e) => {
        // If focus moves outside the sidebar container, release keyboard focus
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHasKeyboardFocus(false);
        }
      }}
    >
      {/* Top Header */}
      <div>
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-sidebar-border/80">
          <KestrelLogo showWordmark={isExpanded} size={24} />
          {isExpanded && (
            <button
              onClick={onTogglePin}
              className={cn(
                "hidden md:flex h-7 w-7 items-center justify-center rounded border transition-colors",
                isPinned
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/50"
              )}
              title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar open"}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
            >
              {isPinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Tactical Sub-header */}
        {isExpanded && (
          <div className="px-4 py-2 text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-sidebar-border/40 flex items-center justify-between animate-fade-in">
            <span>OPERATIONAL SECTORS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-positive animate-ping" />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1 p-2">
          {MAIN_NAV_ITEMS.map(renderNavLink)}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border/80 p-2 space-y-1">
        {isExpanded && (
          <div className="px-3 py-1 text-[10px] font-mono tracking-widest text-muted-foreground uppercase animate-fade-in">
            SYSTEM CONTROL
          </div>
        )}
        {UTILITY_NAV_ITEMS.map(renderNavLink)}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Layout Rail & Auto-Hover Overlay Container */}
      <div
        className={cn(
          "hidden md:block relative shrink-0 transition-[width] duration-200 ease-out z-30",
          isPinned ? "w-60" : "w-16"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <aside
          className={cn(
            "h-full transition-all duration-200 ease-out",
            isPinned
              ? "w-60 relative"
              : isExpanded
              ? "w-60 absolute top-0 left-0 bottom-0 z-40 bg-sidebar"
              : "w-16 relative"
          )}
        >
          {sidebarContent}
        </aside>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 w-64 h-full shadow-2xl animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
