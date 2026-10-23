import React from "react";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings & Node Configuration"
        subtitle="Manage law enforcement jurisdiction boundaries, API sources, and role-based clearance permissions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tactical Node Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Platform Release:</span>
              <span className="text-foreground font-semibold">Kestrel v1.0.0 (Command Deck)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Primary Agency:</span>
              <span className="text-primary font-semibold">Karnataka State Police (KSP)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Active Operational Sector:</span>
              <span className="text-foreground font-semibold">Bengaluru Metro City</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Telepresence Bus:</span>
              <StatusIndicator status="active" label="Zustand High-Speed Bus" ping={false} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Source & API Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Active Adapter:</span>
              <Badge variant="tactical">Mock Intel Provider</Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Curated Dataset:</span>
              <span className="text-positive font-semibold">60+ Bengaluru Incidents Loaded</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Zero-Risk Offline Mode:</span>
              <span className="text-foreground">Armed & Enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
