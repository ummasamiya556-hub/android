import React, { useState } from 'react';
import { Station, StationFacilityItem, StationExit, FacilityType } from '../types/transit';

interface StationFacilityModalProps {
  station: Station;
  onClose: () => void;
  onSelectStation?: (stationId: string) => void;
}

export const StationFacilityModal: React.FC<StationFacilityModalProps> = ({
  station,
  onClose,
  onSelectStation,
}) => {
  const layout = station.facilityLayout;
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    layout?.levels[0]?.id || 'concourse'
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'lift' | 'surau' | 'toilet' | 'exit'>('all');
  const [selectedExit, setSelectedExit] = useState<StationExit | null>(
    layout?.exits[0] || null
  );

  const filteredFacilities = (layout?.facilities || []).filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'lift') return f.type === 'lift' || f.type === 'escalator';
    if (activeFilter === 'surau') return f.type === 'surau';
    if (activeFilter === 'toilet') return f.type === 'toilet';
    return true;
  });

  const getFacilityIcon = (type: FacilityType) => {
    switch (type) {
      case 'lift':
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        );
      case 'escalator':
        return (
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'surau':
        return (
          <span className="text-amber-400 text-sm leading-none font-bold">☪</span>
        );
      case 'toilet':
        return (
          <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'tvm':
        return (
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        );
      case 'fare_gates':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="facility-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              {station.code?.slice(0, 4) || 'STN'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="facility-modal-title" className="text-lg font-bold text-slate-100">
                  {station.name}
                </h2>
                <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Facility Blueprint
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-level layout · Lifts, escalators, prayer rooms & street exits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Level Switcher & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {layout?.levels && layout.levels.length > 0 && (
              <div className="flex items-center space-x-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                {layout.levels.map((lvl) => {
                  const isActive = selectedLevelId === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevelId(lvl.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {lvl.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Amenity Filter Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: 'All Items' },
                  { id: 'lift', label: '♿ Lifts & Escalators' },
                  { id: 'surau', label: '☪ Surau (Prayer)' },
                  { id: 'toilet', label: 'Restrooms' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeFilter === f.id
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Blueprint Schematic Board */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Interactive Floor Schematic · Level: {layout?.levels.find((l) => l.id === selectedLevelId)?.name || 'Ground Concourse'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Tactile Paving & OKU Accessible
              </span>
            </div>

            {/* Blueprint Grid Vector Graphic */}
            <div className="relative w-full h-56 sm:h-64 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Subtle architectural background grid */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Station Layout Diagram Tracks & Concourse */}
              <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
                {/* Platform 2 (Top Track) */}
                <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded text-[11px] font-mono text-slate-300">
                  <span>Track 2 · Northbound (Batu Caves / Rawang)</span>
                  <span className="text-amber-400">Platform 2</span>
                </div>

                {/* Footbridge / Concourse Corridor */}
                <div className="h-14 border-y border-dashed border-blue-500/30 bg-blue-950/20 flex items-center justify-around px-4">
                  <div className="text-[10px] font-mono text-blue-300 tracking-wider uppercase">
                    Central Concourse & Elevated Footbridge Corridor
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-mono">
                    <span>♿ Lift Link</span>
                    <span>·</span>
                    <span>Ticket Gates</span>
                  </div>
                </div>

                {/* Platform 1 (Bottom Track) */}
                <div className="flex items-center justify-between bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded text-[11px] font-mono text-blue-200">
                  <span>Track 1 · Southbound (Putra / KL Sentral / Seremban)</span>
                  <span className="text-emerald-400 font-bold">Platform 1 (Step-free Ramp)</span>
                </div>
              </div>

              {/* Interactive Visual Pins for Key Facilities */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 w-full max-w-2xl">
                {filteredFacilities.slice(0, 8).map((facility) => (
                  <div
                    key={facility.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 shadow-md hover:border-blue-500/60 transition-all flex items-start space-x-2 group cursor-default"
                  >
                    <div className="p-1.5 rounded-md bg-slate-800 group-hover:bg-blue-950 transition-colors shrink-0">
                      {getFacilityIcon(facility.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {facility.name}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                        {facility.locationNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Description Note */}
            <p className="text-xs text-slate-400 mt-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{layout?.levels.find((l) => l.id === selectedLevelId)?.description || 'Full station facility directory and street exit links.'}</span>
            </p>
          </div>

          {/* Lettered Exits Directory */}
          {layout?.exits && layout.exits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <span>Lettered Station Exits & Street Landmarks</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Select an exit for feeder bus & walkway connections
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {layout.exits.map((exit) => {
                  const isSelected = selectedExit?.letter === exit.letter;
                  return (
                    <button
                      key={exit.letter}
                      type="button"
                      onClick={() => setSelectedExit(exit)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-950/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                            {exit.letter}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-100">
                              Exit {exit.letter}: {exit.name}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              {exit.accessible ? (
                                <span className="text-emerald-400">♿ Step-free / Lift</span>
                              ) : (
                                <span className="text-slate-500">Stairway access</span>
                              )}
                              <span>·</span>
                              {exit.hasCoveredWalkway ? (
                                <span className="text-blue-400">☂ Covered Walkway</span>
                              ) : (
                                <span className="text-amber-400/80">Open Curb</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Connecting Landmarks */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                        <div className="text-[11px] font-medium text-slate-300">
                          Connecting Destinations:
                        </div>
                        <ul className="text-xs text-slate-400 space-y-0.5">
                          {exit.connectingLandmarks.map((lm, i) => (
                            <li key={i} className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                              <span>{lm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Connecting Transit Feeder */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                        {exit.connectingTransit.map((tr, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded"
                          >
                            {tr}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Commuter Tips & Advice */}
          {layout?.tips && layout.tips.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <span>Platform Navigation & Commuter Advice</span>
              </div>
              <ul className="space-y-1.5">
                {layout.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-blue-400 font-bold shrink-0 mt-0.5">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90">
          <div className="text-xs text-slate-400">
            Rapid KL & KTM official station facility audit
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
