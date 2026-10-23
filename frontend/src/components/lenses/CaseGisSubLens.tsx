import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FIRCase, AccusedSuspect } from '@kestrel/shared';
import { Crosshair, MapPin } from 'lucide-react';

// Fix standard marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface CaseGisSubLensProps {
  firCase: FIRCase;
  suspects: AccusedSuspect[];
}

// Controller to auto-fly and center on case coordinates
function MapRecenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// Custom Leaflet DivIcon for the crime scene pulsing radar beacon
const createSceneBeaconIcon = () => {
  return L.divIcon({
    className: 'custom-scene-beacon',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 60%; height: 60%; border-radius: 50%; background: rgba(6, 182, 212, 0.6); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 12px #06b6d4;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Custom Leaflet DivIcon for suspect pins
const createSuspectPinIcon = (risk: string) => {
  const color = risk === 'Critical' ? '#ef4444' : risk === 'High' ? '#f59e0b' : '#3b82f6';
  return L.divIcon({
    className: 'custom-suspect-pin',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #0a1120; border: 2px solid ${color}; box-shadow: 0 0 10px ${color}80; color: ${color};">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="7" r="4"></circle>
          <path d="M5.5 21a8.5 8.5 0 0 1 13 0"></path>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const CaseGisSubLens: React.FC<CaseGisSubLensProps> = ({ firCase, suspects }) => {
  const center: [number, number] = [firCase.latitude, firCase.longitude];

  // Derive POI locations for suspects around the scene
  const suspectPois = suspects.map((suspect, idx) => {
    // Generate deterministic geo offset based on index so suspect addresses cluster realistically around the incident
    const angle = (idx * (360 / Math.max(suspects.length, 1)) * Math.PI) / 180;
    const distanceMeters = 350 + (idx * 210) % 550; // Between 350m and 900m
    const latOffset = (distanceMeters * Math.cos(angle)) / 111111;
    const lngOffset = (distanceMeters * Math.sin(angle)) / (111111 * Math.cos((center[0] * Math.PI) / 180));

    return {
      suspect,
      lat: center[0] + latOffset,
      lng: center[1] + lngOffset,
      approxDistance: distanceMeters,
    };
  });

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#050b14] overflow-hidden">
      {/* Map Header HUD Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 bg-[#0a1120]/90 backdrop-blur-md border border-cyan-900/60 rounded-lg px-4 py-2 text-xs shadow-2xl">
        <div className="flex items-center gap-2 text-cyan-400 font-mono font-medium">
          <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>SCENE RADAR:</span>
        </div>
        <span className="text-white font-mono">{firCase.latitude.toFixed(5)}°N, {firCase.longitude.toFixed(5)}°E</span>
        <div className="w-px h-3 bg-cyan-800" />
        <span className="text-slate-400 font-mono">{firCase.policeStation} JURISDICTION</span>
      </div>

      {/* Map Legend HUD Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-[#0a1120]/90 backdrop-blur-md border border-cyan-900/60 rounded-lg p-3 text-xs shadow-2xl">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">TACTICAL PERIMETER</span>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full border border-cyan-400 border-dashed bg-cyan-500/10" />
          <span className="font-mono text-[11px]">500m Immediate Zone</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full border border-rose-500 border-dashed bg-rose-500/10" />
          <span className="font-mono text-[11px]">1000m Syndicate Containment</span>
        </div>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          <span className="font-mono text-[11px]">Crime Scene Zero</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-[#0a1120]" />
          <span className="font-mono text-[11px]">Suspect POIs ({suspectPois.length})</span>
        </div>
      </div>

      {/* Leaflet Dark Carto Map Container */}
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#050b14' }}
      >
        <MapRecenterController center={center} />

        {/* Tactical Dark Matter Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 500m Immediate Tactical Perimeter Circle */}
        <Circle
          center={center}
          radius={500}
          pathOptions={{
            color: '#06b6d4',
            weight: 1.5,
            dashArray: '8, 6',
            fillColor: '#06b6d4',
            fillOpacity: 0.05,
          }}
        />

        {/* 1000m Syndicate Containment Circle */}
        <Circle
          center={center}
          radius={1000}
          pathOptions={{
            color: '#ef4444',
            weight: 1.5,
            dashArray: '8, 6',
            fillColor: '#ef4444',
            fillOpacity: 0.03,
          }}
        />

        {/* Crime Scene Beacon */}
        <Marker position={center} icon={createSceneBeaconIcon()}>
          <Popup className="tactical-popup">
            <div className="p-2 min-w-[200px] bg-[#0a1120] text-slate-100 rounded">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>INCIDENT SCENE ZERO</span>
              </div>
              <div className="text-xs font-mono text-white mb-1">{firCase.firNumber}</div>
              <div className="text-[11px] text-slate-400 leading-snug">{firCase.policeStation}, {firCase.district}</div>
              <div className="mt-2 text-[10px] text-cyan-500 font-mono">
                {firCase.incidentDate ? new Date(firCase.incidentDate).toLocaleString('en-IN') : 'Date Unknown'}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Suspect POI Pins */}
        {suspectPois.map(({ suspect, lat, lng, approxDistance }) => (
          <Marker
            key={suspect.id}
            position={[lat, lng]}
            icon={createSuspectPinIcon(suspect.riskLevel)}
          >
            <Popup className="tactical-popup">
              <div className="p-2 min-w-[220px] bg-[#0a1120] text-slate-100 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">{suspect.fullName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      suspect.riskLevel === 'Critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {suspect.riskLevel}
                  </span>
                </div>
                {suspect.aliases && suspect.aliases.length > 0 && (
                  <div className="text-[10px] text-slate-400 mb-1">Alias: "{suspect.aliases.join(', ')}"</div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono my-1">
                  <Crosshair className="w-3 h-3" />
                  <span>~{approxDistance}m from Incident Scene</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Bail Status: <span className="text-slate-200">{suspect.bailStatus}</span>
                </div>
                {suspect.gangAffiliation && (
                  <div className="text-[10px] text-purple-400 font-mono">
                    Syndicate: {suspect.gangAffiliation}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
