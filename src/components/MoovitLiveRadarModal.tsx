import React, { useState } from 'react';
import {
  ArrowLeft,
  Radio,
  Bus,
  Gauge,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  Accessibility,
} from 'lucide-react';
import { DEFAULT_RAPID_PULSE_ROUTES } from '../data/transitData';
import { GeographicRadarMap } from './GeographicRadarMap';

interface MoovitLiveRadarModalProps {
  onBack: () => void;
  initialRouteCode?: string;
}

export const MoovitLiveRadarModal: React.FC<MoovitLiveRadarModalProps> = ({
  onBack,
  initialRouteCode = '190',
}) => {
  const [activeRouteCode, setActiveRouteCode] = useState<string>(initialRouteCode);
  const [selectedPlate, setSelectedPlate] = useState<string>('WVE7352');
  const [viewMode, setViewMode] = useState<'stops' | 'map'>('stops');

  const route =
    DEFAULT_RAPID_PULSE_ROUTES.find((r) => r.routeCode === activeRouteCode) ||
    DEFAULT_RAPID_PULSE_ROUTES[0];

  const selectedBus =
    route.activeBuses.find((b) => b.vehiclePlate === selectedPlate) || route.activeBuses[0];

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white">
      {/* Top Header (Screenshot 4: Rapid Pulse) */}
      <div className="p-3 bg-[#18191c] border-b border-[#25262c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#25262c] cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>RAPID PULSE LIVE RADAR</span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">{route.routeName}</h2>
            </div>
          </div>

          {/* Toggle between Stepper & Map */}
          <div className="flex items-center gap-1 bg-[#202227] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('stops')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'stops' ? 'bg-[#0070ba] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stops
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#0070ba] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Map
            </button>
          </div>
        </div>

        {/* Route Selector */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#25262c] text-xs">
          <span className="text-slate-400">Route:</span>
          {DEFAULT_RAPID_PULSE_ROUTES.map((r) => (
            <button
              key={r.routeCode}
              onClick={() => {
                setActiveRouteCode(r.routeCode);
                setSelectedPlate(r.activeBuses[0]?.vehiclePlate || '');
              }}
              className={`px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                r.routeCode === activeRouteCode
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-[#202227] text-slate-300 hover:text-white'
              }`}
            >
              {r.routeCode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'map' ? (
        <div className="flex-1 relative overflow-hidden bg-slate-950">
          <GeographicRadarMap />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Buses Horizontal Cards (Screenshot 4: WVE7352, WUW8426, WUW1359) */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Active Bus Units on Route {route.routeCode}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {route.activeBuses.map((bus) => {
                const isSelected = bus.vehiclePlate === selectedPlate;
                return (
                  <div
                    key={bus.vehiclePlate}
                    onClick={() => setSelectedPlate(bus.vehiclePlate)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1a2333] border-sky-400 shadow-md shadow-sky-950/40'
                        : 'bg-[#18191c] border-[#25262c] hover:bg-[#202227]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                        <Bus className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span>{bus.vehiclePlate}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#00c269] animate-ping" />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-[#00c269]">
                        {bus.minutesAway} min
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {bus.stopsAwayLabel}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-400" />
                        <span>{bus.speedKmh} km/h</span>
                      </span>
                      {bus.isWheelchairAccessible && (
                        <span title="Wheelchair accessible">
                          <Accessibility className="w-3 h-3 text-sky-400" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Bus Telemetry Card */}
          {selectedBus && (
            <div className="p-3.5 rounded-xl bg-[#18191c] border border-sky-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-sky-300">
                  BUS {selectedBus.vehiclePlate} · {selectedBus.speedKmh} km/h
                </span>
                <span className="text-[#00c269] text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live GPS</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {selectedBus.statusMessage}. Currently near{' '}
                <span className="text-white font-bold">{selectedBus.currentStationName}</span>.
              </p>
            </div>
          )}

          {/* Stop Progression Line (Screenshot 4) */}
          <div className="p-3.5 rounded-xl bg-[#18191c] border border-[#25262c]">
            <span className="text-xs font-semibold text-slate-400 block mb-3">
              Route Stop Progression
            </span>

            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2e3037]">
              {route.orderedStops.map((stop) => (
                <div
                  key={stop.id}
                  className={`relative flex items-center justify-between text-xs ${
                    stop.isCurrentOrNext
                      ? 'text-sky-300 font-bold'
                      : stop.isPassed
                      ? 'text-slate-400'
                      : 'text-slate-200'
                  }`}
                >
                  <div
                    className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                      stop.isCurrentOrNext
                        ? 'bg-sky-500 border-white ring-4 ring-sky-500/20'
                        : stop.isPassed
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-[#18191c] border-slate-600'
                    }`}
                  />

                  <span>{stop.name}</span>

                  {stop.isCurrentOrNext && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] font-bold text-[#00c269] flex items-center gap-1">
                      <Bus className="w-3 h-3" />
                      <span>{selectedBus.vehiclePlate} Arriving</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
