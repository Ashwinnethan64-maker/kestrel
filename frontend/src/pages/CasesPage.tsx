import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FolderGit2,
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  X,
  FileText,
  MapPin,
  Share2,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";

export function CasesPage() {
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d">("all");

  // Selection & Details Modal
  const [selectedCase, setSelectedCase] = useState<FIRCase | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    Promise.all([apiClient.getCases(), apiClient.getAccused()])
      .then(([casesRes, suspectsRes]) => {
        setCases(casesRes.data);
        setSuspects(suspectsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch FIR cases.");
        setLoading(false);
      });
  }, []);

  // Filter options
  const stations = useMemo(() => Array.from(new Set(cases.map((c) => c.policeStation))).sort(), [cases]);
  const categories = useMemo(() => Array.from(new Set(cases.map((c) => c.crimeCategory))).sort(), [cases]);

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedStation !== "all" && c.policeStation !== selectedStation) return false;
      if (selectedCategory !== "all" && c.crimeCategory !== selectedCategory) return false;
      if (selectedPriority !== "all" && c.priority !== selectedPriority) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.firNumber.toLowerCase().includes(q) ||
          c.crimeCategory.toLowerCase().includes(q) ||
          c.policeStation.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.applicableActs.some((act) => act.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (dateRange !== "all") {
        const incidentTime = new Date(c.incidentDate).getTime();
        const refTime = new Date("2024-10-23T12:00:00Z").getTime();
        const diffDays = (refTime - incidentTime) / (1000 * 60 * 60 * 24);
        if (dateRange === "7d" && diffDays > 7) return false;
        if (dateRange === "30d" && diffDays > 30) return false;
      }

      return true;
    });
  }, [cases, selectedStation, selectedCategory, selectedPriority, selectedStatus, searchQuery, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isFiltered =
    selectedStation !== "all" ||
    selectedCategory !== "all" ||
    selectedPriority !== "all" ||
    selectedStatus !== "all" ||
    dateRange !== "all" ||
    searchQuery !== "";

  const handleClearFilters = () => {
    setSelectedStation("all");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedStatus("all");
    setDateRange("all");
    setSearchQuery("");
    setCurrentPage(1);
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

  // Find linked suspects for selected case
  const linkedSuspects = useMemo(() => {
    if (!selectedCase) return [];
    return suspects.filter((s) => selectedCase.accusedIds?.includes(s.id));
  }, [selectedCase, suspects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases & FIR Records"
        subtitle="Operational ledger of First Information Reports, statutory Indian Penal Code mappings, and accused person registries."
        badge={
          <Badge variant="tactical" dot={true}>
            SYNTHETIC DATA // DEMO
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRowIds.length === 0}
              onClick={() => alert(`Exporting ${selectedRowIds.length} case dossiers to CSV brief.`)}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT SELECTED ({selectedRowIds.length})</span>
            </Button>
            <Link to="/reports">
              <Button variant="tactical" size="sm" className="gap-1.5 font-mono text-xs">
                <FileText className="h-3.5 w-3.5" />
                <span>GENERATE SITREP</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by FIR #, Suspect, Modus Operandi, or Section (e.g. IPC 379)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-input bg-surface-elevated pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStation}
                onChange={(e) => {
                  setSelectedStation(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL STATIONS</option>
                {stations.map((st) => (
                  <option key={st} value={st}>
                    {st.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL CATEGORIES</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL PRIORITIES</option>
                <option value="Critical">CRITICAL</option>
                <option value="High">HIGH</option>
                <option value="Medium">MEDIUM</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">ALL STATUSES</option>
                <option value="Under Investigation">UNDER INVESTIGATION</option>
                <option value="Open">OPEN</option>
                <option value="Closed">CLOSED</option>
              </select>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-xs font-mono text-muted-foreground hover:text-destructive gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
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
          onAction={() => window.location.reload()}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-surface-elevated text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-3 w-10">
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
                    <th className="px-4 py-3">FIR Number</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Police Station</th>
                    <th className="px-4 py-3">Statutory Acts</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
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
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(c.id)}
                              className="rounded border-border bg-card cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-primary">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="hover:underline text-left"
                            >
                              {c.firNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-foreground font-semibold">
                            {c.crimeCategory}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{c.policeStation}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {c.applicableActs.slice(0, 2).map((act) => (
                                <span
                                  key={act}
                                  className="px-1.5 py-0.2 rounded bg-surface-elevated border border-border text-[10px] text-primary"
                                >
                                  {act}
                                </span>
                              ))}
                              {c.applicableActs.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">
                                  +{c.applicableActs.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={c.priority === "Critical" ? "destructive" : "attention"}
                              dot={true}
                            >
                              {c.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{c.status}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {new Date(c.incidentDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="tactical"
                              size="sm"
                              onClick={() => setSelectedCase(c)}
                              className="h-7 px-2 font-mono text-[10px] gap-1"
                            >
                              <Eye className="h-3 w-3" /> Dossier
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs font-mono text-muted-foreground">
              <div>
                Showing <b className="text-foreground">{paginatedCases.length}</b> of{" "}
                <b className="text-foreground">{filteredCases.length}</b> records (Page {currentPage} of {totalPages})
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

      {/* Case Dossier Modal */}
      <Modal
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        title={selectedCase ? `Case Dossier // ${selectedCase.firNumber}` : ""}
        description={selectedCase ? `Registered at ${selectedCase.policeStation} • ${selectedCase.district}` : ""}
        size="lg"
      >
        {selectedCase && (
          <div className="space-y-4 font-mono text-xs">
            {/* Metadata Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">PRIORITY</span>
                <span className="font-bold text-foreground">{selectedCase.priority}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">STATUS</span>
                <span className="font-bold text-foreground">{selectedCase.status}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">INCIDENT DATE</span>
                <span className="font-bold text-foreground">
                  {new Date(selectedCase.incidentDate).toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">GPS COORDS</span>
                <span className="font-bold text-primary">
                  {selectedCase.latitude.toFixed(4)}, {selectedCase.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Modus Operandi & Narrative */}
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase tracking-wider mb-1">
                Incident Summary & Modus Operandi
              </span>
              <div className="p-3 rounded bg-surface-elevated/70 border border-border font-sans text-xs text-foreground leading-relaxed">
                {selectedCase.description}
              </div>
            </div>

            {/* Applicable Acts */}
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase tracking-wider mb-1">
                Statutory Penal Sections
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCase.applicableActs.map((act) => (
                  <span
                    key={act}
                    className="px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary font-bold text-xs"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>

            {/* Linked Suspects Roster */}
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase tracking-wider mb-1">
                Accused / Linked Persons of Interest
              </span>
              {linkedSuspects.length === 0 ? (
                <div className="p-2.5 rounded bg-surface-elevated/40 border border-border text-muted-foreground text-[11px]">
                  No identified accused currently registered in this dossier.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {linkedSuspects.map((suspect) => (
                    <div
                      key={suspect.id}
                      className="p-2 rounded bg-surface-elevated/60 border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold text-foreground">{suspect.fullName}</span>
                        {suspect.aliases[0] && (
                          <span className="text-muted-foreground text-[11px]">
                            ("{suspect.aliases[0]}")
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px]">
                          {suspect.gangAffiliation || "Independent"}
                        </span>
                        <Badge
                          variant={suspect.riskLevel === "Critical" ? "destructive" : "attention"}
                        >
                          {suspect.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Link to="/network">
                <Button variant="outline" size="sm" className="gap-1 font-mono text-xs">
                  <Share2 className="h-3.5 w-3.5" /> View In Network Graph
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/gis">
                  <Button variant="tactical" size="sm" className="gap-1 font-mono text-xs">
                    <MapPin className="h-3.5 w-3.5" /> Pin On GIS Map
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => setSelectedCase(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
