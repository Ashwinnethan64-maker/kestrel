import React, { useState } from "react";
import {
  Palette,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/theme/ThemeContext";
import { ThemeDefinition, KESTREL_DEFAULT_THEME } from "@/theme/themes";
import { cn } from "@/lib/utils";

export function ThemeStudioPage() {
  const {
    activeTheme,
    previewTheme,
    setPreview,
    applyTheme,
    resetToDefault,
    allThemes,
  } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    "Technical & Cyber",
    "Tactile & Organic",
    "Art & Editorial",
    "Retro & Heritage",
  ];

  const currentInspected = previewTheme || activeTheme;

  const filteredThemes = allThemes.filter((theme) => {
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || theme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Global Preview Status & Actions */}
      <PageHeader
        title="Kestrel Theme Studio"
        subtitle="Explore 22 genuinely distinct visual styles across layout geometry, typography, surface depth and borders."
        badge={
          <Badge variant="tactical" dot={true}>
            22 STYLES READY
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {previewTheme && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPreview(null)}
                className="gap-1.5 font-mono text-xs"
              >
                CANCEL PREVIEW
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="gap-1.5 font-mono text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>RESET TO DEFAULT</span>
            </Button>
            {previewTheme && (
              <Button
                variant="default"
                size="sm"
                onClick={() => applyTheme(previewTheme)}
                className="gap-1.5 font-mono text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>APPLY {previewTheme.name.toUpperCase()}</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Interactive Live Scoped Component Preview Bar */}
      <Card glow="teal" className="border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-mono flex items-center gap-2 text-primary">
              <Eye className="h-4 w-4 text-primary" />
              <span>Active Surface View: {currentInspected.name}</span>
              {previewTheme ? (
                <span className="text-[10px] bg-attention/20 text-attention border border-attention/30 px-2 py-0.5 rounded font-mono font-bold">
                  PREVIEWING
                </span>
              ) : (
                <span className="text-[10px] bg-positive/20 text-positive border border-positive/30 px-2 py-0.5 rounded font-mono font-bold">
                  APPLIED
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-muted-foreground text-[11px]">Radius: <b className="text-foreground">{currentInspected.radius}</b></span>
              <span className="text-muted-foreground text-[11px]">Font: <b className="text-foreground">{currentInspected.fontFamily}</b></span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Mock Miniature Component Sandbox */}
          <div className="p-4 rounded-lg bg-surface-elevated/80 border border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: currentInspected.accentHex, color: currentInspected.bgHex }}
              >
                SOC
              </div>
              <div>
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <span>FIR // 2024-CR-089</span>
                  <Badge variant="tactical" className="text-[9px] px-1.5">VERIFIED</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Sector: Indiranagar Division • Signal: 100%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="tactical" size="sm" className="font-mono text-xs">
                Tactical Button
              </Button>
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Outline
              </Button>
              <Button variant="destructive" size="sm" className="font-mono text-xs">
                Critical Alert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search 22 themes by name or design spirit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-surface-elevated pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-mono transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-surface-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "all" ? "ALL (22)" : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Default Hero Preset Card: Kestrel Command */}
      <div className="border border-primary/40 rounded-lg p-4 bg-card/90 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground uppercase">
                {KESTREL_DEFAULT_THEME.name}
              </span>
              <Badge variant="tactical">RECOMMENDED DEFAULT</Badge>
              {activeTheme.id === KESTREL_DEFAULT_THEME.id && (
                <span className="text-[10px] text-positive font-mono font-bold flex items-center gap-1">
                  <Check className="h-3 w-3" /> ACTIVE NOW
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-sans max-w-2xl">
              {KESTREL_DEFAULT_THEME.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(KESTREL_DEFAULT_THEME)}
              className="gap-1 font-mono text-xs"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => applyTheme(KESTREL_DEFAULT_THEME)}
              className="gap-1 font-mono text-xs"
            >
              <Check className="h-3.5 w-3.5" /> Apply Default
            </Button>
          </div>
        </div>
      </div>

      {/* 5. 22 Distinct Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredThemes.map((theme) => {
          const isActive = activeTheme.id === theme.id;
          const isPreviewing = previewTheme?.id === theme.id;

          return (
            <Card
              key={theme.id}
              className={cn(
                "group relative flex flex-col justify-between transition-all duration-200",
                isActive && "border-positive/80 shadow-[0_0_15px_-2px_rgba(16,185,129,0.2)]",
                isPreviewing && "border-attention/80 shadow-[0_0_15px_-2px_rgba(242,182,109,0.3)]",
                !isActive && !isPreviewing && "hover:border-primary/50"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xs font-mono font-bold text-foreground">
                      {theme.name}
                    </CardTitle>
                    <div className="text-[10px] font-mono text-primary mt-0.5">
                      {theme.category}
                    </div>
                  </div>
                  {isActive ? (
                    <Badge variant="positive" dot={true}>
                      ACTIVE
                    </Badge>
                  ) : isPreviewing ? (
                    <Badge variant="attention" dot={true}>
                      PREVIEW
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
                {/* Visual Motif Miniature Showcase */}
                <div
                  className="rounded-md p-3 transition-transform group-hover:scale-[1.01] overflow-hidden"
                  style={{
                    backgroundColor: theme.bgHex,
                    borderRadius: theme.radius,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.accentHex,
                        color: theme.bgHex,
                      }}
                    >
                      {theme.fontFamily}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.accentHex }}
                    />
                  </div>

                  <div className="p-2 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/80 space-y-1">
                    <div className="flex justify-between">
                      <span>RAD: {theme.radius}</span>
                      <span>ACCENT: {theme.accentHex}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed font-sans line-clamp-2">
                  {theme.description}
                </p>

                {/* Card Action Controls */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreview(theme)}
                    className="flex-1 font-mono text-[11px] h-8 gap-1"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </Button>
                  <Button
                    variant={isActive ? "secondary" : "tactical"}
                    size="sm"
                    onClick={() => applyTheme(theme)}
                    className="flex-1 font-mono text-[11px] h-8 gap-1"
                  >
                    <Check className="h-3 w-3" /> Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
