import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Radio,
  Eye,
  Crosshair,
  Compass,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";

export function GisPage() {
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedPin, setSelectedPin] = useState<FIRCase | null>(null);
  const [layerMode, setLayerMode] = useState<"incidents" | "density">("incidents");

  useEffect(() => {
    apiClient
      .getCases()
      .then((res) => {
        setCases(res.data);
        if (res.data.length > 0) setSelectedPin(res.data[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load spatial records.");
        setLoading(false);
      });
  }, []);

  const stations = useMemo(() => Array.from(new Set(cases.map((c) => c.policeStation))).sort(), [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedStation !== "all" && c.policeStation !== selectedStation) return false;
      if (selectedPriority !== "all" && c.priority !== selectedPriority) return false;
      return true;
    });
  }, [cases, selectedStation, selectedPriority]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geographic Intelligence & Spatial GIS"
        subtitle="Geospatial crime telemetry, density clusters, and tactical patrol hotspot mapping across Karnataka / Bengaluru Metro divisions."
        badge={
          <Badge variant="tactical" dot={true}>
            TACTICAL GIS // CARTO DARK
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={layerMode === "incidents" ? "tactical" : "outline"}
              size="sm"
              onClick={() => setLayerMode("incidents")}
              className="gap-1 font-mono text-xs"
            >
              <span>INCIDENT PINS</span>
            </Button>
            <Button
              variant={layerMode === "density" ? "tactical" : "outline"}
              size="sm"
              onClick={() => setLayerMode("density")}
              className="gap-1 font-mono text-xs"
            >
              <span>DENSITY RADAR</span>
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-primary" /> JURISDICTION:
            </span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">ALL METRO SECTORS</option>
              {stations.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">ALL SEVERITIES</option>
              <option value="Critical">CRITICAL INCIDENTS</option>
              <option value="High">HIGH SEVERITY</option>
              <option value="Medium">MEDIUM SEVERITY</option>
            </select>
          </div>

          <div className="text-muted-foreground">
            GEO-PINNED: <b className="text-primary">{filteredCases.length}</b> LOCATIONS
          </div>
        </CardContent>
      </Card>

      {/* GIS Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tactical Map Canvas (8 cols) */}
        <Card className="lg:col-span-8 flex flex-col h-[560px] overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-mono">Bengaluru Tactical Grid</CardTitle>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              GPS REF: 12.9716° N, 77.5946° E
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 relative bg-deck-deep overflow-hidden flex items-center justify-center">
            {/* Tactical Map Surface Background */}
            <div className="absolute inset-0 bg-tactical-grid opacity-60 pointer-events-none" />

            {/* Radar Circular Scan Animation */}
            {layerMode === "density" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-80 w-80 rounded-full border border-primary/20 animate-ping opacity-30" />
                <div className="absolute h-48 w-48 rounded-full border border-secondary/30" />
                <div className="absolute h-96 w-96 rounded-full border border-border/40" />
              </div>
            )}

            {/* Interactive Schematic Pin Cluster */}
            <div className="relative z-10 w-full h-full p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto">
              {filteredCases.slice(0, 9).map((c) => {
                const isSelected = selectedPin?.id === c.id;
                const isCrit = c.priority === "Critical";

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedPin(c)}
                    className={`p-3 rounded-lg border cursor-pointer select-none transition-all font-mono text-xs ${
                      isSelected
                        ? "bg-surface-elevated border-primary shadow-[0_0_15px_rgba(99,230,210,0.3)] scale-102"
                        : "bg-card/85 border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-primary text-[11px]">{c.firNumber}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isCrit ? "bg-destructive animate-pulse" : "bg-attention"
                        }`}
                      />
                    </div>
                    <div className="font-semibold text-foreground truncate">{c.crimeCategory}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.policeStation}</div>
                    <div className="text-[9px] text-primary/80 mt-1">
                      {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Incident Spatial Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <span>Selected Sector Target</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-mono text-xs">
              {selectedPin ? (
                <>
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">
                        {selectedPin.firNumber}
                      </span>
                      <Badge
                        variant={selectedPin.priority === "Critical" ? "destructive" : "attention"}
                      >
                        {selectedPin.priority}
                      </Badge>
                    </div>
                    <div className="text-primary font-semibold">{selectedPin.crimeCategory}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Division: {selectedPin.policeStation} • {selectedPin.district}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Geographic Incident Coordinates
                    </span>
                    <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latitude:</span>
                        <span className="text-foreground font-bold">{selectedPin.latitude}° N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitude:</span>
                        <span className="text-foreground font-bold">{selectedPin.longitude}° E</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered:</span>
                        <span className="text-foreground">
                          {new Date(selectedPin.incidentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Modus Operandi & Context
                    </span>
                    <p className="p-2.5 rounded bg-surface-elevated/60 border border-border text-foreground font-sans text-xs leading-relaxed">
                      {selectedPin.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    <Link to="/cases" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs font-mono">
                        Inspect Case
                      </Button>
                    </Link>
                    <Link to="/copilot" className="flex-1">
                      <Button variant="tactical" size="sm" className="w-full text-xs font-mono">
                        Ask Copilot
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Select an incident pin on the tactical grid to inspect spatial coordinates and patrol recommendations.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
