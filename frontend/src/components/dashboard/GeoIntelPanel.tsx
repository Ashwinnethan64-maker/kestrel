import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, ArrowUpRight, ShieldAlert, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FIRCase } from "@kestrel/shared";

interface GeoIntelPanelProps {
  cases: FIRCase[];
}

export function GeoIntelPanel({ cases }: GeoIntelPanelProps) {
  // Aggregate hotspot clusters by police station
  const stationClusters = React.useMemo(() => {
    const counts: Record<string, { count: number; critical: number; station: string }> = {};
    cases.forEach((c) => {
      if (!counts[c.policeStation]) {
        counts[c.policeStation] = { count: 0, critical: 0, station: c.policeStation };
      }
      counts[c.policeStation].count += 1;
      if (c.priority === "Critical") {
        counts[c.policeStation].critical += 1;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [cases]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Geospatial Hotspots & Patrol Grid</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans">
              Cluster density breakdown across Bengaluru tactical divisions.
            </p>
          </div>
          <Link to="/gis">
            <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono gap-1">
              <span>EXPAND MAP</span>
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Tactical Mini Map Graphic / Coordinate Radar */}
        <div className="relative h-36 w-full rounded border border-border bg-surface-elevated/70 overflow-hidden flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="h-28 w-28 rounded-full border border-primary/40 animate-pulse" />
            <div className="absolute h-16 w-16 rounded-full border border-secondary/30" />
            <div className="absolute h-2 w-2 rounded-full bg-primary" />
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 bg-tactical-grid opacity-50" />

          {/* Incident Pins Simulation */}
          <div className="relative z-10 text-center font-mono space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="tactical" dot={true}>
                ACTIVE SECTOR: BENGALURU METRO
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground">
              GPS REF: 12.9716° N, 77.5946° E
            </div>
            <div className="text-[11px] text-primary font-bold">
              {cases.length} INCIDENTS GEO-PINNED
            </div>
          </div>
        </div>

        {/* Hotspot Division List */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex justify-between">
            <span>High-Density Hotspot Stations</span>
            <span>Cases / Critical</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {stationClusters.slice(0, 4).map((item) => (
              <div
                key={item.station}
                className="flex items-center justify-between p-2 rounded bg-surface-elevated/60 border border-border/60 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <Navigation className="h-3 w-3 text-secondary shrink-0" />
                  <span className="font-semibold text-foreground">{item.station}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.count} cases</span>
                  {item.critical > 0 ? (
                    <span className="rounded px-1.5 py-0.2 bg-destructive/15 text-destructive border border-destructive/30 text-[10px] font-bold">
                      {item.critical} CRIT
                    </span>
                  ) : (
                    <span className="text-positive text-[10px]">NORMAL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
