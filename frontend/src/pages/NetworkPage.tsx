import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Share2,
  Users,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldAlert,
  GitCommit,
  User,
  FolderGit2,
  RefreshCw,
  Info,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { AccusedSuspect, NetworkTopologyPayload } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";

export function NetworkPage() {
  const [topology, setTopology] = useState<NetworkTopologyPayload | null>(null);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedGang, setSelectedGang] = useState("all");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Canvas Viewport State (pan/zoom)
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    Promise.all([apiClient.getNetworkTopology(), apiClient.getAccused()])
      .then(([topRes, suspRes]) => {
        setTopology(topRes.data);
        setSuspects(suspRes.data);
        if (topRes.data.nodes.length > 0) {
          setSelectedNode(topRes.data.nodes[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load network topology.");
        setLoading(false);
      });
  }, []);

  const gangs = useMemo(() => {
    return Array.from(new Set(suspects.map((s) => s.gangAffiliation).filter(Boolean))) as string[];
  }, [suspects]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!topology) return [];
    return topology.nodes.filter((node) => {
      const suspect = suspects.find((s) => s.id === node.id);
      if (selectedRisk !== "all" && node.severity !== selectedRisk) return false;
      if (selectedGang !== "all" && suspect?.gangAffiliation !== selectedGang) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          node.label.toLowerCase().includes(q) ||
          node.subLabel?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [topology, suspects, selectedRisk, selectedGang, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Network & Syndicate Topology"
        subtitle="Force-directed entity graph uncovering co-accused linkages, repeat offender rings, and shared getaway vehicle conduits."
        badge={
          <Badge variant="tactical" dot={true}>
            RELATIONAL TOPOLOGY // DEMO
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoomLevel(1);
                if (topology?.nodes.length) setSelectedNode(topology.nodes[0]);
              }}
              className="gap-1.5 font-mono text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>RESET VIEW</span>
            </Button>
            <Link to="/copilot">
              <Button variant="tactical" size="sm" className="gap-1.5 font-mono text-xs">
                <span>EXPLAIN WITH AI</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter suspect node by name or alias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-surface-elevated pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL RISK LEVELS</option>
                <option value="Critical">CRITICAL RISK</option>
                <option value="High">HIGH RISK</option>
                <option value="Medium">MEDIUM RISK</option>
              </select>

              <select
                value={selectedGang}
                onChange={(e) => setSelectedGang(e.target.value)}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL SYNDICATES</option>
                {gangs.map((g) => (
                  <option key={g} value={g}>
                    {g.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Canvas Zoom Tools */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-muted-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Graph Canvas and Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Graph Canvas Container (8 cols) */}
        <Card className="lg:col-span-8 flex flex-col h-[560px] overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-secondary" />
              <CardTitle className="text-xs font-mono">Topology Visualizer</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-attention" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Medium
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 relative bg-tactical-grid flex items-center justify-center overflow-auto">
            {loading ? (
              <div className="space-y-3 p-8 text-center text-primary font-mono text-xs">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p>Computing relational co-accused matrix...</p>
              </div>
            ) : error ? (
              <StateView variant="error" title="Graph Layout Error" description={error} />
            ) : (
              <div
                className="w-full h-full p-8 flex flex-wrap items-center justify-around gap-6 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isCrit = node.severity === "Critical";
                  const isHigh = node.severity === "High";

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`relative p-3.5 rounded-lg border cursor-pointer select-none transition-all duration-150 w-52 font-mono ${
                        isSelected
                          ? "bg-surface-elevated border-secondary shadow-[0_0_15px_rgba(105,169,255,0.4)] scale-105"
                          : "bg-card/90 border-border hover:border-primary/50"
                      }`}
                    >
                      {/* Status indicator pin */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-primary font-bold">{node.id}</span>
                        <Badge
                          variant={isCrit ? "destructive" : isHigh ? "attention" : "tactical"}
                          className="text-[9px] px-1 py-0"
                        >
                          {node.severity}
                        </Badge>
                      </div>

                      <div className="font-bold text-xs text-foreground truncate">{node.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate mb-2">
                        Alias: "{node.subLabel || "None"}"
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span>Priors: {String((node.data as any)?.totalPriorArrests || 2)}</span>
                        <span className="text-secondary font-semibold">CO-ACCUSED LINK</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Entity Detail Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Entity Intelligence Dossier</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-mono text-xs">
              {selectedNode ? (
                <>
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        {selectedNode.label}
                      </span>
                      <Badge
                        variant={
                          selectedNode.severity === "Critical"
                            ? "destructive"
                            : "attention"
                        }
                      >
                        {selectedNode.severity} RISK
                      </Badge>
                    </div>
                    <div className="text-[11px] text-primary font-semibold">
                      Primary Alias: "{selectedNode.subLabel || "Unregistered"}"
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Syndicate: {String((selectedNode.data as any)?.gangAffiliation || "Independent Actor")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Relational Indicators
                    </span>
                    <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prior Arrest Records:</span>
                        <span className="text-foreground font-bold">
                          {String((selectedNode.data as any)?.totalPriorArrests || 3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bail / Custody Status:</span>
                        <span className="text-attention font-bold">
                          {String((selectedNode.data as any)?.bailStatus || "Bailed")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Primary Sector:</span>
                        <span className="text-foreground">
                          {String((selectedNode.data as any)?.primaryStation || "Indiranagar")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Asset & Modus Operandi Linkages
                    </span>
                    <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[10px] space-y-1 text-muted-foreground">
                      <div>• Sighted with getaway vehicle KA-04-E-1234 (Black Sedan)</div>
                      <div>• Shared statutory involvement in IPC 392 (Armed Robbery)</div>
                      <div>• Accomplice to Indiranagar Night Burglary ring</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    <Link to="/cases" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs font-mono">
                        View FIRs
                      </Button>
                    </Link>
                    <Link to="/copilot" className="flex-1">
                      <Button variant="tactical" size="sm" className="w-full text-xs font-mono">
                        Audit Node
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Click on any node in the topology canvas to inspect entity linkages and dossier details.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
