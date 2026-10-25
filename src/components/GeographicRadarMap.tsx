import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { useTransit } from '../context/TransitContext';
import { ALL_STATIONS, STATIONS_BY_ID, LINES_BY_ID, DEFAULT_WAZE_TRIPS } from '../data/transitData';
import { Station, Vehicle, WazeWalkingTrip, WazeManeuverStep } from '../types/transit';
import {
  ZoomIn,
  ZoomOut,
  Navigation,
  Bus,
  Train,
  Crosshair,
  Layers,
  MapPin,
  Flag,
  Footprints,
  Compass,
  ArrowLeft,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  X,
  ShieldCheck,
  Clock,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface GeographicRadarMapProps {
  onBackToDirections?: () => void;
  isNavigating?: boolean;
  onStopNavigation?: () => void;
  tripId?: string;
  currentView?: 'routes' | 'directions' | 'timetables' | 'radar';
  selectedRouteId?: string;
}

type MapTileStyle = 'google' | 'terrain' | 'satellite' | 'dark';

export const GeographicRadarMap: React.FC<GeographicRadarMapProps> = ({
  onBackToDirections,
  isNavigating = false,
  onStopNavigation,
  tripId,
  currentView = 'routes',
  selectedRouteId,
}) => {
  const {
    originStationId,
    destStationId,
    setOriginStationId,
    setDestStationId,
    userCoords,
    detectCurrentLocation,
    isLocating,
    fleet,
    selectedItinerary,
  } = useTransit();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const vehiclesLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Default to Google Maps (exact roadmap as requested in user reference)
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('google');
  const [selectedStationInfo, setSelectedStationInfo] = useState<Station | null>(null);
  const [selectedBusInfo, setSelectedBusInfo] = useState<Vehicle | null>(null);

  // Active Origin and Destination station objects
  const originStation = useMemo(() => STATIONS_BY_ID.get(originStationId), [originStationId]);
  const destStation = useMemo(() => STATIONS_BY_ID.get(destStationId), [destStationId]);

  // Active Waze Trip selection
  const activeWazeTrip: WazeWalkingTrip = useMemo(() => {
    if (tripId) {
      const found = DEFAULT_WAZE_TRIPS.find((t) => t.id === tripId);
      if (found) return found;
    }
    if (destStationId === 'unirazak') {
      const found = DEFAULT_WAZE_TRIPS.find((t) => t.id === 'waze-to-unirazak');
      if (found) return found;
    }
    if (originStationId === 'segambut_station' || originStationId === 'smk_segambut') {
      const found = DEFAULT_WAZE_TRIPS.find((t) => t.id === 'waze-segambut-to-bus190');
      if (found) return found;
    }
    return DEFAULT_WAZE_TRIPS.find((t) => t.id === 'waze-ipoh-to-chowkit') || DEFAULT_WAZE_TRIPS[0];
  }, [tripId, originStationId, destStationId]);

  // Waze Navigation progression state
  const [stepIndex, setStepIndex] = useState(0);
  const [meterCountdown, setMeterCountdown] = useState(15);

  const currentStep: WazeManeuverStep =
    activeWazeTrip.steps[stepIndex] || activeWazeTrip.steps[0];
  const nextStep: WazeManeuverStep | undefined = activeWazeTrip.steps[stepIndex + 1];

  // Auto-simulate meter progression during active navigation
  useEffect(() => {
    if (!isNavigating) return;

    setMeterCountdown(currentStep?.distanceMeters || 15);
    const interval = setInterval(() => {
      setMeterCountdown((prev) => {
        if (prev <= 5) {
          if (stepIndex < activeWazeTrip.steps.length - 1) {
            setStepIndex((i) => i + 1);
            return activeWazeTrip.steps[stepIndex + 1]?.distanceMeters || 20;
          }
          return 0;
        }
        return prev - 5;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isNavigating, stepIndex, currentStep, activeWazeTrip.steps]);

  // Tile layer URL map (Exact Google Maps Roadmap as requested by user)
  const getTileConfig = (style: MapTileStyle) => {
    switch (style) {
      case 'satellite':
        return {
          url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Satellite',
          maxZoom: 20,
        };
      case 'terrain':
        return {
          url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Terrain',
          maxZoom: 20,
        };
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
        };
      case 'google':
      default:
        // EXACT standard Google Maps Road layer as shown in user's reference image
        return {
          url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Roadmap',
          maxZoom: 20,
        };
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [
      originStation?.lat || 3.1668,
      originStation?.lng || 101.6938,
    ];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const config = getTileConfig('google');
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    vehiclesLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Invalidate size once rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      vehicleMarkersMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const config = getTileConfig(tileStyle);
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
    }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [tileStyle]);

  // Recenter / fit bounds to route or origin
  const fitRouteBounds = useCallback(() => {
    if (!mapRef.current) return;
    if (originStation && destStation) {
      const bounds = L.latLngBounds([
        [originStation.lat, originStation.lng],
        [destStation.lat, destStation.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (originStation) {
      mapRef.current.setView([originStation.lat, originStation.lng], 16);
    }
  }, [originStation, destStation]);

  // Wide overview of Kuala Lumpur & Selangor (matches user reference view)
  const viewOverview = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([3.16, 101.65], 11, { animate: true });
  }, []);

  // Fly to user coordinates
  const handleRecenterUser = useCallback(async () => {
    if (!mapRef.current) return;
    if (userCoords) {
      mapRef.current.flyTo([userCoords.lat, userCoords.lng], 16, { animate: true });
    } else {
      const st = await detectCurrentLocation();
      if (st && mapRef.current) {
        mapRef.current.flyTo([st.lat, st.lng], 16, { animate: true });
      }
    }
  }, [userCoords, detectCurrentLocation]);

  // Re-fit map when origin or destination changes
  useEffect(() => {
    fitRouteBounds();
  }, [originStationId, destStationId, fitRouteBounds]);

  // Render Routes and Markers on Leaflet Map
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    const routesGroup = routeLayerRef.current;

    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // 1. Draw Route Polylines
    if (originStation && destStation) {
      const points: [number, number][] = [];
      points.push([originStation.lat, originStation.lng]);

      // If we have an active itinerary with intermediate legs, add those coordinates
      if (selectedItinerary && selectedItinerary.legs.length > 0) {
        selectedItinerary.legs.forEach((leg) => {
          leg.intermediateStations.forEach((stopId) => {
            const stop = STATIONS_BY_ID.get(stopId);
            if (stop) points.push([stop.lat, stop.lng]);
          });
        });
      }

      points.push([destStation.lat, destStation.lng]);

      // Draw route shadow/border
      const routeBorder = L.polyline(points, {
        color: '#0284c7',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routesGroup.addLayer(routeBorder);

      // Draw primary route line
      const isBusFocus = selectedItinerary?.legs.some((l) => l.mode === 'rapidkl' || l.mode === 'gokl');
      const routeLine = L.polyline(points, {
        color: isBusFocus ? '#00c269' : '#38bdf8',
        weight: 5,
        opacity: 0.95,
        dashArray: isNavigating ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routesGroup.addLayer(routeLine);
    }

    // 2. Add Intermediate Stops ONLY along the active itinerary (Clean, uncluttered)
    if (destStation && selectedItinerary) {
      const activeIntermediateIds = new Set<string>();
      selectedItinerary.legs.forEach((leg) => {
        (leg.intermediateStations || []).forEach((id) => {
          if (id !== originStationId && id !== destStationId) {
            activeIntermediateIds.add(id);
          }
        });
      });

      activeIntermediateIds.forEach((stopId) => {
        const st = STATIONS_BY_ID.get(stopId);
        if (!st) return;

        const stopIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="group relative flex items-center justify-center cursor-pointer">
              <div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0284c7] shadow-md transform hover:scale-125 transition-transform"></div>
              <div class="absolute bottom-full mb-1 hidden group-hover:flex px-2 py-0.5 rounded bg-[#18191c] border border-slate-700 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg z-50">
                ${st.shortName || st.name}
              </div>
            </div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([st.lat, st.lng], { icon: stopIcon });
        marker.on('click', () => setSelectedStationInfo(st));
        markersGroup.addLayer(marker);
      });
    }

    // 3. Prominent Origin Marker (A)
    if (originStation) {
      const originIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center">
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-orange-500/30 animate-ping"></span>
              <div class="w-7 h-7 rounded-full bg-orange-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs">
                A
              </div>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded-md bg-[#18191c] border border-orange-500/70 text-orange-400 text-[10px] font-bold shadow-md whitespace-nowrap">
              Start: ${originStation.shortName || originStation.name}
            </div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      });

      const originMarker = L.marker([originStation.lat, originStation.lng], {
        icon: originIcon,
        zIndexOffset: 1000,
      });
      originMarker.on('click', () => setSelectedStationInfo(originStation));
      markersGroup.addLayer(originMarker);
    }

    // 4. Prominent Destination Marker (B) - Only when destination is selected
    if (destStation) {
      const isUnirazak = destStation.id === 'unirazak';
      const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center">
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full ${isUnirazak ? 'bg-amber-400/30' : 'bg-red-500/30'} animate-ping"></span>
              <div class="w-7 h-7 rounded-full ${isUnirazak ? 'bg-amber-500' : 'bg-red-600'} border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs">
                ${isUnirazak ? '🎓' : 'B'}
              </div>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded-md bg-[#18191c] border ${isUnirazak ? 'border-amber-400/70 text-amber-300' : 'border-red-500/70 text-red-300'} text-[10px] font-bold shadow-md whitespace-nowrap">
              ${destStation.shortName || destStation.name}
            </div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      });

      const destMarker = L.marker([destStation.lat, destStation.lng], {
        icon: destIcon,
        zIndexOffset: 1000,
      });
      destMarker.on('click', () => setSelectedStationInfo(destStation));
      markersGroup.addLayer(destMarker);
    }

    // 5. User GPS Radar Puck
    if (userCoords) {
      const userPuckIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 animate-ping"></span>
            <span class="absolute w-5 h-5 rounded-full bg-cyan-500/40"></span>
            <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: userPuckIcon,
        zIndexOffset: 950,
      });
      markersGroup.addLayer(userMarker);
    }
  }, [
    originStation,
    destStation,
    originStationId,
    destStationId,
    userCoords,
    selectedItinerary,
    isNavigating,
  ]);

  // 6. Live Fleet Vehicles: Smooth, Persistent GPS Telemetry Update
  // ONLY show relevant route buses when user enters 'directions', 'radar', or isNavigating!
  useEffect(() => {
    const vehiclesGroup = vehiclesLayerRef.current;
    if (!vehiclesGroup) return;

    const isDirectionsMode = currentView === 'directions' || currentView === 'radar' || isNavigating;

    if (!isDirectionsMode || !destStation || !selectedItinerary) {
      // Clean view: No buses shown initially until a route/directions is chosen
      vehiclesGroup.clearLayers();
      vehicleMarkersMapRef.current.clear();
      return;
    }

    const activeLineCodes = new Set<string>();

    if (selectedRouteId) {
      if (selectedRouteId.includes('190')) activeLineCodes.add('190');
      if (selectedRouteId.includes('180')) activeLineCodes.add('180');
      if (selectedRouteId.includes('171')) activeLineCodes.add('171');
      if (selectedRouteId.includes('173')) activeLineCodes.add('173');
      if (selectedRouteId.includes('151')) activeLineCodes.add('151');
      if (selectedRouteId.includes('851')) activeLineCodes.add('851');
      if (selectedRouteId.includes('gokl') || selectedRouteId.includes('magenta')) {
        activeLineCodes.add('gokl-13');
        activeLineCodes.add('13');
      }
    }

    selectedItinerary.legs.forEach((leg) => {
      if (leg.mode === 'rapidkl' || leg.mode === 'gokl') {
        if (leg.lineId) activeLineCodes.add(leg.lineId.toLowerCase());
        if (leg.lineCode) activeLineCodes.add(leg.lineCode.toLowerCase());
      }
    });

    if (destStationId === 'unirazak') {
      activeLineCodes.add('190');
      activeLineCodes.add('bus-190');
      activeLineCodes.add('180');
      activeLineCodes.add('bus-180');
    }

    // Filter fleet strictly to this route's buses
    const routeBuses = fleet.filter((bus) => {
      const lineId = bus.lineId.toLowerCase();
      const line = LINES_BY_ID.get(bus.lineId);
      const lineCode = line?.code.toLowerCase() || '';
      return Array.from(activeLineCodes).some(
        (code) => lineId.includes(code) || code.includes(lineId) || (lineCode && lineCode.includes(code))
      );
    });

    const activeBusIds = new Set<string>(routeBuses.map((b) => b.id));

    // Remove any markers that are no longer part of the filtered route
    vehicleMarkersMapRef.current.forEach((marker, busId) => {
      if (!activeBusIds.has(busId)) {
        vehiclesGroup.removeLayer(marker);
        vehicleMarkersMapRef.current.delete(busId);
      }
    });

    // Update or create persistent markers with smooth CSS translation
    routeBuses.forEach((bus) => {
      const line = LINES_BY_ID.get(bus.lineId);
      const routeCode = line?.code || (bus.lineId.includes('190') ? '190' : bus.lineId.includes('180') ? '180' : 'BUS');
      const isGoKl = bus.lineId.includes('gokl');
      const is190 = bus.lineId.includes('190');

      let pillBg = 'bg-sky-600 text-white border-sky-300 shadow-sky-950/50';
      if (isGoKl) pillBg = 'bg-fuchsia-600 text-white border-fuchsia-300 shadow-fuchsia-950/50';
      else if (is190) pillBg = 'bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/60 shadow-emerald-950/50';

      const busIcon = L.divIcon({
        className: 'custom-div-icon transit-live-bus-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform">
            <div class="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg border flex items-center gap-1.5 ${pillBg}">
              <span class="text-xs">🚌</span>
              <span>${routeCode}</span>
              <span class="text-[9px] font-mono bg-black/40 px-1 py-0.2 rounded text-emerald-200">${bus.speedKmh || 28} km/h</span>
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            </div>
            <div class="flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded bg-black/85 text-[8px] font-bold text-emerald-300 border border-emerald-500/40 shadow-xs">
              <span class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE GPS</span>
              <span style="display:inline-block; transform: rotate(${bus.bearing || 180}deg); font-size: 8px;">▲</span>
            </div>
          </div>
        `,
        iconSize: [84, 38],
        iconAnchor: [42, 38],
      });

      const existingMarker = vehicleMarkersMapRef.current.get(bus.id);
      if (existingMarker) {
        // Smoothly glides along the road due to CSS transition!
        existingMarker.setLatLng([bus.lat, bus.lng]);
        existingMarker.setIcon(busIcon);
      } else {
        const busMarker = L.marker([bus.lat, bus.lng], {
          icon: busIcon,
          zIndexOffset: 900,
        });
        busMarker.on('click', () => {
          setSelectedBusInfo(bus);
        });
        vehiclesGroup.addLayer(busMarker);
        vehicleMarkersMapRef.current.set(bus.id, busMarker);
      }
    });
  }, [
    fleet,
    isNavigating,
    currentView,
    selectedRouteId,
    destStation,
    destStationId,
    selectedItinerary,
  ]);

  // Maneuver icon helper for Waze Banner (compact size)
  const renderManeuverIcon = (type: string) => {
    switch (type) {
      case 'turn-left':
      case 'slight-left':
        return <CornerUpLeft className="w-5 h-5 text-amber-400" />;
      case 'turn-right':
      case 'slight-right':
        return <CornerUpRight className="w-5 h-5 text-amber-400" />;
      case 'zebra-crossing':
        return <Footprints className="w-5 h-5 text-cyan-400" />;
      case 'destination':
        return <Flag className="w-5 h-5 text-emerald-400" />;
      case 'straight':
      default:
        return <ArrowUp className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0c1017] overflow-hidden select-none">
      {/* Real Interactive Leaflet Street Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Back / Title / Map Type Selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBackToDirections && (
            <button
              type="button"
              onClick={onBackToDirections}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1e24]/90 backdrop-blur-md border border-[#323640] text-white text-xs font-bold shadow-xl hover:bg-[#252830] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back</span>
            </button>
          )}

          {/* Map Layer Switcher (Google Map vs Terrain vs Satellite vs Dark) */}
          <div className="flex items-center bg-[#1c1e24]/95 backdrop-blur-md rounded-xl p-1 border border-[#323640] shadow-xl text-xs">
            <button
              type="button"
              onClick={() => setTileStyle('google')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tileStyle === 'google'
                  ? 'bg-[#1a73e8] text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Official Google Maps Roadmap (exact match to reference)"
            >
              🗺️ Google Map
            </button>
            <button
              type="button"
              onClick={() => setTileStyle('terrain')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tileStyle === 'terrain'
                  ? 'bg-[#1a73e8] text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Google Maps Terrain with Topography"
            >
              ⛰️ Terrain
            </button>
            <button
              type="button"
              onClick={() => setTileStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tileStyle === 'satellite'
                  ? 'bg-[#1a73e8] text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Google Maps Satellite Hybrid"
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => setTileStyle('dark')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tileStyle === 'dark'
                  ? 'bg-[#1a73e8] text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Night Mode Map"
            >
              🌙 Dark
            </button>
          </div>
        </div>

        {/* Right: Quick Map Actions (Recenter, Fit Route, Overview, Zoom) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={viewOverview}
            className="px-3 py-1.5 rounded-xl bg-[#1c1e24]/95 backdrop-blur-md border border-[#323640] text-slate-200 hover:text-white hover:bg-[#282b33] text-xs font-bold shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Overview of KL & Selangor"
          >
            <span>Selangor / KL</span>
          </button>

          <button
            type="button"
            onClick={fitRouteBounds}
            className="px-3 py-1.5 rounded-xl bg-[#1c1e24]/95 backdrop-blur-md border border-[#323640] text-slate-200 hover:text-white hover:bg-[#282b33] text-xs font-bold shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Fit Route on Map"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Fit Route</span>
          </button>

          <button
            type="button"
            onClick={handleRecenterUser}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Center on My GPS Location"
          >
            <Crosshair className={`w-3.5 h-3.5 text-white ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Location'}</span>
          </button>

          <div className="flex flex-col bg-[#1c1e24]/95 backdrop-blur-md rounded-xl border border-[#323640] shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#282b33] transition-colors border-b border-[#2d303a] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#282b33] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Bus Movement Status Banner (Active in Directions & Radar mode) */}
      {(currentView === 'directions' || currentView === 'radar') && !isNavigating && (
        <div className="absolute top-16 left-4 right-4 md:left-6 md:right-auto z-20 pointer-events-auto">
          <div className="bg-[#14171f]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/50 shadow-xl flex items-center justify-between gap-2.5 text-xs text-white">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c269] animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-[#00c269]" />
              </div>
              <div className="truncate">
                <span className="font-bold text-[#00c269]">Rapid KL Live GPS: </span>
                <span className="text-slate-200 font-medium">
                  Bus 190 moving south (28 km/h)
                </span>
                <span className="text-slate-500 hidden sm:inline"> · </span>
                <span className="text-slate-300 text-[11px] hidden sm:inline">
                  Next: Chow Kit (2m)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold shrink-0">
              🟢 Moving Live
            </span>
          </div>
        </div>
      )}

      {/* WAZE TURN-BY-TURN NAVIGATION HUD (Compact & Clean when isNavigating is active) */}
      {isNavigating && (
        <>
          {/* Top Compact Turn Maneuver Banner */}
          <div className="absolute top-16 left-4 right-4 md:left-6 md:right-auto md:w-[320px] z-30 pointer-events-auto">
            <div className="bg-[#14171f]/95 backdrop-blur-md rounded-xl border border-sky-500/40 shadow-xl p-2.5 text-white">
              {/* Turn Arrow + Instruction */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-inner">
                  {renderManeuverIcon(currentStep.maneuverType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="text-sm font-extrabold text-cyan-300">{meterCountdown} m</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {currentStep.maneuverType.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-100 truncate mt-0.5">
                    {currentStep.instruction}
                  </div>

                  <div className="text-[10px] text-sky-300 flex items-center gap-1 truncate mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                    <span>{currentStep.streetName}</span>
                  </div>
                </div>
              </div>

              {/* Next Step Preview (Compact 1-liner) */}
              {nextStep && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="shrink-0 font-medium text-slate-500">Then:</span>
                  <span className="font-medium text-slate-200 truncate ml-1">
                    {nextStep.thenInstruction || nextStep.instruction}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Compact ETA Status Bar */}
          <div className="absolute bottom-5 left-4 right-4 md:left-6 md:right-6 z-30 pointer-events-auto flex justify-center">
            <div className="bg-[#14171f]/95 backdrop-blur-md rounded-full border border-slate-700/80 px-4 py-2 shadow-2xl flex items-center gap-3 text-white max-w-md w-full justify-between">
              <div className="flex items-center gap-2 min-w-0 text-xs">
                <span className="font-bold text-emerald-400">{activeWazeTrip.totalDurationMinutes} min</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 font-medium">{(activeWazeTrip.totalDistanceMeters / 1000).toFixed(1)} km</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 truncate max-w-[120px]">To {destStation?.shortName || destStation?.name}</span>
              </div>

              {/* Exit Navigation Button */}
              {onStopNavigation && (
                <button
                  type="button"
                  onClick={onStopNavigation}
                  className="px-3 py-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-[11px] shadow transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Station Details Card Modal (When user taps any station on the map) */}
      {selectedStationInfo && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-30 pointer-events-auto bg-[#1c1e24]/95 backdrop-blur-md border border-[#323640] rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                {selectedStationInfo.id === 'unirazak' ? (
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                ) : selectedStationInfo.modes.includes('rail') ? (
                  <Train className="w-4 h-4 text-red-400" />
                ) : (
                  <Bus className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  {selectedStationInfo.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedStationInfo.code ? `Code: ${selectedStationInfo.code}` : selectedStationInfo.zone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStationInfo(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#2d303a]">
            <button
              type="button"
              onClick={() => {
                setOriginStationId(selectedStationInfo.id);
                setSelectedStationInfo(null);
              }}
              className="flex-1 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 text-xs font-bold text-center cursor-pointer"
            >
              Set as Start
            </button>
            <button
              type="button"
              onClick={() => {
                setDestStationId(selectedStationInfo.id);
                setSelectedStationInfo(null);
              }}
              className="flex-1 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold text-center cursor-pointer"
            >
              Set as Destination
            </button>
          </div>
        </div>
      )}

      {/* Bus Details Card Modal (When user taps a moving bus) */}
      {selectedBusInfo && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-30 pointer-events-auto bg-[#1c1e24]/95 backdrop-blur-md border border-[#323640] rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                🚌
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Bus {selectedBusInfo.vehicleNumber} ({LINES_BY_ID.get(selectedBusInfo.lineId)?.code || selectedBusInfo.lineId})
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS Tracker · {selectedBusInfo.speedKmh} km/h
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBusInfo(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-300 bg-[#252830] p-2 rounded-lg">
            <div>
              <span className="text-slate-400">Next stop: </span>
              <span className="font-semibold text-white">
                {STATIONS_BY_ID.get(selectedBusInfo.nextStationId)?.name || selectedBusInfo.nextStationId}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-slate-400">Occupancy: </span>
              <span className="font-semibold text-amber-400 capitalize">
                {selectedBusInfo.occupancy} (Seats available)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
