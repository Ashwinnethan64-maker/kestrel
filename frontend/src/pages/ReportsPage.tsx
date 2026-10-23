import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Printer,
  Shield,
  Filter,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

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
}

const MOCK_REPORTS: IntelligenceReport[] = [
  {
    id: "REP-2024-089",
    title: "Bengaluru East Tactical Situation Report (SITREP)",
    category: "SITREP",
    classification: "CLASSIFIED // RESTRICTED",
    author: "Insp. Sharma (Badge #KSP-4491)",
    generatedDate: "2024-10-23",
    caseCount: 14,
    status: "Finalized",
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
    summary:
      "Statistical evaluation of 30-day case disposition velocities across 6 police stations. Demonstrates 74.6% overall clearance efficiency.",
  },
];

export function ReportsPage() {
  const [reports, setReports] = useState<IntelligenceReport[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<IntelligenceReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleGenerateNew = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newRep: IntelligenceReport = {
        id: `REP-2024-0${90 + reports.length}`,
        title: "Tactical Hotspot Brief // Live Generation",
        category: "SITREP",
        classification: "CLASSIFIED // RESTRICTED",
        author: "Active Officer Session",
        generatedDate: new Date().toISOString().split("T")[0],
        caseCount: 12,
        status: "Finalized",
        summary:
          "Automatically synthesized briefing compiling active First Information Reports and repeat offender coordinates across Bengaluru divisions.",
      };
      setReports((prev) => [newRep, ...prev]);
      setIsGenerating(false);
      setToastMessage("Intelligence Briefing compiled successfully.");
      setTimeout(() => setToastMessage(null), 3000);
    }, 800);
  };

  const handleExport = (rep: IntelligenceReport) => {
    setToastMessage(`Downloading official PDF for ${rep.id}...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classified Intelligence Reports & SITREPs"
        subtitle="Operational charge sheet briefings, situation reports, and court-admissible dossiers with official watermark authentication."
        badge={
          <Badge variant="tactical" dot={true}>
            REPORT GENERATOR READY
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="tactical"
              size="sm"
              disabled={isGenerating}
              onClick={handleGenerateNew}
              className="gap-1.5 font-mono text-xs"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>COMPILING SITREP...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>COMPILE NEW SITREP</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-primary hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter briefings by title or report ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-surface-elevated pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((r) => (
          <Card
            key={r.id}
            className="flex flex-col justify-between hover:border-primary/50 transition-all group"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-primary font-bold">{r.id}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30 uppercase font-semibold">
                  {r.classification}
                </span>
              </div>
              <CardTitle className="text-xs font-mono font-bold leading-snug group-hover:text-primary transition-colors">
                {r.title}
              </CardTitle>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Author: {r.author} • {r.generatedDate}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-3">
                {r.summary}
              </p>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-mono">
                <Badge variant="tactical" className="text-[10px]">
                  {r.caseCount} Cases Attached
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(r)}
                    className="h-7 text-[10px] font-mono px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" /> Preview
                  </Button>
                  <Button
                    variant="tactical"
                    size="sm"
                    onClick={() => handleExport(r)}
                    className="h-7 text-[10px] font-mono px-2"
                  >
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author:</span>
                <span className="text-foreground font-bold">{selectedReport.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Generation:</span>
                <span className="text-foreground">{selectedReport.generatedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attached Case Files:</span>
                <span className="text-primary font-bold">{selectedReport.caseCount} FIR Records</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block uppercase mb-1">
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
                onClick={() => handleExport(selectedReport)}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Verified PDF Brief</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
