import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  SlidersHorizontal,
  Tags,
  MapPin,
  Building2,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Files,
  Search,
  FileDown,
  FileSpreadsheet,
  Eye,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  CircleAlert,
  Info,
  Clock,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useInvestigationContext } from "@/store/useInvestigationContext";
import { useTranslation } from "@/lib/i18n";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";

interface IntelligenceReport {
  id: string;
  title: string;
  category: "SITREP" | "Dossier Brief" | "Crime Audit" | "Patrol Directive";
  classification: "CLASSIFIED // RESTRICTED" | "OFFICIAL LAW ENFORCEMENT";
  author: string;
  generatedDate: string;
  caseCount: number;
  status: "Finalized" | "Draft" | "Under Review";
  summary: string;
  type: "PDF" | "CSV";
  casesData?: FIRCase[];
}

const INITIAL_REPORTS: IntelligenceReport[] = [
  {
    id: "REP-2024-089",
    title: "Bengaluru East Tactical Situation Report (SITREP)",
    category: "SITREP",
    classification: "CLASSIFIED // RESTRICTED",
    author: "Insp. Sharma (Badge #KSP-4491)",
    generatedDate: "2024-10-23",
    caseCount: 14,
    status: "Finalized",
    type: "PDF",
    summary:
      "Comprehensive assessment of night burglary surges in Indiranagar and vehicle thefts along the Outer Ring Road. Outlines prime suspect modus operandi and optimal checkpoint placements.",
  },
  {
    id: "REP-2024-088",
    title: "Syndicate Hierarchy Brief // Indiranagar Ring",
    category: "Dossier Brief",
    classification: "CLASSIFIED // RESTRICTED",
    author: "Intelligence Cell BLR",
    generatedDate: "2024-10-21",
    caseCount: 8,
    status: "Finalized",
    type: "PDF",
    summary:
      "Cross-case linkage matrix examining co-accused associations between Raju Nayak and Mohammed Farooq, linking getaway vehicle sightings at Hebbal toll gates.",
  },
  {
    id: "REP-2024-087",
    title: "Monthly Recidivism & Clearance Analysis",
    category: "Crime Audit",
    classification: "OFFICIAL LAW ENFORCEMENT",
    author: "SP Crime Records Bureau",
    generatedDate: "2024-10-15",
    caseCount: 45,
    status: "Finalized",
    type: "CSV",
    summary:
      "Statistical evaluation of 30-day case disposition velocities across 6 police stations. Demonstrates 74.6% overall clearance efficiency.",
  },
];

