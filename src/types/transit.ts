export type TransitAgency = 'google' | 'moovit' | 'rapid_pulse' | 'gokl';

export type TransitMode = 'rail' | 'gokl' | 'rapidkl' | 'walk';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlatformInfo {
  platformNumber: string;
  trackNumber?: string;
  sideName: string; // e.g. "Platform 1: Southbound (towards Putra / KL Sentral / Seremban)"
  headingDirection: 'southbound' | 'northbound' | 'eastbound' | 'westbound';
  destinations: string[]; // e.g. ['Putra KTM', 'KL Sentral', 'Mid Valley', 'Pulau Sebang']
  tips: string; // e.g. "Stand on this platform to go to Putra. Do NOT stand on Platform 2!"
  landmarkReference?: string; // e.g. "Take stairs on the left immediately after fare gates"
}

export interface WalkingOrientationGuide {
  fromLocation: string;
  toLocation: string;
  targetLineOrBus: string;
  whichSideOfRoad: string; // e.g. "Same side of road as SMK Segambut (Southbound curb)"
  streetName: string; // e.g. "Jalan Segambut"
  walkingDistanceMeters: number;
  walkMinutes: number;
  compassHeading: string; // e.g. "Head South-East (140°)"
  stepByStep: string[];
  landmarks: string[];
}

export interface StationExit {
  letter: string; // e.g. 'A', 'B', 'C'
  name: string;
  accessible: boolean;
  connectingLandmarks: string[];
  connectingTransit: string[];
  hasCoveredWalkway: boolean;
}

export type FacilityType = 'lift' | 'escalator' | 'surau' | 'toilet' | 'tvm' | 'fare_gates' | 'customer_service' | 'bicycle_parking';

export interface StationFacilityItem {
  id: string;
  name: string;
  type: FacilityType;
  level: 'platform' | 'concourse' | 'ground' | 'mezzanine' | string;
  locationNote: string;
  accessible?: boolean;
}

export interface StationFacilityLayout {
  stationId: string;
  stationName: string;
  levels: { id: string; name: string; description: string }[];
  exits: StationExit[];
  facilities: StationFacilityItem[];
  tips?: string[];
}

export type CommuterPassType = 'tng' | 'my50' | 'concession' | 'cash';

export interface FareBreakdown {
  tngRm: number;
  cashRm: number;
  concessionRm: number;
  my50Covered: boolean;
  savingsRm: number;
}

export interface CoveredWalkwayInfo {
  isCovered: boolean;
  coveredPercentage: number; // 0-100
  shelterDescription: string;
  rainShieldStatus: 'full' | 'partial' | 'exposed';
}

export interface CrowdDensity {
  level: 'low' | 'moderate' | 'packed';
  percentage: number; // 0 to 100
  isPeakHour: boolean;
  peakLabel: string;
  recommendation: string;
}

export interface SavedCommute {
  id: string;
  label: string;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  icon: string;
  preferredPass?: CommuterPassType;
  quickNote?: string;
}

export interface DisruptionAlert {
  id: string;
  lineId: string;
  lineCode: string;
  severity: 'minor_delay' | 'major_delay' | 'maintenance';
  title: string;
  description: string;
  delayMinutes: number;
  bypassLineCode: string;
  bypassLineName: string;
  bypassInstructions: string;
  active: boolean;
}

export interface Station {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
  lat: number;
  lng: number;
  lines: string[]; // Line IDs passing through
  modes: TransitMode[];
  zone?: string;
  facilities?: string[];
  isInterchange?: boolean;
  platforms?: PlatformInfo[];
  walkingGuides?: WalkingOrientationGuide[];
  facilityLayout?: StationFacilityLayout;
}

export interface TransitLine {
  id: string;
  code: string;
  name: string;
  mode: TransitMode;
  color: string;
  textColor: string;
  stations: string[]; // ordered station IDs
  headwayMinutes: number; // typical frequency
  operatingHours: string;
  fare: string;
  fareRm?: number;
  isGoKL?: boolean;
  agency: TransitAgency[];
}

export interface Vehicle {
  id: string;
  lineId: string;
  vehicleNumber: string;
  currentStationId: string;
  nextStationId: string;
  progress: number; // 0 to 1 between current and next
  lat: number;
  lng: number;
  bearing: number;
  speedKmh: number;
  isGpsConfirmed: boolean;
  occupancy: 'low' | 'medium' | 'high';
  direction: 'inbound' | 'outbound';
  lastUpdatedSecondsAgo: number;
}

