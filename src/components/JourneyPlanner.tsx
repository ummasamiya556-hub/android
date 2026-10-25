import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { ALL_STATIONS, STATIONS_BY_ID } from '../data/transitData';
import { RouteItinerary, TransitAgency } from '../types/transit';
import { FarePassSelector } from './FarePassSelector';
import { DisruptionBypassBanner } from './DisruptionBypassBanner';
import { CrowdDensityIndicator } from './CrowdDensityIndicator';
import { KtmSegambutTrapAlert } from './KtmSegambutTrapAlert';
import {
  ArrowUpDown,
  Navigation,
  Clock,
  CircleDollarSign,
  Zap,
  Bus,
  Train,
  Footprints,
  CheckCircle2,
  AlertCircle,
  Radio,
  ChevronRight,
  Sparkles,
  MapPin,
  AlertTriangle,
  Compass,
  ShieldAlert,
  Umbrella,
  Layers,
} from 'lucide-react';

const QUICK_COMMUTES = [
  {
    from: 'Segambut KTM',
    to: 'Putra (Bus 190 Bypass)',
    origin: 'segambut_station',
    dest: 'putra_ktm',
    badge: '⚡ Avoid 40m Wait',
    highlight: 'Walk 3m to Bus 190 (RM1.00) vs 42 min KTM wait',
  },
  {
    from: '8 Jln Ipoh Kecil',
    to: 'Chow Kit Utara (KI52)',
    origin: 'jalan_ipoh_kecil',
    dest: 'chow_kit_utara',
    badge: 'Moovit Corridor',
    highlight: 'Buses 180 / 171 / 173 leave in 2, 8, 9 min',
  },
  {
    from: 'MITEC',
    to: 'PWTC / Putra Court',
    origin: 'mitec_matrade',
    dest: 'putra_court',
    badge: 'Go KL 13 Free',
    highlight: 'Go KL Magenta Line (Free) + Bus 190',
  },
  {
    from: 'SMK Segambut',
    to: 'PWTC LRT',
    origin: 'smk_segambut',
    dest: 'pwtc_lrt',
    badge: 'Bus 190 Curb',
    highlight: 'Same side of road, no street crossing needed',
  },
];

