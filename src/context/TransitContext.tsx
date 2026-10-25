import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ALL_LINES, ALL_STATIONS, LINES_BY_ID, STATIONS_BY_ID } from '../data/transitData';
import {
  advanceFleetPositions,
  findItineraries,
  generateInitialFleet,
  getStationDepartures,
} from '../utils/transitGraph';
import {
  CommuterPassType,
  Departure,
  DisruptionAlert,
  RouteItinerary,
  Station,
  TransitLine,
  TransitMode,
  Vehicle,
} from '../types/transit';
import { DEFAULT_DISRUPTIONS } from '../data/transitData';

interface TransitContextType {
  // Navigation & Search
  originStationId: string;
  destStationId: string;
  setOriginStationId: (id: string) => void;
  setDestStationId: (id: string) => void;
  swapOriginDest: () => void;
  originStation: Station | undefined;
  destStation: Station | undefined;

  // Geolocation & User Location
  userCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  locationError: string | null;
  detectCurrentLocation: () => Promise<Station | null>;

  // Itineraries
  itineraries: RouteItinerary[];
  selectedItineraryId: string | null;
  selectedItinerary: RouteItinerary | undefined;
  setSelectedItineraryId: (id: string | null) => void;

  // Fare Pass & Personalized Pricing
  commuterPass: CommuterPassType;
  setCommuterPass: (pass: CommuterPassType) => void;

  // Service Disruption & Bypass Contingency
  isDisruptionActive: boolean;
  setIsDisruptionActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  toggleDisruption: () => void;
  activeDisruptionAlert: DisruptionAlert;
  applyDisruptionBypass: () => void;

  // Station Facility Blueprint Modal
  activeFacilityModalStation: Station | null;
  setActiveFacilityModalStation: (station: Station | null) => void;
  openFacilityModal: (stationId: string) => void;
  closeFacilityModal: () => void;

  // Active Journey Tracking (Google Maps Style)
  isJourneyActive: boolean;
  currentLegIndex: number;
  currentStationPassedIndex: number;
  passedStationIds: Set<string>;
  startJourney: (itinerary: RouteItinerary) => void;
  stopJourney: () => void;
  advanceJourneyStation: () => void;
  simulationSpeed: number; // 1, 2, 4, 0 (paused)
  setSimulationSpeed: (speed: number) => void;

  // Live Fleet (Rapid Pulse Radar Engine)
  fleet: Vehicle[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (v: Vehicle | null) => void;

  // Station Inspector / Departures (Moovit Style)
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  selectedStation: Station | undefined;
  selectedStationDepartures: Departure[];

  // Line Directory & View
  selectedLineId: string;
  setSelectedLineId: (id: string) => void;
  selectedLine: TransitLine | undefined;
  filterMode: 'all' | 'gokl' | 'rapidkl' | 'rail';
  setFilterMode: (m: 'all' | 'gokl' | 'rapidkl' | 'rail') => void;

  // Canvas View Mode
  viewMode: 'geographic' | 'schematic';
  setViewMode: (mode: 'geographic' | 'schematic') => void;
  radarScanActive: boolean;
  setRadarScanActive: (active: boolean | ((prev: boolean) => boolean)) => void;

  // Mobile navigation
  mobileTab: 'planner' | 'radar' | 'inspector' | 'lines';
  setMobileTab: (tab: 'planner' | 'radar' | 'inspector' | 'lines') => void;

  // Optional AI Transit Concierge (Gemini 3.8 Flash + Google Maps Grounding)
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  toggleAi: () => void;
}

const TransitContext = createContext<TransitContextType | null>(null);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to the user's specific route: Segambut KTM -> KL Sentral
  const [originStationId, setOriginStationId] = useState<string>('segambut_station');
  const [destStationId, setDestStationId] = useState<string>('kl_sentral');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  // User Geolocation State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 3.1668,
    lng: 101.6938, // Chow Kit / 8 Jalan Ipoh Kecil
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Helper to find closest station to GPS coordinates
  const findClosestStation = useCallback((lat: number, lng: number): Station => {
    let closestStation = ALL_STATIONS[0];
    let minDistance = Infinity;

    for (const station of ALL_STATIONS) {
      const d = Math.hypot(station.lat - lat, station.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        closestStation = station;
      }
    }
    return closestStation;
  }, []);

