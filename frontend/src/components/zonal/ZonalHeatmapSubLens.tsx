import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FIRCase, PoliceStationZone } from '@kestrel/shared';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import {
  ShieldAlert,
  Building2,
  Navigation,
  Compass,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface ZonalHeatmapSubLensProps {
  cases: FIRCase[];
  activeSyndicateFilter: string | null;
  onClearSyndicateFilter: () => void;
  onSelectCase: (caseId: string) => void;
}

// Fixed Karnataka Police Station Centroids for Bengaluru East & Central
const STATION_CENTROIDS: Array<{
  name: string;
  code: string;
  district: string;
  coords: [number, number];
  sho: string;
  phone: string;
}> = [
  {
    name: 'Indiranagar',
    code: 'INDR',
    district: 'Bengaluru East',
    coords: [12.9784, 77.6408],
    sho: 'Insp. Vikram Patil',
    phone: '+91 80 2294 2501',
  },
  {
    name: 'K.R. Puram',
    code: 'KRP',
    district: 'Bengaluru East',
    coords: [13.0075, 77.6959],
    sho: 'SI Ramesh',
    phone: '+91 80 2294 2505',
  },
  {
    name: 'Whitefield',
    code: 'WHT',
    district: 'Bengaluru East',
    coords: [12.9698, 77.7499],
    sho: 'Insp. Ananya Sharma',
    phone: '+91 80 2294 2510',
  },
  {
    name: 'Koramangala',
    code: 'KORM',
    district: 'Bengaluru South-East',
    coords: [12.9352, 77.6245],
    sho: 'Insp. Girish Kumar',
    phone: '+91 80 2294 2515',
  },
  {
    name: 'Cubbon Park',
    code: 'CUB',
    district: 'Bengaluru Central',
    coords: [12.9763, 77.5929],
    sho: 'Insp. Raghavendra',
    phone: '+91 80 2294 2520',
  },
  {
    name: 'Ulsoor',
    code: 'ULS',
    district: 'Bengaluru East',
    coords: [12.9815, 77.6256],
    sho: 'Insp. Srinivas Rao',
    phone: '+91 80 2294 2525',
  },
];

// Custom Leaflet DivIcon for Police Station Centroid
const createStationCentroidIcon = (stationName: string, caseCount: number) => {
  return L.divIcon({
    className: 'custom-station-centroid',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="display: flex; items-center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: #071325; border: 2px solid #06b6d4; box-shadow: 0 0 15px rgba(6,182,212,0.6); color: #06b6d4; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div style="position: absolute; -top: 6px; -right: 6px; background: #ef4444; color: #fff; font-family: monospace; font-size: 10px; font-weight: bold; padding: 1px 5px; border-radius: 9999px; border: 1px solid #ffffff; box-shadow: 0 0 6px #ef4444;">
          ${caseCount}
        </div>
        <div style="margin-top: 3px; background: rgba(10,17,32,0.9); border: 1px solid rgba(6,182,212,0.4); border-radius: 4px; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: 600; color: #e2e8f0; white-space: nowrap;">
          ${stationName} PS
        </div>
      </div>
    `,
    iconSize: [80, 54],
    iconAnchor: [40, 24],
  });
};

// Checkpoint Pin Icon
const createCheckpointIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-checkpoint-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; animation: bounce 1s infinite;">
        <div style="background: #10b981; color: #050b14; font-weight: bold; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #fff; box-shadow: 0 0 12px #10b981; white-space: nowrap;">
          🚔 ${label}
        </div>
        <div style="width: 2px; height: 10px; background: #10b981;"></div>
      </div>
    `,
    iconSize: [120, 36],
    iconAnchor: [60, 36],
  });
};

function MapCenteringController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12, { animate: true });
  }, [center, map]);
  return null;
}

