import React, { useMemo } from 'react';
import { useTransit } from '../context/TransitContext';
import { ALL_LINES, LINES_BY_ID, STATIONS_BY_ID } from '../data/transitData';
import {
  Train,
  Bus,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SchematicLineDiagram: React.FC = () => {
  const {
    selectedLineId,
    setSelectedLineId,
    selectedStationId,
    setSelectedStationId,
    selectedItinerary,
    isJourneyActive,
    currentLegIndex,
    passedStationIds,
    fleet,
  } = useTransit();

  // Either use the active journey line or the currently inspected line
  const activeLineId = useMemo(() => {
    if (isJourneyActive && selectedItinerary) {
      // Prioritize current leg's transit line, or any transit leg if walking
      const currentLegLine = selectedItinerary.legs[currentLegIndex]?.lineId;
      if (currentLegLine) return currentLegLine;
      const anyTransitLeg = selectedItinerary.legs.find((l) => l.lineId);
      if (anyTransitLeg?.lineId) return anyTransitLeg.lineId;
    }
    return selectedLineId;
  }, [isJourneyActive, selectedItinerary, currentLegIndex, selectedLineId]);

  const line = useMemo(() => LINES_BY_ID.get(activeLineId) || ALL_LINES[0], [activeLineId]);

  // Find active vehicles on this line
  const lineVehicles = useMemo(() => {
    return fleet.filter((v) => v.lineId === line.id);
  }, [fleet, line.id]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 md:p-6">
      {/* Line Selector & Metadata Header */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
              style={{ backgroundColor: line.color }}
            >
              {line.mode === 'rail' ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {line.isGoKL ? 'Go KL Free City Bus' : line.mode === 'rail' ? 'Rail Transit' : 'Rapid KL Bus'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Moovit Confirmed
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug break-words">
                {line.name}
              </h2>
            </div>
          </div>

          {/* Quick Line Picker Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <label htmlFor="schematic-line-select" className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Line:
            </label>
            <select
              id="schematic-line-select"
              value={activeLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 max-w-[210px] sm:max-w-[240px] truncate"
            >
              <optgroup label="Go KL City Buses (Free)">
                {ALL_LINES.filter((l) => l.isGoKL).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Rapid KL Buses">
                {ALL_LINES.filter((l) => l.mode === 'rapidkl').map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Integrated Rail (LRT/MRT/Monorail)">
                {ALL_LINES.filter((l) => l.mode === 'rail').map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Line Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Frequency</span>
            <span className="text-white font-medium">Every {line.headwayMinutes} mins</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hours</span>
            <span className="text-white font-medium">{line.operatingHours}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fare</span>
            <span className="text-emerald-400 font-semibold">{line.fare}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Fleet</span>
            <span className="text-sky-400 font-medium">{lineVehicles.length} Vehicles Live</span>
          </div>
        </div>
      </div>

      {/* Schematic Linear Strip (Subway Style) */}
      <div className="relative max-w-3xl mx-auto w-full py-4 px-2">
        {/* Continuous Track Bar */}
        <div
          className="absolute left-[29px] top-8 bottom-8 w-2 rounded-full"
          style={{ backgroundColor: line.color }}
        />

        {/* Stations Sequence */}
        <div className="space-y-6 relative z-10">
          {line.stations.map((stationId, idx) => {
            const station = STATIONS_BY_ID.get(stationId);
            const isSelected = stationId === selectedStationId;
            const isPassed = isJourneyActive && passedStationIds.has(stationId);

            // Check if there is a vehicle between this station and the next
            const activeVehicleHere = lineVehicles.find(
              (v) => v.currentStationId === stationId
            );

            // Connecting lines at this station
            const connectingLines = (station?.lines || [])
              .filter((lid) => lid !== line.id)
              .map((lid) => LINES_BY_ID.get(lid))
              .filter(Boolean);

            return (
              <div
                key={stationId}
                onClick={() => setSelectedStationId(stationId)}
                className="flex items-start gap-4 group cursor-pointer"
              >
                {/* Station Node Marker */}
                <div className="relative shrink-0 flex items-center justify-center w-[20px] ml-[20px]">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-slate-700 text-slate-400 ring-2 ring-slate-600' // Passed station in grey
                        : isSelected
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/40 shadow-lg shadow-emerald-500/50'
                        : 'bg-slate-950 text-white ring-2 ring-white/80 group-hover:ring-emerald-400'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>
                </div>

                {/* Station Details Card */}
                <div
                  className={`flex-1 rounded-xl p-3 border transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/60 shadow-md'
                      : isPassed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isPassed
                            ? 'text-slate-400 line-through'
                            : isSelected
                            ? 'text-emerald-300'
                            : 'text-white'
                        }`}
                      >
                        {station?.name}
                      </h4>
                      {station?.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {station.code}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Est. arrival in ~{idx * 3 + 2} min
                    </div>
                  </div>

                  {/* Connecting Interchanges */}
                  {connectingLines.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 mt-2">
                      <span className="text-[10px] text-slate-400 mr-1">Interchange with:</span>
                      {connectingLines.map((conn) => (
                        <span
                          key={conn!.id}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-xs"
                          style={{ backgroundColor: conn!.color }}
                        >
                          {conn!.code}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Live Vehicle Indicator if approaching or at this stop */}
                  {activeVehicleHere && (
                    <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-semibold">{activeVehicleHere.vehicleNumber}</span>
                      <span className="text-slate-400">•</span>
                      <span>Approaching ({activeVehicleHere.speedKmh} km/h)</span>
                      <span className="ml-auto text-[10px] font-mono text-emerald-400 font-bold">
                        Moovit Confirmed GPS
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
