import React from "react";
import { FolderGit2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";
import { Button } from "@/components/ui/button";

export function CasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases & FIR Records"
        subtitle="Manage First Information Reports, accused profiles, statutory sections, and evidence records."
      />
      <StateView
        icon={<FolderGit2 className="h-6 w-6 text-primary" />}
        title="Case & FIR Explorer Module Initialized"
        description="The full case ledger with multi-column filtering, IPC statutory mapping, and dossier drawer will be connected in Phase 2 / Stage 4."
        actionLabel="View Overview Dashboard"
        onAction={() => window.location.href = "/overview"}
      />
    </div>
  );
}