  // Browser Geolocation API execution
  const detectCurrentLocation = useCallback(async (): Promise<Station | null> => {
    setIsLocating(true);
    setLocationError(null);

    return new Promise<Station | null>((resolve) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setLocationError('Geolocation not supported by browser');
        setIsLocating(false);
        const fallback = STATIONS_BY_ID.get('jalan_ipoh_kecil') || ALL_STATIONS[0];
        setOriginStationId(fallback.id);
        setUserCoords({ lat: fallback.lat, lng: fallback.lng });
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          const nearest = findClosestStation(lat, lng);
          setOriginStationId(nearest.id);
          setIsLocating(false);
          resolve(nearest);
        },
        (err) => {
          console.warn('Geolocation access failed or denied:', err.message);
          setLocationError(err.message);
          setIsLocating(false);
          // Seamless fallback to Chow Kit (8 Jalan Ipoh Kecil)
          const fallback = STATIONS_BY_ID.get('jalan_ipoh_kecil') || ALL_STATIONS[0];
          setOriginStationId(fallback.id);
          setUserCoords({ lat: fallback.lat, lng: fallback.lng });
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });
  }, [findClosestStation]);

  // Commuter Pass Category State (TnG, My50, Concession, Cash)
  const [commuterPass, setCommuterPassState] = useState<CommuterPassType>(() => {
    try {
      const stored = localStorage.getItem('kl_transit_commuter_pass');
      if (stored === 'tng' || stored === 'my50' || stored === 'concession' || stored === 'cash') {
        return stored as CommuterPassType;
      }
    } catch {
      // fallback
    }
    return 'tng';
  });

  const setCommuterPass = useCallback((pass: CommuterPassType) => {
    setCommuterPassState(pass);
    try {
      localStorage.setItem('kl_transit_commuter_pass', pass);
    } catch {
      // ignore
    }
  }, []);

  // Service Disruption Simulation & Bypass State
  const [isDisruptionActive, setIsDisruptionActive] = useState<boolean>(true); // Active by default to showcase contingency
  const activeDisruptionAlert = DEFAULT_DISRUPTIONS[0];

  const toggleDisruption = useCallback(() => {
    setIsDisruptionActive((prev) => !prev);
  }, []);

  const applyDisruptionBypass = useCallback(() => {
    setIsDisruptionActive(true);
    setOriginStationId('segambut_station');
    setDestStationId('pwtc_lrt');
  }, []);

  // Station Facility Blueprint Modal State
  const [activeFacilityModalStation, setActiveFacilityModalStation] = useState<Station | null>(null);

  const openFacilityModal = useCallback((stationId: string) => {
    const st = STATIONS_BY_ID.get(stationId);
    if (st) {
      setActiveFacilityModalStation(st);
    }
  }, []);

  const closeFacilityModal = useCallback(() => {
    setActiveFacilityModalStation(null);
  }, []);

  // Active Journey State
  const [isJourneyActive, setIsJourneyActive] = useState<boolean>(false);
  const [currentLegIndex, setCurrentLegIndex] = useState<number>(0);
  const [currentStationPassedIndex, setCurrentStationPassedIndex] = useState<number>(0);
  const [passedStationIds, setPassedStationIds] = useState<Set<string>>(new Set());
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Station & Line Inspector
  const [selectedStationId, setSelectedStationId] = useState<string>('segambut_station');
  const [selectedLineId, setSelectedLineId] = useState<string>('bus-190');
  const [filterMode, setFilterMode] = useState<'all' | 'gokl' | 'rapidkl' | 'rail'>('all');

  // Radar & Fleet State
  const [fleet, setFleet] = useState<Vehicle[]>(() => generateInitialFleet());
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<'geographic' | 'schematic'>('geographic');
  const [radarScanActive, setRadarScanActive] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'planner' | 'radar' | 'inspector' | 'lines'>('planner');

  // Optional AI Transit Concierge (OFF by default until turned on by user)
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);

  const toggleAi = useCallback(() => {
    setIsAiEnabled((prev) => {
      const next = !prev;
      if (next) {
        setIsAiChatOpen(true);
      } else {
        setIsAiChatOpen(false);
      }
      return next;
    });
  }, []);

  // Computed stations
  const originStation = useMemo(() => STATIONS_BY_ID.get(originStationId), [originStationId]);
  const destStation = useMemo(() => STATIONS_BY_ID.get(destStationId), [destStationId]);
  const selectedStation = useMemo(() => STATIONS_BY_ID.get(selectedStationId), [selectedStationId]);
  const selectedLine = useMemo(() => LINES_BY_ID.get(selectedLineId), [selectedLineId]);

  // Computed itineraries with fare category and disruption bypass awareness
  const itineraries = useMemo(() => {
    return findItineraries(originStationId, destStationId, commuterPass, isDisruptionActive);
  }, [originStationId, destStationId, commuterPass, isDisruptionActive]);

  // Set default selected itinerary
  useEffect(() => {
    if (itineraries.length > 0) {
      setSelectedItineraryId(itineraries[0].id);
    } else {
      setSelectedItineraryId(null);
    }
  }, [itineraries]);

  const selectedItinerary = useMemo(() => {
    return itineraries.find((it) => it.id === selectedItineraryId) || itineraries[0];
  }, [itineraries, selectedItineraryId]);

  // Station departures (Moovit live signals with crowd and delay adjustments)
  const selectedStationDepartures = useMemo(() => {
    return getStationDepartures(selectedStationId, isDisruptionActive);
  }, [selectedStationId, isDisruptionActive]);

  // Swap origin and destination
  const swapOriginDest = useCallback(() => {
    setOriginStationId(destStationId);
    setDestStationId(originStationId);
  }, [originStationId, destStationId]);

  // Start journey navigation
  const startJourney = useCallback((itinerary: RouteItinerary) => {
    setIsJourneyActive(true);
    setCurrentLegIndex(0);
    setCurrentStationPassedIndex(0);
    setPassedStationIds(new Set());
    setSelectedItineraryId(itinerary.id);
    setMobileTab('radar');
  }, []);

  // Stop journey navigation
  const stopJourney = useCallback(() => {
    setIsJourneyActive(false);
    setCurrentLegIndex(0);
    setCurrentStationPassedIndex(0);
    setPassedStationIds(new Set());
  }, []);

  // Advance journey one station forward
  const advanceJourneyStation = useCallback(() => {
    if (!selectedItinerary || !isJourneyActive) return;

    const currentLeg = selectedItinerary.legs[currentLegIndex];
    if (!currentLeg) return;

    const stops = currentLeg.intermediateStations;
    if (currentStationPassedIndex < stops.length - 1) {
      const newlyPassed = stops[currentStationPassedIndex];
      setPassedStationIds((prev) => new Set([...prev, newlyPassed]));
      setCurrentStationPassedIndex((prev) => prev + 1);
    } else if (currentLegIndex < selectedItinerary.legs.length - 1) {
      // Advance to next leg
      const lastStopOfLeg = stops[stops.length - 1];
      setPassedStationIds((prev) => new Set([...prev, lastStopOfLeg]));
      setCurrentLegIndex((prev) => prev + 1);
      setCurrentStationPassedIndex(0);
    } else {
      // Completed trip!
      const finalStop = stops[stops.length - 1];
      setPassedStationIds((prev) => new Set([...prev, finalStop]));
    }
  }, [selectedItinerary, isJourneyActive, currentLegIndex, currentStationPassedIndex]);

  // Real-time fleet animation loop (Rapid Pulse live radar)
  useEffect(() => {
    if (simulationSpeed === 0) return; // Paused

    const intervalMs = Math.round(1200 / simulationSpeed);
    const timer = setInterval(() => {
      setFleet((prevFleet) => advanceFleetPositions(prevFleet, 0.02 * simulationSpeed));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulationSpeed]);

  // Auto-progress active journey in follow mode if simulation speed > 0
  useEffect(() => {
    if (!isJourneyActive || simulationSpeed === 0) return;

    const stepInterval = Math.round(7000 / simulationSpeed);
    const timer = setInterval(() => {
      advanceJourneyStation();
    }, stepInterval);

    return () => clearInterval(timer);
  }, [isJourneyActive, simulationSpeed, advanceJourneyStation]);

  const value = {
    originStationId,
    destStationId,
    setOriginStationId,
    setDestStationId,
    swapOriginDest,
    originStation,
    destStation,
    userCoords,
    isLocating,
    locationError,
    detectCurrentLocation,
    itineraries,
    selectedItineraryId,
    selectedItinerary,
    setSelectedItineraryId,
    commuterPass,
    setCommuterPass,
    isDisruptionActive,
    setIsDisruptionActive,
    toggleDisruption,
    activeDisruptionAlert,
    applyDisruptionBypass,
    activeFacilityModalStation,
    setActiveFacilityModalStation,
    openFacilityModal,
    closeFacilityModal,
    isJourneyActive,
    currentLegIndex,
    currentStationPassedIndex,
    passedStationIds,
    startJourney,
    stopJourney,
    advanceJourneyStation,
    simulationSpeed,
    setSimulationSpeed,
    fleet,
    selectedVehicle,
    setSelectedVehicle,
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    selectedStationDepartures,
    selectedLineId,
    setSelectedLineId,
    selectedLine,
    filterMode,
    setFilterMode,
    viewMode,
    setViewMode,
    radarScanActive,
    setRadarScanActive,
    mobileTab,
    setMobileTab,
    isAiEnabled,
    setIsAiEnabled,
    isAiChatOpen,
    setIsAiChatOpen,
    toggleAi,
  };

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
};

export function useTransit() {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
}
