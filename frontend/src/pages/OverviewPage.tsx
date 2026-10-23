import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldAlert,
  Radio,
  Clock,
  Sparkles,
  MapPin,
  FolderGit2,
  Share2,
  Download,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";

// Reusable Dashboard Components
import { KPIStatCard } from "@/components/dashboard/KPIStatCard";
import { DashboardFilterBar, DashboardFilterState } from "@/components/dashboard/DashboardFilterBar";
import { CrimeTrendChart } from "@/components/dashboard/CrimeTrendChart";
import { GeoIntelPanel } from "@/components/dashboard/GeoIntelPanel";
import { AskKestrelPanel } from "@/components/dashboard/AskKestrelPanel";
import { EntityNetworkPreview } from "@/components/dashboard/EntityNetworkPreview";
import { RecentRecordsTable } from "@/components/dashboard/RecentRecordsTable";

export function OverviewPage() {
  const [allCases, setAllCases] = useState<FIRCase[]>([]);
  const [allSuspects, setAllSuspects] = useState<AccusedSuspect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<boolean>(false);

  // Filter State
  const [filterState, setFilterState] = useState<DashboardFilterState>({
    dateRange: "all",
    policeStation: "all",
    category: "all",
    priority: "all",
    searchQuery: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, suspectsRes] = await Promise.all([
        apiClient.getCases(),
        apiClient.getAccused(),
      ]);
      setAllCases(casesRes.data);
      setAllSuspects(suspectsRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load tactical telemetry stream.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Available Stations & Categories dynamically
  const availableStations = useMemo(() => {
    return Array.from(new Set(allCases.map((c) => c.policeStation))).sort();
  }, [allCases]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(allCases.map((c) => c.crimeCategory))).sort();
  }, [allCases]);

  // Apply Filters Client-side
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      // Station filter
      if (
        filterState.policeStation !== "all" &&
        c.policeStation.toLowerCase() !== filterState.policeStation.toLowerCase()
      ) {
        return false;
      }

      // Category filter
      if (
        filterState.category !== "all" &&
        c.crimeCategory.toLowerCase() !== filterState.category.toLowerCase()
      ) {
        return false;
      }

      // Priority filter
      if (
        filterState.priority !== "all" &&
        c.priority !== filterState.priority
      ) {
        return false;
      }

      // Date Range filter (simulation based on days from reference)
      if (filterState.dateRange !== "all") {
        const incidentTime = new Date(c.incidentDate).getTime();
        const now = new Date("2024-10-23T12:00:00Z").getTime(); // fixed demo reference point
        const diffHours = (now - incidentTime) / (1000 * 60 * 60);

        if (filterState.dateRange === "24h" && diffHours > 48) return false;
        if (filterState.dateRange === "7d" && diffHours > 7 * 24) return false;
        if (filterState.dateRange === "30d" && diffHours > 30 * 24) return false;
      }

      // Search Query
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        return (
          c.firNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.applicableActs.some((a) => a.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [allCases, filterState]);

  // KPI Calculations
  const totalRecords = filteredCases.length;
  const casesUnderReview = filteredCases.filter(
    (c) => c.status === "Under Investigation"
  ).length;
  const criticalCases = filteredCases.filter((c) => c.priority === "Critical").length;
  const activeHotspotCount = useMemo(() => {
    return new Set(filteredCases.map((c) => c.policeStation)).size;
  }, [filteredCases]);

  // Handlers
  const handleFilterChange = (updated: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updated }));
  };

  const handleExportBriefing = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Intelligence Overview"
        subtitle="Explore patterns, relationships and geographic insights across the available records."
        badge={
          <Badge variant="tactical" dot={true}>
            SYNTHETIC TELEMETRY // DEMO
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBriefing}
              className="gap-1.5 font-mono text-xs"
            >
              {exportNotice ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-positive" />
                  <span>BRIEFING COMPILED</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>EXPORT BRIEF</span>
                </>
              )}
            </Button>
            <Link to="/copilot">
              <Button variant="tactical" size="sm" className="gap-1.5 font-mono text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ASK KESTREL</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Responsive Dashboard Operational Filter Bar */}
      <DashboardFilterBar
        filters={filterState}
        onChange={handleFilterChange}
        onRefresh={fetchData}
        availableStations={availableStations}
        availableCategories={availableCategories}
        totalMatches={totalRecords}
      />

      {/* 3. Error or Loading Handling */}
      {error && (
        <StateView
          variant="error"
          title="Telemetry Bus Failure"
          description={error}
          actionLabel="Retry Connection"
          onAction={fetchData}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* 4. Four Primary KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIStatCard
              title="Total Records"
              value={totalRecords}
              description="Chronologically indexed FIRs"
              trend={{ value: "+14.2%", isPositive: true }}
              icon={<Activity className="h-4 w-4 text-primary" />}
              glow="teal"
              targetRoute="/cases"
            />
            <KPIStatCard
              title="Cases Under Review"
              value={casesUnderReview}
              description="Active station inquiries"
              trend={{ value: "-6.1%", isPositive: true }}
              icon={<Radio className="h-4 w-4 text-secondary" />}
              glow="blue"
              targetRoute="/cases"
            />
            <KPIStatCard
              title="Linked Entities"
              value={allSuspects.length}
              description="Accused & syndicate nodes"
              trend={{ value: "3 Gangs", isNeutral: true }}
              icon={<Share2 className="h-4 w-4 text-primary" />}
              targetRoute="/network"
            />
            <KPIStatCard
              title="Geographic Hotspots"
              value={activeHotspotCount}
              description="High-density station clusters"
              trend={{ value: `${criticalCases} Critical`, isPositive: criticalCases === 0 ? true : false }}
              icon={<MapPin className="h-4 w-4 text-destructive" />}
              glow={criticalCases > 0 ? "red" : "none"}
              targetRoute="/gis"
            />
          </div>

          {/* 5. Asymmetric Swiss Bento Layout Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Trend & Velocity Chart (7 cols) */}
            <div className="lg:col-span-7">
              <CrimeTrendChart cases={filteredCases} />
            </div>

            {/* Geographic Intelligence Panel (5 cols) */}
            <div className="lg:col-span-5">
              <GeoIntelPanel cases={filteredCases} />
            </div>

            {/* "Ask Kestrel" Conversational Copilot Entry Point (6 cols) */}
            <div className="lg:col-span-6">
              <AskKestrelPanel
                onExecuteQuery={(q) => {
                  if (q.includes("Indiranagar")) {
                    handleFilterChange({ policeStation: "Indiranagar" });
                  }
                }}
              />
            </div>

            {/* Entity-Relationship Network Preview (6 cols) */}
            <div className="lg:col-span-6">
              <EntityNetworkPreview />
            </div>

            {/* Full-width Recent Records & Priority Incident Table (12 cols) */}
            <div className="lg:col-span-12">
              <RecentRecordsTable cases={filteredCases} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
