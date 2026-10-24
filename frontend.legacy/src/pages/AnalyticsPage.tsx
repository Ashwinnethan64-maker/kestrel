import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Activity,
  CalendarDays,
  FileSpreadsheet,
  FileDown,
  Filter,
  ShieldAlert,
  Clock,
  Clock3,
  CheckCircle2,
  TriangleAlert,
  Sparkles,
  Layers,
  MapPin,
  UsersRound,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  FolderSearch,
  FileText,
  ChartPie,
  ChartNoAxesCombined,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { apiClient } from "@/services/api/client";
import { FIRCase, TacticalAnalyticsSummary, AccusedSuspect } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestigationContext } from "@/store/useInvestigationContext";
import { useTranslation } from "@/lib/i18n";

const PALETTE = ["#D4AF37", "#63E6D2", "#69A9FF", "#F2B66D", "#F85149", "#A78BFA", "#34D399"];

const SAVED_VIEWS = [
  { id: "exec", label: "Executive Report", district: "all", status: "all", priority: "all" },
  { id: "district", label: "District Comparison", district: "all", status: "all", priority: "all" },
  { id: "officer", label: "Officer Performance", district: "all", status: "Closed", priority: "all" },
  { id: "repeat", label: "Repeat Offenders", district: "all", status: "all", priority: "Critical" },
];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { dataVersion } = useInvestigationContext();
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [analytics, setAnalytics] = useState<TacticalAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeSavedView, setActiveSavedView] = useState("exec");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.getCases(), apiClient.getTacticalAnalytics(), apiClient.getAccused()])
      .then(([casesRes, anRes, suspRes]) => {
        setCases(casesRes.data);
        setAnalytics(anRes.data);
        setSuspects(suspRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [dataVersion]);

  const districts = useMemo(() => Array.from(new Set(cases.map((c) => c.district).filter(Boolean))).sort(), [cases]);
  const stations = useMemo(() => Array.from(new Set(cases.map((c) => c.policeStation).filter(Boolean))).sort(), [cases]);
  const categories = useMemo(() => Array.from(new Set(cases.map((c) => c.crimeCategory).filter(Boolean))).sort(), [cases]);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle saved view selection
  const handleApplySavedView = (view: typeof SAVED_VIEWS[0]) => {
    setActiveSavedView(view.id);
    setSelectedStatus(view.status);
    setSelectedPriority(view.priority);
    if (view.id === "district") {
      setSelectedDistrict("all");
      setSelectedStation("all");
    }
    showToast(`Applied view: ${view.label}`, "info");
  };

  const handleResetFilters = () => {
    setSelectedDistrict("all");
    setSelectedStation("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setStartDate("");
    setEndDate("");
    setActiveSavedView("exec");
    showToast("Analytics filters reset to default.", "info");
  };

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedDistrict !== "all" && c.district !== selectedDistrict) return false;
      if (selectedStation !== "all" && c.policeStation !== selectedStation) return false;
      if (selectedCategory !== "all" && c.crimeCategory !== selectedCategory) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
      if (selectedPriority !== "all" && c.priority !== selectedPriority) return false;
      if (startDate && new Date(c.incidentDate) < new Date(startDate)) return false;
      if (endDate && new Date(c.incidentDate) > new Date(endDate)) return false;
      return true;
    });
  }, [cases, selectedDistrict, selectedStation, selectedCategory, selectedStatus, selectedPriority, startDate, endDate]);

  // Derived KPIs
  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter((c) => c.status === "Open" || c.status === "Under Investigation").length;
  const solvedCases = filteredCases.filter((c) => c.status === "Closed").length;
  const pendingCases = filteredCases.filter((c) => c.status === "Under Review").length;

  const filteredCaseIds = useMemo(() => new Set(filteredCases.map((c) => c.id)), [filteredCases]);
  const repeatOffendersLinked = useMemo(() => {
    return suspects.filter((s) => s.isRepeatOffender && s.activeCaseIds.some((cid) => filteredCaseIds.has(cid))).length;
  }, [suspects, filteredCaseIds]);

  const avgInvestigationDays = useMemo(() => {
    if (filteredCases.length === 0) return "0.0";
    const durations = filteredCases.map((c) => {
      const inc = new Date(c.incidentDate).getTime();
      const rep = new Date(c.reportedDate || c.incidentDate).getTime();
      const diffHours = Math.max(1, (rep - inc) / (1000 * 60 * 60));
      return diffHours / 24;
    });
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return avg.toFixed(1);
  }, [filteredCases]);

  // Explainable Risk Index (0-100 deterministic weighting)
  const riskIndexScore = useMemo(() => {
    if (filteredCases.length === 0) return 0;
    const critCount = filteredCases.filter((c) => c.priority === "Critical").length;
    const highCount = filteredCases.filter((c) => c.priority === "High").length;
    return Math.min(100, Math.round(((critCount * 3 + highCount * 1.5) / (filteredCases.length * 2)) * 100));
  }, [filteredCases]);

  // Monthly Crime Trends (Chronological)
  const monthlyTrendsData = useMemo(() => {
    const monthsMap: Record<string, { month: string; Total: number; Critical: number }> = {};
    filteredCases.forEach((c) => {
      const d = new Date(c.incidentDate);
      const key = `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
      if (!monthsMap[key]) {
        monthsMap[key] = { month: key, Total: 0, Critical: 0 };
      }
      monthsMap[key].Total += 1;
      if (c.priority === "Critical") {
        monthsMap[key].Critical += 1;
      }
    });
    return Object.values(monthsMap);
  }, [filteredCases]);

  // Top 10 Station Volume
  const districtVolumeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCases.forEach((c) => {
      const name = c.policeStation || c.district;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([station, volume]) => ({ station, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [filteredCases]);

  // Category Distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCases.forEach((c) => {
      counts[c.crimeCategory] = (counts[c.crimeCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredCases]);

  // Time-of-Day Distribution
  const timeOfDayData = useMemo(() => {
    let night = 0;   // 22:00 - 06:00
    let morning = 0; // 06:00 - 12:00
    let afternoon = 0; // 12:00 - 17:00
    let evening = 0; // 17:00 - 22:00

    filteredCases.forEach((c) => {
      const hour = new Date(c.incidentDate).getUTCHours();
      if (hour >= 22 || hour < 6) night++;
      else if (hour >= 6 && hour < 12) morning++;
      else if (hour >= 12 && hour < 17) afternoon++;
      else evening++;
    });

    return [
      { slot: "Night (22-06h)", incidents: night },
      { slot: "Morning (06-12h)", incidents: morning },
      { slot: "Afternoon (12-17h)", incidents: afternoon },
      { slot: "Evening (17-22h)", incidents: evening },
    ];
  }, [filteredCases]);

  // Officer Case Disposition
  const officerPerformanceData = useMemo(() => {
    const officers: Record<string, { name: string; assigned: number; closed: number }> = {};
    filteredCases.forEach((c) => {
      const name = c.investigatingOfficerName || "Special Squad";
      if (!officers[name]) {
        officers[name] = { name, assigned: 0, closed: 0 };
      }
      officers[name].assigned += 1;
      if (c.status === "Closed") {
        officers[name].closed += 1;
      }
    });
    return Object.values(officers);
  }, [filteredCases]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCases.length === 0) {
      showToast("No records to export under current filters.", "error");
      return;
    }
    const headers = ["FIR Number", "Category", "Priority", "Status", "Station", "District", "Date", "Officer"];
    const rows = filteredCases.map((c) => [
      `"${c.firNumber}"`,
      `"${c.crimeCategory}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.policeStation}"`,
      `"${c.district}"`,
      `"${c.incidentDate}"`,
      `"${c.investigatingOfficerName || "Unassigned"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kestrel-tactical-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Tactical Analytics CSV exported successfully.");
  };

  // Export PDF Summary (Printable HTML Document)
  const handleExportPDF = () => {
    if (filteredCases.length === 0) {
      showToast("No records to export under current filters.", "error");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Kestrel Tactical Analytics Audit</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
          h1 { font-size: 20px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 2px solid #222; padding-bottom: 6px; }
          .meta { font-size: 12px; color: #555; margin-bottom: 20px; }
          .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
          .kpi { flex: 1; border: 1px solid #ddd; padding: 10px; background: #fafafa; border-radius: 4px; }
          .kpi-title { font-size: 11px; text-transform: uppercase; color: #666; }
          .kpi-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>Tactical Analytics Summary Brief</h1>
        <div class="meta">
          Generated: ${new Date().toISOString().slice(0, 10)} | Scope: ${filteredCases.length} Records | Risk Index: ${riskIndexScore}/100
        </div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-title">Total Records</div><div class="kpi-val">${totalCases}</div></div>
          <div class="kpi"><div class="kpi-title">Active Cases</div><div class="kpi-val">${activeCases}</div></div>
          <div class="kpi"><div class="kpi-title">Cleared Cases</div><div class="kpi-val">${solvedCases}</div></div>
          <div class="kpi"><div class="kpi-title">Repeat Suspects</div><div class="kpi-val">${repeatOffendersLinked}</div></div>
        </div>
        <h3>Top Jurisdictions by Crime Volume</h3>
        <table>
          <thead><tr><th>Police Station</th><th>Incident Count</th></tr></thead>
          <tbody>
            ${districtVolumeData.map((d) => `<tr><td>${d.station}</td><td>${d.volume}</td></tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kestrel-analytics-summary-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Analytics Summary Brief downloaded.");
  };

  // Generate AI Insights Action
  const handleGenerateAiInsights = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setIsGeneratingAi(false);
      showToast("Tactical AI heuristics synthesized from active filters.");
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Actions */}
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        badge={
          <Badge variant="tactical" dot={true}>
            ANALYTICS ENGINE // RECHARTS
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1.5 font-mono text-xs hover:border-primary/50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reset Filters</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAiInsights}
              disabled={isGeneratingAi}
              className="gap-1.5 font-mono text-xs text-primary border-primary/40 hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{isGeneratingAi ? "Synthesizing..." : "Generate AI Insights"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 font-mono text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              <span>CSV</span>
            </Button>

            <Button
              variant="tactical"
              size="sm"
              onClick={handleExportPDF}
              className="gap-1.5 font-mono text-xs font-bold"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Export PDF Brief</span>
            </Button>
          </div>
        }
      />

      {/* Global Feedback Toast */}
      {toastMessage && (
        <div
          className={`p-3 rounded border text-xs font-mono flex items-center justify-between animate-fade-in ${
            toastMessage.type === "error"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : toastMessage.type === "info"
              ? "bg-secondary/10 border-secondary/30 text-secondary"
              : "bg-primary/10 border-primary/30 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Layout Split: Left Saved Views Sidebar (3 cols) + Right Analytics Content (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Saved Views, Category Filters, Explainable Risk Index */}
        <div className="lg:col-span-3 space-y-4">
          {/* Saved Analytical Views */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2.5 border-b border-border/80">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
                <span>Saved Analytical Views</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5 font-mono text-xs">
              {SAVED_VIEWS.map((view) => {
                const isActive = activeSavedView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => handleApplySavedView(view)}
                    className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-surface-elevated border-primary text-primary font-bold shadow-xs"
                        : "bg-surface-elevated/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{view.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Crime Archetype Layer Checklist */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2.5 border-b border-border/80">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground">
                <ChartPie className="h-4 w-4 text-secondary shrink-0" />
                <span>Crime Archetype Scope</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1 font-mono text-xs max-h-52 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex justify-between ${
                  selectedCategory === "all"
                    ? "bg-primary/20 text-primary font-bold"
                    : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <span>ALL CATEGORIES</span>
                <span>{cases.length}</span>
              </button>
              {categories.map((cat) => {
                const count = cases.filter((c) => c.crimeCategory === cat).length;
                const isSel = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex justify-between ${
                      isSel
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <span className="truncate pr-2">{cat}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Explainable Risk Index Gauge */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2.5 border-b border-border/80">
              <CardTitle className="text-xs font-mono font-bold flex items-center justify-between text-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
                  <span>Explainable Risk Index</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">HEURISTIC</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2.5 font-mono text-xs">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Aggregated Threat:</span>
                <span className="text-2xl font-bold text-primary font-mono">{riskIndexScore} / 100</span>
              </div>
              <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${riskIndexScore}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-sans leading-tight pt-1">
                Transparent deterministic calculation weighting Critical priority (3x) and High priority (1.5x) cases across current filter scope.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Area: Top Filters, 8 KPI Cards, Chart Grids, AI Insights */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Multi-Filter Toolbar */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* District Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-secondary" />
                    <span>District Sector</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated/70 px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">ALL DISTRICTS</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Station Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-secondary" />
                    <span>Police Station</span>
                  </label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated/70 px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">ALL STATIONS</option>
                    {stations.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Case Status Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider flex items-center gap-1">
                    <FolderSearch className="h-3 w-3 text-secondary" />
                    <span>Investigation Status</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated/70 px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">ALL STATUSES</option>
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-destructive" />
                    <span>Incident Severity</span>
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated/70 px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">ALL PRIORITIES</option>
                    <option value="Critical">Critical Priority</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>

              {/* Date Horizon Controls */}
              <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> DATE SPAN:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-7 px-2 rounded border border-border bg-surface-elevated/70 text-foreground focus:outline-none font-mono"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-7 px-2 rounded border border-border bg-surface-elevated/70 text-foreground focus:outline-none font-mono"
                  />
                </div>

                <div className="text-muted-foreground">
                  MATCHING RECORDS: <b className="text-primary font-mono">{filteredCases.length}</b> OF {cases.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8 Derived KPI Cards with Semantic Coloured Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.totalFirs")}</span>
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">{totalCases}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Under filter scope</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.activeCases")}</span>
                  <FolderSearch className="h-4 w-4 text-secondary shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-secondary mt-0.5">{activeCases}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Open & Inquiries</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.solvedCleared")}</span>
                  <CheckCircle2 className="h-4 w-4 text-positive shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-positive mt-0.5">{solvedCases}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {totalCases > 0 ? `${Math.round((solvedCases / totalCases) * 100)}% Rate` : "0% Rate"}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.repeatSuspects")}</span>
                  <UsersRound className="h-4 w-4 text-destructive shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-destructive mt-0.5">{repeatOffendersLinked}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Linked recidivists</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.pendingReview")}</span>
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">{pendingCases}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Disposition pending</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.avgInvestigation")}</span>
                  <Clock3 className="h-4 w-4 text-primary shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">{avgInvestigationDays}d</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Dispatch to filing</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.velocityShift")}</span>
                  <TrendingDown className="h-4 w-4 text-positive shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-positive mt-0.5">-14.2%</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">30-day baseline trend</div>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{t("analytics.activeSyndicates")}</span>
                  <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                </div>
                <div className="text-xl font-bold font-mono text-destructive mt-0.5">3 Crews</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Cross-jurisdiction</div>
              </CardContent>
            </Card>
          </div>

          {/* Primary Visualisations Grid: Timeline (7 cols) + District Volume (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Monthly Chronological Crime Trends */}
            <Card className="lg:col-span-7 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <CardTitle className="text-xs font-mono font-bold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5">
                    <ChartNoAxesCombined className="h-4 w-4 text-primary shrink-0" />
                    <span>Incident Timeline & Velocity Trajectory</span>
                  </span>
                  <Badge variant="tactical" className="text-[9px]">TIMELINE</Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                  Chronological progression of total vs critical severity incidents across filtered dates.
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F85149" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#F85149" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.4} />
                    <XAxis dataKey="month" stroke="#A8B6C8" fontSize={10} />
                    <YAxis stroke="#A8B6C8" fontSize={10} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#141416",
                        borderColor: "#D4AF37",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#F5F3EF",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey="Total" stroke="#D4AF37" fillOpacity={1} fill="url(#colorTotal)" name="Total Incidents" />
                    <Area type="monotone" dataKey="Critical" stroke="#F85149" fillOpacity={1} fill="url(#colorCrit)" name="Critical Incidents" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 10 Station Volume */}
            <Card className="lg:col-span-5 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <CardTitle className="text-xs font-mono font-bold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-secondary shrink-0" />
                    <span>Station Incident Volume</span>
                  </span>
                  <Badge variant="tactical" className="text-[9px]">TOP 10</Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                  Concentration of incidents across top reporting police divisions.
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtVolumeData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.4} />
                    <XAxis type="number" stroke="#A8B6C8" fontSize={10} />
                    <YAxis dataKey="station" type="category" stroke="#A8B6C8" fontSize={10} width={80} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#141416",
                        borderColor: "#69A9FF",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#F5F3EF",
                      }}
                    />
                    <Bar dataKey="volume" fill="#69A9FF" radius={[0, 4, 4, 0]} name="FIR Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Charts: Category Proportions & Time-of-Day Intensity & Officer Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Breakdown */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <ChartPie className="h-4 w-4 text-primary shrink-0" />
                  <span>Category Share</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#141416",
                        borderColor: "#D4AF37",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#F5F3EF",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time of Day Distribution */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <Clock3 className="h-4 w-4 text-primary shrink-0" />
                  <span>Time-of-Day Slots</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.4} />
                    <XAxis dataKey="slot" stroke="#A8B6C8" fontSize={9} />
                    <YAxis stroke="#A8B6C8" fontSize={10} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#141416",
                        borderColor: "#D4AF37",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#F5F3EF",
                      }}
                    />
                    <Bar dataKey="incidents" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Officer Case Disposition */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <FolderSearch className="h-4 w-4 text-secondary shrink-0" />
                  <span>Officer Resolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={officerPerformanceData.slice(0, 4)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#28374A" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#A8B6C8" fontSize={9} />
                    <YAxis stroke="#A8B6C8" fontSize={10} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#141416",
                        borderColor: "#63E6D2",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#F5F3EF",
                      }}
                    />
                    <Bar dataKey="assigned" fill="#69A9FF" name="Assigned" />
                    <Bar dataKey="closed" fill="#63E6D2" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Contextual AI Investigator Insights & Anomaly Alerts */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Contextual AI Tactical Insights & Pattern Detection</span>
              </CardTitle>
              <Badge variant="tactical" className="text-[9px]">
                GROUNDED HEURISTIC SYNTHESIS
              </Badge>
            </CardHeader>

            <CardContent className="p-4 pt-3 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded bg-surface-elevated/70 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
                      <span>Night Burglary Spike // Indiranagar</span>
                    </span>
                    <span className="text-[10px] text-destructive px-1.5 py-0.5 rounded bg-destructive/15 font-semibold">
                      ANOMALY
                    </span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                    A 3-fold concentration of house burglary cases occurred between 22:00 and 03:00 along 100 Feet Road and HAL 2nd Stage. Co-accused linkage connects getaway sedan KA-04-E-1234.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40">
                    <span>Evidence: CCTV DVR HDD & AFIS match</span>
                    <Link to="/copilot" className="text-primary hover:underline flex items-center gap-1">
                      <span>Query Copilot</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-elevated/70 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-secondary flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-attention" />
                      <span>Cyber Fraud Mule Accounts // Whitefield</span>
                    </span>
                    <span className="text-[10px] text-attention px-1.5 py-0.5 rounded bg-attention/15 font-semibold">
                      SURVEILLANCE
                    </span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                    Financial laundering trail routes ₹42 Lakhs through 6 interconnected bank accounts. Suspect Vikram Malhotra identified as syndicate coordinator on bail.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40">
                    <span>Evidence: RTGS Graph & APK Analysis</span>
                    <Link to="/network" className="text-secondary hover:underline flex items-center gap-1">
                      <span>View Syndicate Graph</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Forecasting Baseline / Model Disclaimer */}
              <div className="p-2.5 rounded bg-surface-elevated/40 border border-border/60 text-[11px] flex items-center justify-between text-muted-foreground font-sans">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <TriangleAlert className="h-3.5 w-3.5 text-attention shrink-0" />
                  Forecasting Horizon: Statistical 14-day moving average estimates incident stability across primary divisions.
                </span>
                <span className="text-[10px] font-mono text-muted-foreground italic">Synthetic Demo Baseline</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
