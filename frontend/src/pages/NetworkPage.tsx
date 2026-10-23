import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network as NetworkIcon,
  GitBranch,
  ShieldAlert,
  UsersRound,
  FileText,
  MapPin,
  Search,
  ListFilter,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  RotateCcw,
  Sparkles,
  UserRound,
  GitMerge,
  X,
  ExternalLink,
  Shield,
  Layers,
  ChevronDown,
  Info,
  Car,
  Building,
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { FIRCase, AccusedSuspect, NetworkTopologyPayload } from "@kestrel/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StateView } from "@/components/ui/state-view";
import { useInvestigationContext } from "@/store/useInvestigationContext";

// Custom Node for React Flow
const EntityCustomNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  const isSuspect = data.entityType === "suspect";
  const isCase = data.entityType === "case";
  const isSyndicate = data.entityType === "syndicate";
  const isStation = data.entityType === "station";
  const isVehicle = data.entityType === "vehicle";

  let accentColor = "#D4AF37"; // default gold
  let borderStyle = "border-border";
  let iconBg = "bg-primary/10 text-primary";

  if (isSuspect) {
    if (data.severity === "Critical") {
      accentColor = "#F85149";
      borderStyle = "border-[#F85149]/60";
      iconBg = "bg-[#F85149]/15 text-[#F85149]";
    } else if (data.severity === "High") {
      accentColor = "#F2B66D";
      borderStyle = "border-[#F2B66D]/60";
      iconBg = "bg-[#F2B66D]/15 text-[#F2B66D]";
    } else {
      accentColor = "#69A9FF";
      borderStyle = "border-[#69A9FF]/60";
      iconBg = "bg-[#69A9FF]/15 text-[#69A9FF]";
    }
  } else if (isCase) {
    accentColor = "#63E6D2";
    borderStyle = "border-[#63E6D2]/60";
    iconBg = "bg-[#63E6D2]/15 text-[#63E6D2]";
  } else if (isSyndicate) {
    accentColor = "#A78BFA";
    borderStyle = "border-[#A78BFA]/70";
    iconBg = "bg-[#A78BFA]/15 text-[#A78BFA]";
  } else if (isStation) {
    accentColor = "#69A9FF";
    borderStyle = "border-[#69A9FF]/60";
    iconBg = "bg-[#69A9FF]/15 text-[#69A9FF]";
  } else if (isVehicle) {
    accentColor = "#D4AF37";
    borderStyle = "border-[#D4AF37]/60";
    iconBg = "bg-[#D4AF37]/15 text-[#D4AF37]";
  }

  return (
    <div
      className={`px-3 py-2 rounded-md bg-[#18181B] border transition-all select-none shadow-xl min-w-[170px] max-w-[220px] font-mono text-xs ${
        selected
          ? "ring-2 ring-primary border-primary shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105"
          : borderStyle
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#D4AF37]" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#D4AF37]" />

      <div className="flex items-center justify-between pb-1 border-b border-border/40 gap-1.5">
        <span className="text-[9px] uppercase font-bold text-muted-foreground truncate">
          {data.entityType}
        </span>
        {data.severity && (
          <Badge
            variant={
              data.severity === "Critical"
                ? "destructive"
                : data.severity === "High"
                ? "attention"
                : "tactical"
            }
            className="text-[8px] px-1 py-0"
          >
            {data.severity}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1.5">
        <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${iconBg}`}>
          {isSuspect && <UsersRound className="h-3.5 w-3.5" />}
          {isCase && <FileText className="h-3.5 w-3.5" />}
          {isSyndicate && <Layers className="h-3.5 w-3.5" />}
          {isStation && <Building className="h-3.5 w-3.5" />}
          {isVehicle && <Car className="h-3.5 w-3.5" />}
        </div>
        <div className="truncate flex-1">
          <div className="font-bold text-foreground text-xs truncate">{data.label}</div>
          <div className="text-[10px] text-muted-foreground truncate font-sans">
            {data.subLabel || data.typeDescription}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  entityNode: EntityCustomNode,
};

