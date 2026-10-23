import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FIRCase } from "@kestrel/shared";

interface CrimeTrendChartProps {
  cases: FIRCase[];
}

export function CrimeTrendChart({ cases }: CrimeTrendChartProps) {
  // Aggregate incidents by month/date chronologically
  const timelineData = useMemo(() => {
    const buckets: Record<string, { date: string; incidents: number; critical: number }> = {};

    cases.forEach((c) => {
      const d = new Date(c.incidentDate);
      const key = `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
      if (!buckets[key]) {
        buckets[key] = { date: key, incidents: 0, critical: 0 };
      }
      buckets[key].incidents += 1;
      if (c.priority === "Critical") {
        buckets[key].critical += 1;
      }
    });

    const list = Object.values(buckets);
    return list.slice(0, 12);
  }, [cases]);

  // Aggregate category counts for the bar distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.crimeCategory] = (counts[c.crimeCategory] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name.replace(/ /g, "\n"),
        rawName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [cases]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-mono">Incident Velocity & Pattern Trajectory</CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Chronological incident progression and high-frequency category breakdown.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Total
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Critical
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col justify-between gap-4">
        {/* Timeline Area Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#63E6D2" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#63E6D2" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F85149" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F85149" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.6} />
              <XAxis dataKey="date" stroke="#A8B6C8" fontSize={10} fontVariant="mono" tickLine={false} />
              <YAxis stroke="#A8B6C8" fontSize={10} fontVariant="mono" tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#111C2E",
                  borderColor: "#28374A",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "#F3F6FB",
                }}
              />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#63E6D2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncidents)"
                name="Total Incidents"
              />
              <Area
                type="monotone"
                dataKey="critical"
                stroke="#F85149"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorCritical)"
                name="Critical Severity"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Top Offense Categories in Filter Scope
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#A8B6C8" fontSize={10} fontVariant="mono" tickLine={false} />
                <YAxis dataKey="rawName" type="category" stroke="#A8B6C8" fontSize={9} fontVariant="mono" width={90} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#111C2E",
                    borderColor: "#28374A",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#F3F6FB",
                  }}
                />
                <Bar dataKey="count" fill="#69A9FF" radius={[0, 4, 4, 0]} barSize={12} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
