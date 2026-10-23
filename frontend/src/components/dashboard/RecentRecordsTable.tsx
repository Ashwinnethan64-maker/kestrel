import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderGit2,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FIRCase } from "@kestrel/shared";

interface RecentRecordsTableProps {
  cases: FIRCase[];
}

export function RecentRecordsTable({ cases }: RecentRecordsTableProps) {
  const [sortField, setSortField] = useState<keyof FIRCase>("incidentDate");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCase, setSelectedCase] = useState<FIRCase | null>(null);
  const pageSize = 5;

  const handleSort = (field: keyof FIRCase) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedCases = [...cases].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined || valB === undefined) return 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCases.length / pageSize) || 1;
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-primary" />
              <span>Priority Incident Ledger & FIR Roster</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Verified police case files sorted by date and priority. Click any row to inspect legal sections and suspect records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/cases">
              <Button variant="outline" size="sm" className="font-mono text-xs h-8">
                OPEN FULL LEDGER ({cases.length})
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-surface-elevated text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("firNumber")}
                  >
                    <div className="flex items-center gap-1">
                      <span>FIR Number</span>
                      {sortField === "firNumber" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("crimeCategory")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      {sortField === "crimeCategory" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("policeStation")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Police Station</span>
                      {sortField === "policeStation" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      {sortField === "priority" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === "status" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-right cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("incidentDate")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Date</span>
                      {sortField === "incidentDate" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No matching FIR records found for current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-surface-elevated/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-bold text-primary flex items-center gap-1.5">
                        <span>{c.firNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{c.crimeCategory}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.policeStation}</td>
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
                          variant="ghost"
                          size="iconSm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(c);
                          }}
                          className="opacity-70 group-hover:opacity-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs font-mono text-muted-foreground">
            <div>
              Showing Page <b className="text-foreground">{currentPage}</b> of{" "}
              <b className="text-foreground">{totalPages}</b> ({sortedCases.length} records)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 font-mono"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2 font-mono"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Details Modal */}
      <Modal
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        title={selectedCase ? `Case Dossier // ${selectedCase.firNumber}` : ""}
        description={selectedCase ? `Police Station: ${selectedCase.policeStation} • Registered: ${new Date(selectedCase.incidentDate).toLocaleDateString()}` : ""}
        size="lg"
      >
        {selectedCase && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">PRIORITY</span>
                <span className="text-foreground font-bold">{selectedCase.priority}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">STATUS</span>
                <span className="text-foreground font-bold">{selectedCase.status}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">CATEGORY</span>
                <span className="text-foreground font-bold truncate">{selectedCase.crimeCategory}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-muted-foreground block">DISTRICT</span>
                <span className="text-foreground font-bold">{selectedCase.district}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">INCIDENT NARRATIVE / MODUS OPERANDI</span>
              <p className="p-3 rounded bg-surface-elevated/60 border border-border text-foreground font-sans text-xs leading-relaxed">
                {selectedCase.description}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">APPLICABLE STATUTORY ACTS & SECTIONS</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCase.applicableActs.map((act) => (
                  <span
                    key={act}
                    className="px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary font-bold text-[11px]"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                Close Dossier
              </Button>
              <Link to="/gis">
                <Button variant="tactical" size="sm">
                  Pin On Map
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