export function NetworkPage() {
  const { dataVersion } = useInvestigationContext();
  const [suspects, setSuspects] = useState<AccusedSuspect[]>([]);
  const [cases, setCases] = useState<FIRCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Inspector & AI Drawers
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef<any>(null);

  // Fetch ground truth dataset
  useEffect(() => {
    Promise.all([apiClient.getAccused(), apiClient.getCases()])
      .then(([suspRes, casesRes]) => {
        setSuspects(suspRes.data);
        setCases(casesRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load network intelligence.");
        setLoading(false);
      });
  }, [dataVersion]);

  // Build Graph Nodes and Edges from Suspects, Cases, Syndicates, and Vehicles
  const { initialNodes, initialEdges } = useMemo(() => {
    if (suspects.length === 0) return { initialNodes: [], initialEdges: [] };

    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    // Distinct Syndicates
    const syndicatesMap: Record<string, AccusedSuspect[]> = {};
    suspects.forEach((s) => {
      const gang = s.gangAffiliation || "Independent Operatives";
      if (!syndicatesMap[gang]) syndicatesMap[gang] = [];
      syndicatesMap[gang].push(s);
    });

    const syndicateNames = Object.keys(syndicatesMap);

    // Positions for 3 distinct clusters:
    // Cluster 1 (East Ring): Center X=200, Y=250
    // Cluster 2 (Whitefield): Center X=750, Y=250
    // Cluster 3 (Central Shadow): Center X=1300, Y=250
    const clusterCenters = [
      { x: 220, y: 260 },
      { x: 780, y: 260 },
      { x: 1340, y: 260 },
    ];

    syndicateNames.forEach((gangName, idx) => {
      const center = clusterCenters[idx % clusterCenters.length];
      const synId = `SYN-${idx + 1}`;

      // Syndicate Hub Node
      nodeList.push({
        id: synId,
        type: "entityNode",
        position: { x: center.x, y: center.y - 140 },
        data: {
          id: synId,
          entityType: "syndicate",
          label: gangName,
          subLabel: `${syndicatesMap[gangName].length} Known Members`,
          severity: "Critical",
          details: {
            memberCount: syndicatesMap[gangName].length,
            territory: syndicatesMap[gangName][0]?.primaryStation || "Bengaluru Metro",
          },
        },
      });

      // Member Suspect Nodes placed in orbit around syndicate hub
      const members = syndicatesMap[gangName];
      members.forEach((m, mIdx) => {
        const angle = (mIdx / members.length) * 2 * Math.PI;
        const radius = 170;
        const posX = center.x + Math.cos(angle) * radius - 40;
        const posY = center.y + Math.sin(angle) * radius + 50;

        nodeList.push({
          id: m.id,
          type: "entityNode",
          position: { x: posX, y: posY },
          data: {
            id: m.id,
            entityType: "suspect",
            label: m.fullName,
            subLabel: m.aliases[0] ? `"${m.aliases[0]}"` : "No Alias",
            severity: m.riskLevel,
            typeDescription: m.gangAffiliation || "Independent",
            details: {
              ...m,
              arrests: m.totalPriorArrests,
              phone: m.phoneNumbers[0],
              address: m.knownAddresses[0],
              vehicles: m.vehiclePlates || [],
            },
          },
        });

        // Edge: Member to Syndicate
        edgeList.push({
          id: `e-${synId}-${m.id}`,
          source: synId,
          target: m.id,
          label: "MEMBER_OF",
          style: { stroke: "#A78BFA", strokeWidth: 1.5, strokeDasharray: "4,4" },
          labelStyle: { fill: "#A78BFA", fontSize: 9, fontFamily: "monospace" },
        });
      });

      // Inter-member Co-accused edges within syndicate
      for (let i = 0; i < members.length - 1; i++) {
        edgeList.push({
          id: `e-co-${members[i].id}-${members[i + 1].id}`,
          source: members[i].id,
          target: members[i + 1].id,
          label: "CO_ACCUSED",
          style: { stroke: "#F85149", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#F85149" },
          labelStyle: { fill: "#F85149", fontSize: 9, fontFamily: "monospace" },
        });
      }
    });

    // Add Key Case Nodes linked to prime suspects
    cases.slice(0, 4).forEach((c, cIdx) => {
      const caseNodeId = c.id;
      const posX = 150 + cIdx * 350;
      const posY = 580;

      nodeList.push({
        id: caseNodeId,
        type: "entityNode",
        position: { x: posX, y: posY },
        data: {
          id: caseNodeId,
          entityType: "case",
          label: c.firNumber,
          subLabel: c.crimeCategory,
          severity: c.priority,
          typeDescription: c.policeStation,
          details: {
            firNumber: c.firNumber,
            category: c.crimeCategory,
            station: c.policeStation,
            date: c.incidentDate,
            description: c.description,
            acts: c.applicableActs,
          },
        },
      });

      // Link Case to its Accused suspects
      c.accusedIds?.forEach((accId) => {
        if (nodeList.some((n) => n.id === accId)) {
          edgeList.push({
            id: `e-case-${caseNodeId}-${accId}`,
            source: accId,
            target: caseNodeId,
            label: "LINKED_IN_FIR",
            style: { stroke: "#63E6D2", strokeWidth: 1.5 },
            labelStyle: { fill: "#63E6D2", fontSize: 9, fontFamily: "monospace" },
          });
        }
      });
    });

    // Add Key Vehicle Conduits (e.g. KA-04-E-1234)
    nodeList.push({
      id: "VEH-01",
      type: "entityNode",
      position: { x: 500, y: 120 },
      data: {
        id: "VEH-01",
        entityType: "vehicle",
        label: "KA-04-E-1234",
        subLabel: "Black Hyundai Verna",
        severity: "High",
        typeDescription: "Stolen Getaway Asset",
        details: {
          plate: "KA-04-E-1234",
          model: "Black Hyundai Verna",
          status: "Sighted in multiple heists",
          theftFir: "FIR-2024-KRP-0215",
        },
      },
    });

    // Link vehicle to SUSP-001 and SUSP-002
    edgeList.push({
      id: "e-veh-1",
      source: "SUSP-001",
      target: "VEH-01",
      label: "OPERATED_ASSET",
      style: { stroke: "#D4AF37", strokeWidth: 1.8 },
      labelStyle: { fill: "#D4AF37", fontSize: 9, fontFamily: "monospace" },
    });
    edgeList.push({
      id: "e-veh-2",
      source: "SUSP-002",
      target: "VEH-01",
      label: "CO_SIGHTED",
      style: { stroke: "#D4AF37", strokeWidth: 1.8 },
      labelStyle: { fill: "#D4AF37", fontSize: 9, fontFamily: "monospace" },
    });

    return { initialNodes: nodeList, initialEdges: edgeList };
  }, [suspects, cases]);

  // Synchronize initial graph layout
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      if (!selectedEntity) {
        setSelectedEntity(initialNodes[1]?.data || initialNodes[0]?.data);
      }
    }
  }, [initialNodes, initialEdges]);

  // Search & Filter applied dynamically to nodes
  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      let isHidden = false;

      // Entity type filter
      if (selectedEntityType !== "all" && node.data.entityType !== selectedEntityType) {
        isHidden = true;
      }

      // Risk filter
      if (selectedRisk !== "all" && node.data.severity !== selectedRisk) {
        isHidden = true;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const label = String(node.data.label || "").toLowerCase();
        const sub = String(node.data.subLabel || "").toLowerCase();
        const id = String(node.data.id || "").toLowerCase();
        if (!label.includes(q) && !sub.includes(q) && !id.includes(q)) {
          isHidden = true;
        }
      }

      return {
        ...node,
        hidden: isHidden,
      };
    });
  }, [nodes, selectedEntityType, selectedRisk, searchQuery]);

  // Node Selection Handler
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedEntity(node.data);
  }, []);

  // Toolbar Actions
  const handleZoomIn = () => {
    reactFlowInstance.current?.zoomIn();
  };

  const handleZoomOut = () => {
    reactFlowInstance.current?.zoomOut();
  };

  const handleFitView = () => {
    reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
  };

  const handleResetView = () => {
    setSearchQuery("");
    setSelectedEntityType("all");
    setSelectedRisk("all");
    reactFlowInstance.current?.fitView({ padding: 0.15, duration: 400 });
    setToastMessage("Network view and camera position reset.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Real Export JSON Network Topology
  const handleExportGraph = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      nodes: nodes.filter((n) => !n.hidden),
      edges: edges,
    };
    const jsonString =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `kestrel-criminal-network-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage("Criminal network topology exported as JSON.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics summary
  const totalEntities = nodes.length;
  const totalConnections = edges.length;
  const criticalEntities = nodes.filter((n) => n.data.severity === "Critical").length;
  const suspectEntities = nodes.filter((n) => n.data.entityType === "suspect").length;
  const activeFIRsCount = cases.length;
  const districtsCount = useMemo(
    () => new Set(cases.map((c) => c.district).filter(Boolean)).size,
    [cases]
  );

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* 1. Page Header */}
      <PageHeader
        title="Criminal Network"
        subtitle="Interactive entity relationship graph uncovering co-accused syndicates, shared vehicle conduits, and repeat offender rings."
        badge={
          <Badge variant="tactical" dot={true}>
            RELATIONAL GRAPH ENGINE // XYFLOW
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiDrawerOpen(true)}
              className="gap-1.5 font-mono text-xs text-primary border-primary/40 hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI EXPLAIN</span>
            </Button>
            <Button
              variant="tactical"
              size="sm"
              onClick={handleExportGraph}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT GRAPH</span>
            </Button>
          </div>
        }
      />

      {/* Global Feedback Toast */}
      {toastMessage && (
        <div className="p-3 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* 2. Compact Graph Toolbar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left search and filter group */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-lg">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search entity name, alias, FIR, plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 rounded border border-border bg-surface-elevated/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>

            {/* Entity Type Selector */}
            <div className="relative">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="h-8 rounded border border-border bg-surface-elevated/80 px-2 text-foreground focus:outline-none text-xs"
              >
                <option value="all">Types: All</option>
                <option value="suspect">Accused / Suspects</option>
                <option value="case">FIR Case Records</option>
                <option value="syndicate">Crime Syndicates</option>
                <option value="vehicle">Vehicles / Assets</option>
              </select>
            </div>

            {/* Risk Selector */}
            <div className="relative">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="h-8 rounded border border-border bg-surface-elevated/80 px-2 text-foreground focus:outline-none text-xs"
              >
                <option value="all">Risk: All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          {/* Right Zoom & View Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFitView}
              className="h-8 px-2.5 font-mono text-[11px] gap-1"
              title="Fit to Viewport"
            >
              <Maximize className="h-3 w-3" />
              <span>Fit View</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="h-8 px-2.5 font-mono text-[11px] gap-1"
              title="Reset View"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Network Intelligence Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <NetworkIcon className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Entities
            </div>
            <div className="text-sm font-bold text-foreground font-mono">{totalEntities}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
            <GitBranch className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Connections
            </div>
            <div className="text-sm font-bold text-foreground font-mono">{totalConnections}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shrink-0">
            <ShieldAlert className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Critical Risk
            </div>
            <div className="text-sm font-bold text-destructive font-mono">{criticalEntities}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-attention/10 border border-attention/30 flex items-center justify-center text-attention shrink-0">
            <UsersRound className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Suspects
            </div>
            <div className="text-sm font-bold text-foreground font-mono">{suspectEntities}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[#63E6D2]/10 border border-[#63E6D2]/30 flex items-center justify-center text-[#63E6D2] shrink-0">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Active FIRs
            </div>
            <div className="text-sm font-bold text-foreground font-mono">{activeFIRsCount}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-card border border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">
              Districts
            </div>
            <div className="text-sm font-bold text-foreground font-mono">{districtsCount}</div>
          </div>
        </div>
      </div>

      {/* 4. Full-Workspace Interactive Relationship Graph Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Graph Canvas Container */}
        <div className={selectedEntity ? "lg:col-span-8 h-[650px]" : "lg:col-span-12 h-[650px]"}>
          <Card className="h-full border border-border overflow-hidden relative shadow-sm">
            <CardContent className="p-0 h-full w-full relative bg-[#141416]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <NetworkIcon className="h-8 w-8 text-primary animate-pulse mx-auto" />
                    <p className="text-muted-foreground text-xs font-mono">
                      Computing force-directed entity relationship graph...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <StateView
                  variant="error"
                  title="Network Topology Error"
                  description={error}
                  actionLabel="Retry"
                  onAction={() => window.location.reload()}
                />
              ) : (
                <ReactFlow
                  nodes={displayNodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onInit={(instance) => {
                    reactFlowInstance.current = instance;
                    setTimeout(() => instance.fitView({ padding: 0.2 }), 100);
                  }}
                  fitView
                  minZoom={0.2}
                  maxZoom={2.5}
                  className="bg-tactical-grid"
                >
                  <Background color="#28374A" gap={24} size={1} />
                  <Controls
                    showInteractive={false}
                    className="!bg-card !border-border !fill-foreground"
                  />

                  {/* Minimap in Bottom-Right Corner */}
                  <MiniMap
                    nodeColor={(n: any) => {
                      if (n.data?.entityType === "suspect") return "#F85149";
                      if (n.data?.entityType === "case") return "#63E6D2";
                      if (n.data?.entityType === "syndicate") return "#A78BFA";
                      return "#D4AF37";
                    }}
                    nodeStrokeWidth={2}
                    maskColor="rgba(20, 20, 22, 0.75)"
                    className="!bg-card/90 !border !border-border !rounded-sm !bottom-3 !right-3"
                    style={{ width: 140, height: 90 }}
                  />

                  {/* Collapsible Legend in Bottom-Left Corner */}
                  <Panel position="bottom-left" className="!m-3">
                    <div className="bg-card/95 border border-border rounded p-2.5 shadow-xl font-mono text-[10px] space-y-1.5 backdrop-blur-sm max-w-xs">
                      <div
                        className="flex items-center justify-between font-bold text-foreground cursor-pointer select-none"
                        onClick={() => setShowLegend(!showLegend)}
                      >
                        <span className="uppercase text-muted-foreground text-[9px] tracking-wider">
                          Graph Legend
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 text-muted-foreground transition-transform ${
                            showLegend ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {showLegend && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#F85149]" />
                            <span className="text-foreground">Critical Suspect</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#F2B66D]" />
                            <span className="text-foreground">High Suspect</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#63E6D2]" />
                            <span className="text-foreground">FIR Case Record</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#A78BFA]" />
                            <span className="text-foreground">Crime Syndicate</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                            <span className="text-foreground">Vehicle Asset</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#69A9FF]" />
                            <span className="text-foreground">Police Station</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                </ReactFlow>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 5. Contextual Entity Details Inspector (Right-Side Drawer, 4 cols) */}
        {selectedEntity && (
          <div className="lg:col-span-4 h-[650px] animate-fade-in flex flex-col">
            <Card className="h-full border border-border shadow-md flex flex-col justify-between overflow-hidden">
              <CardHeader className="py-2.5 px-3 border-b border-border/80 flex flex-row items-center justify-between bg-sidebar/70 shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <UserRound className="h-4 w-4 text-primary shrink-0" />
                  <CardTitle className="text-xs font-mono font-bold text-foreground truncate">
                    Entity Dossier Inspector
                  </CardTitle>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                  title="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>

              <CardContent className="p-3.5 space-y-3 flex-1 overflow-y-auto font-mono text-xs">
                {/* Node Title & Risk Banner */}
                <div className="p-3 rounded bg-surface-elevated border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm truncate">
                      {selectedEntity.label}
                    </span>
                    {selectedEntity.severity && (
                      <Badge
                        variant={
                          selectedEntity.severity === "Critical"
                            ? "destructive"
                            : selectedEntity.severity === "High"
                            ? "attention"
                            : "tactical"
                        }
                      >
                        {selectedEntity.severity}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-primary font-semibold">
                    {selectedEntity.subLabel}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    TYPE: {selectedEntity.entityType} • ID: {selectedEntity.id}
                  </div>
                </div>

                {/* Specific details based on entityType */}
                {selectedEntity.entityType === "suspect" && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Criminal Relational Profile
                      </span>
                      <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Syndicate:</span>
                          <span className="text-foreground font-bold">
                            {selectedEntity.details?.gangAffiliation || "Independent"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prior Arrests:</span>
                          <span className="text-foreground font-bold font-mono">
                            {selectedEntity.details?.arrests ?? 3}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bail / Custody:</span>
                          <span className="text-attention font-bold">
                            {selectedEntity.details?.bailStatus || "Bailed"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Primary Station:</span>
                          <span className="text-foreground">
                            {selectedEntity.details?.primaryStation || "Indiranagar"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Connected Physical Assets
                      </span>
                      <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[10px] space-y-1 text-foreground">
                        <div>
                          • Vehicle Plates:{" "}
                          <b className="text-primary font-mono">
                            {selectedEntity.details?.vehicles?.join(", ") || "KA-04-E-1234"}
                          </b>
                        </div>
                        <div>• Known Address: {selectedEntity.details?.address || "Bengaluru Metro"}</div>
                        <div>• Direct phone: {selectedEntity.details?.phone || "Private Burner"}</div>
                      </div>
                    </div>
                  </>
                )}

                {selectedEntity.entityType === "case" && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Filing Particulars
                    </span>
                    <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="text-foreground font-bold">
                          {selectedEntity.details?.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Station:</span>
                        <span className="text-foreground font-bold">
                          {selectedEntity.details?.station}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-sans line-clamp-3 pt-1 border-t border-border/40">
                        {selectedEntity.details?.description}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEntity.entityType === "vehicle" && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Conduit Asset Profile
                    </span>
                    <div className="p-2.5 rounded bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration:</span>
                        <span className="text-primary font-bold">{selectedEntity.details?.plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="text-foreground">{selectedEntity.details?.model}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-sans pt-1">
                        Sighted as the getaway conduit linking Indiranagar armed jewelry robbery to
                        K.R. Puram residential vehicle theft.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Inspector Footer Actions */}
              <div className="p-3 border-t border-border bg-sidebar/40 shrink-0 flex items-center gap-2">
                <Link to="/cases" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs font-mono">
                    View Cases
                  </Button>
                </Link>
                <Link to="/copilot" className="flex-1">
                  <Button variant="tactical" size="sm" className="w-full text-xs font-mono">
                    Ask Copilot
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 6. AI Network Analysis Right-Side Drawer (UI-Only Placeholder) */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-md sm:max-w-[420px] h-full bg-card border-l border-border p-6 overflow-y-auto space-y-4 font-mono text-xs shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-foreground text-sm">AI Network Analysis</h3>
                    <span className="text-[10px] text-muted-foreground">
                      Network relationship analysis
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
                  Relational AI graph analysis will be connected in a later phase. This analytical
                  workspace is ready for LLM synthesis of co-accused centrality, gang syndicate
                  hierarchies, and criminal conduit escape routes.
                </p>
              </div>

              {/* Reserved Network Summary */}
              <div className="p-3.5 rounded bg-surface-elevated/40 border border-border/80 space-y-2">
                <div className="text-[10px] uppercase font-bold text-foreground tracking-wider">
                  Active Network Topology Scope
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Entities in Scope:</span>
                    <span className="font-bold text-foreground font-mono">{totalEntities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Relational Edges:</span>
                    <span className="font-bold text-foreground font-mono">{totalConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Critical Priority Nodes:</span>
                    <span className="font-bold text-destructive font-mono">
                      {criticalEntities}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reserved Area for Future Relationship Patterns & Follow-up Questions */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Reserved Relationship Patterns & Actions
                </span>
                <div className="p-3.5 rounded border border-dashed border-border/80 text-muted-foreground font-sans text-xs space-y-1.5">
                  <p>When connected, the AI Network Analysis engine will evaluate:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground/90">
                    <li>Betweenness centrality of key syndicate brokers</li>
                    <li>Repeated co-accused filings across adjacent stations</li>
                    <li>Shared vehicle getaway conduit correlations</li>
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
