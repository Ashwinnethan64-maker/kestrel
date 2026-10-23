import React from "react";
import { Link } from "react-router-dom";
import { Share2, Users, ArrowUpRight, ShieldAlert, GitCommit } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EntityNetworkPreview() {
  const topSuspects = [
    { id: "SUSP-001", name: "Raju Nayak", alias: "Snake", gang: "Indiranagar Syndicate", priors: 4, risk: "High" },
    { id: "SUSP-002", name: "Mohammed Farooq", alias: "Bullet", gang: "Indiranagar Syndicate", priors: 3, risk: "High" },
    { id: "SUSP-005", name: "Anand Kumar", alias: "Blade", gang: "K.R. Puram Network", priors: 5, risk: "Critical" },
  ];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-secondary" />
              <span>Criminal Entity & Syndicate Network</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Active co-accused linkages and repeat offender topology.
            </p>
          </div>
          <Link to="/network">
            <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono gap-1">
              <span>OPEN GRAPH</span>
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Network Mini Graphic */}
        <div className="rounded border border-border bg-surface-elevated/60 p-3 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>DISCOVERED SYNDICATES: <b className="text-secondary">3 ACTIVE</b></span>
            <span>TOPOLOGY EDGES: <b className="text-foreground">7 CO-ACCUSED</b></span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <GitCommit className="h-3 w-3 text-primary" />
            <span>Shared getaway vehicle KA-04-E-1234 bridges Indiranagar & K.R. Puram</span>
          </div>
        </div>

        {/* Suspect Roster Preview */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Priority Repeat Offenders Tracked
          </div>

          <div className="space-y-1.5">
            {topSuspects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded bg-surface-elevated/40 border border-border/50 text-xs font-mono hover:border-secondary/40 transition-colors"
              >
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{s.name}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">"{s.alias}"</span>
                  </div>
                  <div className="text-[10px] text-secondary">{s.gang}</div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-[10px] text-muted-foreground">{s.priors} Priors</span>
                  <Badge
                    variant={s.risk === "Critical" ? "destructive" : "attention"}
                    className="text-[9px] px-1.5"
                  >
                    {s.risk}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
