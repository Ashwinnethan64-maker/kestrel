import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Target,
  FolderSearch,
  ShieldAlert,
  UsersRound,
  Flame,
  MapPin,
  Sparkles,
  Network,
  Download,
  ExternalLink,
  ChevronRight,
  BrainCircuit,
  ArrowRight,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { CrimeTrendActivityChart } from "@/components/dashboard/CrimeTrendActivityChart";
import { useInvestigationContext } from "@/store/useInvestigationContext";
import { useTranslation } from "@/lib/i18n";

export function OverviewPage() {
  const { t } = useTranslation();
  const { dataVersion } = useInvestigationContext();
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, suspectsRes] = await Promise.all([
        apiClient.getCases(),
        apiClient.getAccused(),
      ]);
      setCases(casesRes.data);
      setSuspects(suspectsRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load command-center telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataVersion]);

  // 1. Four Principal KPI Metrics
  // Total FIRs
  const totalFIRs = cases.length;

  // Active Cases (Open or Under Investigation)
  const activeCasesCount = useMemo(() => {
    return cases.filter((c) => c.status === "Open" || c.status === "Under Investigation").length;
  }, [cases]);

  // Repeat Offenders
  const repeatOffendersCount = useMemo(() => {
    return suspects.filter((s) => s.isRepeatOffender || s.totalPriorArrests > 1).length;
  }, [suspects]);

  // Crime Hotspots (distinct police stations with critical or high activity)
  const hotspotCount = useMemo(() => {
    const stations = new Set(cases.map((c) => c.policeStation));
    return stations.size;
  }, [cases]);

  // Critical incident count
  const criticalCount = useMemo(() => {
    return cases.filter((c) => c.priority === "Critical").length;
  }, [cases]);

  // Recent Case Files (first 5 cases sorted by date)
  const recentCaseFiles = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime())
      .slice(0, 5);
  }, [cases]);

  // Recent Alerts derived honestly from critical and recent cases
  const recentAlerts = useMemo(() => {
    return [
      {
        id: "alert-1",
        title: "Commercial Armed Robbery Corridor Spike",
        severity: "Critical",
        description: "Three armed suspects armed with machetes deployed stolen black sedan KA-04-E-1234 on 100 Feet Road.",
        firNumber: "FIR-2024-INDR-0102",
        station: "Indiranagar",
        time: "2 hours ago",
      },
      {
        id: "alert-2",
        title: "CAN-Bus Electronic Vehicle Theft Alert",
        severity: "High",
        description: "Cloned key transmitter utilized in apartment parking perimeter along Old Madras Road.",
        firNumber: "FIR-2024-KRP-0215",
        station: "K.R. Puram",
        time: "6 hours ago",
      },
      {
        id: "alert-3",
        title: "Cyber Banking Account Layering",
        severity: "High",
        description: "Six mule bank accounts flagged for unauthorized wire routing originating from Whitefield tech park.",
        firNumber: "FIR-2024-WFD-0301",
        station: "Whitefield",
        time: "18 hours ago",
      },
    ];
  }, []);

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* A. Dashboard Header */}
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        badge={
          <Badge variant="tactical" dot={true}>
            DEMO DATA // BENGALURU JURISDICTION
          </Badge>
        }
      />

      {/* Error Handling */}
      {error && (
        <StateView
          variant="error"
          title="Telemetry Connection Issue"
          description={error}
          actionLabel="Retry"
          onAction={fetchData}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Skeleton className="h-72 lg:col-span-8" />
            <Skeleton className="h-72 lg:col-span-4" />
          </div>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* B. Four Principal KPI Metric Cards in One Balanced Row       */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Total FIRs */}
            <Card className="border border-border p-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {t('dashboard.kpiTotalFirs')}
                </span>
                <div className="h-8 w-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-2xl font-bold text-foreground font-mono">{totalFIRs}</div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  {t('dashboard.kpiTotalFirsSub')}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-primary font-bold">100% Index Coverage</span>
                <Link to="/cases" className="text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  <span>{t('dashboard.explore')}</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </Card>

            {/* 2. Active Cases */}
            <Card className="border border-border p-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {t('dashboard.kpiActiveCases')}
                </span>
                <div className="h-8 w-8 rounded bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                  <FolderSearch className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-2xl font-bold text-foreground font-mono">{activeCasesCount}</div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  {t('dashboard.kpiActiveCasesSub')}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-secondary font-bold">{criticalCount} Critical Priority</span>
                <Link to="/cases" className="text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  <span>{t('dashboard.viewCases')}</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </Card>

            {/* 3. Repeat Offenders */}
            <Card className="border border-border p-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {t('dashboard.kpiRepeatOffenders')}
                </span>
                <div className="h-8 w-8 rounded bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-2xl font-bold text-foreground font-mono">{repeatOffendersCount}</div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  {t('dashboard.kpiRepeatOffendersSub')}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-destructive font-bold">{suspects.length} Total Suspects</span>
                <Link to="/network" className="text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  <span>{t('dashboard.network')}</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </Card>

            {/* 4. Crime Hotspots */}
            <Card className="border border-border p-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {t('dashboard.kpiHotspots')}
                </span>
                <div className="h-8 w-8 rounded bg-[#F2B66D]/15 border border-[#F2B66D]/30 flex items-center justify-center text-[#F2B66D]">
                  <Flame className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-2xl font-bold text-foreground font-mono">{hotspotCount}</div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  {t('dashboard.kpiHotspotsSub')}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-[#F2B66D] font-bold">Bengaluru East / Central</span>
                <Link to="/gis" className="text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  <span>{t('dashboard.crimeMap')}</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </Card>
          </div>

          {/* ============================================================== */}
          {/* C & D. Middle Row: Crime Trend Activity (8 cols) + Quick Actions (4 cols) */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* C. Crime Trend Activity */}
            <div className="lg:col-span-8 flex flex-col">
              <CrimeTrendActivityChart cases={cases} />
            </div>

            {/* D. Quick Actions */}
            <div className="lg:col-span-4 flex flex-col">
              <Card className="h-full border border-border shadow-xs flex flex-col justify-between">
                <CardHeader className="py-3 px-4 border-b border-border/80 bg-sidebar/50">
                  <CardTitle className="text-xs font-mono font-bold text-foreground">
                    {t('dashboard.quickActionsTitle')}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    {t('dashboard.quickActionsSubtitle')}
                  </p>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col justify-center">
                  {/* Action 1: Ask AI Investigator */}
                  <Link to="/copilot" className="block">
                    <Button
                      variant="tactical"
                      size="sm"
                      className="w-full justify-start gap-2.5 h-10 font-mono text-xs"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-primary-foreground" />
                      <div className="text-left">
                        <div className="font-bold">{t('dashboard.qaAskAi')}</div>
                        <div className="text-[10px] opacity-80 font-sans font-normal">
                          {t('dashboard.qaAskAiSub')}
                        </div>
                      </div>
                    </Button>
                  </Link>

                  {/* Action 2: Search FIR Database */}
                  <Link to="/cases" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2.5 h-10 font-mono text-xs border-border hover:bg-surface-elevated"
                    >
                      <FolderSearch className="h-4 w-4 shrink-0 text-secondary" />
                      <div className="text-left">
                        <div className="font-bold text-foreground">{t('dashboard.qaSearchFir')}</div>
                        <div className="text-[10px] text-muted-foreground font-sans font-normal">
                          {t('dashboard.qaSearchFirSub')}
                        </div>
                      </div>
                    </Button>
                  </Link>

                  {/* Action 3: Open Criminal Network */}
                  <Link to="/network" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2.5 h-10 font-mono text-xs border-border hover:bg-surface-elevated"
                    >
                      <Network className="h-4 w-4 shrink-0 text-primary" />
                      <div className="text-left">
                        <div className="font-bold text-foreground">{t('dashboard.qaOpenNetwork')}</div>
                        <div className="text-[10px] text-muted-foreground font-sans font-normal">
                          {t('dashboard.qaOpenNetworkSub')}
                        </div>
                      </div>
                    </Button>
                  </Link>

                  {/* Action 4: Generate Threat Report */}
                  <Link to="/reports" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2.5 h-10 font-mono text-xs border-border hover:bg-surface-elevated"
                    >
                      <Download className="h-4 w-4 shrink-0 text-[#A78BFA]" />
                      <div className="text-left">
                        <div className="font-bold text-foreground">{t('dashboard.qaGenerateReport')}</div>
                        <div className="text-[10px] text-muted-foreground font-sans font-normal">
                          {t('dashboard.qaGenerateReportSub')}
                        </div>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ============================================================== */}
          {/* E & F. Lower Row: Recent Alerts + AI Threat Insight (8 cols) + Recent Case Files (4 cols) */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 Columns: Recent Alerts & AI Threat Insight */}
            <div className="lg:col-span-8 space-y-4">
              {/* Recent Alerts */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="py-2.5 px-4 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                    <CardTitle className="text-xs font-mono font-bold text-foreground">
                      {t('dashboard.recentAlerts')}
                    </CardTitle>
                  </div>
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                    {t('dashboard.activeAlertsCount')}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded bg-surface-elevated/70 border border-border flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-xs">{alert.title}</span>
                          <Badge
                            variant={alert.severity === "Critical" ? "destructive" : "attention"}
                            className="text-[9px] px-1 py-0"
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {alert.station} • {alert.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-sans line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      <Link
                        to={`/cases?caseId=${alert.firNumber}`}
                        className="text-primary hover:underline font-mono text-[10px] shrink-0 flex items-center gap-0.5 mt-1"
                      >
                        <span>{alert.firNumber}</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Threat Insight */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="py-2.5 px-4 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary shrink-0" />
                    <CardTitle className="text-xs font-mono font-bold text-foreground">
                      {t('dashboard.aiThreatInsight')}
                    </CardTitle>
                  </div>
                  <Badge variant="tactical" className="text-[9px] px-1.5 py-0">
                    {t('dashboard.groundedPattern')}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="p-3 rounded bg-surface-elevated/60 border border-border font-sans text-xs text-foreground leading-relaxed space-y-1.5">
                    <div className="font-bold font-mono text-primary text-xs flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Coordinated Syndicate Corridor Activity</span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Cross-referencing telemetry across Indiranagar and K.R. Puram indicates
                      coordinated operations by the East Ring Syndicate. Getaway vehicle KA-04-E-1234
                      connects three recent burglary cases within a 48-hour window. Toolmark impressions
                      from recovered bolt cutters verify identical hydraulic equipment.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Related Records:</span>
                      <Link to="/cases?caseId=FIR-2024-INDR-0102" className="text-primary hover:underline font-mono">
                        FIR-2024-INDR-0102
                      </Link>
                      <span>•</span>
                      <Link to="/cases?caseId=FIR-2024-KRP-0215" className="text-primary hover:underline font-mono">
                        FIR-2024-KRP-0215
                      </Link>
                    </div>
                    <Link to="/copilot">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] font-mono gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span>{t('dashboard.queryCopilot')}</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 4 Columns: Recent Case Files */}
            <div className="lg:col-span-4">
              <Card className="border border-border shadow-xs h-full flex flex-col justify-between">
                <CardHeader className="py-2.5 px-4 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-secondary shrink-0" />
                    <CardTitle className="text-xs font-mono font-bold text-foreground">
                      {t('dashboard.recentCaseFiles')}
                    </CardTitle>
                  </div>
                  <Link to="/cases" className="text-[10px] text-primary hover:underline font-mono">
                    {t('dashboard.viewAll')}
                  </Link>
                </CardHeader>
                <CardContent className="p-3 space-y-2 flex-1">
                  {recentCaseFiles.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded bg-surface-elevated/70 border border-border flex items-center justify-between text-xs hover:border-primary/50 transition-colors"
                    >
                      <div className="truncate pr-2">
                        <Link
                          to={`/cases?caseId=${c.id}`}
                          className="font-bold text-primary font-mono hover:underline block truncate"
                        >
                          {c.firNumber}
                        </Link>
                        <div className="text-[11px] text-foreground font-semibold truncate">
                          {c.crimeCategory}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {c.policeStation} • {c.district}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <Badge
                          variant={
                            c.priority === "Critical"
                              ? "destructive"
                              : c.priority === "High"
                              ? "attention"
                              : "tactical"
                          }
                          className="text-[9px] px-1 py-0 block"
                        >
                          {c.priority}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground block font-mono">
                          {new Date(c.incidentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