export function ReportsPage() {
  const { t } = useTranslation();
  const { dataVersion } = useInvestigationContext();
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<IntelligenceReport | null>(null);
  const [inspectingCase, setInspectingCase] = useState<FIRCase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // Form State
  const [reportTitle, setReportTitle] = useState("Tactical Situation Brief");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterStation, setFilterStation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    apiClient.getCases().then((res) => {
      setCases(res.data);
    });
  }, [dataVersion]);

  const categories = useMemo(() => Array.from(new Set(cases.map((c) => c.crimeCategory).filter(Boolean))).sort(), [cases]);
  const districts = useMemo(() => Array.from(new Set(cases.map((c) => c.district).filter(Boolean))).sort(), [cases]);
  const stations = useMemo(() => Array.from(new Set(cases.map((c) => c.policeStation).filter(Boolean))).sort(), [cases]);

  // Matching Cases Scope
  const matchingCases = useMemo(() => {
    return cases.filter((c) => {
      if (filterCategory !== "all" && c.crimeCategory !== filterCategory) return false;
      if (filterDistrict !== "all" && c.district !== filterDistrict) return false;
      if (filterStation !== "all" && c.policeStation !== filterStation) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterSeverity !== "all" && c.priority !== filterSeverity) return false;
      if (startDate && new Date(c.incidentDate) < new Date(startDate)) return false;
      if (endDate && new Date(c.incidentDate) > new Date(endDate)) return false;
      return true;
    });
  }, [cases, filterCategory, filterDistrict, filterStation, filterStatus, filterSeverity, startDate, endDate]);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleClearConstraints = () => {
    setReportTitle("Tactical Situation Brief");
    setFilterCategory("all");
    setFilterDistrict("all");
    setFilterStation("all");
    setFilterStatus("all");
    setFilterSeverity("all");
    setStartDate("");
    setEndDate("");
    showToast("Report builder constraints cleared.", "info");
  };

  // Generate and Download Real RFC-4180 CSV
  const handleGenerateCSV = () => {
    if (matchingCases.length === 0) {
      showToast("No records match current scope constraints.", "error");
      return;
    }

    exportToCSV({
      headers: [
        "FIR Number", "Crime Category", "Priority Severity", "Case Status",
        "Police Station", "District", "Incident Date", "Investigating Officer",
        "Applicable Acts", "Description",
      ],
      rows: matchingCases.map((c) => [
        c.firNumber,
        c.crimeCategory,
        c.priority,
        c.status,
        c.policeStation,
        c.district,
        c.incidentDate,
        c.investigatingOfficerName || 'Unassigned',
        (c.applicableActs || []).join('; '),
        c.description,
      ]),
      filename: `kestrel-${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.csv`,
    });

    const newReport: IntelligenceReport = {
      id: `REP-2024-${100 + reports.length}`,
      title: `${reportTitle} [CSV Data Export]`,
      category: "Crime Audit",
      classification: "OFFICIAL LAW ENFORCEMENT",
      author: "Insp. Sharma (Badge #KSP-4491)",
      generatedDate: new Date().toISOString().split("T")[0],
      caseCount: matchingCases.length,
      status: "Finalized",
      type: "CSV",
      summary: `Automated tabular export covering ${matchingCases.length} incident records in ${filterStation !== "all" ? filterStation : "All Police Stations"} (${filterDistrict !== "all" ? filterDistrict : "All Districts"}).`,
      casesData: [...matchingCases],
    };

    setReports((prev) => [newReport, ...prev]);
    showToast(`CSV exported with ${matchingCases.length} records.`);
  };

  // Generate Genuine Binary PDF Report using jsPDF
  const handleGeneratePDF = () => {
    if (matchingCases.length === 0) {
      showToast("No records match current scope constraints.", "error");
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const generatedId = `REP-2024-${100 + reports.length}`;
      const genDate = new Date().toISOString().split("T")[0];

      exportToPDF({
        title: reportTitle,
        id: generatedId,
        classification: 'CLASSIFIED // RESTRICTED',
        author: 'Insp. Sharma (Badge #KSP-4491)',
        date: genDate,
        scope: `Category: ${filterCategory} | District: ${filterDistrict} | Station: ${filterStation} | Priority: ${filterSeverity}`,
        summaryText: `Intelligence briefing synthesizing ${matchingCases.length} verified First Information Records. Includes incident progression, statutory sections applied, and operational recommendations for deployment.`,
        headers: ['FIR Number', 'Category', 'Station', 'Severity', 'Status', 'Date'],
        rows: matchingCases.map((c) => [
          c.firNumber,
          c.crimeCategory,
          c.policeStation,
          c.priority,
          c.status,
          c.incidentDate.slice(0, 10),
        ]),
        filename: `kestrel-brief-${generatedId}.pdf`,
      });

      const newReport: IntelligenceReport = {
        id: generatedId,
        title: `${reportTitle} [SITREP Brief]`,
        category: "SITREP",
        classification: "CLASSIFIED // RESTRICTED",
        author: "Insp. Sharma (Badge #KSP-4491)",
        generatedDate: genDate,
        caseCount: matchingCases.length,
        status: "Finalized",
        type: "PDF",
        summary: `Synthesized operational briefing covering ${matchingCases.length} verified First Information Records across ${filterStation !== "all" ? filterStation : "Bengaluru Metro divisions"}.`,
        casesData: [...matchingCases],
      };

      setReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
      setSelectedReport(newReport);
      showToast(`PDF Intelligence Brief compiled: ${generatedId}`);
    }, 600);
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    setReports((prev) => prev.filter((r) => r.id !== reportToDelete));
    showToast(`Dossier ${reportToDelete} removed from recent exports.`, "info");
    setReportToDelete(null);
  };

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        badge={
          <Badge variant="tactical" dot={true}>
            REPORT ENGINE // READY
          </Badge>
        }
      />

      {/* Toast Feedback */}
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
            {toastMessage.type === "error" ? (
              <CircleAlert className="h-4 w-4 shrink-0 text-destructive" />
            ) : toastMessage.type === "info" ? (
              <Info className="h-4 w-4 shrink-0 text-secondary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Builder Grid: Left Configuration Form (~65%) + Right Scope & Previews (~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Report Configuration Form (approx 62% -> 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-border/80">
              <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
                <span>Report Builder Configuration</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 pt-4 space-y-4 font-mono text-xs">
              {/* Report Title */}
              <div className="space-y-1.5">
                <label htmlFor="report-title" className="text-[11px] text-muted-foreground block font-semibold uppercase tracking-wider">
                  Dossier / Report Title
                </label>
                <div className="relative">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <input
                    id="report-title"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                    placeholder="e.g. Tactical Situation Brief"
                  />
                </div>
              </div>

              {/* Selectors Row 1: Category, District, Police Station */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="filter-cat" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <Tags className="h-3 w-3 text-primary" />
                    <span>Crime Category</span>
                  </label>
                  <select
                    id="filter-cat"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full h-9 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-foreground focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="all">ALL CATEGORIES</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="filter-dist" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <MapPin className="h-3 w-3 text-secondary" />
                    <span>District</span>
                  </label>
                  <select
                    id="filter-dist"
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="w-full h-9 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-foreground focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="all">ALL DISTRICTS</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="filter-station" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <Building2 className="h-3 w-3 text-secondary" />
                    <span>Police Station</span>
                  </label>
                  <select
                    id="filter-station"
                    value={filterStation}
                    onChange={(e) => setFilterStation(e.target.value)}
                    className="w-full h-9 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-foreground focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="all">ALL STATIONS</option>
                    {stations.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selectors Row 2: Status, Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="filter-status" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <ClipboardList className="h-3 w-3 text-secondary" />
                    <span>Investigation Status</span>
                  </label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-9 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-foreground focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="all">ALL STATUSES</option>
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="filter-severity" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <ShieldAlert className="h-3 w-3 text-destructive" />
                    <span>Incident Severity</span>
                  </label>
                  <select
                    id="filter-severity"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full h-9 rounded border border-border bg-surface-elevated/70 px-2.5 py-1 text-foreground focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="all">ALL SEVERITIES</option>
                    <option value="Critical">Critical Priority</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>

              {/* Date Horizons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="start-date" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    <span>Start Date Horizon</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="end-date" className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    <span>End Date Horizon</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded border border-border bg-surface-elevated/70 text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Clean Bottom Action Row */}
              <div className="pt-3 border-t border-border/80 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearConstraints}
                  className="gap-1.5 text-xs font-mono"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Clear Constraints</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCSV}
                    className="gap-1.5 text-xs font-mono hover:border-primary/50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                    <span>Generate CSV</span>
                  </Button>

                  <Button
                    type="button"
                    variant="tactical"
                    size="sm"
                    disabled={isGenerating}
                    onClick={handleGeneratePDF}
                    className="gap-1.5 text-xs font-mono font-bold"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Generate PDF Report</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Real-Time Scope Verification & Attached Case Previews (approx 38% -> 4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Scope Verification</span>
              </CardTitle>
              <Badge variant="tactical" className="font-mono text-[10px]">
                {matchingCases.length} Records
              </Badge>
            </CardHeader>

            <CardContent className="p-4 pt-3 space-y-3 font-mono text-xs">
              {/* Summary Metrics */}
              <div className="p-3 rounded bg-surface-elevated/70 border border-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Scope Cases:</span>
                  <span className="font-bold text-primary">{matchingCases.length} of {cases.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jurisdiction:</span>
                  <span className="text-foreground truncate max-w-[170px] text-right">
                    {filterStation !== "all" ? filterStation : filterDistrict !== "all" ? filterDistrict : "All Metro Sectors"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="text-foreground truncate max-w-[170px] text-right">
                    {filterCategory === "all" ? "All Archetypes" : filterCategory}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Severity:</span>
                  <span className="text-foreground">{filterSeverity === "all" ? "All Priorities" : filterSeverity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-foreground">{filterStatus === "all" ? "All Statuses" : filterStatus}</span>
                </div>
              </div>

              {/* Attached Case Previews */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Files className="h-3 w-3 text-secondary" /> Attached Case Previews
                  </span>
                  <span>{matchingCases.length}</span>
                </div>

                {matchingCases.length === 0 ? (
                  <div className="p-6 rounded bg-surface-elevated/40 border border-border text-center text-muted-foreground font-sans text-xs">
                    No incident cases match the selected filter constraints. Try expanding the category or date range.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {matchingCases.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded bg-surface-elevated/60 border border-border hover:border-primary/40 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-primary text-[11px] truncate flex items-center gap-1.5">
                            <span>{c.firNumber}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">• {c.policeStation}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{c.crimeCategory}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={c.priority === "Critical" ? "destructive" : "attention"}
                            className="text-[9px] px-1.5 py-0.5"
                          >
                            {c.priority}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setInspectingCase(c)}
                            title="Inspect case details"
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-surface-elevated transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {matchingCases.length > 6 && (
                      <div className="text-[10px] text-muted-foreground text-center py-1">
                        + {matchingCases.length - 6} more matching records will be included in the export
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Intelligence Dossiers & Exports */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-mono font-bold text-foreground">
              Recent Intelligence Dossiers & Exports
            </CardTitle>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t("reports.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded border border-border bg-surface-elevated/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs font-mono"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/50 text-muted-foreground text-[10px] uppercase tracking-wider">
                  <th className="p-3 pl-4">{t("reports.reportId")}</th>
                  <th className="p-3">{t("reports.reportTitle")}</th>
                  <th className="p-3">{t("reports.category")}</th>
                  <th className="p-3">{t("reports.author")}</th>
                  <th className="p-3">{t("reports.date")}</th>
                  <th className="p-3">{t("reports.status")}</th>
                  <th className="p-3 pr-4 text-right">{t("reports.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground font-sans">
                      No matching intelligence exports found.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-3 pl-4 font-bold text-primary whitespace-nowrap">{r.id}</td>
                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-foreground truncate">{r.title}</div>
                        <div className="text-[10px] text-muted-foreground">{r.classification}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="tactical" className="text-[10px] font-mono">
                          {r.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px] whitespace-nowrap">{r.author}</td>
                      <td className="p-3 text-muted-foreground text-[11px] whitespace-nowrap">{r.generatedDate}</td>
                      <td className="p-3 font-semibold text-foreground whitespace-nowrap">{r.caseCount}</td>
                      <td className="p-3 pr-4 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(r)}
                          className="h-7 text-[11px] px-2 font-mono hover:border-primary/50"
                        >
                          <Eye className="h-3 w-3 mr-1 text-primary" />
                          <span>Preview</span>
                        </Button>

                        <Button
                          variant="tactical"
                          size="sm"
                          onClick={() => {
                            showToast(`Downloading verified archive: ${r.id}`);
                          }}
                          className="h-7 text-[11px] px-2 font-mono"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span>Download</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportToDelete(r.id)}
                          className="h-7 text-[11px] px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Report Dossier Viewer Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `${selectedReport.id} // ${selectedReport.title}` : ""}
        description={selectedReport ? `Classification: ${selectedReport.classification}` : ""}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded bg-surface-elevated border border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Author:</span>
                <span className="text-foreground font-bold">{selectedReport.author}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Generation Date:</span>
                <span className="text-foreground">{selectedReport.generatedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attached Records:</span>
                <span className="text-primary font-bold">{selectedReport.caseCount} FIR Cases</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">File Format:</span>
                <span className="text-secondary font-bold">{selectedReport.type}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold tracking-wider">
                Executive Synthesis
              </span>
              <p className="p-3 rounded bg-surface-elevated/60 border border-border text-foreground font-sans text-xs leading-relaxed">
                {selectedReport.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
              <Button
                variant="tactical"
                size="sm"
                onClick={() => {
                  showToast(`Downloading verified archive: ${selectedReport.id}`);
                  setSelectedReport(null);
                }}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Report Package</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Case Quick Inspection Modal */}
      <Modal
        isOpen={!!inspectingCase}
        onClose={() => setInspectingCase(null)}
        title={inspectingCase ? `Case Inspection // ${inspectingCase.firNumber}` : ""}
        description={inspectingCase ? `Division: ${inspectingCase.policeStation} • ${inspectingCase.district}` : ""}
        size="md"
      >
        {inspectingCase && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="text-primary font-bold">{inspectingCase.crimeCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant={inspectingCase.priority === "Critical" ? "destructive" : "attention"}>
                  {inspectingCase.priority}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-foreground">{inspectingCase.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">{inspectingCase.incidentDate}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Description</span>
              <p className="p-2.5 rounded bg-surface-elevated/60 border border-border text-foreground font-sans text-xs leading-relaxed">
                {inspectingCase.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <Link to="/cases">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <ExternalLink className="h-3 w-3" /> Go to Cases
                </Button>
              </Link>
              <Button variant="tactical" size="sm" onClick={() => setInspectingCase(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        title="Confirm Report Deletion"
        description="Are you sure you want to remove this intelligence report entry from recent exports?"
        size="sm"
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-muted-foreground font-sans text-xs">
            This action will remove dossier record <b>{reportToDelete}</b> from your workstation history.
          </p>
          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReportToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete} className="gap-1">
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Entry</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
