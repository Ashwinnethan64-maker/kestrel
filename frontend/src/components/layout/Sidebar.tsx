import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  FolderGit2,
  Share2,
  MapPin,
  BarChart3,
  FileText,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
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
  { label: "Overview", path: "/overview", icon: LayoutDashboard },
  { label: "AI Copilot", path: "/copilot", icon: Sparkles, badge: "AI" },
  { label: "Cases & FIRs", path: "/cases", icon: FolderGit2 },
  { label: "Entity Network", path: "/network", icon: Share2 },
  { label: "Geographic Intel", path: "/gis", icon: MapPin },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Reports", path: "/reports", icon: FileText },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  { label: "Theme Studio", path: "/theme", icon: Palette },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
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
        <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
        {!isCollapsed && (
          <span className="truncate flex-1 tracking-wide font-sans">{item.label}</span>
        )}
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-primary">
            {item.badge}
          </span>
        )}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.path} content={item.label} side="right">
          {content}
        </Tooltip>
      );
    }

    return <React.Fragment key={item.path}>{content}</React.Fragment>;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-sidebar border-r border-sidebar-border select-none">
      {/* Top Header */}
      <div>
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border/80">
          <KestrelLogo showWordmark={!isCollapsed} size={22} />
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded border border-border/60 bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Tactical Sub-header */}
        {!isCollapsed && (
          <div className="px-4 py-2 text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-sidebar-border/40 flex items-center justify-between">
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
        {!isCollapsed && (
          <div className="px-3 py-1 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            SYSTEM CONTROL
          </div>
        )}
        {UTILITY_NAV_ITEMS.map(renderNavLink)}

        {/* Tactical Badge & Node Info */}
        {!isCollapsed && (
          <div className="mt-3 rounded border border-sidebar-border bg-surface-elevated/40 p-2.5 font-mono text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Shield className="h-3 w-3 text-primary" /> SOC NODE 01
              </span>
              <span className="text-positive">SECURE</span>
            </div>
            <div className="text-[9px] text-muted-foreground truncate">
              JURISDICTION: BLR METRO
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden md:block transition-all duration-300 ease-in-out shrink-0 z-30",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

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
