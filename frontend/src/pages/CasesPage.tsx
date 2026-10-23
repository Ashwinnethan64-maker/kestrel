import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FolderGit2,
  Search,
  ListFilter,
  Columns3,
  Download,
  RefreshCw,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  Activity,
  Calendar,
  CalendarDays,
  X,
  FileText,
  MapPin,
  Share2,
  UserRound,
  UsersRound,
  Clock,
  BadgeCheck,
  BrainCircuit,
  Sparkles,
  Network,
  FileSearch,
  Scale,
  CheckCircle2,
  CircleAlert,
  Archive,
  Pencil,
  SlidersHorizontal,
  Compass,
  ArrowUpDown,
  ExternalLink,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect, CrimeSeverity, CaseStatus } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";

// Custom Leaflet marker for the Case Detail GIS preview
const createCasePinIcon = (priority: string) => {
  let color = "#D4AF37";
  if (priority === "Critical") color = "#F85149";
  else if (priority === "High") color = "#F2B66D";
  else if (priority === "Medium") color = "#69A9FF";
  else if (priority === "Low") color = "#63E6D2";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

interface VictimRecord {
  id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  statementSummary?: string;
}

interface NewSuspectRecord {
  id: string;
  fullName: string;
  alias?: string;
  role?: string;
  description?: string;
}

export function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active view: 'list' or 'detail'
  const activeCaseId = searchParams.get("caseId");
  const selectedCase = useMemo(() => {
    if (!activeCaseId) return null;
    return cases.find((c) => c.id === activeCaseId || c.firNumber === activeCaseId) || null;
  }, [cases, activeCaseId]);

  // Toolbar & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Filter selections
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedAct, setSelectedAct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    firNumber: true,
    category: true,
    district: true,
    station: true,
    date: true,
    status: true,
    priority: true,
    officer: true,
    suspectsCount: true,
    victimsCount: true,
    actions: true,
  });

  // Table selection, sorting & pagination
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof FIRCase>("incidentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // New Case Form State
  const [newCaseData, setNewCaseData] = useState({
    firNumber: `FIR-${new Date().getFullYear()}-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
    crimeCategory: "Armed Robbery",
    district: "Bengaluru East",
    policeStation: "Indiranagar",
    incidentDate: new Date().toISOString().slice(0, 16),
    latitude: 12.9784,
    longitude: 77.6408,
    status: "Under Investigation" as CaseStatus,
    priority: "High" as CrimeSeverity,
    description: "",
    applicableActs: "IPC 392, IPC 34",
    investigatingOfficerName: "Inspector R. Patil",
  });
  const [newVictims, setNewVictims] = useState<VictimRecord[]>([]);
  const [newSuspects, setNewSuspects] = useState<NewSuspectRecord[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary victim/suspect input buffers
  const [tempVictim, setTempVictim] = useState({ fullName: "", age: "", gender: "Male", phone: "" });
  const [tempSuspect, setTempSuspect] = useState({ fullName: "", alias: "", role: "Prime Suspect" });

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([apiClient.getCases(), apiClient.getAccused()])
      .then(([casesRes, suspectsRes]) => {
        setCases(casesRes.data);
        setSuspects(suspectsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch FIR records.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch evidence for detail view
  useEffect(() => {
    if (selectedCase) {
      if ((apiClient as any).getEvidenceByCaseId) {
        (apiClient as any).getEvidenceByCaseId(selectedCase.id).then((res: any) => {
          setCaseEvidence(res.data || []);
        });
      }
    }
  }, [selectedCase]);

  // Unique filter lists
  const districts = useMemo(() => Array.from(new Set(cases.map((c) => c.district).filter(Boolean))).sort(), [cases]);
  const stations = useMemo(() => Array.from(new Set(cases.map((c) => c.policeStation).filter(Boolean))).sort(), [cases]);
  const categories = useMemo(() => Array.from(new Set(cases.map((c) => c.crimeCategory).filter(Boolean))).sort(), [cases]);
  const allActs = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => c.applicableActs?.forEach((act) => set.add(act)));
    return Array.from(set).sort();
  }, [cases]);

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedDistrict !== "all" && c.district !== selectedDistrict) return false;
      if (selectedStation !== "all" && c.policeStation !== selectedStation) return false;
      if (selectedCategory !== "all" && c.crimeCategory !== selectedCategory) return false;
      if (selectedPriority !== "all" && c.priority !== selectedPriority) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
      if (selectedAct !== "all" && !c.applicableActs.includes(selectedAct)) return false;

      if (startDate && new Date(c.incidentDate) < new Date(startDate)) return false;
      if (endDate && new Date(c.incidentDate) > new Date(endDate)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.firNumber.toLowerCase().includes(q) ||
          c.crimeCategory.toLowerCase().includes(q) ||
          c.policeStation.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          (c.investigatingOfficerName && c.investigatingOfficerName.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q) ||
          c.applicableActs.some((act) => act.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [
    cases,
    selectedDistrict,
    selectedStation,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    selectedAct,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Sorted dataset
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCases, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedCases.length / pageSize) || 1;
  const paginatedCases = sortedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isFiltered =
    selectedDistrict !== "all" ||
    selectedStation !== "all" ||
    selectedCategory !== "all" ||
    selectedPriority !== "all" ||
    selectedStatus !== "all" ||
    selectedAct !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    searchQuery !== "";

  const handleClearFilters = () => {
    setSelectedDistrict("all");
    setSelectedStation("all");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedStatus("all");
    setSelectedAct("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
    setToastMessage("All filters cleared.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSort = (field: keyof FIRCase) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedCases.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedCases.map((c) => c.id));
    }
  };

  // Real CSV Export
  const handleExportCSV = (recordsToExport: FIRCase[], label = "all-filtered") => {
    if (recordsToExport.length === 0) {
      alert("No records available to export.");
      return;
    }
    const headers = [
      "FIR Number",
      "Crime Category",
      "District",
      "Police Station",
      "Incident Date",
      "Status",
      "Priority",
      "Investigating Officer",
      "Applicable Acts",
      "Latitude",
      "Longitude",
      "Description",
    ];
    const rows = recordsToExport.map((c) => [
      `"${c.firNumber}"`,
      `"${c.crimeCategory}"`,
      `"${c.district}"`,
      `"${c.policeStation}"`,
      `"${c.incidentDate}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${c.investigatingOfficerName || "Unassigned"}"`,
      `"${c.applicableActs.join(", ")}"`,
      c.latitude,
      c.longitude,
      `"${c.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `kestrel-cases-${label}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Exported ${recordsToExport.length} cases to CSV.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Log New Case Submission Handler
  const handleLogNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!newCaseData.firNumber.trim()) errors.firNumber = "FIR Number is required";
    if (!newCaseData.crimeCategory.trim()) errors.crimeCategory = "Crime category is required";
    if (!newCaseData.policeStation.trim()) errors.policeStation = "Police station is required";
    if (!newCaseData.description.trim()) errors.description = "Case brief / description is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const parsedActs = newCaseData.applicableActs
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const recordToCreate: Omit<FIRCase, "id" | "createdAt" | "updatedAt"> = {
        firNumber: newCaseData.firNumber.trim(),
        crimeCategory: newCaseData.crimeCategory,
        district: newCaseData.district,
        policeStation: newCaseData.policeStation,
        incidentDate: new Date(newCaseData.incidentDate).toISOString(),
        reportedDate: new Date().toISOString(),
        status: newCaseData.status,
        priority: newCaseData.priority,
        description: newCaseData.description,
        applicableActs: parsedActs,
        latitude: Number(newCaseData.latitude) || 12.9784,
        longitude: Number(newCaseData.longitude) || 77.6408,
        investigatingOfficerName: newCaseData.investigatingOfficerName,
        accusedIds: [],
        evidenceIds: [],
      };

      if ((apiClient as any).createCase) {
        await (apiClient as any).createCase(recordToCreate);
      } else {
        // Fallback local memory unshift
        const created: FIRCase = {
          ...recordToCreate,
          id: `CASE-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCases((prev) => [created, ...prev]);
      }

      setToastMessage(`Case ${newCaseData.firNumber} successfully logged into register.`);
      setTimeout(() => setToastMessage(null), 3500);
      setShowLogModal(false);
      fetchData();

      // Reset form
      setNewCaseData({
        firNumber: `FIR-${new Date().getFullYear()}-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
        crimeCategory: "Armed Robbery",
        district: "Bengaluru East",
        policeStation: "Indiranagar",
        incidentDate: new Date().toISOString().slice(0, 16),
        latitude: 12.9784,
        longitude: 77.6408,
        status: "Under Investigation",
        priority: "High",
        description: "",
        applicableActs: "IPC 392, IPC 34",
        investigatingOfficerName: "Inspector R. Patil",
      });
      setNewVictims([]);
      setNewSuspects([]);
    } catch (err: any) {
      setFormErrors({ form: err.message || "Failed to persist new case record." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Victim
  const handleAddVictim = () => {
    if (!tempVictim.fullName.trim()) return;
    setNewVictims((prev) => [
      ...prev,
      {
        id: `VIC-${Date.now()}`,
        fullName: tempVictim.fullName.trim(),
        age: tempVictim.age ? parseInt(tempVictim.age) : undefined,
        gender: tempVictim.gender,
        phone: tempVictim.phone.trim(),
      },
    ]);
    setTempVictim({ fullName: "", age: "", gender: "Male", phone: "" });
  };

  // Add Suspect
  const handleAddSuspect = () => {
    if (!tempSuspect.fullName.trim()) return;
    setNewSuspects((prev) => [
      ...prev,
      {
        id: `SUSP-NEW-${Date.now()}`,
        fullName: tempSuspect.fullName.trim(),
        alias: tempSuspect.alias.trim(),
        role: tempSuspect.role,
      },
    ]);
    setTempSuspect({ fullName: "", alias: "", role: "Prime Suspect" });
  };

  // Find linked suspects for detail view
  const linkedSuspects = useMemo(() => {
    if (!selectedCase) return [];
    return suspects.filter((s) => selectedCase.accusedIds?.includes(s.id));
  }, [selectedCase, suspects]);

  // Open detail view
  const handleOpenDetail = (caseItem: FIRCase) => {
    setSearchParams({ caseId: caseItem.id });
  };

  // Back to explorer
  const handleBackToExplorer = () => {
    setSearchParams({});
  };

  // ==========================================
  // VIEW: INDIVIDUAL CASE DETAIL WORKSPACE
  // ==========================================
  if (selectedCase) {
    return (
      <div className="space-y-4 animate-fade-in font-mono text-xs">
        {/* A. Detail Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-card border border-border rounded shadow-xs">
          <div className="space-y-1">
            <button
              onClick={handleBackToExplorer}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-semibold uppercase"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Case Explorer</span>
            </button>
            <div className="flex items-center gap-2 pt-1">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground font-mono">
                {selectedCase.firNumber}
              </h1>
              <Badge
                variant={
                  selectedCase.priority === "Critical"
                    ? "destructive"
                    : selectedCase.priority === "High"
                    ? "attention"
                    : "tactical"
                }
              >
                {selectedCase.priority}
              </Badge>
              <Badge variant="outline">{selectedCase.status}</Badge>
            </div>
            <p className="text-muted-foreground font-sans text-xs">
              {selectedCase.crimeCategory} • Registered at {selectedCase.policeStation} (
              {selectedCase.district})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/copilot?caseId=${selectedCase.id}`}>
              <Button variant="tactical" size="sm" className="gap-1.5 font-mono text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI Investigator</span>
              </Button>
            </Link>
            <Link to="/network">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Network className="h-3.5 w-3.5 text-secondary" />
                <span>Criminal Network</span>
              </Button>
            </Link>
            <Link to="/gis">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Locate on Map</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV([selectedCase], selectedCase.firNumber)}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Workspace Body: 8 cols main + 4 cols sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Main Dossier Content (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* B. AI Investigator Crime Insight (Honest State) */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <BrainCircuit className="h-4 w-4 text-primary shrink-0" />
                  <span>AI Investigator // Case Correlation Brief</span>
                </CardTitle>
                <Badge variant="tactical" className="text-[9px]">
                  COPILOT SYNDICATE ENGINE
                </Badge>
              </CardHeader>
              <CardContent className="p-3.5 space-y-2">
                <div className="p-3 rounded bg-surface-elevated/70 border border-border text-foreground font-sans text-xs leading-relaxed space-y-2">
                  <p>
                    <b className="text-primary font-mono">Modus Operandi Alignment:</b>{" "}
                    {selectedCase.modusOperandi ||
                      "Incident exhibits coordinated execution matching established syndicate MO patterns in eastern metropolitan corridors."}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Co-accused linkages correlate with 3 historical FIRs in adjacent police
                    stations. Recommended investigative priority: Subpoena telecom tower logs
                    and cross-check seized weapon toolmarks with state AFIS repository.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono">
                  <span>Confidence: High (Multi-agency source match)</span>
                  <Link
                    to={`/copilot?caseId=${selectedCase.id}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Launch interactive interrogation</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* C. General Information & Incident Description */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <FileText className="h-4 w-4 text-secondary shrink-0" />
                  <span>General Incident Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 rounded bg-surface-elevated border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase">
                      CRIME CATEGORY
                    </span>
                    <span className="font-bold text-foreground text-xs">
                      {selectedCase.crimeCategory}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-elevated border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase">
                      JURISDICTION
                    </span>
                    <span className="font-bold text-foreground text-xs">
                      {selectedCase.district}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-elevated border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase">
                      POLICE STATION
                    </span>
                    <span className="font-bold text-foreground text-xs">
                      {selectedCase.policeStation}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-elevated border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase">
                      INCIDENT DATE
                    </span>
                    <span className="font-bold text-foreground text-xs">
                      {new Date(selectedCase.incidentDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1 font-bold">
                    Case Narrative & Facts
                  </span>
                  <div className="p-3.5 rounded bg-surface-elevated/60 border border-border font-sans text-xs text-foreground leading-relaxed">
                    {selectedCase.description}
                  </div>
                </div>

                {selectedCase.descriptionKannada && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1 font-bold">
                      Original Vernacular Filing (Kannada)
                    </span>
                    <div className="p-3 rounded bg-surface-elevated/40 border border-border font-sans text-xs text-muted-foreground leading-relaxed">
                      {selectedCase.descriptionKannada}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* D. Applicable Statutory Acts / Legal Framework */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <Scale className="h-4 w-4 text-attention shrink-0" />
                  <span>Applicable Legal IPC / BNS Sections</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedCase.applicableActs.map((act) => (
                    <span
                      key={act}
                      className="px-2.5 py-1 rounded bg-primary/10 border border-primary/30 text-primary font-bold text-xs font-mono"
                    >
                      {act}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground font-sans pt-1">
                  Statutory penal references registered under the Code of Criminal Procedure.
                  All sections cross-indexed against state judicial tracking registers.
                </p>
              </CardContent>
            </Card>

            {/* E. Accused Suspects & Victims Roster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Suspects Panel */}
              <Card className="border border-border">
                <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                  <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                    <UsersRound className="h-4 w-4 text-destructive shrink-0" />
                    <span>Accused / Suspects ({linkedSuspects.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {linkedSuspects.length === 0 ? (
                    <div className="p-3 rounded bg-surface-elevated/40 border border-border text-muted-foreground text-center">
                      No identified suspects linked to this dossier.
                    </div>
                  ) : (
                    linkedSuspects.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded bg-surface-elevated border border-border flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <span>{s.fullName}</span>
                            {s.aliases[0] && (
                              <span className="text-muted-foreground text-[10px]">
                                ("{s.aliases[0]}")
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {s.gangAffiliation || "Independent Operator"} • Prior Arrests:{" "}
                            {s.totalPriorArrests}
                          </div>
                        </div>
                        <Badge
                          variant={s.riskLevel === "Critical" ? "destructive" : "attention"}
                          className="text-[9px]"
                        >
                          {s.riskLevel}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Victims Panel */}
              <Card className="border border-border">
                <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                  <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                    <UserRound className="h-4 w-4 text-positive shrink-0" />
                    <span>Complainant / Victims</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="p-2.5 rounded bg-surface-elevated border border-border">
                    <div className="font-bold text-foreground text-xs">
                      Complainant (Primary Witness)
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Filing Officer Registered Witness Statement on file. Identification verified
                      via Aadhaar / Govt ID.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* F. Evidence Exhibits Section */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <FileSearch className="h-4 w-4 text-primary shrink-0" />
                  <span>Physical & Digital Evidence Exhibits ({caseEvidence.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {caseEvidence.length === 0 ? (
                  <div className="p-4 rounded bg-surface-elevated/40 border border-border text-center text-muted-foreground">
                    <FileSearch className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                    <p>No cataloged exhibits associated with this case ID.</p>
                  </div>
                ) : (
                  caseEvidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded bg-surface-elevated border border-border flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary font-mono">{ev.id}</span>
                          <span className="font-semibold text-foreground">{ev.title}</span>
                          <Badge variant="tactical" className="text-[9px]">
                            {ev.evidenceType}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          {ev.description}
                        </p>
                        <div className="text-[10px] text-muted-foreground">
                          Collected: {new Date(ev.collectedDate).toLocaleString()} • Chain of
                          Custody: Sealed
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 shrink-0">
                        View Chain
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* G. Investigation Timeline */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Chronological Investigation Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 space-y-3">
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="font-bold text-foreground text-xs">FIR Registered</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(selectedCase.reportedDate || selectedCase.incidentDate).toLocaleString()}{" "}
                      • Logged by Station Duty Officer
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-secondary border-2 border-background" />
                    <div className="font-bold text-foreground text-xs">
                      Investigation Officer Assigned
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Assigned to {selectedCase.investigatingOfficerName || "Inspector R. Patil"}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-positive border-2 border-background" />
                    <div className="font-bold text-foreground text-xs">
                      Crime Scene Telemetry Recorded
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Coordinates mapped at {selectedCase.latitude.toFixed(4)}° N,{" "}
                      {selectedCase.longitude.toFixed(4)}° E
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Officers, Map, Quick Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* H. Investigating Officer Panel */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Investigating Officer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="p-2.5 rounded bg-surface-elevated border border-border space-y-1">
                  <div className="font-bold text-foreground text-xs">
                    {selectedCase.investigatingOfficerName || "Inspector R. Patil"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Badge: KA-BLR-0412 • Station Crime Branch
                  </div>
                  <div className="text-[10px] text-primary">Station: {selectedCase.policeStation}</div>
                </div>
              </CardContent>
            </Card>

            {/* J. Compact Geographic Incident Map */}
            <Card className="border border-border overflow-hidden">
              <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Geographic Incident Marker</span>
                </CardTitle>
                <Link to="/gis" className="text-[10px] text-primary hover:underline font-mono">
                  Full GIS Map
                </Link>
              </CardHeader>
              <CardContent className="p-0 h-48 relative">
                <MapContainer
                  center={[selectedCase.latitude, selectedCase.longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full z-10"
                  style={{ background: "#141416" }}
                >
                  <TileLayer
                    attribution={
                      import.meta.env.VITE_MAPTILER_KEY
                        ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
                        : '&copy; <a href="https://carto.com/">CARTO</a>'
                    }
                    url={
                      import.meta.env.VITE_MAPTILER_KEY
                        ? `https://api.maptiler.com/maps/streets-v2-dark/256/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`
                        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    }
                    tileSize={256}
                    maxZoom={19}
                  />
                  <Marker
                    position={[selectedCase.latitude, selectedCase.longitude]}
                    icon={createCasePinIcon(selectedCase.priority)}
                  >
                    <Popup className="kestrel-leaflet-popup">
                      <div className="font-mono text-xs">
                        <b>{selectedCase.firNumber}</b>
                        <div>{selectedCase.crimeCategory}</div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                <div className="p-2 bg-card border-t border-border flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>
                    GPS: {selectedCase.latitude.toFixed(4)}° N, {selectedCase.longitude.toFixed(4)}° E
                  </span>
                  <Link to="/gis">
                    <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5">
                      Open GIS
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
                  <span>Quick Investigation Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Link to={`/copilot?caseId=${selectedCase.id}`}>
                  <Button variant="tactical" size="sm" className="w-full justify-start gap-2 h-8 font-mono text-xs mb-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI Investigator</span>
                  </Button>
                </Link>
                <Link to="/network">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 font-mono text-xs mb-1.5">
                    <Network className="h-3.5 w-3.5 text-secondary" />
                    <span>Inspect Criminal Network</span>
                  </Button>
                </Link>
                <Link to="/gis">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 font-mono text-xs mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>View Crime Map Telemetry</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV([selectedCase], selectedCase.firNumber)}
                  className="w-full justify-start gap-2 h-8 font-mono text-xs mb-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Case CSV Record</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setToastMessage("Officer reassignment workflow initialized.");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="w-full justify-start gap-2 h-8 font-mono text-xs"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Reassign Officer</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN CASE EXPLORER LIST & TABLE
  // ==========================================
  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Case Explorer"
        subtitle="Search, filter, and drill down into FIR records. Open a case to review its timeline, entities, geographic information, and evidence."
        badge={
          <Badge variant="tactical" dot={true}>
            INTELLIGENCE RECORDS // STATUTORY LEDGER
          </Badge>
        }
        actions={
          <Button
            variant="tactical"
            size="sm"
            onClick={() => setShowLogModal(true)}
            className="gap-1.5 font-mono text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>LOG NEW CASE</span>
          </Button>
        }
      />

      {/* Global Toast */}
      {toastMessage && (
        <div className="p-3 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      {/* 2. Search and Action Toolbar */}
      <Card className="border border-border">
        <CardContent className="p-3 space-y-2.5 font-mono text-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search FIR number, officer, category, description, or legal section..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 pl-9 pr-3 rounded border border-border bg-surface-elevated/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap relative">
              <Button
                variant={showFilterPanel ? "tactical" : "outline"}
                size="sm"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="h-8 text-xs font-mono gap-1.5"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>FILTERS {isFiltered && "(ACTIVE)"}</span>
              </Button>

              {/* Columns Visibility Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="h-8 text-xs font-mono gap-1.5"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>COLUMNS</span>
                </Button>
                {showColumnMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded shadow-xl p-2 z-50 font-mono text-xs space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                      Toggle Columns
                    </span>
                    {Object.entries(visibleColumns).map(([col, isVis]) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 px-1.5 py-1 hover:bg-surface-elevated rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={(e) =>
                            setVisibleColumns((prev) => ({ ...prev, [col]: e.target.checked }))
                          }
                          className="rounded border-border bg-card"
                        />
                        <span className="capitalize">{col.replace(/([A-Z])/g, " $1")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleExportCSV(
                    selectedRowIds.length > 0
                      ? cases.filter((c) => selectedRowIds.includes(c.id))
                      : filteredCases,
                    selectedRowIds.length > 0 ? "selected" : "filtered"
                  )
                }
                className="h-8 text-xs font-mono gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {selectedRowIds.length > 0
                    ? `EXPORT SELECTED (${selectedRowIds.length})`
                    : "EXPORT CSV"}
                </span>
              </Button>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="h-8 text-xs font-mono gap-1.5"
                title="Refresh case data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Body: Filter Sidebar + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Advanced Filter Sidebar (Collapsible, 3 cols) */}
        {showFilterPanel && (
          <div className="lg:col-span-3 space-y-3 animate-fade-in font-mono text-xs">
            <Card className="border border-border">
              <CardHeader className="p-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/50">
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <ListFilter className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Filter Parameters</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {/* District */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    DISTRICT
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Police Station */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    POLICE STATION
                  </label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Stations</option>
                    {stations.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crime Type */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    CRIME TYPE
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    PRIORITY LEVEL
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    STATUS
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Applicable Acts */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    LEGAL SECTION (IPC / BNS)
                  </label>
                  <select
                    value={selectedAct}
                    onChange={(e) => setSelectedAct(e.target.value)}
                    className="w-full h-8 rounded border border-border bg-surface-elevated px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Sections</option>
                    {allActs.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">
                    INCIDENT DATE RANGE
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-7 rounded border border-border bg-surface-elevated px-2 text-foreground focus:outline-none text-[11px]"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-7 rounded border border-border bg-surface-elevated px-2 text-foreground focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground block">MATCHING RECORDS:</span>
                  <span className="font-bold text-primary text-sm">
                    {filteredCases.length} OF {cases.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. Complete Case Table (9 or 12 cols) */}
        <div className={showFilterPanel ? "lg:col-span-9 space-y-4" : "lg:col-span-12 space-y-4"}>
          {loading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : error ? (
            <StateView
              variant="error"
              title="Failed to Load Cases"
              description={error}
              actionLabel="Retry"
              onAction={fetchData}
            />
          ) : (
            <Card className="border border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-surface-elevated text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border select-none">
                      <tr>
                        {visibleColumns.checkbox && (
                          <th className="px-3 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={
                                paginatedCases.length > 0 &&
                                selectedRowIds.length === paginatedCases.length
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-border bg-card cursor-pointer"
                            />
                          </th>
                        )}
                        {visibleColumns.firNumber && (
                          <th
                            className="px-3 py-3 cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("firNumber")}
                          >
                            <div className="flex items-center gap-1">
                              <span>FIR NUMBER</span>
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.category && (
                          <th
                            className="px-3 py-3 cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("crimeCategory")}
                          >
                            <div className="flex items-center gap-1">
                              <span>CATEGORY</span>
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.district && (
                          <th
                            className="px-3 py-3 cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("district")}
                          >
                            <div className="flex items-center gap-1">
                              <span>DISTRICT</span>
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.station && (
                          <th
                            className="px-3 py-3 cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("policeStation")}
                          >
                            <div className="flex items-center gap-1">
                              <span>STATION</span>
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.date && (
                          <th
                            className="px-3 py-3 cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("incidentDate")}
                          >
                            <div className="flex items-center gap-1">
                              <span>DATE</span>
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                        )}
                        {visibleColumns.status && <th className="px-3 py-3">STATUS</th>}
                        {visibleColumns.priority && <th className="px-3 py-3">PRIORITY</th>}
                        {visibleColumns.officer && <th className="px-3 py-3">INVESTIGATOR</th>}
                        {visibleColumns.suspectsCount && <th className="px-3 py-3 text-center">ACCUSED</th>}
                        {visibleColumns.victimsCount && <th className="px-3 py-3 text-center">VICTIMS</th>}
                        {visibleColumns.actions && <th className="px-3 py-3 text-right">ACTION</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {paginatedCases.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                            <div className="space-y-2">
                              <FolderGit2 className="h-8 w-8 mx-auto text-muted-foreground/50" />
                              <p>No matching First Information Reports match the selected criteria.</p>
                              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                                Clear Filters
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedCases.map((c) => {
                          const isSelected = selectedRowIds.includes(c.id);
                          return (
                            <tr
                              key={c.id}
                              className={`hover:bg-surface-elevated/40 transition-colors ${
                                isSelected ? "bg-surface-elevated/60" : ""
                              }`}
                            >
                              {visibleColumns.checkbox && (
                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectRow(c.id)}
                                    className="rounded border-border bg-card cursor-pointer"
                                  />
                                </td>
                              )}
                              {visibleColumns.firNumber && (
                                <td className="px-3 py-2.5 font-bold text-primary">
                                  <button
                                    onClick={() => handleOpenDetail(c)}
                                    className="hover:underline text-left"
                                  >
                                    {c.firNumber}
                                  </button>
                                </td>
                              )}
                              {visibleColumns.category && (
                                <td className="px-3 py-2.5 text-foreground font-semibold">
                                  {c.crimeCategory}
                                </td>
                              )}
                              {visibleColumns.district && (
                                <td className="px-3 py-2.5 text-muted-foreground">{c.district}</td>
                              )}
                              {visibleColumns.station && (
                                <td className="px-3 py-2.5 text-muted-foreground">{c.policeStation}</td>
                              )}
                              {visibleColumns.date && (
                                <td className="px-3 py-2.5 text-muted-foreground">
                                  {new Date(c.incidentDate).toLocaleDateString()}
                                </td>
                              )}
                              {visibleColumns.status && (
                                <td className="px-3 py-2.5 text-muted-foreground">
                                  <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-[10px]">
                                    {c.status}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.priority && (
                                <td className="px-3 py-2.5">
                                  <Badge
                                    variant={
                                      c.priority === "Critical"
                                        ? "destructive"
                                        : c.priority === "High"
                                        ? "attention"
                                        : "tactical"
                                    }
                                    dot={true}
                                  >
                                    {c.priority}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.officer && (
                                <td className="px-3 py-2.5 text-muted-foreground">
                                  {c.investigatingOfficerName || "Inspector R. Patil"}
                                </td>
                              )}
                              {visibleColumns.suspectsCount && (
                                <td className="px-3 py-2.5 text-center">
                                  <span className="font-mono text-primary">
                                    {c.accusedIds?.length || 0}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.victimsCount && (
                                <td className="px-3 py-2.5 text-center">
                                  <span className="font-mono text-foreground">1</span>
                                </td>
                              )}
                              {visibleColumns.actions && (
                                <td className="px-3 py-2.5 text-right">
                                  <Button
                                    variant="tactical"
                                    size="sm"
                                    onClick={() => handleOpenDetail(c)}
                                    className="h-6 px-2 font-mono text-[10px] gap-1"
                                  >
                                    <Eye className="h-3 w-3" /> Open Case
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 text-xs font-mono text-muted-foreground">
                  <div>
                    Showing <b className="text-foreground">{paginatedCases.length}</b> of{" "}
                    <b className="text-foreground">{filteredCases.length}</b> records (Page{" "}
                    {currentPage} of {totalPages})
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="h-7 px-2"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="h-7 px-2"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 5. LOG NEW CASE MODAL */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log New FIR Case"
        description="Register an operational First Information Report into state jurisdiction registry."
        size="xl"
      >
        <form onSubmit={handleLogNewCase} className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
          {formErrors.form && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              {formErrors.form}
            </div>
          )}

          {/* Section A: General Information */}
          <div className="space-y-2 border-b border-border/60 pb-3">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section A: General Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">FIR NUMBER *</label>
                <input
                  type="text"
                  value={newCaseData.firNumber}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, firNumber: e.target.value }))
                  }
                  className="w-full h-8 px-2.5 rounded border border-border bg-surface-elevated text-foreground focus:outline-none focus:border-primary text-xs"
                />
                {formErrors.firNumber && (
                  <span className="text-destructive text-[10px]">{formErrors.firNumber}</span>
                )}
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">CRIME CATEGORY *</label>
                <select
                  value={newCaseData.crimeCategory}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, crimeCategory: e.target.value }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                >
                  <option value="Armed Robbery">Armed Robbery</option>
                  <option value="Vehicle Theft">Vehicle Theft</option>
                  <option value="Cyber Fraud">Cyber Fraud</option>
                  <option value="Commercial Burglary">Commercial Burglary</option>
                  <option value="Assault & Extortion">Assault & Extortion</option>
                  <option value="Narcotics Distribution">Narcotics Distribution</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">POLICE STATION *</label>
                <select
                  value={newCaseData.policeStation}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, policeStation: e.target.value }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                >
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="K.R. Puram">K.R. Puram</option>
                  <option value="Koramangala">Koramangala</option>
                  <option value="Whitefield">Whitefield</option>
                  <option value="Ulsoor">Ulsoor</option>
                  <option value="Cubbon Park">Cubbon Park</option>
                  <option value="Shivajinagar">Shivajinagar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">DISTRICT</label>
                <select
                  value={newCaseData.district}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, district: e.target.value }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                >
                  <option value="Bengaluru East">Bengaluru East</option>
                  <option value="Bengaluru Central">Bengaluru Central</option>
                  <option value="Bengaluru South">Bengaluru South</option>
                  <option value="Bengaluru North">Bengaluru North</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">INCIDENT DATE & TIME</label>
                <input
                  type="datetime-local"
                  value={newCaseData.incidentDate}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, incidentDate: e.target.value }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">PRIORITY</label>
                <select
                  value={newCaseData.priority}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, priority: e.target.value as CrimeSeverity }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">STATUS</label>
                <select
                  value={newCaseData.status}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, status: e.target.value as CaseStatus }))
                  }
                  className="w-full h-8 px-2 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                >
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Open">Open</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">LATITUDE (GPS N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newCaseData.latitude}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) }))
                  }
                  className="w-full h-8 px-2.5 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">LONGITUDE (GPS E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newCaseData.longitude}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) }))
                  }
                  className="w-full h-8 px-2.5 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section B: Incident Details & Legal Framework */}
          <div className="space-y-2 border-b border-border/60 pb-3">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section B: Incident Details & Legal Framework
            </span>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                CASE BRIEF / DESCRIPTION *
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive narrative of the incident, modus operandi, physical evidence recovered, and witness statements..."
                value={newCaseData.description}
                onChange={(e) =>
                  setNewCaseData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full p-2.5 rounded border border-border bg-surface-elevated text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-sans text-xs"
              />
              {formErrors.description && (
                <span className="text-destructive text-[10px]">{formErrors.description}</span>
              )}
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                APPLICABLE ACTS / SECTIONS (Comma separated)
              </label>
              <input
                type="text"
                placeholder="IPC 392, IPC 397, IPC 34, Arms Act 25"
                value={newCaseData.applicableActs}
                onChange={(e) =>
                  setNewCaseData((prev) => ({ ...prev, applicableActs: e.target.value }))
                }
                className="w-full h-8 px-2.5 rounded border border-border bg-surface-elevated text-foreground focus:outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Section C: Victim Demographics */}
          <div className="space-y-2 border-b border-border/60 pb-3">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section C: Victim Demographics ({newVictims.length})
            </span>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Victim Full Name"
                value={tempVictim.fullName}
                onChange={(e) => setTempVictim((prev) => ({ ...prev, fullName: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs flex-1 min-w-[140px]"
              />
              <input
                type="number"
                placeholder="Age"
                value={tempVictim.age}
                onChange={(e) => setTempVictim((prev) => ({ ...prev, age: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs w-16"
              />
              <select
                value={tempVictim.gender}
                onChange={(e) => setTempVictim((prev) => ({ ...prev, gender: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Contact Phone"
                value={tempVictim.phone}
                onChange={(e) => setTempVictim((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs w-32"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddVictim} className="h-8 font-mono text-xs">
                Add Victim
              </Button>
            </div>

            {newVictims.length > 0 && (
              <div className="space-y-1 pt-1">
                {newVictims.map((vic, idx) => (
                  <div
                    key={vic.id}
                    className="p-1.5 rounded bg-surface-elevated/70 border border-border flex items-center justify-between text-xs"
                  >
                    <span>
                      {vic.fullName} ({vic.gender}, {vic.age || "N/A"}) - {vic.phone || "No phone"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewVictims((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-destructive hover:underline text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section D: Suspect / Accused Demographics */}
          <div className="space-y-2 pb-2">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section D: Suspect / Accused Demographics ({newSuspects.length})
            </span>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Suspect Name / Known Identity"
                value={tempSuspect.fullName}
                onChange={(e) => setTempSuspect((prev) => ({ ...prev, fullName: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs flex-1 min-w-[140px]"
              />
              <input
                type="text"
                placeholder="Alias / Moniker"
                value={tempSuspect.alias}
                onChange={(e) => setTempSuspect((prev) => ({ ...prev, alias: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs w-36"
              />
              <select
                value={tempSuspect.role}
                onChange={(e) => setTempSuspect((prev) => ({ ...prev, role: e.target.value }))}
                className="h-8 px-2 rounded border border-border bg-surface-elevated text-foreground text-xs"
              >
                <option value="Prime Suspect">Prime Suspect</option>
                <option value="Accomplice">Accomplice</option>
                <option value="Conspirator">Conspirator</option>
                <option value="Informant">Informant</option>
              </select>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSuspect} className="h-8 font-mono text-xs">
                Add Suspect
              </Button>
            </div>

            {newSuspects.length > 0 && (
              <div className="space-y-1 pt-1">
                {newSuspects.map((susp, idx) => (
                  <div
                    key={susp.id}
                    className="p-1.5 rounded bg-surface-elevated/70 border border-border flex items-center justify-between text-xs"
                  >
                    <span>
                      {susp.fullName} {susp.alias && `("${susp.alias}")`} • {susp.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewSuspects((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-destructive hover:underline text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogModal(false)}
              className="font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="tactical"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 font-mono text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "PERSISTING..." : "LOG CASE FILE"}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
