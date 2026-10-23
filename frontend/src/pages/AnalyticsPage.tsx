import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Activity,
  Calendar,
  Download,
  Filter,
  ShieldAlert,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiClient } from "@/services/api/client";
import { FIRCase, TacticalAnalyticsSummary } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PIE_COLORS = ["#63E6D2", "#69A9FF", "#F2B66D", "#F85149", "#10B981"];

export function AnalyticsPage() {
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [analytics, setAnalytics] = useState<TacticalAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"30d" | "90d" | "1y">("30d");

  useEffect(() => {
    Promise.all([apiClient.getCases(), apiClient.getTacticalAnalytics()])
      .then(([casesRes, anRes]) => {
        setCases(casesRes.data);
        setAnalytics(anRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.crimeCategory] = (counts[c.crimeCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  // Station clearance metrics
  const stationData = useMemo(() => {
    if (analytics?.stationClearanceRates) {
      return analytics.stationClearanceRates;
    }
    return [
      { station: "Indiranagar", total: 18, cleared: 14, ratePercent: 77.7 },
      { station: "K.R. Puram", total: 24, cleared: 16, ratePercent: 66.6 },
      { station: "Whitefield", total: 31, cleared: 22, ratePercent: 70.9 },
      { station: "Cubbon Park", total: 12, cleared: 10, ratePercent: 83.3 },
    ];
  }, [analytics]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tactical Analytics & Crime Velocity"
        subtitle="Multi-dimensional trend analysis, clearance rates, repeat offender recidivism indices, and station workload distribution."
        badge={
          <Badge variant="tactical" dot={true}>
            ANALYTICS ENGINE // RECHARTS
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Exporting tactical analytics summary to CSV format.")}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT REPORT</span>
            </Button>
          </div>
        }
      />

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="teal">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>30-Day Velocity Shift</span>
              <TrendingDown className="h-4 w-4 text-positive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-positive">-14.2%</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Decline vs previous period
            </div>
          </CardContent>
        </Card>

        <Card glow="blue">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Recidivism Index</span>
              <Activity className="h-4 w-4 text-secondary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">38.5%</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Repeat offender involvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Average Clearance Rate</span>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">74.6%</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Across all Bengaluru divisions
            </div>
          </CardContent>
        </Card>

        <Card glow="red">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Active Syndicates Flagged</span>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">3 Groups</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Cross-jurisdiction operations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Station Clearance Rate Bar Chart (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-xs font-mono">
              Station Division Clearance Comparison (%)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Clearance efficiency of reported cases across active police divisions.
            </p>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.5} />
                <XAxis dataKey="station" stroke="#A8B6C8" fontSize={10} fontVariant="mono" />
                <YAxis stroke="#A8B6C8" fontSize={10} fontVariant="mono" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#111C2E",
                    borderColor: "#28374A",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#F3F6FB",
                  }}
                />
                <Bar dataKey="ratePercent" fill="#63E6D2" radius={[4, 4, 0, 0]} name="Clearance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Donut / Pie Chart (5 cols) */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-xs font-mono">Category Volume Distribution</CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Proportional breakdown of active cases by crime archetype.
            </p>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#111C2E",
                    borderColor: "#28374A",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#F3F6FB",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
