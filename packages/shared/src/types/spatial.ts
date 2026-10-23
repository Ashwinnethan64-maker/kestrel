export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

// Bounding box represented as [[southLat, westLng], [northLat, eastLng]]
export type BoundingBox = [[number, number], [number, number]];

export interface SpatialHotspot {
  id: string;
  stationName: string;
  district: string;
  center: GeoCoordinate;
  radiusMeters: number;
  incidentCount: number;
  dominantCrime: string;
  riskScore: number; // 0 - 100
}

export interface PoliceStationZone {
  code: string; // e.g. "INDR"
  name: string; // "Indiranagar"
  district: string; // "Bengaluru East"
  center: GeoCoordinate;
  boundaryRadiusMeters: number;
  inspectorName: string;
  contactNumber: string;
}

export interface SpatialClusterSummary {
  totalIncidents: number;
  criticalCount: number;
  peakHourWindow: string; // e.g. "01:00 - 04:00"
  dominantCategory: string;
  involvedGangNames: string[];
  suggestedPatrolCheckpoints: GeoCoordinate[];
}
