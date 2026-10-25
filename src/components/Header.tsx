import React from 'react';
import { useTransit } from '../context/TransitContext';
import {
  Compass,
  Radio,
  MapPin,
  GitBranch,
  Layers,
  Sparkles,
  Bus,
  Train,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  onOpenDirectory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDirectory }) => {
  const {
    viewMode,
    setViewMode,
    fleet,
    radarScanActive,
    setRadarScanActive,
    filterMode,
    setFilterMode,
    isJourneyActive,
    isAiEnabled,
    isAiChatOpen,
    setIsAiChatOpen,
    toggleAi,
  } = useTransit();

  const activeVehiclesCount = fleet.length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shrink-0 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Sync Badges */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 shadow-md shadow-emerald-950/40">
            <Compass className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-2">
                Klang Valley Transit
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Unified Navigator
                </span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Moovit Confirmed GPS
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                <Radio className="w-3 h-3 text-sky-400" />
                Rapid Pulse Radar
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-pink-400 font-medium">
                <Bus className="w-3 h-3 text-pink-400" />
                15 Go KL Lines
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <Train className="w-3 h-3 text-amber-400" />
                Full Rail
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Mode View Switcher (Geographic Radar vs Schematic Strip) */}
          <div className="inline-flex p-1 bg-slate-800/90 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setViewMode('geographic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'geographic'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Geographic Live Radar Map with moving buses & trains"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Radar Map</span>
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'schematic'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tokyo/London Subway style schematic diagram with grey tracking"
            >
              <GitBranch className="w-3.5 h-3.5 text-sky-400" />
              <span>Line Diagram</span>
            </button>
          </div>

          {/* Radar Sweep Toggle */}
          <button
            onClick={() => setRadarScanActive((prev) => !prev)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              radarScanActive
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle radar scan sweep effect"
          >
            <span className={`w-2 h-2 rounded-full ${radarScanActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>Radar Sweep</span>
          </button>

          {/* AI Concierge Switch (OFF by default, user-activated) */}
          <div className="inline-flex items-center gap-2 p-1 bg-slate-800/90 rounded-lg border border-slate-700/80">
            <button
              onClick={toggleAi}
              className="flex items-center gap-2 px-2 py-0.5 group focus:outline-none"
              title={
                isAiEnabled
                  ? 'AI Concierge is Active - Click to toggle panel or turn off'
                  : 'Turn ON AI Concierge (Powered by Gemini 3.8 Flash + Google Maps)'
              }
            >
              <Sparkles
                className={`w-3.5 h-3.5 transition-colors ${
                  isAiEnabled ? 'text-sky-400 animate-pulse' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="text-xs font-medium text-slate-200">AI Concierge</span>
              {/* Switch pill */}
              <div
                className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isAiEnabled ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isAiEnabled ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-bold font-mono px-1 rounded ${
                  isAiEnabled ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 bg-slate-700/50'
                }`}
              >
                {isAiEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
            {isAiEnabled && !isAiChatOpen && (
              <button
                onClick={() => setIsAiChatOpen(true)}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-500/30 transition-colors"
                title="Open AI Chat Drawer"
              >
                Chat
              </button>
            )}
          </div>

          {/* Directory Button */}
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span>All Lines Directory</span>
          </button>

          {/* Active Fleet Counter Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono font-semibold">{activeVehiclesCount}</span>
            <span className="text-slate-400">vehicles live</span>
          </div>
        </div>
      </div>
    </header>
  );
};
