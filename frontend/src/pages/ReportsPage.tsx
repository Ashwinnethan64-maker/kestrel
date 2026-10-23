import React from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Classified Intelligence Reports & SITREPs"
        subtitle="Automated charge sheet briefs, classified PDF dossier synthesis with dynamic security watermarking."
      />
      <StateView
        icon={<FileText className="h-6 w-6 text-primary" />}
        title="Report Synthesis Engine Ready"
        description="Client-side PDF report compilation and sanitized CSV data export will be activated in Stage 4."
      />
    </div>
  );
}
