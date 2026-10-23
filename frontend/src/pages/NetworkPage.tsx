import React from "react";
import { Share2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";

export function NetworkPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Network & Syndicate Analysis"
        subtitle="Force-directed graph topologies connecting repeat offenders, co-accused syndicates, and shared incident locations."
      />
      <StateView
        icon={<Share2 className="h-6 w-6 text-secondary" />}
        title="Network Graph Topology Canvas Ready"
        description="The interactive React Flow canvas with custom suspect nodes, syndicate clustering, and AI explainability will be activated in Stage 4."
      />
    </div>
  );
}
