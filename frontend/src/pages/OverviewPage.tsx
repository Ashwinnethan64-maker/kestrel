import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderGit2,
  Share2,
  MapPin,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Layers,
  Radio,
  Clock,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase } from "@kestrel/shared";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator } from "@/components/ui/status-indicator";

export function OverviewPage() {
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getCases().then((res) => {
      setCases(res.data);
      setLoading(false);
    });
  }, []);

  const criticalCount = cases.filter((c) => c.priority === "Critical").length;
  const underInvestigationCount = cases.filter(
    (c) => c.status === "Under Investigation"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tactical Operations Overview"
        subtitle="Bengaluru Metropolitan Police Command & Control Grid. Real-time incident telemetry, predictive pattern detection, and unified case dossiers."
        badge={
          <Badge variant="tactical" dot={true}>
            SYSTEM OPERATIONAL
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/copilot">
              <Button variant="tactical" size="sm" className="gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5" /> AI COPILOT
              </Button>
            </Link>
            <Link to="/cases">
              <Button variant="default" size="sm" className="gap-1.5 font-mono">
                <FolderGit2 className="h-3.5 w-3.5" /> EXPLORE CASES
              </Button>
            </Link>
          </div>
        }
      />

      {/* Bento Grid KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="teal" className="bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Active Incident Records</span>
              <Activity className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {loading ? "..." : cases.length}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
              <span className="text-positive font-semibold">↑ +14.2%</span> vs last 30d
            </div>
          </CardContent>
        </Card>

        <Card glow="red" className="bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Critical Severity FIRs</span>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {loading ? "..." : criticalCount}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
              <span>Requires immediate deployment</span>
            </div>
          </CardContent>
        </Card>

        <Card glow="blue" className="bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Under Active Investigation</span>
              <Radio className="h-4 w-4 text-secondary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {loading ? "..." : underInvestigationCount}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-secondary font-mono">
              <span>6 station divisions assigned</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Mean Resolution Velocity</span>
              <Clock className="h-4 w-4 text-attention" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              4.8 Days
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-positive font-mono">
              <span>-18% lead time reduction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-lens Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/cases" className="group">
          <Card className="h-full hover:border-primary/50 transition-all hover:bg-surface-elevated/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                  <FolderGit2 className="h-4 w-4 text-primary" /> Case & FIR Explorer
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full-spectrum FIR ledger, statutory IPC/BNS act mapper, evidence chain of custody, and accused suspect registry.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/network" className="group">
          <Card className="h-full hover:border-secondary/50 transition-all hover:bg-surface-elevated/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground group-hover:text-secondary transition-colors">
                  <Share2 className="h-4 w-4 text-secondary" /> Criminal Syndicate Graph
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Relational entity topology, co-accused network clustering, repeat offender bridges, and automated threat hierarchy explainability.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/gis" className="group">
          <Card className="h-full hover:border-primary/50 transition-all hover:bg-surface-elevated/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                  <MapPin className="h-4 w-4 text-primary" /> Geospatial GIS Map
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tactical crime density heatmaps, spatial lasso query tool, high-risk patrol routing, and district perimeter analytics.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Incidents Table Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Priority Incidents</CardTitle>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              Live chronological feed of reported First Information Reports across Bengaluru stations.
            </p>
          </div>
          <Link to="/cases">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              View All ({cases.length})
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-surface-elevated/80 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">FIR Number</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Police Station</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cases.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-primary">{c.firNumber}</td>
                    <td className="px-4 py-3 text-foreground">{c.crimeCategory}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.policeStation}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={c.priority === "Critical" ? "destructive" : "attention"}
                        dot={true}
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.status}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(c.incidentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
