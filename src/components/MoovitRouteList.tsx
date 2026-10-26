import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  MapPin,
  Clock,
  Radio,
  Footprints,
  Bus,
  Train,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Zap,
  Crosshair,
  X,
  Navigation,
  Building,
  Home,
  Check,
  Play,
  GraduationCap,
} from 'lucide-react';
import { ALL_STATIONS, STATIONS_BY_ID } from '../data/transitData';
import { useTransit } from '../context/TransitContext';
import { Station } from '../types/transit';

export interface DepartureTiming {
  minutes: number;
  status: 'live' | 'scheduled' | 'delayed';
  note?: string;
}

interface RouteOption {
  id: string;
  title: string;
  totalDurationMinutes: number;
  leaveTime: string;
  arriveTime: string;
  walkMinutes: number;
  busCodes: string[];
  departureTimings: DepartureTiming[];
  nextBusMinutes: number[];
  departureStopName: string;
  isLiveGps: boolean;
  fare: string;
  isKtmTrap?: boolean;
  ktmDelayMinutes?: number;
  isBypass?: boolean;
  summarySteps: { type: 'walk' | 'bus' | 'train'; label: string; minutes?: number; isGreen?: boolean }[];
}

interface MoovitRouteListProps {
  onSelectRoute: (routeId: string) => void;
  onOpenLiveRadar: () => void;
  onToggleMobileMap?: () => void;
  onStartNavigation?: (routeId: string) => void;
}

