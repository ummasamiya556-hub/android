import React, { useState } from 'react';
import {
  Radio,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bus,
  CheckCircle2,
  Users,
  MapPin,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { CorridorGroup, CorridorDepartureItem } from '../types/transit';
import { DEFAULT_CORRIDOR_GROUPS } from '../data/transitData';

interface MoovitCorridorBoardProps {
  onSelectRoute?: (routeCode: string) => void;
  onOpenLiveRadar?: () => void;
}

export const MoovitCorridorBoard: React.FC<MoovitCorridorBoardProps> = ({
  onSelectRoute,
  onOpenLiveRadar,
}) => {
  const [corridors, setCorridors] = useState<CorridorGroup[]>(DEFAULT_CORRIDOR_GROUPS);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-chowkit-ki52');
  const [expandedDepartures, setExpandedDepartures] = useState<boolean>(true);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const activeCorridor: CorridorGroup =
    corridors.find((c) => c.id === selectedCorridorId) || corridors[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate real-time GPS tick
      setCorridors((prev) =>
        prev.map((c) => ({
          ...c,
          departures: c.departures.map((d) => ({
            ...d,
            minutesAway: Math.max(1, d.minutesAway - 1),
          })),
        }))
      );
      setIsRefreshing(false);
    }, 600);
  };

  const filteredDepartures =
    selectedLineFilter === 'all'
      ? activeCorridor.departures
      : activeCorridor.departures.filter((d) => d.lineCode === selectedLineFilter);

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xl text-slate-100 flex flex-col gap-3">
      {/* Top Header: Moovit Style Live Signal & Station Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                MOOVIT LIVE CORRIDOR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {activeCorridor.stopName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Refresh GPS arrivals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Corridor Selector Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {corridors.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCorridorId(c.id);
              setSelectedLineFilter('all');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              c.id === selectedCorridorId
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {c.stopCode} · {c.corridorName}
          </button>
        ))}
      </div>

      {/* Main Multi-Line Corridor Card (Matching Moovit Screenshot 1 & 2) */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-3">
        {/* Destination & Multi-Line Codes */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Towards Common Destination
            </span>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              {activeCorridor.commonDestination}
            </div>
          </div>

          {activeCorridor.isAccurateArrival && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Arrival time is accurate</span>
            </div>
          )}
        </div>

        {/* Grouped Line Code Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeCorridor.routeCodes.map((code) => (
            <button
              key={code}
              onClick={() => setSelectedLineFilter(selectedLineFilter === code ? 'all' : code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLineFilter === code
                  ? 'bg-white text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              Bus {code}
            </button>
          ))}
          {selectedLineFilter !== 'all' && (
            <button
              onClick={() => setSelectedLineFilter('all')}
              className="text-[11px] text-emerald-400 hover:underline px-1 cursor-pointer"
            >
              Show all
            </button>
          )}
        </div>

        {/* Accurate Countdown Banner: Green (Live GPS) vs White (Scheduled Timetable) */}
        <div className="p-3 rounded-lg bg-[#181a20] border border-[#2a2d36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00c269] animate-pulse" />
            <div>
              <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-normal">Leaves in:</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/60 text-[#00c269] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c269] animate-pulse" />
                  2m Live
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#252830] border border-slate-600 text-white font-semibold">
                  8m Sched
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#252830] border border-slate-600 text-white font-semibold">
                  9m Sched
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Next buses: {activeCorridor.scheduledNextTimes.join(' · ')}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-[#00c269] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 block">
              🟢 GPS Tracked
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              ⚪ Timetable
            </span>
          </div>
        </div>

        {/* Toggle Expand Individual Bus Departures */}
        <div className="pt-1 flex items-center justify-between text-xs">
          <button
            onClick={() => setExpandedDepartures(!expandedDepartures)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
          >
            {expandedDepartures ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide individual departures</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show individual departures & timetables</span>
              </>
            )}
          </button>

          {onOpenLiveRadar && (
            <button
              onClick={onOpenLiveRadar}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
            >
              <span>View live bus radar</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Individual Bus Departures List (Moovit Timetable View) */}
        {expandedDepartures && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            {filteredDepartures.map((dep, idx) => (
              <div
                key={`${dep.lineCode}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: dep.color }}
                  >
                    {dep.lineCode}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {dep.destination}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Sched: {dep.scheduledTime}</span>
                      {dep.vehiclePlate && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-cyan-300">Bus {dep.vehiclePlate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-bold flex items-center justify-end gap-1 ${
                      dep.isGpsConfirmed ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {dep.isGpsConfirmed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span>{dep.minutesAway} min</span>
                  </div>
                  <span className="text-[10px] text-slate-500 capitalize">{dep.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