export const JourneyPlanner: React.FC = () => {
  const {
    originStationId,
    destStationId,
    setOriginStationId,
    setDestStationId,
    swapOriginDest,
    itineraries,
    selectedItineraryId,
    setSelectedItineraryId,
    startJourney,
    setSelectedStationId,
    isJourneyActive,
    setViewMode,
    commuterPass,
    setCommuterPass,
    isDisruptionActive,
    toggleDisruption,
    activeDisruptionAlert,
    applyDisruptionBypass,
    openFacilityModal,
  } = useTransit();

  const [activeFilter, setActiveFilter] = useState<'all' | 'gokl' | 'rapidkl' | 'rail'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter itineraries based on selected transit mode
  const filteredItineraries = itineraries.filter((it) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'gokl') return it.legs.some((l) => l.isGoKL);
    if (activeFilter === 'rapidkl') return it.legs.some((l) => l.mode === 'rapidkl');
    if (activeFilter === 'rail') return it.legs.some((l) => l.mode === 'rail');
    return true;
  });

  const renderSourceBadge = (source: TransitAgency) => {
    switch (source) {
      case 'moovit':
        return (
          <span
            key="moovit"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Moovit Live
          </span>
        );
      case 'rapid_pulse':
        return (
          <span
            key="pulse"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30"
          >
            <Radio className="w-2.5 h-2.5 text-sky-400" />
            Rapid Pulse
          </span>
        );
      case 'google':
        return (
          <span
            key="google"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
          >
            Google Maps
          </span>
        );
      case 'gokl':
        return (
          <span
            key="gokl"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/30"
          >
            Go KL Free
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 overflow-y-auto">
      {/* Route Selector Card */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">
              Trip Navigation Planner
            </h2>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Deduplicated
          </span>
        </div>

        {/* Inputs */}
        <div className="space-y-2 relative">
          {/* Origin */}
          <div className="flex items-center gap-2 bg-slate-950/80 rounded-lg p-2 border border-slate-800 focus-within:border-emerald-500/50 transition-colors">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-500/20" />
            <div className="flex-1 min-w-0">
              <label htmlFor="origin-select" className="text-[10px] font-semibold text-slate-400 block uppercase">
                Origin / Starting Point
              </label>
              <select
                id="origin-select"
                value={originStationId}
                onChange={(e) => setOriginStationId(e.target.value)}
                className="w-full bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer truncate"
              >
                {ALL_STATIONS.map((s) => (
                  <option key={`orig-${s.id}`} value={s.id} className="bg-slate-900 text-white">
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="absolute right-3 top-[32px] z-10">
            <button
              onClick={swapOriginDest}
              aria-label="Swap origin and destination"
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow transition-colors"
              title="Swap Origin and Destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-2 bg-slate-950/80 rounded-lg p-2 border border-slate-800 focus-within:border-pink-500/50 transition-colors">
            <div className="w-3 h-3 rounded-full bg-pink-500 shrink-0 ring-4 ring-pink-500/20" />
            <div className="flex-1 min-w-0">
              <label htmlFor="dest-select" className="text-[10px] font-semibold text-slate-400 block uppercase">
                Destination Station / Venue
              </label>
              <select
                id="dest-select"
                value={destStationId}
                onChange={(e) => setDestStationId(e.target.value)}
                className="w-full bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer truncate"
              >
                {ALL_STATIONS.map((s) => (
                  <option key={`dest-${s.id}`} value={s.id} className="bg-slate-900 text-white">
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Station Blueprint Quick Actions */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => openFacilityModal(originStationId)}
            className="flex-1 py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3 h-3 text-blue-400" />
            <span className="truncate">Origin Facility Blueprint</span>
          </button>
          <button
            type="button"
            onClick={() => openFacilityModal(destStationId)}
            className="flex-1 py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3 h-3 text-pink-400" />
            <span className="truncate">Dest Facility Blueprint</span>
          </button>
        </div>

        {/* Commuter Fare Category Selector */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <FarePassSelector
            currentPass={commuterPass}
            onPassChange={setCommuterPass}
            fareBreakdown={itineraries[0]?.fares}
          />
        </div>

        {/* Proactive Headway Trap Alert for KTM Segambut */}
        <div className="mt-3">
          <KtmSegambutTrapAlert />
        </div>

        {/* Live Disruption Simulator & Bypass Routing */}
        <div className="mt-3">
          <DisruptionBypassBanner
            alert={activeDisruptionAlert}
            isDisruptionActive={isDisruptionActive}
            onToggleDisruption={toggleDisruption}
            onApplyBypassRoute={applyDisruptionBypass}
          />
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Unified ({itineraries.length})
          </button>
          <button
            onClick={() => setActiveFilter('gokl')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'gokl'
                ? 'bg-pink-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Go KL City Bus
          </button>
          <button
            onClick={() => setActiveFilter('rapidkl')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'rapidkl'
                ? 'bg-sky-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Rapid KL Bus
          </button>
          <button
            onClick={() => setActiveFilter('rail')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'rail'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            LRT / MRT / Rail
          </button>
        </div>
      </div>

      {/* Itinerary Results List */}
      <div className="p-4 space-y-3 flex-1">
        {filteredItineraries.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">No direct line for this filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Switch filter to "All Unified" or try nearby interchange connections.
            </p>
          </div>
        ) : (
          filteredItineraries.map((it, idx) => {
            const isSelected = it.id === selectedItineraryId;
            const hasGpsConfirmed = it.legs.some((l) => l.isGpsConfirmed);
            const hasGoKL = it.legs.some((l) => l.isGoKL);

            return (
              <div
                key={it.id}
                onClick={() => setSelectedItineraryId(it.id)}
                className={`relative rounded-xl p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Top Row: Duration, Fare, Recommended / Bypass Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-white tracking-tight">
                      {it.totalDurationMinutes}
                      <span className="text-xs font-normal text-slate-400 ml-0.5">min</span>
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-medium">
                      {it.totalDistanceKm} km
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    {it.fares ? (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                        {commuterPass === 'my50'
                          ? 'RM 0.00 (My50)'
                          : commuterPass === 'concession'
                          ? `RM ${it.fares.concessionRm.toFixed(2)}`
                          : `RM ${it.fares.tngRm.toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {it.totalFare}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {it.isBypassRoute && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                        ⚡ Bypass Route
                      </span>
                    )}
                    {it.isRecommended && !it.isBypassRoute && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                        <Sparkles className="w-3 h-3" />
                        Top Choice
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-header: Sources merged */}
                <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Sources merged:</span>
                  {it.sources.map((s) => renderSourceBadge(s))}
                  {hasGpsConfirmed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Confirmed Live GPS
                    </span>
                  )}
                </div>

                {/* Route Visual Timeline / Line badges */}
                <div className="flex items-center gap-1.5 py-1 mb-2.5 overflow-x-auto">
                  {it.legs.map((leg, legIdx) => (
                    <React.Fragment key={leg.id}>
                      {legIdx > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      {leg.mode === 'walk' ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 shrink-0">
                          <Footprints className="w-3 h-3 text-slate-400" />
                          <span>{leg.durationMinutes}m walk</span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: leg.color }}
                        >
                          {leg.mode === 'rail' ? (
                            <Train className="w-3.5 h-3.5" />
                          ) : (
                            <Bus className="w-3.5 h-3.5" />
                          )}
                          <span>{leg.lineCode}</span>
                          <span className="text-[10px] font-normal opacity-90">
                            ({leg.stopCount} stops)
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Long Wait Alert (e.g. KTM 40+ min headway warning) */}
                {it.longWaitAlert && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 block font-bold">40+ Min Wait Detected:</strong>
                      <span>{it.longWaitAlert}</span>
                    </div>
                  </div>
                )}

                {/* Platform Direction Guidance Alert */}
                {it.platformAlert && (
                  <div className="mb-2.5 p-2 rounded-lg bg-slate-900 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-start gap-2">
                    <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Which Side to Stand:</strong>
                      <span>{it.platformAlert}</span>
                    </div>
                  </div>
                )}

                {/* Covered Walkway Shelter Badge */}
                {it.coveredWalkwaySummary && (
                  <div className="mb-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                      <Umbrella className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate text-[11px]">{it.coveredWalkwaySummary.shelterDescription}</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        it.coveredWalkwaySummary.rainShieldStatus === 'full'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : it.coveredWalkwaySummary.rainShieldStatus === 'partial'
                          ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      {it.coveredWalkwaySummary.coveredPercentage}% Rain Shield
                    </span>
                  </div>
                )}

                {/* Live Crowd Density Indicator */}
                {it.crowdDensity && (
                  <div className="mb-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>{it.crowdDensity.peakLabel}</span>
                    </span>
                    <CrowdDensityIndicator density={it.crowdDensity} compact />
                  </div>
                )}

                {/* Walking Street Orientation Guidance */}
                {it.legs.some((l) => l.walkingOrientation) && (
                  <div className="mb-2.5 space-y-1.5">
                    {it.legs
                      .filter((l) => l.walkingOrientation)
                      .map((l) => (
                        <div
                          key={`walk-guide-${l.id}`}
                          className="p-2 rounded-lg bg-sky-950/50 border border-sky-500/40 text-xs text-sky-200"
                        >
                          <div className="font-bold flex items-center gap-1.5 text-sky-300">
                            <Navigation className="w-3.5 h-3.5 text-sky-400" />
                            <span>{l.walkingOrientation!.targetLineOrBus}: {l.walkingOrientation!.compassHeading}</span>
                          </div>
                          <div className="text-[11px] text-sky-100 font-semibold mt-0.5">
                            🛣️ Road Side: {l.walkingOrientation!.whichSideOfRoad}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Highlights */}
                <div className="space-y-1 mb-3 text-xs text-slate-300">
                  {it.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    {it.transferCount === 0 ? 'Direct ride' : `${it.transferCount} transfer`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItineraryId(it.id);
                        startJourney(it);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-950/40"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Journey</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
