import React from "react";
import { Filter, Calendar, MapPin, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardFilterState {
  dateRange: "24h" | "7d" | "30d" | "all";
  policeStation: string;
  category: string;
  priority: string;
  searchQuery: string;
}

interface DashboardFilterBarProps {
  filters: DashboardFilterState;
  onChange: (updated: Partial<DashboardFilterState>) => void;
  onRefresh: () => void;
  availableStations: string[];
  availableCategories: string[];
  totalMatches: number;
}

export function DashboardFilterBar({
  filters,
  onChange,
  onRefresh,
  availableStations,
  availableCategories,
  totalMatches,
}: DashboardFilterBarProps) {
  const isFiltered =
    filters.dateRange !== "all" ||
    filters.policeStation !== "all" ||
    filters.category !== "all" ||
    filters.priority !== "all" ||
    filters.searchQuery !== "";

  const handleReset = () => {
    onChange({
      dateRange: "all",
      policeStation: "all",
      category: "all",
      priority: "all",
      searchQuery: "",
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card/80 p-3 shadow-sm select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center rounded border border-border bg-surface-elevated/70 p-0.5 font-mono text-xs">
            <span className="px-2 text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
            </span>
            {(["24h", "7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => onChange({ dateRange: range })}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-semibold transition-all",
                  filters.dateRange === range
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Station Division Dropdown */}
          <div className="relative">
            <select
              value={filters.policeStation}
              onChange={(e) => onChange({ policeStation: e.target.value })}
              className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">ALL STATIONS (BLR METRO)</option>
              {availableStations.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Crime Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">ALL CATEGORIES</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={filters.priority}
              onChange={(e) => onChange({ priority: e.target.value })}
              className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">ALL PRIORITIES</option>
              <option value="Critical">CRITICAL ONLY</option>
              <option value="High">HIGH SEVERITY</option>
              <option value="Medium">MEDIUM SEVERITY</option>
            </select>
          </div>

          {/* Clear Filters Reset Button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 font-mono"
            >
              <X className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        {/* Right: Record Counter & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-muted-foreground">
            MATCHING: <span className="font-bold text-primary">{totalMatches}</span> RECORDS
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 gap-1.5 font-mono text-xs"
            title="Refresh active telemetry view"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
