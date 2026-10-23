import React from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tactical Analytics & Crime Velocity"
        subtitle="Incident velocity metrics, repeat offender recidivism indices, and station workload clearance distribution."
      />
      <StateView
        icon={<BarChart3 className="h-6 w-6 text-attention" />}
        title="Tactical Analytics Pipeline Configured"
        description="ECharts hardware-accelerated time-series visualization and anomaly surge detection will be rendered in Stage 4."
      />
    </div>
  );
}
