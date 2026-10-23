import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  Shield,
  Palette,
  Bell,
  Languages,
  Database,
  Lock,
  CheckCircle,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useTheme } from "@/theme/ThemeContext";

export function SettingsPage() {
  const { activeTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [preferredLang, setPreferredLang] = useState<"EN" | "KN">("EN");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings & Preferences"
        subtitle="Manage law enforcement workstation preferences, active theme profile, bilingual modes, and diagnostic logs."
        badge={
          <Badge variant="tactical" dot={true}>
            STATION STATION IN-CHARGE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="tactical"
              size="sm"
              onClick={handleSavePreferences}
              className="gap-1.5 font-mono text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>SAVE PREFERENCES</span>
            </Button>
          </div>
        }
      />

      {savedNotice && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <span>Workstation settings successfully saved to local station profile.</span>
          <button onClick={() => setSavedNotice(false)}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appearance & Active Theme Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span>Visual Appearance & Theme</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Active Theme:</span>
              <span className="font-bold text-foreground">{activeTheme.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Theme Category:</span>
              <span className="text-primary">{activeTheme.category}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Typography:</span>
              <span className="text-foreground">{activeTheme.fontFamily}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Accent Gold:</span>
              <span className="text-primary font-bold">{activeTheme.accentHex}</span>
            </div>
            <div className="pt-2 text-[11px] text-muted-foreground italic">
              Platform visual system locked to Editorial Design (Art &amp; Editorial).
            </div>
          </CardContent>
        </Card>

        {/* Operational Localization & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-secondary" />
              <span>Operational Language & HUD Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Primary Language:</span>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as any)}
                className="rounded border border-border bg-surface-elevated px-2 py-1 text-xs text-foreground focus:outline-none"
              >
                <option value="EN">English (EN)</option>
                <option value="KN">Kannada (ಕನ್ನಡ - KN)</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Real-time Radar Pings:</span>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  notificationsEnabled
                    ? "bg-positive/20 text-positive border border-positive/30"
                    : "bg-surface-elevated text-muted-foreground"
                }`}
              >
                {notificationsEnabled ? "ENABLED" : "MUTED"}
              </button>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Session Clearance:</span>
              <span className="text-foreground font-semibold">Investigator Level 2</span>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics & Offline Mode */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span>Data Architecture & Security Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Data Provider</span>
                <div className="font-bold text-foreground">In-Memory Mock Adapter</div>
                <div className="text-[10px] text-positive">Zero-Dependency Resilience</div>
              </div>
              <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Curated Index</span>
                <div className="font-bold text-foreground">60+ Bengaluru Incident Records</div>
                <div className="text-[10px] text-muted-foreground">GPS, Suspect & FIR Models</div>
              </div>
              <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Credentials Status</span>
                <div className="font-bold text-foreground">Zero Client Secrets Embedded</div>
                <div className="text-[10px] text-positive">Production Compliant</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
