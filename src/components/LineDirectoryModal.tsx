import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { ALL_LINES, STATIONS_BY_ID } from '../data/transitData';
import { TransitMode } from '../types/transit';
import {
  X,
  Search,
  Bus,
  Train,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Layers,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface LineDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineDirectoryModal: React.FC<LineDirectoryModalProps> = ({ isOpen, onClose }) => {
  const { setSelectedLineId, setViewMode, fleet } = useTransit();
  const [tab, setTab] = useState<'all' | 'gokl' | 'rapidkl' | 'rail'>('gokl');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLines = ALL_LINES.filter((line) => {
    if (tab === 'gokl' && !line.isGoKL) return false;
    if (tab === 'rapidkl' && (line.mode !== 'rapidkl' || line.isGoKL)) return false;
    if (tab === 'rail' && line.mode !== 'rail') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        line.name.toLowerCase().includes(q) ||
        line.code.toLowerCase().includes(q) ||
        line.stations.some((sid) => STATIONS_BY_ID.get(sid)?.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Klang Valley Transit Directory
              </h2>
              <p className="text-xs text-slate-400">
                15 Free Go KL City Bus Lines • Rapid KL Bus Trunk Network • Integrated Rail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setTab('gokl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === 'gokl'
                  ? 'bg-pink-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Go KL City Bus (15 Lines)
            </button>
            <button
              onClick={() => setTab('rapidkl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === 'rapidkl'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Rapid KL Buses
            </button>
            <button
              onClick={() => setTab('rail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === 'rail'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Rail Network
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Lines ({ALL_LINES.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search line name, code, or stop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Line Cards Grid */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredLines.map((line) => {
            const lineVehicles = fleet.filter((v) => v.lineId === line.id);

            return (
              <div
                key={line.id}
                onClick={() => {
                  setSelectedLineId(line.id);
                  setViewMode('schematic');
                  onClose();
                }}
                className="group rounded-xl p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.code}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {line.name}
                      </h3>
                      {line.isGoKL && (
                        <span className="text-[10px] text-pink-400 font-semibold">
                          Free for Citizens • Rapid KL Operated • Moovit Exclusive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      {lineVehicles.length} Active Radar
                    </span>
                    <button className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-white transition-colors">
                      <span>View Diagram</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs text-slate-300 mb-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Operating Hours
                    </span>
                    <span>{line.operatingHours}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Headway
                    </span>
                    <span>Every {line.headwayMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Standard Fare
                    </span>
                    <span className="text-emerald-400 font-semibold">{line.fare}</span>
                  </div>
                </div>

                {/* Stop sequence pill preview */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 no-scrollbar">
                  <span className="shrink-0 text-slate-500">Route:</span>
                  {line.stations.map((sid, idx) => {
                    const st = STATIONS_BY_ID.get(sid);
                    return (
                      <React.Fragment key={sid}>
                        {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-500 shrink-0 inline" />}
                        <span className="shrink-0 text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {st?.shortName || st?.name || sid}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