export interface Departure {
  lineId: string;
  lineCode: string;
  lineName: string;
  destination: string;
  color: string;
  mode: TransitMode;
  minutesAway: number;
  isGpsConfirmed: boolean; // Moovit green beacon
  isGoKL?: boolean;
  vehicleNumber?: string;
  platform?: string;
  bay?: string;
  sources: TransitAgency[];
  fareRm?: number;
  platformGuide?: PlatformInfo;
  isLongWaitWarning?: boolean;
  crowdLevel?: 'low' | 'moderate' | 'packed';
  alternativeSuggestion?: {
    lineCode: string;
    minutesAway: number;
    fare: string;
    description: string;
  };
}

export interface RouteLeg {
  id: string;
  mode: TransitMode;
  lineId?: string;
  lineCode?: string;
  lineName?: string;
  color: string;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  stopCount: number;
  intermediateStations: string[];
  durationMinutes: number;
  distanceKm: number;
  instruction: string;
  isGpsConfirmed?: boolean;
  vehicleNumber?: string;
  isGoKL?: boolean;
  fareRm?: number;
  platformGuide?: PlatformInfo;
  walkingOrientation?: WalkingOrientationGuide;
  coveredWalkway?: CoveredWalkwayInfo;
}

export interface RouteItinerary {
  id: string;
  title: string;
  summary: string;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  totalFare: string;
  totalFareRm?: number;
  transferCount: number;
  legs: RouteLeg[];
  sources: TransitAgency[];
  isRecommended?: boolean;
  isFastest?: boolean;
  isFreeOrCheapest?: boolean;
  highlights: string[];
  platformAlert?: string;
  longWaitAlert?: string;
  fares?: FareBreakdown;
  crowdDensity?: CrowdDensity;
  coveredWalkwaySummary?: CoveredWalkwayInfo;
  isBypassRoute?: boolean;
}

// ==========================================
// MOOVIT MULTI-LINE CORRIDOR TYPES
// ==========================================
export interface CorridorDepartureItem {
  lineCode: string;
  lineId: string;
  color: string;
  destination: string;
  minutesAway: number;
  isGpsConfirmed: boolean;
  scheduledTime: string;
  vehiclePlate?: string;
  crowdLevel: 'low' | 'moderate' | 'packed';
  status: 'on_time' | 'delayed' | 'approaching' | 'scheduled';
}

export interface CorridorGroup {
  id: string;
  corridorName: string;
  stopName: string;
  stopCode: string;
  commonDestination: string;
  routeCodes: string[];
  nextBusMinutes: number[];
  isGpsConfirmed: boolean;
  isAccurateArrival: boolean;
  scheduledNextTimes: string[];
  departures: CorridorDepartureItem[];
}

// ==========================================
// WAZE PEDESTRIAN MANEUVER HUD TYPES
// ==========================================
export type WazeManeuverType =
  | 'u-turn'
  | 'turn-left'
  | 'turn-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'slight-left'
  | 'slight-right'
  | 'straight'
  | 'stairs-up'
  | 'stairs-down'
  | 'linkbridge'
  | 'zebra-crossing'
  | 'destination';

export interface WazeManeuverStep {
  id: string;
  maneuverType: WazeManeuverType;
  distanceMeters: number;
  streetName: string;
  instruction: string;
  thenInstruction?: string;
  landmark?: string;
  isCoveredWalkway?: boolean;
  hazardAlert?: string;
  crossStreetPill?: string;
}

export interface WazeWalkingTrip {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  etaTime: string;
  coveredPercentage: number;
  steps: WazeManeuverStep[];
}

// ==========================================
// RAPID PULSE LIVE BUS FLEET RADAR TYPES
// ==========================================
export interface RapidPulseFleetUnit {
  vehiclePlate: string;
  routeCode: string;
  routeId: string;
  destination: string;
  minutesAway: number;
  stopsAway: number;
  stopsAwayLabel: string;
  currentStationName: string;
  lastPassedStationName: string;
  speedKmh: number;
  isGpsLive: boolean;
  isWheelchairAccessible: boolean;
  occupancy: 'low' | 'medium' | 'high';
  lineProgressPercent: number; // 0-100 along the route
  statusMessage: string;
}

export interface RapidPulseRouteProgression {
  routeCode: string;
  routeName: string;
  originTerminus: string;
  destTerminus: string;
  orderedStops: {
    id: string;
    name: string;
    code?: string;
    isCurrentOrNext?: boolean;
    isPassed?: boolean;
  }[];
  activeBuses: RapidPulseFleetUnit[];
}