export const MoovitRouteList: React.FC<MoovitRouteListProps> = ({
  onSelectRoute,
  onOpenLiveRadar,
  onToggleMobileMap,
  onStartNavigation,
}) => {
  const {
    originStationId,
    destStationId,
    setOriginStationId,
    setDestStationId,
    swapOriginDest,
    originStation,
    destStation,
    userCoords,
    isLocating,
    detectCurrentLocation,
  } = useTransit();

  // Search input text state
  const [originQuery, setOriginQuery] = useState<string>('');
  const [destQuery, setDestQuery] = useState<string>('');
  const [isOriginFocused, setIsOriginFocused] = useState<boolean>(false);
  const [isDestFocused, setIsDestFocused] = useState<boolean>(false);
  const [isCurrentLocationActive, setIsCurrentLocationActive] = useState<boolean>(true);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>('');

  const originBoxRef = useRef<HTMLDivElement>(null);
  const destBoxRef = useRef<HTMLDivElement>(null);

  // Synchronize input fields when station IDs change externally
  useEffect(() => {
    if (originStationId === 'jalan_ipoh_kecil') {
      setOriginQuery('Current Location (8, Jalan Ipoh Kecil)');
      setIsCurrentLocationActive(true);
    } else {
      const st = STATIONS_BY_ID.get(originStationId);
      if (st) {
        setOriginQuery(st.name);
        setIsCurrentLocationActive(false);
      }
    }
  }, [originStationId]);

  useEffect(() => {
    const st = STATIONS_BY_ID.get(destStationId);
    if (st) {
      setDestQuery(st.name);
    }
  }, [destStationId]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originBoxRef.current && !originBoxRef.current.contains(e.target as Node)) {
        setIsOriginFocused(false);
      }
      if (destBoxRef.current && !destBoxRef.current.contains(e.target as Node)) {
        setIsDestFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter stations based on user typing with smart alias matching
  const filterStations = (query: string): Station[] => {
    const clean = query.trim().toLowerCase();
    if (!clean) return ALL_STATIONS.slice(0, 10);

    return ALL_STATIONS.filter((s) => {
      const name = s.name.toLowerCase();
      const short = (s.shortName || '').toLowerCase();
      const code = (s.code || '').toLowerCase();
      const zone = (s.zone || '').toLowerCase();
      const facilities = (s.facilities || []).join(' ').toLowerCase();

      // Custom alias associations matching user query patterns
      const isUnirazakMatch =
        (clean.includes('unirazak') || clean.includes('razak') || clean.includes('uni')) &&
        (s.id.includes('unirazak') ||
          name.includes('razak') ||
          s.id.includes('razak') ||
          short.includes('razak'));

      const isPutraMatch =
        clean.includes('putra') &&
        (s.id.includes('putra') ||
          name.includes('putra') ||
          name.includes('pwtc') ||
          code.includes('ka04'));

      const isMitecMatch =
        clean.includes('mitec') &&
        (s.id.includes('mitec') ||
          name.includes('mitec') ||
          name.includes('matrade') ||
          s.id.includes('duta'));

      const isSegambutMatch =
        clean.includes('segambut') &&
        (s.id.includes('segambut') ||
          name.includes('segambut') ||
          code.includes('ka05') ||
          code.includes('kl526'));

      const isChowKitMatch =
        clean.includes('chow') &&
        (s.id.includes('chow_kit') ||
          name.includes('chow kit') ||
          code.includes('ki52') ||
          s.id.includes('ipoh'));

      return (
        name.includes(clean) ||
        short.includes(clean) ||
        code.includes(clean) ||
        zone.includes(clean) ||
        facilities.includes(clean) ||
        isUnirazakMatch ||
        isPutraMatch ||
        isMitecMatch ||
        isSegambutMatch ||
        isChowKitMatch
      );
    });
  };

  const originSuggestions = useMemo(() => filterStations(originQuery), [originQuery]);
  const destSuggestions = useMemo(() => filterStations(destQuery), [destQuery]);

  // Detect current location via browser GPS / Geolocation API
  const handleUseCurrentLocation = async () => {
    setLocationStatusMessage('Locating your position...');
    try {
      const nearest = await detectCurrentLocation();
      if (nearest) {
        if (nearest.id === 'jalan_ipoh_kecil') {
          setOriginQuery('Current Location (8, Jalan Ipoh Kecil)');
        } else {
          setOriginQuery(`Near Me (${nearest.name})`);
        }
        setIsCurrentLocationActive(true);
        setLocationStatusMessage(`📍 Location set: ${nearest.name}`);
        setIsOriginFocused(false);
        setTimeout(() => setLocationStatusMessage(''), 3500);
      }
    } catch {
      setOriginStationId('jalan_ipoh_kecil');
      setOriginQuery('Current Location (8, Jalan Ipoh Kecil)');
      setIsCurrentLocationActive(true);
      setIsOriginFocused(false);
    }
  };

  // Select origin from dropdown
  const handleSelectOrigin = (station: Station) => {
    setOriginStationId(station.id);
    setOriginQuery(station.name);
    setIsCurrentLocationActive(station.id === 'jalan_ipoh_kecil');
    setIsOriginFocused(false);
  };

  // Select destination from dropdown
  const handleSelectDest = (station: Station) => {
    setDestStationId(station.id);
    setDestQuery(station.name);
    setIsDestFocused(false);
  };

  // Popular quick destination shortcuts
  const popularDestinations = useMemo(() => {
    return [
      ALL_STATIONS.find((s) => s.id === 'unirazak'),
      ALL_STATIONS.find((s) => s.id === 'putra_ktm'),
      ALL_STATIONS.find((s) => s.id === 'putra_court'),
      ALL_STATIONS.find((s) => s.id === 'mitec_matrade'),
      ALL_STATIONS.find((s) => s.id === 'chow_kit_utara'),
      ALL_STATIONS.find((s) => s.id === 'pwtc_lrt'),
      ALL_STATIONS.find((s) => s.id === 'segambut_station'),
      ALL_STATIONS.find((s) => s.id === 'kl_sentral'),
    ].filter(Boolean) as Station[];
  }, []);

  // Compute realistic transit route itineraries
  const routes = useMemo((): RouteOption[] => {
    // Case 1: UNIRAZAK (Universiti Tun Abdul Razak) destination
    if (
      destStationId === 'unirazak' ||
      destQuery.toLowerCase().includes('unirazak') ||
      destQuery.toLowerCase().includes('razak')
    ) {
      return [
        {
          id: 'route-unirazak-bus190',
          title: 'Direct Rapid Bus 190 / 180 to UNIRAZAK',
          totalDurationMinutes: 14,
          leaveTime: '3:45 pm',
          arriveTime: '3:59 pm',
          walkMinutes: 3,
          busCodes: ['190', '180'],
          departureTimings: [
            { minutes: 2, status: 'live' },
            { minutes: 7, status: 'scheduled' },
          ],
          nextBusMinutes: [2, 7],
          departureStopName: 'Chow Kit Utara / Segambut Hub',
          isLiveGps: true,
          fare: 'MYR 1.00',
          isBypass: true,
          summarySteps: [
            { type: 'walk', label: 'Walk 2m', minutes: 2 },
            { type: 'bus', label: 'Bus 190 / 180', isGreen: true },
            { type: 'walk', label: 'Walk 1m to UNIRAZAK', minutes: 1 },
          ],
        },
        {
          id: 'route-unirazak-gokl',
          title: 'Go KL Free City Bus (to Bank Negara / UNIRAZAK)',
          totalDurationMinutes: 18,
          leaveTime: '3:47 pm',
          arriveTime: '4:05 pm',
          walkMinutes: 4,
          busCodes: ['GOKL 13', 'GOKL 02'],
          departureTimings: [
            { minutes: 4, status: 'live' },
            { minutes: 12, status: 'scheduled' },
          ],
          nextBusMinutes: [4, 12],
          departureStopName: 'Go KL City Bus Bay',
          isLiveGps: true,
          fare: 'FREE',
          summarySteps: [
            { type: 'walk', label: 'Walk 3m', minutes: 3 },
            { type: 'bus', label: 'Go KL Free Bus', isGreen: true },
            { type: 'walk', label: 'Walk 1m to UNIRAZAK', minutes: 1 },
          ],
        },
      ];
    }

    // Case 2: Segambut to Putra / PWTC / KL Sentral (User's 40m KTM delay trap)
    if (
      originStationId === 'segambut_station' ||
      originStationId === 'smk_segambut' ||
      originQuery.toLowerCase().includes('segambut')
    ) {
      return [
        {
          id: 'route-segambut-bus190',
          title: 'Fast Bus 190 Bypass (Avoids 40m KTM Wait)',
          totalDurationMinutes: 16,
          leaveTime: '3:45 pm',
          arriveTime: '4:01 pm',
          walkMinutes: 3,
          busCodes: ['190', 'GOKL 13'],
          departureTimings: [
            { minutes: 2, status: 'live' },
            { minutes: 7, status: 'scheduled' },
          ],
          nextBusMinutes: [2, 7],
          departureStopName: 'SMK Segambut (KL522)',
          isLiveGps: true,
          fare: 'MYR 1.00',
          isBypass: true,
          summarySteps: [
            { type: 'walk', label: 'Walk 3m', minutes: 3 },
            { type: 'bus', label: '190 / GOKL 13', isGreen: true },
            { type: 'walk', label: 'Walk 1m', minutes: 1 },
          ],
        },
        {
          id: 'route-segambut-ktm-trap',
          title: 'KTM Komuter Line (Delayed 40+ min)',
          totalDurationMinutes: 52,
          leaveTime: '3:45 pm',
          arriveTime: '4:37 pm',
          walkMinutes: 5,
          busCodes: ['KTM'],
          departureTimings: [
            { minutes: 42, status: 'delayed' },
          ],
          nextBusMinutes: [42],
          departureStopName: 'Segambut KTM Platform 1',
          isLiveGps: false,
          fare: 'MYR 1.80',
          isKtmTrap: true,
          ktmDelayMinutes: 42,
          summarySteps: [
            { type: 'walk', label: 'Walk 5m', minutes: 5 },
            { type: 'train', label: 'KTM (Next train 8:10 pm)' },
            { type: 'walk', label: 'Walk 4m', minutes: 4 },
          ],
        },
      ];
    }

    // Case 3: MITEC to Putra / PWTC / Chow Kit
    if (originStationId === 'mitec_matrade' || originQuery.toLowerCase().includes('mitec')) {
      return [
        {
          id: 'route-mitec-gokl',
          title: 'Direct Go KL Magenta (Free Shuttle)',
          totalDurationMinutes: 14,
          leaveTime: '3:46 pm',
          arriveTime: '4:00 pm',
          walkMinutes: 2,
          busCodes: ['GOKL 13'],
          departureTimings: [
            { minutes: 3, status: 'live' },
            { minutes: 11, status: 'scheduled' },
          ],
          nextBusMinutes: [3, 11],
          departureStopName: 'MITEC South Concourse Bus Bay',
          isLiveGps: true,
          fare: 'FREE',
          summarySteps: [
            { type: 'walk', label: 'Walk 2m', minutes: 2 },
            { type: 'bus', label: 'GOKL 13 Magenta', isGreen: true },
            { type: 'walk', label: 'Walk 2m', minutes: 2 },
          ],
        },
        {
          id: 'route-mitec-bus190',
          title: 'Rapid KL Bus 190 (Direct Express)',
          totalDurationMinutes: 18,
          leaveTime: '3:48 pm',
          arriveTime: '4:06 pm',
          walkMinutes: 4,
          busCodes: ['190'],
          departureTimings: [
            { minutes: 6, status: 'live' },
            { minutes: 16, status: 'scheduled' },
          ],
          nextBusMinutes: [6, 16],
          departureStopName: 'Jalan Dutamas 2 Bus Stand',
          isLiveGps: true,
          fare: 'MYR 1.00',
          summarySteps: [
            { type: 'walk', label: 'Walk 4m', minutes: 4 },
            { type: 'bus', label: 'Bus 190', isGreen: true },
            { type: 'walk', label: 'Walk 1m', minutes: 1 },
          ],
        },
      ];
    }

    // Case 4: Putra Court to PWTC LRT / Sunway Putra Hotel / Putra Mall (Direct walk along Jalan 1/64d from image_6d70ea65.png)
    if (
      originStationId === 'putra_court' ||
      destStationId === 'putra_court' ||
      originQuery.toLowerCase().includes('putra court') ||
      destQuery.toLowerCase().includes('putra court') ||
      ((destStationId === 'pwtc_lrt' || destStationId === 'sunway_putra') && originStationId === 'putra_court')
    ) {
      return [
        {
          id: 'route-putra-court-walk-pwtc',
          title: 'Direct Walk via Jalan 1/64d to PWTC / Sunway Putra',
          totalDurationMinutes: 4,
          leaveTime: '3:45 pm',
          arriveTime: '3:49 pm',
          walkMinutes: 4,
          busCodes: [],
          departureTimings: [],
          nextBusMinutes: [],
          departureStopName: 'Jalan 1/64d Pedestrian Footpath',
          isLiveGps: false,
          fare: 'Free',
          isBypass: true,
          summarySteps: [
            { type: 'walk', label: 'Walk 4m along Jalan 1/64d (350 m)', minutes: 4 },
          ],
        },
        {
          id: 'route-putra-court-bus190',
          title: 'Bus 190 / Go KL Magenta via PWTC Transit Bay',
          totalDurationMinutes: 12,
          leaveTime: '3:47 pm',
          arriveTime: '3:59 pm',
          walkMinutes: 3,
          busCodes: ['190', 'GOKL 13'],
          departureTimings: [
            { minutes: 2, status: 'live' },
            { minutes: 7, status: 'scheduled' },
          ],
          nextBusMinutes: [2, 7],
          departureStopName: 'PWTC / Sunway Putra Bus Bay',
          isLiveGps: true,
          fare: 'MYR 1.00',
          summarySteps: [
            { type: 'walk', label: 'Walk 3m', minutes: 3 },
            { type: 'bus', label: 'Bus 190 / GOKL 13', isGreen: true },
            { type: 'walk', label: 'Walk 1m', minutes: 1 },
          ],
        },
      ];
    }

    // Case 5: 8 Jalan Ipoh Kecil / Chow Kit (Moovit Corridor 180, 171, 173, 151)
    return [
      {
        id: 'route-chowkit-corridor',
        title: 'Moovit Multi-Line Corridor (Fastest)',
        totalDurationMinutes: 44,
        leaveTime: '3:44 pm',
        arriveTime: '4:28 pm',
        walkMinutes: 4,
        busCodes: ['180', '171', '173', '151'],
        departureTimings: [
          { minutes: 2, status: 'live' },       // Green: live GPS confirmed approaching
          { minutes: 8, status: 'scheduled' },  // White: scheduled timetable run
          { minutes: 9, status: 'scheduled' },  // White: scheduled timetable run
        ],
        nextBusMinutes: [2, 8, 9],
        departureStopName: 'Chow Kit (Utara) (KI52)',
        isLiveGps: true,
        fare: 'MYR 1.00',
        summarySteps: [
          { type: 'walk', label: 'Walk 4m', minutes: 4 },
          { type: 'bus', label: '180 / 171 / 173 / 151', isGreen: true },
          { type: 'bus', label: '851' },
          { type: 'walk', label: 'Walk 2m', minutes: 2 },
        ],
      },
      {
        id: 'route-ktm-gokl',
        title: 'KTM Komuter + Go KL Magenta 13',
        totalDurationMinutes: 52,
        leaveTime: '4:03 pm',
        arriveTime: '4:55 pm',
        walkMinutes: 11,
        busCodes: ['KTM', 'GOKL-13'],
        departureTimings: [
          { minutes: 18, status: 'scheduled' },
          { minutes: 35, status: 'scheduled' },
        ],
        nextBusMinutes: [18, 35],
        departureStopName: 'Putra KTM',
        isLiveGps: false,
        fare: 'MYR 1.80',
        summarySteps: [
          { type: 'walk', label: 'Walk 11m', minutes: 11 },
          { type: 'train', label: 'KTM' },
          { type: 'walk', label: 'Walk 2m', minutes: 2 },
          { type: 'bus', label: 'GOKL-13' },
          { type: 'walk', label: 'Walk 3m', minutes: 3 },
        ],
      },
      {
        id: 'route-walk-only',
        title: 'Direct Walking Route',
        totalDurationMinutes: 38,
        leaveTime: '3:43 pm',
        arriveTime: '4:21 pm',
        walkMinutes: 38,
        busCodes: [],
        departureTimings: [],
        nextBusMinutes: [],
        departureStopName: 'Sidewalk / Covered Overpass',
        isLiveGps: false,
        fare: 'Free',
        summarySteps: [{ type: 'walk', label: 'Walk 2.8 km', minutes: 38 }],
      },
    ];
  }, [originStationId, destStationId, originQuery, destQuery]);

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white select-none">
      {/* Top Search Container */}
      <div className="p-3 bg-[#18191c] border-b border-[#25262c] relative z-30">
        {/* Origin & Destination Interactive Box */}
        <div className="relative bg-[#202227] rounded-xl p-2.5 border border-[#2e3037] space-y-2.5 shadow-lg">
          {/* Origin Search Field */}
          <div ref={originBoxRef} className="relative">
            <div className="flex items-center gap-2.5">
              {/* Origin Icon (Orange Ring) */}
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>

              {/* Editable Search Input */}
              <div className="flex-1 relative flex items-center gap-1.5">
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setIsCurrentLocationActive(false);
                    setIsOriginFocused(true);
                  }}
                  onFocus={() => {
                    setIsOriginFocused(true);
                    setIsDestFocused(false);
                  }}
                  placeholder="Starting point or tap Near Me"
                  className="w-full bg-transparent text-xs font-semibold text-white placeholder-slate-400 focus:outline-none"
                />

                {/* Clear Origin Button if query exists */}
                {originQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginQuery('');
                      setIsCurrentLocationActive(false);
                      setIsOriginFocused(true);
                    }}
                    className="text-slate-400 hover:text-white p-1"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Prominent 'Near Me' Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm ${
                    isCurrentLocationActive
                      ? 'bg-emerald-500/20 text-[#00c269] border border-emerald-500/50 hover:bg-emerald-500/30'
                      : 'bg-[#252830] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/80 hover:border-emerald-500/60'
                  }`}
                  title="Detect and set your current location"
                >
                  <Navigation className={`w-3 h-3 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
                </button>
              </div>
            </div>

            {/* Origin Autocomplete Dropdown */}
            {isOriginFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#1c1e24] border border-[#323640] rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col">
                {/* 1-Tap Option: Current Location */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-3 py-2.5 bg-[#252830] hover:bg-[#2e323c] border-b border-[#323640] text-left flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <Crosshair className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#00c269] flex items-center gap-1.5">
                      <span>Your Current Location</span>
                      <span className="w-2 h-2 rounded-full bg-[#00c269] animate-ping" />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      8, Jalan Ipoh Kecil, Chow Kit (Auto-detected)
                    </div>
                  </div>
                </button>

                {/* Suggestions List */}
                <div className="overflow-y-auto p-1 divide-y divide-[#262830]">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {originQuery.trim() ? 'Matching Stations & Places' : 'Nearby Stations'}
                  </div>

                  {originSuggestions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      No station found for &quot;{originQuery}&quot;. Try typing &quot;UNIRAZAK&quot;, &quot;Putra&quot;, &quot;MITEC&quot;, or &quot;Chow Kit&quot;.
                    </div>
                  ) : (
                    originSuggestions.map((st) => (
                      <button
                        key={`orig-sug-${st.id}`}
                        type="button"
                        onClick={() => handleSelectOrigin(st)}
                        className="w-full px-3 py-2 text-left hover:bg-[#252830] flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#2c2f38] flex items-center justify-center text-slate-300 shrink-0">
                          {st.id === 'unirazak' ? (
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          ) : st.modes.includes('rail') ? (
                            <Train className="w-3.5 h-3.5 text-red-400" />
                          ) : st.id.includes('court') ? (
                            <Home className="w-3.5 h-3.5 text-amber-400" />
                          ) : st.id.includes('mitec') ? (
                            <Building className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <Bus className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            {st.code && (
                              <span className="px-1 py-0.2 bg-[#2e323c] rounded text-slate-300 font-mono">
                                {st.code}
                              </span>
                            )}
                            <span>{st.zone || 'Klang Valley'}</span>
                          </div>
                        </div>
                        {st.id === originStationId && (
                          <Check className="w-3.5 h-3.5 text-[#00c269] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-[#2e3037] ml-6" />

          {/* Destination Search Field */}
          <div ref={destBoxRef} className="relative">
            <div className="flex items-center gap-2.5">
              {/* Destination Pin */}
              <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center shrink-0">
                <MapPin className="w-2.5 h-2.5 text-red-500" />
              </div>

              {/* Editable Search Input */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setIsDestFocused(true);
                  }}
                  onFocus={() => {
                    setIsDestFocused(true);
                    setIsOriginFocused(false);
                  }}
                  placeholder="Where to? (e.g. UNIRAZAK, Putra KTM, MITEC)"
                  className="w-full bg-transparent text-xs font-semibold text-white placeholder-slate-400 focus:outline-none pr-8"
                />

                {/* Clear Destination Button */}
                {destQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestQuery('');
                      setIsDestFocused(true);
                    }}
                    className="absolute right-1 text-slate-400 hover:text-white p-1"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Destination Autocomplete Dropdown */}
            {isDestFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#1c1e24] border border-[#323640] rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col">
                <div className="px-3 py-1.5 bg-[#252830] text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-[#323640]">
                  {destQuery.trim() ? 'Search Results' : 'Popular Destinations'}
                </div>

                <div className="overflow-y-auto p-1 divide-y divide-[#262830]">
                  {(destQuery.trim() ? destSuggestions : popularDestinations).length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      No station found for &quot;{destQuery}&quot;. Try typing &quot;UNIRAZAK&quot;, &quot;Putra&quot;, &quot;MITEC&quot;, or &quot;PWTC&quot;.
                    </div>
                  ) : (
                    (destQuery.trim() ? destSuggestions : popularDestinations).map((st) => (
                      <button
                        key={`dest-sug-${st.id}`}
                        type="button"
                        onClick={() => handleSelectDest(st)}
                        className="w-full px-3 py-2 text-left hover:bg-[#252830] flex items-center gap-2.5 transition-colors cursor-pointer rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#2c2f38] flex items-center justify-center text-slate-300 shrink-0">
                          {st.id === 'unirazak' ? (
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          ) : st.modes.includes('rail') ? (
                            <Train className="w-3.5 h-3.5 text-red-400" />
                          ) : st.id.includes('court') ? (
                            <Home className="w-3.5 h-3.5 text-amber-400" />
                          ) : st.id.includes('mitec') ? (
                            <Building className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <Bus className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            {st.code && (
                              <span className="px-1 py-0.2 bg-[#2e323c] rounded text-slate-300 font-mono">
                                {st.code}
                              </span>
                            )}
                            <span>{st.zone || 'Klang Valley'}</span>
                          </div>
                        </div>
                        {st.id === destStationId && (
                          <Check className="w-3.5 h-3.5 text-[#00c269] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={swapOriginDest}
            className="absolute right-3 top-[26px] w-7 h-7 rounded-full bg-[#2a2c33] hover:bg-[#343740] flex items-center justify-center text-slate-300 hover:text-white border border-[#3c3f4a] transition-colors cursor-pointer shadow"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Location Notification Toast */}
        {locationStatusMessage && (
          <div className="mt-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{locationStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Filter / Depart Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141518] border-b border-[#202227] text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 text-[11px] font-medium">Depart Now</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Map Toggle Button */}
          {onToggleMobileMap && (
            <button
              type="button"
              onClick={onToggleMobileMap}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#252830] border border-[#323640] text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <span>🗺️ Show Map</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLiveRadar}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-500/40 text-sky-300 text-xs font-semibold cursor-pointer"
          >
            <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
            <span>Live Bus Radar</span>
          </button>
        </div>
      </div>

      {/* Moovit Arrival Timing Status Legend */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400 px-3 py-1.5 bg-[#16171b] border-b border-[#202227] overflow-x-auto no-scrollbar">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] shrink-0">Moovit Signals:</span>
        <span className="inline-flex items-center gap-1 text-[#00c269] font-bold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c269] animate-pulse"></span>
          Green = Live GPS
        </span>
        <span className="inline-flex items-center gap-1 text-slate-200 font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          White = Scheduled
        </span>
        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Yellow = Delay
        </span>
      </div>

      {/* Route Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {routes.map((route) => (
          <div
            key={route.id}
            onClick={() => onSelectRoute(route.id)}
            className={`rounded-xl p-3.5 transition-all cursor-pointer border ${
              route.isBypass
                ? 'bg-gradient-to-r from-[#17202a] via-[#1a232f] to-[#18191c] border-sky-500/60 shadow-lg shadow-sky-950/30'
                : route.isKtmTrap
                ? 'bg-[#18191c] border-red-500/40 opacity-90'
                : 'bg-[#18191c] hover:bg-[#1f2026] border-[#25262c]'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Left Column: Big Duration & Times */}
              <div className="w-18 shrink-0">
                <div className="text-2xl font-black text-white tracking-tight">
                  {route.totalDurationMinutes}{' '}
                  <span className="text-xs font-normal text-slate-400">mins</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  <span>{route.leaveTime}</span>
                  <div className="text-slate-500 text-[9px]">↓</div>
                  <span>{route.arriveTime}</span>
                </div>
              </div>

              {/* Right Column: Transit Chain & Live Departure Status */}
              <div className="flex-1 min-w-0">
                {/* Visual Transit Badge Chain */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {route.summarySteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      {step.type === 'walk' && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                          <Footprints className="w-3.5 h-3.5 text-slate-400" />
                          <span>{step.minutes ? `${step.minutes}m` : step.label}</span>
                        </span>
                      )}

                      {step.type === 'bus' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white ${
                            step.isGreen ? 'bg-[#0070ba]' : 'bg-[#0284c7]'
                          }`}
                        >
                          <Bus className="w-3 h-3" />
                          <span>{step.label}</span>
                        </span>
                      )}

                      {step.type === 'train' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#dc2626] text-white">
                          <Train className="w-3 h-3" />
                          <span>{step.label}</span>
                        </span>
                      )}

                      {idx < route.summarySteps.length - 1 && (
                        <span className="text-slate-600 text-xs font-bold">›</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Live Departure Text or Delay Warning with Moovit Green (Live GPS), White (Scheduled), Yellow (Delayed) */}
                {route.isKtmTrap ? (
                  <div className="mt-2 text-xs text-amber-300 flex items-start gap-1.5 font-medium bg-amber-950/40 p-2 rounded-lg border border-amber-500/40">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">
                        Next train in <span className="underline decoration-amber-400 font-extrabold">{route.ktmDelayMinutes} min</span> (Yellow = Long Wait).
                      </span>
                      <div className="text-[11px] text-amber-200/80 mt-0.5">
                        Avoid KTM delay! Rapid KL Bus 190 arrives in 2 min (Live GPS) to save 35 min.
                      </div>
                    </div>
                  </div>
                ) : route.departureTimings && route.departureTimings.length > 0 ? (
                  <div className="mt-2 text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400 text-[11px]">Leaves in:</span>
                    {route.departureTimings.map((dep, dIdx) => {
                      if (dep.status === 'live') {
                        return (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-[#00c269] font-bold text-xs shadow-sm"
                            title="Confirmed Live GPS Telemetry: Transponder active on road"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00c269] animate-pulse" />
                            <span>{dep.minutes}m</span>
                            <span className="text-[9px] uppercase font-bold tracking-tight bg-emerald-900/60 px-1 rounded text-emerald-200">
                              Live
                            </span>
                          </span>
                        );
                      }
                      if (dep.status === 'delayed') {
                        return (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-xs shadow-sm"
                            title="Delayed / High headway"
                          >
                            <span>{dep.minutes}m</span>
                            <span className="text-[9px] uppercase font-bold tracking-tight bg-amber-900/60 px-1 rounded text-amber-200">
                              Delay
                            </span>
                          </span>
                        );
                      }
                      // Scheduled Timetable (White text on dark)
                      return (
                        <span
                          key={dIdx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#242731] border border-slate-600/70 text-slate-100 font-semibold text-xs"
                          title="Scheduled Timetable (Unconfirmed until vehicle departs terminal)"
                        >
                          <span>{dep.minutes}m</span>
                          <span className="text-[9px] uppercase font-medium tracking-tight text-slate-400">
                            Sched
                          </span>
                        </span>
                      );
                    })}
                    <span className="text-slate-400 text-[11px] truncate">
                      from {route.departureStopName}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400">
                    <span>Continuous pedestrian connection</span>
                  </div>
                )}

                {/* Smart Tips Pill & Google Maps 1-Tap "Start" Navigation Button */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#282136] text-[#c084fc] text-[10px] font-semibold">
                    <Sparkles className="w-3 h-3 text-[#c084fc]" />
                    <span>{route.isBypass ? '⚡ Fast Shortcut' : 'Smart Tips'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {route.fare}
                    </span>

                    {/* Direct 1-Tap Waze Navigation Start Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartNavigation) {
                          onStartNavigation(route.id);
                        } else {
                          onSelectRoute(route.id);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-[#00c269] hover:bg-[#00ab5c] text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-transform"
                      title="Start Live Waze Navigation on Map"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
