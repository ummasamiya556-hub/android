import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { ALL_STATIONS, LINES_BY_ID, STATIONS_BY_ID } from '../data/transitData';
import { findNearbyStations } from '../utils/transitGraph';
import {
  Clock,
  Radio,
  MapPin,
  Bus,
  Train,
  Footprints,
  Sparkles,
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { CrowdDensityIndicator } from './CrowdDensityIndicator';

export const StationDepartureBoard: React.FC = () => {
  const {
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    selectedStationDepartures,
    setOriginStationId,
    setDestStationId,
    setSelectedLineId,
    setViewMode,
    setMobileTab,
    openFacilityModal,
    commuterPass,
  } = useTransit();

  const [activePlatformTab, setActivePlatformTab] = useState<string | null>(null);
  const [showWalkingGuide, setShowWalkingGuide] = useState<boolean>(true);

  if (!selectedStation) return null;

  const nearby = findNearbyStations(selectedStation.id, 0.45);
  const hasPlatforms = selectedStation.platforms && selectedStation.platforms.length > 0;
  const hasWalkingGuides = selectedStation.walkingGuides && selectedStation.walkingGuides.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto">
      {/* Header Station Info */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Station Inspector & Departures</span>
          </div>
          {selectedStation.code && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {selectedStation.code}
            </span>
          )}
        </div>

        <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
          {selectedStation.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Zone: {selectedStation.zone || 'Klang Valley'}</span>
          {selectedStation.isInterchange && (
            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
              Major Interchange
            </span>
          )}
        </p>

        {/* Quick Origin / Dest Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setOriginStationId(selectedStation.id)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors text-center"
          >
            Set as Origin
          </button>
          <button
            onClick={() => setDestStationId(selectedStation.id)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-pink-950/60 hover:bg-pink-900/60 text-pink-300 border border-pink-500/40 text-xs font-medium transition-colors text-center"
          >
            Set as Destination
          </button>
        </div>

        <button
          onClick={() => openFacilityModal(selectedStation.id)}
          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>View Station Facility Blueprint & Exits</span>
        </button>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* ========================================================================= */}
        {/* WHICH SIDE TO STAND? (PLATFORM & TRACK DIRECTION GUIDE)                   */}
        {/* ========================================================================= */}
        {hasPlatforms && (
          <div className="rounded-xl p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Which Platform / Which Side to Stand?</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-500/30">
                Track Guide
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-2.5">
              Select your travel direction to know exactly which track to wait on:
            </p>

            <div className="space-y-2">
              {selectedStation.platforms!.map((plat) => {
                const isSelected = activePlatformTab === plat.platformNumber || (!activePlatformTab && plat.headingDirection === 'southbound');
                const isSouthbound = plat.headingDirection === 'southbound';

                return (
                  <div
                    key={plat.platformNumber}
                    onClick={() => setActivePlatformTab(plat.platformNumber)}
                    className={`rounded-lg p-2.5 border transition-all cursor-pointer ${
                      isSelected
                        ? isSouthbound
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-100 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-sky-950/50 border-sky-500/70 text-sky-100 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {plat.platformNumber}
                        </span>
                        <span>{plat.sideName}</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {plat.headingDirection.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] mt-1 space-y-1">
                      <div className="text-slate-300">
                        <strong className="text-amber-300">Destinations: </strong>
                        {plat.destinations.join(' • ')}
                      </div>
                      <div className="text-emerald-300 font-medium bg-slate-950/70 p-1.5 rounded border border-slate-800/80 mt-1">
                        {plat.tips}
                      </div>
                      {plat.landmarkReference && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{plat.landmarkReference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STREET & WALKING ORIENTATION GUIDE (e.g. SMK Segambut / Stop Transfers)   */}
        {/* ========================================================================= */}
        {hasWalkingGuides && (
          <div className="rounded-xl p-3.5 bg-slate-950/80 border border-sky-500/40 shadow-md">
            <button
              onClick={() => setShowWalkingGuide((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Street & Walking Direction Guide
                </span>
              </div>
              {showWalkingGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showWalkingGuide && (
              <div className="mt-3 space-y-3 pt-2 border-t border-slate-800">
                {selectedStation.walkingGuides!.map((guide, idx) => (
                  <div key={idx} className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex items-center justify-between gap-2 mb-1.5">
                      <span>{guide.toLocation}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {guide.walkingDistanceMeters}m ({guide.walkMinutes} min walk)
                      </span>
                    </div>

                    <div className="bg-sky-950/50 text-sky-200 p-2 rounded border border-sky-500/30 mb-2">
                      <div className="font-semibold flex items-center gap-1 text-[11px] text-sky-300">
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span>Direction: {guide.compassHeading}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-sky-100 font-bold">
                        🛣️ Road Side: {guide.whichSideOfRoad}
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      <span className="font-semibold text-slate-400 block mb-0.5">Step-by-Step Directions:</span>
                      {guide.stepByStep.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-mono font-bold shrink-0">{sIdx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    {guide.landmarks.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-500">Landmarks:</span>
                        {guide.landmarks.map((lm, lIdx) => (
                          <span key={lIdx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {lm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Station Crowd Density Meter */}
        <CrowdDensityIndicator stationName={selectedStation.name} />

        {/* ========================================================================= */}
        {/* LIVE DEPARTURES BOARD                                                     */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Upcoming Departures</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Moovit GPS Confirmed
            </span>
          </div>

          {selectedStationDepartures.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
              No live departures scheduled in the next 30 minutes.
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedStationDepartures.map((dep, i) => {
                return (
                  <div
                    key={`${dep.lineId}-${i}`}
                    onClick={() => {
                      setSelectedLineId(dep.lineId);
                    }}
                    className={`group rounded-xl p-3 border transition-all cursor-pointer ${
                      dep.isLongWaitWarning
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: dep.color }}
                        >
                          {dep.lineCode}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">
                          {dep.destination}
                        </span>
                      </div>

                      {/* Minutes Countdown */}
                      <div className="text-right">
                        <span
                          className={`text-sm font-extrabold font-mono ${
                            dep.isLongWaitWarning ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {dep.minutesAway} min
                        </span>
                      </div>
                    </div>

                    {/* Sub details: Platform / Bay & Fare & Crowd */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dep.platform && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">
                            {dep.platform}
                          </span>
                        )}
                        {dep.bay && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {dep.bay}
                          </span>
                        )}
                        <span className="text-emerald-400 font-semibold font-mono">
                          {commuterPass === 'my50'
                            ? 'RM 0.00 (My50)'
                            : commuterPass === 'concession' && dep.fareRm
                            ? `RM ${(dep.fareRm * 0.5).toFixed(2)}`
                            : dep.fareRm !== undefined
                            ? dep.fareRm === 0
                              ? 'FREE'
                              : `RM ${dep.fareRm.toFixed(2)}`
                            : 'RM 1.00'}
                        </span>
                        {dep.crowdLevel && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              dep.crowdLevel === 'packed'
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                : dep.crowdLevel === 'moderate'
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            }`}
                          >
                            {dep.crowdLevel === 'packed'
                              ? 'Packed'
                              : dep.crowdLevel === 'moderate'
                              ? 'Moderate'
                              : 'Low Load'}
                          </span>
                        )}
                      </div>

                      {dep.isGpsConfirmed && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Moovit GPS
                        </span>
                      )}
                    </div>

                    {/* Long Wait Warning & Faster Alternative Suggestion Card */}
                    {dep.isLongWaitWarning && dep.alternativeSuggestion && (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-950/60 border border-amber-500/50 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>40+ Min KTM Wait Detected!</span>
                        </div>
                        <p className="text-[11px] text-amber-200 leading-snug">
                          {dep.alternativeSuggestion.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-amber-500/30">
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Arrives in {dep.alternativeSuggestion.minutesAway} min • {dep.alternativeSuggestion.fare}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLineId('bus-190');
                              setViewMode('geographic');
                              setMobileTab('radar');
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors"
                          >
                            Track Bus 190 on Radar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nearby Station Interchanges */}
        {nearby.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-slate-400" />
              <span>Walk-to Interchanges (&lt; 450m)</span>
            </h4>
            <div className="space-y-1.5">
              {nearby.map((n) => (
                <div
                  key={n.station.id}
                  onClick={() => setSelectedStationId(n.station.id)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {n.station.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {n.walkMinutes} min walk ({Math.round(n.distanceKm * 1000)}m)
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.station.lines.slice(0, 2).map((lid) => {
                      const l = LINES_BY_ID.get(lid);
                      if (!l) return null;
                      return (
                        <span
                          key={lid}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: l.color }}
                        >
                          {l.code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
