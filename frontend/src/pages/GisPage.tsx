import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Map as MapIcon,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Activity,
  CalendarDays,
  Flame,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
  X,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Crosshair,
  Globe,
  SlidersHorizontal,
  Bot,
  Info,
  Check,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { apiClient } from "@/services/api/client";
import { useInvestigationContext } from "@/store/useInvestigationContext";
import type { FIRCase, BoundingBox } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// MapTiler Configuration
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";
const MAPTILER_DARK_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2-dark/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const MAPTILER_STREETS_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAPTILER_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  : '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Custom Leaflet marker icons with color codes
const createCustomMarkerIcon = (priority: string, isSelected: boolean) => {
  let color = "#D4AF37"; // default gold
  if (priority === "Critical") color = "#F85149"; // red
  else if (priority === "High") color = "#F2B66D"; // amber
  else if (priority === "Medium") color = "#69A9FF"; // slate blue
  else if (priority === "Low") color = "#63E6D2"; // teal

  const pulseRing =
    priority === "Critical"
      ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${color}"></span>`
      : "";
  const borderStyle = isSelected
    ? "border: 2px solid #FFF; transform: scale(1.3);"
    : "border: 1.5px solid #141416;";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        ${pulseRing}
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; ${borderStyle} box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

// Component to dynamically re-center/fit the map viewport
function MapAutoCentering({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

// PostGIS Live Viewport Synchronizer Component
interface MapViewportSyncProps {
  enabled: boolean;
  onBoundsChange: (bounds: BoundingBox) => void;
}

function MapViewportSync({ enabled, onBoundsChange }: MapViewportSyncProps) {
  const map = useMapEvents({
    moveend: () => {
      if (!enabled) return;
      const b = map.getBounds();
      onBoundsChange([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ]);
    },
    zoomend: () => {
      if (!enabled) return;
      const b = map.getBounds();
      onBoundsChange([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ]);
    },
  });

  useEffect(() => {
    if (!enabled) return;
    const b = map.getBounds();
    onBoundsChange([
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ]);
  }, [enabled, map, onBoundsChange]);

  return null;
}

export function GisPage() {
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Map Modes & View controls
  const [mapMode, setMapMode] = useState<"standard" | "heatmap">("standard");
  const [mapTileStyle, setMapTileStyle] = useState<"dark" | "osm">("dark");
  const [selectedPin, setSelectedPin] = useState<FIRCase | null>(null);

  // Sidebar and Drawer Toggles
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Layer Accordion Collapsibles
  const [openSections, setOpenSections] = useState<{
    districts: boolean;
    categories: boolean;
    risk: boolean;
    status: boolean;
  }>({
    districts: true,
    categories: true,
    risk: true,
    status: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Default coordinates centered on Karnataka / Bengaluru Metro
  const defaultCenter: [number, number] = [12.9716, 77.5946];
  const [activeCenter, setActiveCenter] = useState<[number, number]>(defaultCenter);
  const [activeZoom, setActiveZoom] = useState<number>(12);

  // PostGIS Viewport Sync State
  const [viewportSyncEnabled, setViewportSyncEnabled] = useState(true);
  const [isQueryingPostGIS, setIsQueryingPostGIS] = useState(false);
  const [postgisLatency, setPostgisLatency] = useState<number | null>(null);
  const [activeBounds, setActiveBounds] = useState<BoundingBox | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: BoundingBox) => {
      setActiveBounds(bounds);
      useInvestigationContext.getState().setActiveBoundingBox(bounds);

      if (!viewportSyncEnabled) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsQueryingPostGIS(true);
        const start = Date.now();
        try {
          const res = await apiClient.getSpatialIncidents(bounds, {
            crimeCategory: selectedCategory !== "all" ? selectedCategory : undefined,
            priority: selectedPriority !== "all" ? selectedPriority : undefined,
            status: selectedStatus !== "all" ? selectedStatus : undefined,
            policeStation: selectedStation !== "all" ? selectedStation : undefined,
            district: selectedDistrict !== "all" ? selectedDistrict : undefined,
            searchQuery: searchQuery.trim() || undefined,
            limit: 1500,
          });
          if (res.success && res.data) {
            setCases(res.data);
            setPostgisLatency(Date.now() - start);
          }
        } catch (err: any) {
          console.warn("[PostGIS Viewport Sync Error]:", err);
        } finally {
          setIsQueryingPostGIS(false);
        }
      }, 350);
    },
    [
      viewportSyncEnabled,
      selectedCategory,
      selectedPriority,
      selectedStatus,
      selectedStation,
      selectedDistrict,
      searchQuery,
    ]
  );

  useEffect(() => {
    apiClient
      .getSpatialIncidents(null, { limit: 1500 })
      .then((res) => {
        setCases(res.data);
        if (res.data.length > 0) {
          setSelectedPin(res.data[0]);
          setActiveCenter([res.data[0].latitude, res.data[0].longitude]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load spatial telemetry records.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeBounds && viewportSyncEnabled) {
      handleBoundsChange(activeBounds);
    }
  }, [
    selectedCategory,
    selectedPriority,
    selectedStatus,
    selectedStation,
    selectedDistrict,
    searchQuery,
    handleBoundsChange,
    activeBounds,
    viewportSyncEnabled,
  ]);

  // Filter Unique Lists
  const districts = useMemo(
    () => Array.from(new Set(cases.map((c) => c.district).filter(Boolean))).sort(),
    [cases]
  );
  const stations = useMemo(
    () => Array.from(new Set(cases.map((c) => c.policeStation).filter(Boolean))).sort(),
    [cases]
  );
  const categories = useMemo(
    () => Array.from(new Set(cases.map((c) => c.crimeCategory).filter(Boolean))).sort(),
    [cases]
  );

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedDistrict !== "all" && c.district !== selectedDistrict) return false;
      if (selectedStation !== "all" && c.policeStation !== selectedStation) return false;
      if (selectedCategory !== "all" && c.crimeCategory !== selectedCategory) return false;
      if (selectedPriority !== "all" && c.priority !== selectedPriority) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
      if (startDate && new Date(c.incidentDate) < new Date(startDate)) return false;
      if (endDate && new Date(c.incidentDate) > new Date(endDate)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.firNumber.toLowerCase().includes(q) ||
          c.policeStation.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    cases,
    selectedDistrict,
    selectedStation,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDistrict("all");
    setSelectedStation("all");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setActiveCenter(defaultCenter);
    setActiveZoom(12);
    setToastMessage("Crime map filters reset to default.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectIncident = (incident: FIRCase) => {
    setSelectedPin(incident);
    setActiveCenter([incident.latitude, incident.longitude]);
    setActiveZoom(14);
  };

  // Real Export CSV
  const handleExportCSV = () => {
    setShowExportMenu(false);
    if (filteredCases.length === 0) {
      alert("No matching incidents to export.");
      return;
    }
    const headers = [
      "FIR Number",
      "Latitude",
      "Longitude",
      "Police Station",
      "District",
      "Category",
      "Priority",
      "Status",
      "Date",
      "Description",
    ];
    const rows = filteredCases.map((c) => [
      `"${c.firNumber}"`,
      c.latitude,
      c.longitude,
      `"${c.policeStation}"`,
      `"${c.district}"`,
      `"${c.crimeCategory}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.incidentDate}"`,
      `"${c.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `kestrel-crime-map-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("Filtered incident records exported as CSV.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real Export GeoJSON
  const handleExportGeoJSON = () => {
    setShowExportMenu(false);
    if (filteredCases.length === 0) {
      alert("No matching incidents to export.");
      return;
    }
    const geojson = {
      type: "FeatureCollection",
      features: filteredCases.map((c) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [c.longitude, c.latitude],
        },
        properties: {
          id: c.id,
          firNumber: c.firNumber,
          policeStation: c.policeStation,
          district: c.district,
          crimeCategory: c.crimeCategory,
          priority: c.priority,
          status: c.status,
          incidentDate: c.incidentDate,
          description: c.description,
        },
      })),
    };
    const jsonString =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(geojson, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute(
      "download",
      `kestrel-crime-map-features-${new Date().toISOString().slice(0, 10)}.geojson`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("GeoJSON FeatureCollection exported successfully.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-3">
      {/* 1. Page Header */}
      <PageHeader
        title="Crime Map"
        subtitle="Geospatial intelligence workspace, density clusters, and tactical patrol hotspot mapping across Karnataka and Bengaluru divisions."
        badge={
          <Badge variant="tactical" dot={true}>
            GEO TELEMETRY // MAPTILER ENGINE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live PostGIS Viewport Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated/80 border border-border font-mono text-[11px] shrink-0">
              <span className={`h-2 w-2 rounded-full ${isQueryingPostGIS ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
              <span className="text-muted-foreground">POSTGIS VIEWPORT:</span>
              <span className="font-bold text-foreground">{filteredCases.length} INCIDENTS</span>
              {postgisLatency !== null && (
                <span className="text-primary text-[10px]">({postgisLatency}ms)</span>
              )}
            </div>

            {/* Toggle Viewport Sync Button */}
            <Button
              variant={viewportSyncEnabled ? "tactical" : "outline"}
              size="sm"
              onClick={() => {
                const next = !viewportSyncEnabled;
                setViewportSyncEnabled(next);
                setToastMessage(next ? "Live PostGIS Viewport Sync activated." : "Viewport Sync paused. Showing fixed dataset.");
                setTimeout(() => setToastMessage(null), 2500);
                if (next && activeBounds) {
                  handleBoundsChange(activeBounds);
                }
              }}
              className="gap-1.5 font-mono text-xs"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{viewportSyncEnabled ? "SYNC: ON" : "SYNC: PAUSED"}</span>
            </Button>

            <Button
              variant={mapMode === "standard" ? "tactical" : "outline"}
              size="sm"
              onClick={() => setMapMode("standard")}
              className="gap-1.5 font-mono text-xs"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>INCIDENT PINS</span>
            </Button>
            <Button
              variant={mapMode === "heatmap" ? "tactical" : "outline"}
              size="sm"
              onClick={() => setMapMode("heatmap")}
              className="gap-1.5 font-mono text-xs"
            >
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span>HEATMAP MODE</span>
            </Button>
            <Button
              variant={mapTileStyle === "dark" ? "outline" : "tactical"}
              size="sm"
              onClick={() => setMapTileStyle(mapTileStyle === "dark" ? "osm" : "dark")}
              className="gap-1.5 font-mono text-xs"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{mapTileStyle === "dark" ? "MAPTILER DARK" : "MAPTILER STREET"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiDrawerOpen(true)}
              className="gap-1.5 font-mono text-xs text-primary border-primary/40 hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI ANALYSE AREA</span>
            </Button>
          </div>
        }
      />

      {/* API Key Missing or Restricted Warning if applicable */}
      {!MAPTILER_KEY && (
        <div className="p-3 rounded bg-attention/10 border border-attention/30 text-attention font-mono text-xs flex items-center justify-between">
          <span>NOTICE: VITE_MAPTILER_KEY environment variable is not defined. Using fallback tile provider.</span>
        </div>
      )}

      {/* Global Feedback Toast */}
      {toastMessage && (
        <div className="p-3 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      {/* 2. Compact Horizontal Map Toolbar */}
      <Card className="shadow-xs border border-border">
        <CardContent className="p-2.5 space-y-2 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search FIR, Area, or Station */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search FIR, area or station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 rounded border border-border bg-surface-elevated/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>

            {/* District Selector */}
            <div className="flex items-center gap-1.5 bg-surface-elevated/80 border border-border px-2 py-0.5 rounded">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs"
              >
                <option value="all">District: All</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Crime Type Selector */}
            <div className="flex items-center gap-1.5 bg-surface-elevated/80 border border-border px-2 py-0.5 rounded">
              <Shield className="h-3.5 w-3.5 text-secondary shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs"
              >
                <option value="all">Crime Type: All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Selector */}
            <div className="flex items-center gap-1.5 bg-surface-elevated/80 border border-border px-2 py-0.5 rounded">
              <ShieldAlert className="h-3.5 w-3.5 text-attention shrink-0" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs"
              >
                <option value="all">Risk Level: All</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Severity</option>
                <option value="Medium">Medium Severity</option>
                <option value="Low">Low Severity</option>
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-surface-elevated/80 border border-border px-2 py-0.5 rounded">
              <Activity className="h-3.5 w-3.5 text-positive shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs"
              >
                <option value="all">Status: All</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Under Review">Under Review</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-surface-elevated/80 border border-border px-2 py-0.5 rounded">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs w-28"
              />
              <span className="text-muted-foreground text-[10px]">TO</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                className="h-7 bg-transparent text-foreground focus:outline-none text-xs w-28"
              />
            </div>
          </div>

          {/* Sub-bar: Filtered Count + View & Export Actions */}
          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">FILTERED INCIDENTS:</span>
              <span className="font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                {filteredCases.length} OF {cases.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                className="h-6 text-[10px] px-2 font-mono gap-1 ml-2"
              >
                <Layers className="h-3 w-3 text-secondary" />
                <span>{isLayersOpen ? "COLLAPSE LAYERS" : "EXPAND LAYERS"}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 text-[10px] px-2 font-mono"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Reset View
              </Button>

              {/* Export Dropdown */}
              <div className="relative">
                <Button
                  variant="tactical"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="h-6 text-[10px] px-2 font-mono gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>EXPORT</span>
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded shadow-xl py-1 z-50 font-mono text-xs">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface-elevated text-foreground flex items-center justify-between"
                    >
                      <span>Export as CSV</span>
                      <span className="text-[10px] text-muted-foreground">.csv</span>
                    </button>
                    <button
                      onClick={handleExportGeoJSON}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface-elevated text-foreground flex items-center justify-between border-t border-border/40"
                    >
                      <span>Export as GeoJSON</span>
                      <span className="text-[10px] text-muted-foreground">.geojson</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Workspace: Collapsible Layers Sidebar + Large Leaflet Map Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Intelligence Layers Sidebar (Collapsible, 3 cols) */}
        {isLayersOpen && (
          <div className="lg:col-span-3 space-y-2.5 animate-fade-in">
            {/* Districts / Sectors Layer */}
            <Card className="shadow-xs border border-border">
              <CardHeader
                className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between cursor-pointer select-none bg-sidebar/50"
                onClick={() => toggleSection("districts")}
              >
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Districts & Sectors</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant="tactical" className="text-[9px] px-1 py-0">
                    {districts.length} Dist.
                  </Badge>
                  {openSections.districts ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {openSections.districts && (
                <CardContent className="p-2 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
                  <button
                    onClick={() => setSelectedDistrict("all")}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                      selectedDistrict === "all"
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <span>All Karnataka Divisions</span>
                    <span className="text-[10px]">{cases.length}</span>
                  </button>
                  {districts.map((d) => {
                    const count = cases.filter((c) => c.district === d).length;
                    const isSel = selectedDistrict === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDistrict(d)}
                        className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                          isSel
                            ? "bg-primary/20 text-primary font-bold"
                            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                        }`}
                      >
                        <span className="truncate pr-1">{d}</span>
                        <span className="text-[10px] font-mono">{count}</span>
                      </button>
                    );
                  })}
                </CardContent>
              )}
            </Card>

            {/* Crime Archetypes Layer */}
            <Card className="shadow-xs border border-border">
              <CardHeader
                className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between cursor-pointer select-none bg-sidebar/50"
                onClick={() => toggleSection("categories")}
              >
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <Shield className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span>Crime Categories</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {categories.length}
                  </Badge>
                  {openSections.categories ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {openSections.categories && (
                <CardContent className="p-2 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                      selectedCategory === "all"
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <span>All Crime Categories</span>
                    <span className="text-[10px]">{cases.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = cases.filter((c) => c.crimeCategory === cat).length;
                    const isSel = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                          isSel
                            ? "bg-primary/20 text-primary font-bold"
                            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                        }`}
                      >
                        <span className="truncate pr-1">{cat}</span>
                        <span className="text-[10px] font-mono">{count}</span>
                      </button>
                    );
                  })}
                </CardContent>
              )}
            </Card>

            {/* Risk Level Layer */}
            <Card className="shadow-xs border border-border">
              <CardHeader
                className="p-2.5 border-b border-border/80 flex flex-row items-center justify-between cursor-pointer select-none bg-sidebar/50"
                onClick={() => toggleSection("risk")}
              >
                <CardTitle className="text-xs font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <ShieldAlert className="h-3.5 w-3.5 text-attention shrink-0" />
                  <span>Risk Level Filter</span>
                </CardTitle>
                {openSections.risk ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </CardHeader>
              {openSections.risk && (
                <CardContent className="p-2 space-y-1 font-mono text-xs">
                  {[
                    { label: "All Risk Levels", value: "all", color: "text-foreground" },
                    { label: "Critical Priority", value: "Critical", color: "text-[#F85149]" },
                    { label: "High Severity", value: "High", color: "text-[#F2B66D]" },
                    { label: "Medium Severity", value: "Medium", color: "text-[#69A9FF]" },
                    { label: "Low Severity", value: "Low", color: "text-[#63E6D2]" },
                  ].map((lvl) => {
                    const count =
                      lvl.value === "all"
                        ? cases.length
                        : cases.filter((c) => c.priority === lvl.value).length;
                    const isSel = selectedPriority === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        onClick={() => setSelectedPriority(lvl.value)}
                        className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                          isSel
                            ? "bg-primary/20 text-primary font-bold"
                            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                        }`}
                      >
                        <span className={`truncate pr-1 ${lvl.color}`}>{lvl.label}</span>
                        <span className="text-[10px] font-mono">{count}</span>
                      </button>
                    );
                  })}
                </CardContent>
              )}
            </Card>

            {/* Severity Legend */}
            <Card className="shadow-xs border border-border">
              <CardContent className="p-2.5 space-y-2 font-mono text-[11px]">
                <span className="text-muted-foreground uppercase block text-[10px] font-bold">
                  Geographic Marker Legend
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F85149] shrink-0" />
                    <span className="text-foreground">Critical (Red)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F2B66D] shrink-0" />
                    <span className="text-foreground">High (Amber)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#69A9FF] shrink-0" />
                    <span className="text-foreground">Medium (Blue)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#63E6D2] shrink-0" />
                    <span className="text-foreground">Low (Teal)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Central Full-Sized Geographic Leaflet Map Canvas */}
        <div className={isLayersOpen ? "lg:col-span-9 space-y-3" : "lg:col-span-12 space-y-3"}>
          <Card className="h-[680px] overflow-hidden flex flex-col shadow-sm relative border border-border">
            <CardHeader className="py-2 px-3 border-b border-border/80 flex flex-row items-center justify-between shrink-0 bg-sidebar/80">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-xs font-mono font-bold text-foreground">
                  Karnataka // Bengaluru Interactive Geographic Map
                </CardTitle>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <span>
                  VIEWPORT: {activeCenter[0].toFixed(4)}° N, {activeCenter[1].toFixed(4)}° E
                </span>
                <button
                  onClick={() => {
                    setActiveCenter(defaultCenter);
                    setActiveZoom(12);
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1"
                  title="Reset initial viewport"
                >
                  <RotateCcw className="h-3 w-3" /> Reset View
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative">
              <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                className="w-full h-full z-10"
                style={{ background: "#141416" }}
              >
                {/* Dynamically adjust map viewport on selection */}
                <MapAutoCentering center={activeCenter} zoom={activeZoom} />

                {/* Live PostGIS Viewport Synchronizer */}
                <MapViewportSync
                  enabled={viewportSyncEnabled}
                  onBoundsChange={handleBoundsChange}
                />

                {/* MapTiler Dark Matter or MapTiler Streets Tile Layer */}
                {mapTileStyle === "dark" ? (
                  <TileLayer
                    attribution={MAPTILER_ATTRIBUTION}
                    url={MAPTILER_DARK_URL}
                    tileSize={256}
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    attribution={MAPTILER_ATTRIBUTION}
                    url={MAPTILER_STREETS_URL}
                    tileSize={256}
                    maxZoom={19}
                  />
                )}

                {/* Heatmap Mode via density circles */}
                {mapMode === "heatmap" &&
                  filteredCases.map((c) => (
                    <CircleMarker
                      key={`heat-${c.id}`}
                      center={[c.latitude, c.longitude]}
                      radius={
                        c.priority === "Critical" ? 38 : c.priority === "High" ? 28 : 20
                      }
                      pathOptions={{
                        fillColor: c.priority === "Critical" ? "#F85149" : "#D4AF37",
                        fillOpacity: 0.28,
                        stroke: false,
                      }}
                    />
                  ))}

                {/* Geographic Incident Markers */}
                {filteredCases.map((c) => {
                  const isSelected = selectedPin?.id === c.id;
                  const markerIcon = createCustomMarkerIcon(c.priority, isSelected);

                  return (
                    <Marker
                      key={c.id}
                      position={[c.latitude, c.longitude]}
                      icon={markerIcon}
                      eventHandlers={{
                        click: () => handleSelectIncident(c),
                      }}
                    >
                      <Popup className="kestrel-leaflet-popup">
                        <div className="font-mono text-xs p-1 space-y-1">
                          <div className="font-bold text-primary">{c.firNumber}</div>
                          <div className="font-semibold text-foreground">{c.crimeCategory}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {c.policeStation} • {c.priority} Priority
                          </div>
                          <div className="text-[10px] text-foreground font-sans line-clamp-2">
                            {c.description}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Floating Selected Incident Detail View */}
              {selectedPin && (
                <div className="absolute bottom-4 right-4 z-[400] w-84 max-w-[calc(100%-2rem)] bg-card/95 backdrop-blur-md border border-border p-3.5 rounded shadow-2xl font-mono text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-primary text-xs">
                        {selectedPin.firNumber}
                      </span>
                    </div>
                    <Badge
                      variant={
                        selectedPin.priority === "Critical"
                          ? "destructive"
                          : selectedPin.priority === "High"
                          ? "attention"
                          : "tactical"
                      }
                      className="text-[9px]"
                    >
                      {selectedPin.priority}
                    </Badge>
                  </div>

                  <div>
                    <div className="font-bold text-foreground text-xs">
                      {selectedPin.crimeCategory}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-secondary shrink-0" />
                      <span>
                        {selectedPin.policeStation} • {selectedPin.district}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-foreground font-sans line-clamp-3 leading-relaxed bg-surface-elevated/60 p-2 rounded border border-border/40">
                    {selectedPin.description}
                  </p>

                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-1">
                    <div>
                      <span className="block text-muted-foreground/80">COORDINATES</span>
                      <span className="text-foreground">
                        {selectedPin.latitude.toFixed(4)}°, {selectedPin.longitude.toFixed(4)}°
                      </span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground/80">INCIDENT DATE</span>
                      <span className="text-foreground">
                        {new Date(selectedPin.incidentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <Link to="/cases" className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-[10px] font-mono gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Inspect Case
                      </Button>
                    </Link>
                    <Link to="/copilot" className="flex-1">
                      <Button
                        variant="tactical"
                        size="sm"
                        className="w-full h-7 text-[10px] font-mono gap-1"
                      >
                        <Bot className="h-3 w-3" />
                        Ask Copilot
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. AI Area Analysis Right-Side Drawer (UI-Only Placeholder - No Simulated Results) */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-md sm:max-w-[420px] h-full bg-card border-l border-border p-6 overflow-y-auto space-y-4 font-mono text-xs shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-foreground text-sm">AI Area Analysis</h3>
                    <span className="text-[10px] text-muted-foreground">
                      Viewport intelligence summary
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiDrawerOpen(false)}
                  className="p-1 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Informative Placeholder Notice */}
              <div className="p-4 rounded bg-surface-elevated/70 border border-border space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Info className="h-4 w-4" />
                  <span>Integration Status: Backend In Progress</span>
                </div>
                <p className="text-muted-foreground text-xs font-sans leading-relaxed">
                  Geospatial AI analysis will be connected in a later phase. This analytical
                  workspace is ready for LLM synthesis of active patrol telemetry, incident
                  hotspots, and syndicate correlation.
                </p>
              </div>

              {/* Reserved Geographic Viewport Overview */}
              <div className="p-3.5 rounded bg-surface-elevated/40 border border-border/80 space-y-2">
                <div className="text-[10px] uppercase font-bold text-foreground tracking-wider">
                  Active Viewport Telemetry Scope
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Filtered Records:</span>
                    <span className="font-bold text-foreground font-mono">
                      {filteredCases.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">District Selection:</span>
                    <span className="font-bold text-foreground">
                      {selectedDistrict === "all" ? "All Districts" : selectedDistrict}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category Selection:</span>
                    <span className="font-bold text-foreground">
                      {selectedCategory === "all" ? "All Categories" : selectedCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reserved Area for Future Geographic Summaries & Category Breakdowns */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Reserved Geographic Summaries & Actions
                </span>
                <div className="p-3.5 rounded border border-dashed border-border/80 text-muted-foreground font-sans text-xs space-y-1.5">
                  <p>When connected, the AI Area Analysis engine will evaluate:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground/90">
                    <li>Multi-incident spatial clustering and corridor escape routes</li>
                    <li>Repeat offender modus operandi match within 5km radius</li>
                    <li>Patrol dispatch and ANPR surveillance recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiDrawerOpen(false)}
                className="font-mono text-xs"
              >
                Close Drawer
              </Button>
              <Link to="/copilot">
                <Button variant="tactical" size="sm" className="gap-1.5 font-mono text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Open AI Investigator</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
