import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AccusedSuspect } from '@kestrel/shared';
import { Network, Building2, User, AlertOctagon, Filter, ShieldAlert } from 'lucide-react';

interface ZonalSyndicateCanvasProps {
  syndicates: Array<{
    id: string;
    name: string;
    knownLeaderId?: string;
    knownLeaderName?: string;
    memberSuspectIds: string[];
    primaryCrimeCategory: string;
    territoryStations: string[];
    estimatedTotalHeistInr: number;
    threatLevel: string;
    activeCaseCount: number;
  }>;
  suspects: AccusedSuspect[];
  activeSyndicateFilter: string | null;
  onSelectSyndicate: (syndicateName: string) => void;
}

// 1. Syndicate Central Ring Node
const MacroSyndicateNode = ({ data }: NodeProps) => {
  const isSelected = data.isSelected as boolean;
  const isCritical = data.threatLevel === 'Critical';

  return (
    <div
      onClick={() => data.onClick && (data.onClick as () => void)()}
      className={`relative cursor-pointer px-4 py-3 bg-[#0f0a20] rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.8)] scale-105'
          : isCritical
          ? 'border-rose-500 shadow-[0_0_18px_rgba(239,68,68,0.4)]'
          : 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
      } min-w-[240px]`}
    >
      <Handle type="source" position={Position.Top} className="!bg-purple-400 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Left} className="!bg-purple-400 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-2.5 !h-2.5" />

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-purple-400">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">ORGANIZED RING</span>
        </div>
        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
            isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          }`}
        >
          {data.threatLevel as string}
        </span>
      </div>

      <div className="text-sm font-mono font-bold text-white mb-1 leading-tight">{data.label as string}</div>
      <div className="text-[11px] text-slate-300">{data.category as string}</div>

      <div className="mt-2 pt-2 border-t border-purple-900/50 flex items-center justify-between font-mono text-[10px]">
        <span className="text-slate-400">Est. Heist Value:</span>
        <span className="text-emerald-400 font-bold">₹{((data.heist as number) / 100000).toFixed(1)} Lakhs</span>
      </div>
      <div className="text-[9px] text-purple-400 font-mono mt-1 text-right">
        {isSelected ? '✓ Filter Active on Heatmap' : 'Click to filter map →'}
      </div>
    </div>
  );
};

// 2. Police Station Territory Node
const StationTerritoryNode = ({ data }: NodeProps) => {
  return (
    <div className="relative px-3 py-2 bg-[#06121f] rounded-lg border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)] min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2" />

      <div className="flex items-center gap-1.5 mb-0.5">
        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono uppercase text-cyan-400">JURISDICTION</span>
      </div>
      <div className="text-xs font-mono font-bold text-white">{data.label as string} PS</div>
      <div className="text-[10px] text-slate-400">Bengaluru Police Dept</div>
    </div>
  );
};

// 3. Ring Leader / Key Suspect Node
const KingpinNode = ({ data }: NodeProps) => {
  return (
    <div className="relative px-3 py-2.5 bg-[#17080c] rounded-lg border-2 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] min-w-[170px]">
      <Handle type="target" position={Position.Top} className="!bg-rose-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} className="!bg-rose-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-rose-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} className="!bg-rose-400 !w-2 !h-2" />

      <div className="flex items-center gap-1.5 mb-1">
        <User className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">KNOWN LEADER</span>
      </div>
      <div className="text-xs font-bold text-white">{data.label as string}</div>
      <div className="text-[10px] font-mono text-slate-400">Bail: {data.bailStatus as string}</div>
      <div className="text-[9px] text-rose-400 font-mono mt-0.5">Repeat Offender</div>
    </div>
  );
};

const nodeTypes = {
  syndicate: MacroSyndicateNode,
  station: StationTerritoryNode,
  kingpin: KingpinNode,
};

export const ZonalSyndicateCanvas: React.FC<ZonalSyndicateCanvasProps> = ({
  syndicates,
  suspects,
  activeSyndicateFilter,
  onSelectSyndicate,
}) => {
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // Map each syndicate horizontally
    syndicates.forEach((syn, synIdx) => {
      const synX = 120 + synIdx * 450;
      const synY = 280;
      const synNodeId = `syn-${syn.id}`;
      const isSelected = activeSyndicateFilter === syn.name;

      // Central Syndicate Core Node
      generatedNodes.push({
        id: synNodeId,
        type: 'syndicate',
        position: { x: synX, y: synY },
        data: {
          label: syn.name,
          category: syn.primaryCrimeCategory,
          threatLevel: syn.threatLevel,
          heist: syn.estimatedTotalHeistInr,
          isSelected,
          onClick: () => onSelectSyndicate(syn.name),
        },
      });

      // Leader Node (Above Syndicate)
      if (syn.knownLeaderName) {
        const leaderNodeId = `leader-${syn.id}`;
        const matchedSuspect = suspects.find(
          (s) => s.id === syn.knownLeaderId || s.fullName.toLowerCase().includes(syn.knownLeaderName!.toLowerCase().slice(0, 4))
        );

        generatedNodes.push({
          id: leaderNodeId,
          type: 'kingpin',
          position: { x: synX + 30, y: synY - 160 },
          data: {
            label: syn.knownLeaderName,
            bailStatus: matchedSuspect ? matchedSuspect.bailStatus : 'Bailed',
          },
        });

        // Edge: Leader -> Syndicate
        generatedEdges.push({
          id: `edge-lead-${syn.id}`,
          source: synNodeId,
          target: leaderNodeId,
          label: 'HEADED_BY',
          style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4 4' },
          labelStyle: { fill: '#f87171', fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#050b14', fillOpacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
        });
      }

      // Territory Station Nodes (Below Syndicate)
      syn.territoryStations.forEach((stationName, stIdx) => {
        const stationNodeId = `st-${syn.id}-${stIdx}`;
        const stX = synX - 100 + stIdx * 170;
        const stY = synY + 220;

        generatedNodes.push({
          id: stationNodeId,
          type: 'station',
          position: { x: stX, y: stY },
          data: {
            label: stationName,
          },
        });

        // Edge: Syndicate -> Station
        generatedEdges.push({
          id: `edge-st-${syn.id}-${stIdx}`,
          source: synNodeId,
          target: stationNodeId,
          label: 'OPERATES_ACROSS',
          style: { stroke: '#06b6d4', strokeWidth: 1.5 },
          labelStyle: { fill: '#22d3ee', fontSize: 9, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#050b14', fillOpacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
        });
      });
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [syndicates, suspects, activeSyndicateFilter, onSelectSyndicate]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#050b14] overflow-hidden">
      {/* Topology Canvas HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#0a1120]/90 backdrop-blur-md border border-purple-900/60 rounded-lg px-4 py-2 text-xs shadow-2xl">
        <div className="flex items-center gap-2 text-purple-400 font-mono font-medium">
          <Network className="w-4 h-4 text-purple-400" />
          <span>INTER-STATION SYNDICATE TOPOLOGY:</span>
        </div>
        <span className="text-white font-mono">{syndicates.length} Cross-Station Rings</span>
        <div className="w-px h-3 bg-purple-800" />
        <span className="text-slate-400 font-mono">
          Click any syndicate ring to filter the Zonal Heatmap
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        className="bg-[#050b14]"
      >
        <Background color="#1e1838" gap={25} size={1} />
        <Controls className="!bg-[#0a1120] !border-purple-900/60 !fill-purple-400 [&>button]:!border-purple-900/60" />
      </ReactFlow>
    </div>
  );
};
