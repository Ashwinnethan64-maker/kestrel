import React, { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FIRCase, AccusedSuspect, curatedCrimeDataset } from '@kestrel/shared';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { Network, FileText, User } from 'lucide-react';

export interface CaseNetworkSubLensProps {
  firCase: FIRCase;
  suspects: AccusedSuspect[];
}

// Custom Center Case Node
const CaseNodeComponent = ({ data }: NodeProps) => {
  return (
    <div className="relative px-4 py-3 bg-[#0a1120] border-2 border-cyan-400 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] min-w-[200px]">
      <Handle type="source" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2" />
      
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-cyan-400" />
        <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">PRIMARY FIR</span>
      </div>
      <div className="text-sm font-mono font-bold text-white">{data.label as string}</div>
      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{data.category as string}</div>
      <div className="text-[10px] text-cyan-500 font-mono mt-1">{data.station as string}</div>
    </div>
  );
};

// Custom Suspect Node
const SuspectNodeComponent = ({ data }: NodeProps) => {
  const isCritical = data.riskLevel === 'Critical';
  const borderColor = isCritical ? 'border-rose-500' : 'border-amber-500';
  const shadowColor = isCritical ? 'shadow-[0_0_18px_rgba(239,68,68,0.35)]' : 'shadow-[0_0_14px_rgba(245,158,11,0.25)]';
  const badgeBg = isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400';

  return (
    <div
      onClick={() => data.onClick && (data.onClick as () => void)()}
      className={`relative cursor-pointer px-4 py-3 bg-[#0a1120] border-2 ${borderColor} ${shadowColor} rounded-xl min-w-[190px] transition-transform hover:scale-105`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-xs font-bold text-white truncate max-w-[110px]">{data.label as string}</span>
        </div>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${badgeBg}`}>
          {data.riskLevel as string}
        </span>
      </div>

      {data.alias && (
        <div className="text-[10px] text-slate-400 mb-1">"{data.alias as string}"</div>
      )}

      <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-between">
        <span>Bail: {data.bailStatus as string}</span>
        <span className="text-cyan-400 hover:underline">View Dossier →</span>
      </div>
    </div>
  );
};

// Custom Syndicate Node
const SyndicateNodeComponent = ({ data }: NodeProps) => {
  return (
    <div className="relative px-4 py-3 bg-[#110d24] border-2 border-purple-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.35)] min-w-[210px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1">
        <Network className="w-4 h-4 text-purple-400" />
        <span className="text-[10px] font-mono uppercase text-purple-400 tracking-wider">ORGANIZED SYNDICATE</span>
      </div>
      <div className="text-xs font-mono font-bold text-purple-200">{data.label as string}</div>
      <div className="text-[10px] text-purple-400/80 mt-1">Cross-Station Criminal Ring</div>
    </div>
  );
};

const nodeTypes = {
  caseNode: CaseNodeComponent,
  suspectNode: SuspectNodeComponent,
  syndicateNode: SyndicateNodeComponent,
};

export const CaseNetworkSubLens: React.FC<CaseNetworkSubLensProps> = ({ firCase, suspects }) => {
  const setCaseSubLens = useCommandDeckStore((s) => s.setCaseSubLens);

  // Filter suspects relevant to this case
  const caseSuspects = useMemo(() => {
    return suspects.filter((s) => firCase.accusedIds.includes(s.id));
  }, [suspects, firCase.accusedIds]);

  // Extract syndicates from curated crime dataset
  const datasetSyndicates: Array<{ id: string; name: string; memberIds: string[] }> = useMemo(() => {
    return (curatedCrimeDataset as any).syndicates || [];
  }, []);

  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // 1. Center Case Node at (0, 0)
    generatedNodes.push({
      id: `case-${firCase.id}`,
      type: 'caseNode',
      position: { x: 350, y: 250 },
      data: {
        label: firCase.firNumber,
        category: firCase.crimeCategory,
        station: firCase.policeStation,
      },
    });

    const syndicateIdsPresent = new Set<string>();

    // 2. Suspect Nodes radially around the case node
    const radius = 260;
    caseSuspects.forEach((suspect, idx) => {
      const angle = (idx * (2 * Math.PI)) / Math.max(caseSuspects.length, 1) - Math.PI / 2;
      const x = 350 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      const nodeId = `suspect-${suspect.id}`;

      generatedNodes.push({
        id: nodeId,
        type: 'suspectNode',
        position: { x, y },
        data: {
          label: suspect.fullName,
          alias: suspect.aliases && suspect.aliases[0],
          riskLevel: suspect.riskLevel,
          bailStatus: suspect.bailStatus,
          onClick: () => {
            // Jump to dossier lens with suspect context
            useCommandDeckStore.setState({ activeSuspectId: suspect.id });
            setCaseSubLens('dossier');
          },
        },
      });

      // Edge from Case to Suspect
      generatedEdges.push({
        id: `edge-case-${suspect.id}`,
        source: `case-${firCase.id}`,
        target: nodeId,
        animated: true,
        label: 'ACCUSED_IN',
        style: { stroke: '#06b6d4', strokeWidth: 2 },
        labelStyle: { fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#050b14', fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#06b6d4',
        },
      });

      if (suspect.gangAffiliation) {
        syndicateIdsPresent.add(suspect.gangAffiliation);
      }
    });

    // 3. Connect co-accused suspects to each other
    for (let i = 0; i < caseSuspects.length; i++) {
      for (let j = i + 1; j < caseSuspects.length; j++) {
        generatedEdges.push({
          id: `edge-co-${caseSuspects[i].id}-${caseSuspects[j].id}`,
          source: `suspect-${caseSuspects[i].id}`,
          target: `suspect-${caseSuspects[j].id}`,
          label: 'CO_ACCUSED',
          style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 4' },
          labelStyle: { fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#050b14', fillOpacity: 0.8 },
        });
      }
    }

    // 4. Syndicate Nodes
    let synIdx = 0;
    syndicateIdsPresent.forEach((synName) => {
      const synNodeId = `syn-${synIdx}`;
      const matchedSyndicate = datasetSyndicates.find((s) => s.name.toLowerCase() === synName.toLowerCase() || s.id.toLowerCase() === synName.toLowerCase());

      generatedNodes.push({
        id: synNodeId,
        type: 'syndicateNode',
        position: { x: 350 + (synIdx === 0 ? 320 : -320), y: 550 },
        data: {
          label: matchedSyndicate ? matchedSyndicate.name : synName,
        },
      });

      // Connect suspect members to syndicate node
      caseSuspects.forEach((suspect) => {
        if (suspect.gangAffiliation === synName) {
          generatedEdges.push({
            id: `edge-syn-${suspect.id}-${synIdx}`,
            source: synNodeId,
            target: `suspect-${suspect.id}`,
            label: 'MEMBER_OF',
            style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5 5' },
            labelStyle: { fill: '#c084fc', fontSize: 9, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#050b14', fillOpacity: 0.8 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a855f7',
            },
          });
        }
      });

      synIdx++;
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [firCase, caseSuspects, datasetSyndicates, setCaseSubLens]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#050b14] overflow-hidden">
      {/* Network HUD Legend */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#0a1120]/90 backdrop-blur-md border border-cyan-900/60 rounded-lg px-4 py-2 text-xs shadow-2xl">
        <div className="flex items-center gap-2 text-cyan-400 font-mono font-medium">
          <Network className="w-4 h-4 text-cyan-400" />
          <span>EGO-NETWORK GRAPH:</span>
        </div>
        <span className="text-slate-300 font-mono">{caseSuspects.length} Accused Linked</span>
        <div className="w-px h-3 bg-cyan-800" />
        <span className="text-purple-400 font-mono">Click any suspect node to open Dossier</span>
      </div>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          className="bg-[#050b14]"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-[#0a1120] !border-cyan-900/60 !fill-cyan-400 [&>button]:!border-cyan-900/60" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};
