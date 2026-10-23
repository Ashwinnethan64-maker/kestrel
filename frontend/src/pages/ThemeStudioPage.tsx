import React from "react";
import { Palette } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ThemeStudioPage() {
  const palette = [
    { name: "Deep Background", hex: "#0B1220", css: "--background", role: "Primary canvas backdrop" },
    { name: "Sidebar Surface", hex: "#0D1625", css: "--sidebar", role: "Navigation drawer surface" },
    { name: "Bento Card Surface", hex: "#111C2E", css: "--card", role: "Default widget container" },
    { name: "Elevated Surface", hex: "#162235", css: "--surface-elevated", role: "Hovered & active controls" },
    { name: "Tactical Border", hex: "#28374A", css: "--border", role: "Separators and borders" },
    { name: "Primary Accent (Teal)", hex: "#63E6D2", css: "--primary", role: "Active state, high-signal alerts" },
    { name: "Secondary Accent (Blue)", hex: "#69A9FF", css: "--secondary", role: "Secondary highlights" },
    { name: "Warning Attention", hex: "#F2B66D", css: "--attention", role: "Sub-critical alerts" },
    { name: "Critical Alert", hex: "#F85149", css: "--destructive", role: "Immediate emergency alerts" },
    { name: "Positive / Normal", hex: "#10B981", css: "--positive", role: "Resolved & online status" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kestrel Command Theme Studio"
        subtitle="Semantic token palette, contrast ratios, and design system primitives inspection."
        badge={<Badge variant="tactical">DESIGN TOKENS</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {palette.map((p) => (
          <Card key={p.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">{p.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{p.hex}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="h-14 w-full rounded border border-border mb-3 shadow-inner"
                style={{ backgroundColor: p.hex }}
              />
              <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span className="text-primary">{p.css}</span>
                <span>{p.role}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
