import React, { useState } from 'react';
import {
  Radio,
  Bus,
  Gauge,
  Navigation,
  CheckCircle2,
  Clock,
  ArrowRight,
  Accessibility,
  Users,
  MapPin,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { RapidPulseFleetUnit, RapidPulseRouteProgression } from '../types/transit';
import { DEFAULT_RAPID_PULSE_ROUTES } from '../data/transitData';

interface RapidPulseFleetTrackerProps {
  initialRouteCode?: string;
  onSelectBusUnit?: (unit: RapidPulseFleetUnit) => void;
  onFocusStation?: (stationId: string) => void;
}

export const RapidPulseFleetTracker: React.FC<RapidPulseFleetTrackerProps> = ({
  initialRouteCode = '190',
  onSelectBusUnit,
  onFocusStation,
}) => {
  const [routes] = useState<RapidPulseRouteProgression[]>(DEFAULT_RAPID_PULSE_ROUTES);
  const [activeRouteCode, setActiveRouteCode] = useState<string>(initialRouteCode);
  const [selectedPlate, setSelectedPlate] = useState<string>('WVE7352');

  const activeRoute =
    routes.find((r) => r.routeCode === activeRouteCode) || routes[0];

  const selectedBus =
    activeRoute.activeBuses.find((b) => b.vehiclePlate === selectedPlate) ||
    activeRoute.activeBuses[0];

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xl text-slate-100 flex flex-col gap-3">
      {/* Rapid Pulse Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Radio className="w-4 h-4 animate-pulse text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                RAPID PULSE LIVE RADAR
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-[10px] font-mono text-sky-300">
                FLEET TRACK
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {activeRoute.routeName}
            </h3>
          </div>
        </div>

        {/* Route Selector Buttons */}
        <div className="flex items-center gap-1">
          {routes.map((r) => (
            <button
              key={r.routeCode}
              onClick={() => {
                setActiveRouteCode(r.routeCode);
                setSelectedPlate(r.activeBuses[0]?.vehiclePlate || '');
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                r.routeCode === activeRouteCode
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Route {r.routeCode}
            </button>
          ))}
        </div>
      </div>

      {/* Terminus Range Banner */}
      <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <span className="text-sky-400 font-bold">{activeRoute.originTerminus}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-100 font-bold truncate">{activeRoute.destTerminus}</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
          {activeRoute.activeBuses.length} Active Buses
        </span>
      </div>

      {/* Active Bus Fleet Units Grid (Screenshot 4: WVE7352, WUW8426, WUW1359) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {activeRoute.activeBuses.map((bus) => {
          const isSelected = bus.vehiclePlate === selectedPlate;
          return (
            <button
              key={bus.vehiclePlate}
              onClick={() => {
                setSelectedPlate(bus.vehiclePlate);
                if (onSelectBusUnit) onSelectBusUnit(bus);
              }}
              className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400/50 shadow-lg shadow-sky-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bus className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="font-mono text-xs font-bold text-white">
                    {bus.vehiclePlate}
                  </span>
                </div>
                {bus.isGpsLive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-sm font-black text-emerald-300 tabular-nums">
                  {bus.minutesAway} min
                </span>
                <span className="text-[10px] font-semibold text-slate-400 truncate">
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
            </button>
          );
        })}
      </div>

      {/* Selected Bus Live Telemetry Banner */}
      {selectedBus && (
        <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-black font-mono text-[11px]">
                BUS {selectedBus.vehiclePlate}
              </span>
              <span className="font-semibold text-slate-200">
                {selectedBus.currentStationName}
              </span>
            </div>

            <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live GPS Broadcast</span>
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {selectedBus.statusMessage} · Last passed <span className="font-semibold text-white">{selectedBus.lastPassedStationName}</span>.
          </p>

          {/* Progress bar across line */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${selectedBus.lineProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Linear Station Progression Stepper (Tracking line from starting station) */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
          Route Station Progression & Bus Position
        </span>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {activeRoute.orderedStops.map((stop, idx) => {
            const isTargetStop = stop.id === 'smk_segambut' || stop.id === 'chow_kit_utara' || stop.id === 'damai_hospital';
            return (
              <div
                key={stop.id}
                onClick={() => {
                  if (onFocusStation) onFocusStation(stop.id);
                }}
                className={`relative flex items-center justify-between text-xs cursor-pointer group ${
                  stop.isCurrentOrNext
                    ? 'text-sky-300 font-bold'
                    : stop.isPassed
                    ? 'text-slate-400'
                    : 'text-slate-200'
                }`}
              >
                {/* Node indicator */}
                <div
                  className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    stop.isCurrentOrNext
                      ? 'bg-sky-500 border-white ring-4 ring-sky-500/30'
                      : stop.isPassed
                      ? 'bg-slate-700 border-slate-600'
                      : 'bg-slate-950 border-slate-600 group-hover:border-slate-400'
                  }`}
                />

                <div className="flex items-center gap-2">
                  <span className="truncate group-hover:text-white transition-colors">
                    {stop.name}
                  </span>
                  {stop.code && (
                    <span className="text-[10px] font-mono text-slate-500">
                      ({stop.code})
                    </span>
                  )}
                  {isTargetStop && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-[9px] font-bold text-amber-300">
                      Interchange
                    </span>
                  )}
                </div>

                {stop.isCurrentOrNext && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <Bus className="w-3 h-3 text-emerald-400 animate-bounce" />
                    <span>WVE7352 Here (2 min)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
