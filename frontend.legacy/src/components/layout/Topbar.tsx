import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  Languages,
  User,
  ShieldAlert,
  WifiOff,
  Database,
  RefreshCw,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useInvestigationContext } from "@/store/useInvestigationContext";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useTranslation } from "@/lib/i18n";
import { apiClient } from "@/services/api/client";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
}

export function Topbar({
  onOpenMobileSidebar,
  onOpenCommandPalette,
}: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguageStore();
  const { profile } = useProfileStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRetryingLive, setIsRetryingLive] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    isOfflineMode,
    setOfflineMode,
    backendStatus,
    setBackendStatus,
    triggerDataRefresh,
  } = useInvestigationContext();

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setShowSignOutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleOffline = () => {
    const nextMode = !isOfflineMode;
    setOfflineMode(nextMode);
    apiClient.setMode(nextMode ? "mock" : "live");
    triggerDataRefresh();
  };

  const handleRetryLive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetryingLive(true);
    try {
      const res = await fetch("/api/cases?limit=1");
      if (res.ok) {
        setBackendStatus("connected");
        apiClient.setMode("live");
        triggerDataRefresh();
      }
    } catch (err) {
      console.warn("[HUD Retry] Live ping failed:", err);
    } finally {
      setIsRetryingLive(false);
    }
  };

  // Compute Breadcrumb section name
  const pathParts = location.pathname.split("/").filter(Boolean);
  const sectionKey = pathParts[0] || "overview";
  const navTranslationKey = `nav.${sectionKey === "overview" ? "dashboard" : sectionKey}`;
  const sectionTitle = t(navTranslationKey, sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1));

  return (
    <header className="h-14 border-b border-border bg-sidebar/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left: Mobile Toggle & Breadcrumbs & Workspace Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
          aria-label="Toggle mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Tactical Workspace Context Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="tactical" className="px-2 py-0.5 text-[10px]">
            {t('topbar.soc')}
          </Badge>
          <span className="text-border">/</span>
          <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
            {sectionTitle}
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-border/60">
          <StatusIndicator status="active" label={t('topbar.gridActive')} ping={true} />
        </div>
      </div>

      {/* Center: Global Search Entry Point / Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between rounded-md border border-border bg-surface-elevated/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-surface-elevated transition-all group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="font-mono text-xs text-muted-foreground truncate">
              {t('topbar.searchPlaceholder')}
            </span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] text-muted-foreground shrink-0">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Mode Toggle, Language Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Global Tactical Mode Toggle: LIVE vs OFFLINE DEMO */}
        <div className="flex items-center">
          {backendStatus === "offline_fallback" ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-destructive/40 bg-destructive/10 text-destructive text-[11px] font-mono animate-pulse">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span className="font-bold hidden xl:inline">{t('topbar.failover')}</span>
              <button
                onClick={handleRetryLive}
                disabled={isRetryingLive}
                className="ml-1 px-1.5 py-0.5 rounded bg-destructive/20 hover:bg-destructive/30 text-destructive font-semibold flex items-center gap-1 transition-colors text-[10px]"
                title="Retry Live Backend Connection"
              >
                <RefreshCw className={cn("h-2.5 w-2.5", isRetryingLive && "animate-spin")} />
                {isRetryingLive ? "..." : t('topbar.retry')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleToggleOffline}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all select-none",
                isOfflineMode
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              )}
              title={
                isOfflineMode
                  ? "Running on local fixtures. Click to switch to Live Backend."
                  : "Connected to Live Backend. Click to switch to Offline Demo."
              }
            >
              {isOfflineMode ? (
                <>
                  <Database className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-bold tracking-wide">{t('topbar.offlineDemo')}</span>
                  <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">
                    {t('topbar.fixtures')}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold tracking-wide">{t('topbar.liveBackend')}</span>
                  <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-emerald-400/20 text-emerald-300">
                    {t('topbar.online')}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Complete English / Kannada Language Selector Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-xs font-mono text-foreground hover:border-primary/50 transition-colors shadow-sm"
          title="Toggle Application Language (English / ಕನ್ನಡ)"
          aria-label="Change Language"
        >
          <Languages className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-[11px] tracking-wider uppercase">
            {language === "en" ? "EN" : "ಕನ್ನಡ"}
          </span>
        </button>

        {/* Operational Notifications Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-elevated/70 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="Operational Alerts"
            aria-label="View notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card p-3 shadow-2xl z-50 animate-fade-in font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> {t('topbar.alerts')}
                </span>
                <span className="text-[10px] text-muted-foreground">{t('topbar.newAlerts')}</span>
              </div>
              <div className="space-y-2">
                <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-[11px]">
                  <div className="text-destructive font-bold mb-0.5">PRIORITY 1 // BURGLARY SURGE</div>
                  <div className="text-muted-foreground font-sans text-xs">
                    3 incidents flagged in Indiranagar within 48h. Latch match found.
                  </div>
                </div>
                <div className="rounded border border-attention/30 bg-attention/10 p-2 text-[11px]">
                  <div className="text-attention font-bold mb-0.5">ALERT // SUSPECT PROXIMITY</div>
                  <div className="text-muted-foreground font-sans text-xs">
                    Vehicle KA-04-E-1234 flagged at Hebbal toll checkpoint.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile Menu Dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-2.5 py-1 text-xs text-foreground hover:border-primary/50 transition-colors group"
            aria-label="User Account Menu"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary border border-primary/40 font-bold overflow-hidden">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-mono text-[10px] font-bold text-foreground leading-tight tracking-wide">
                {profile.displayName.toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground leading-tight">
                {profile.badgeNumber}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform duration-150" />
          </button>

          {/* User Menu Dropdown Panel */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-card p-2 shadow-2xl z-50 animate-fade-in font-sans text-xs space-y-1">
              <div className="px-2.5 py-2 border-b border-border/70 mb-1 bg-surface-elevated/40 rounded">
                <div className="text-foreground font-bold text-xs">{profile.displayName}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">{profile.email}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="tactical" className="text-[9px] py-0 px-1.5 font-mono">
                    {profile.role}
                  </Badge>
                  <span className="text-[9px] text-primary font-mono">{profile.station}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>{t('topbar.profileClearance')}</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                <SettingsIcon className="h-4 w-4 text-secondary shrink-0" />
                <span>{t('topbar.systemSettings')}</span>
              </button>

              <div className="border-t border-border/50 my-1" />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setShowSignOutConfirm(true);
                }}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded hover:bg-destructive/15 text-destructive text-xs font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{t('topbar.lockDeck')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-semibold text-lg text-foreground">
                {t('profile.signOutConfirm')}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.signOutPrompt')}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded text-xs font-semibold border border-border bg-surface-elevated hover:bg-surface-elevated/80 text-foreground transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  navigate("/overview");
                }}
                className="px-4 py-2 rounded text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white transition-colors"
              >
                {t('profile.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
