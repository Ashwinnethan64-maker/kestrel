import React from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";

export function GisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Geographic Intelligence & Spatial GIS"
        subtitle="Tactical crime mapping, kernel density heatmaps, spatial lasso query tool, and patrol route optimization."
      />
      <StateView
        icon={<MapPin className="h-6 w-6 text-primary" />}
        title="Geospatial Mapping Engine Configured"
        description="Leaflet tile integration, dynamic Turf.js spatial calculation, and sector geofencing will be connected in Stage 4."
      />
    </div>
  );
}