export const ZonalHeatmapSubLens: React.FC<ZonalHeatmapSubLensProps> = ({
  cases,
  activeSyndicateFilter,
  onClearSyndicateFilter,
  onSelectCase,
}) => {
  const [deployedCheckpoints, setDeployedCheckpoints] = useState<
    Array<{ id: string; name: string; coords: [number, number] }>
  >([]);
  const [deploymentToast, setDeploymentToast] = useState(false);

  const currentPlayheadDate = useCommandDeckStore((s) => s.timeline.currentPlayheadDate);

  // Filter cases based on active syndicate and temporal scrubber position
  const filteredCases = cases.filter((c) => {
    // 1. Syndicate Filter
    if (activeSyndicateFilter) {
      const match =
        c.tags?.includes(activeSyndicateFilter) ||
        c.crimeCategory.toLowerCase().includes(activeSyndicateFilter.toLowerCase()) ||
        c.description.toLowerCase().includes(activeSyndicateFilter.toLowerCase());
      if (!match) return false;
    }

    // 2. Chronological Scrubber Filter
    if (currentPlayheadDate && c.incidentDate) {
      const caseDate = new Date(c.incidentDate).getTime();
      const playheadTime = new Date(currentPlayheadDate).getTime();
      if (caseDate > playheadTime) return false;
    }

    return true;
  });

  const handleDeployPatrols = () => {
    const checkpoints = [
      { id: 'cp-1', name: 'Hoysala-04 · 100ft Rd Junction', coords: [12.9754, 77.6418] as [number, number] },
      { id: 'cp-2', name: 'Hoysala-07 · Old Madras Road Toll Gate', coords: [13.0012, 77.6885] as [number, number] },
      { id: 'cp-3', name: 'Hoysala-12 · ITPL Main Gate Outer Ring', coords: [12.9865, 77.7324] as [number, number] },
    ];
    setDeployedCheckpoints(checkpoints);
    setDeploymentToast(true);
    setTimeout(() => setDeploymentToast(false), 4500);
  };

  const center: [number, number] = [12.9716, 77.6412]; // Bengaluru East centroid

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#050b14] overflow-hidden">
      {/* 1. Hoysala Night Patrol Hotspot Recommendation Banner */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0a1322]/95 backdrop-blur-md border border-amber-500/50 rounded-lg p-3.5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
                POSTGIS NIGHT PATROL RECOMMENDATION (01:00 - 04:00)
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded font-mono">
                HIGH DENSITY SURGE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-sans">
              Critical vehicle snatching & burglary vector detected along <span className="text-cyan-400 font-mono">100ft Road / Old Madras Rd corridor</span>. 3 repeat offenders bailed nearby.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeSyndicateFilter && (
            <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span>Syndicate: {activeSyndicateFilter}</span>
              <button
                onClick={onClearSyndicateFilter}
                className="ml-1 text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          <button
            onClick={handleDeployPatrols}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Deploy Hoysala Patrol Checkpoints</span>
          </button>
        </div>
      </div>

      {/* Deployment Confirmation Toast */}
      {deploymentToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-lg text-xs font-mono shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>3 Hoysala Checkpoints Dispatched & Geo-locked to Control Room Dispatch!</span>
        </div>
      )}

      {/* Map Legend HUD */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2 bg-[#0a1120]/90 backdrop-blur-md border border-cyan-900/60 rounded-lg p-3 text-xs shadow-2xl">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">ZONAL RADAR LAYERS</span>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-md border border-cyan-400 bg-cyan-500/20" />
          <span className="font-mono text-[11px]">Police Station Centroids (6)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" />
          <span className="font-mono text-[11px]">Critical PostGIS Density</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500" />
          <span className="font-mono text-[11px]">High / Medium Incident Density</span>
        </div>
        {deployedCheckpoints.length > 0 && (
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px]">Active Hoysala Checkpoints ({deployedCheckpoints.length})</span>
          </div>
        )}
      </div>

      {/* Leaflet Dark Map Canvas */}
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#050b14' }}
      >
        <MapCenteringController center={center} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />

        {/* 1. Spatial Density Heatmap Simulated via glowing CircleMarkers */}
        {filteredCases.map((c) => {
          const isCritical = c.priority === 'Critical';
          const isHigh = c.priority === 'High';
          const color = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#06b6d4';
          const radius = isCritical ? 42 : isHigh ? 30 : 20;

          return (
            <React.Fragment key={`density-${c.id}`}>
              {/* Outer density aura */}
              <CircleMarker
                center={[c.latitude, c.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.18,
                  stroke: false,
                }}
              />
              {/* Core incident node */}
              <CircleMarker
                center={[c.latitude, c.longitude]}
                radius={5}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.9,
                  color: '#ffffff',
                  weight: 1,
                }}
                eventHandlers={{
                  click: () => onSelectCase(c.id),
                }}
              >
                <Popup className="tactical-popup">
                  <div className="p-2 min-w-[200px] bg-[#0a1120] text-slate-100 rounded">
                    <div className="font-mono text-cyan-400 font-bold text-xs">{c.firNumber}</div>
                    <div className="text-white text-xs font-semibold">{c.crimeCategory}</div>
                    <div className="text-[11px] text-slate-400">{c.policeStation} • {c.priority}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{c.description}</div>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="mt-2 w-full py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-mono"
                    >
                      Open Case Nexus →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* 2. Police Station Centroid Markers */}
        {STATION_CENTROIDS.map((station) => {
          const stationCaseCount = cases.filter(
            (c) => c.policeStation.toLowerCase() === station.name.toLowerCase()
          ).length;

          return (
            <Marker
              key={station.code}
              position={station.coords}
              icon={createStationCentroidIcon(station.name, stationCaseCount)}
            >
              <Popup className="tactical-popup">
                <div className="p-2 min-w-[220px] bg-[#071325] text-slate-100 rounded">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{station.name.toUpperCase()} POLICE STATION</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">SHO: {station.sho}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Control: {station.phone}</div>
                  <div className="mt-2 pt-2 border-t border-cyan-900/50 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Assigned FIRs:</span>
                    <span className="text-cyan-400 font-bold">{stationCaseCount}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Deployed Hoysala Patrol Checkpoints */}
        {deployedCheckpoints.map((cp) => (
          <Marker key={cp.id} position={cp.coords} icon={createCheckpointIcon(cp.name)}>
            <Popup className="tactical-popup">
              <div className="p-2 min-w-[180px] bg-[#071325] text-slate-100 rounded font-mono text-xs">
                <div className="text-emerald-400 font-bold mb-1">PATROL CHECKPOINT ACTIVE</div>
                <div className="text-white text-[11px]">{cp.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">Status: Sector Static Sentry</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
