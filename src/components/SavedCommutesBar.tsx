import React, { useState, useEffect } from 'react';
import { SavedCommute } from '../types/transit';
import { DEFAULT_SAVED_COMMUTES } from '../data/transitData';

interface SavedCommutesBarProps {
  onSelectCommute: (fromStationId: string, toStationId: string) => void;
  currentOriginId?: string;
  currentDestId?: string;
  onSaveCurrentTrip?: (label: string) => void;
}

const STORAGE_KEY = 'kl_transit_saved_commutes_v1';

export const SavedCommutesBar: React.FC<SavedCommutesBarProps> = ({
  onSelectCommute,
  currentOriginId,
  currentDestId,
}) => {
  const [commutes, setCommutes] = useState<SavedCommute[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SAVED_COMMUTES;
  });

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commutes));
    } catch {
      // ignore
    }
  }, [commutes]);

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim() || !currentOriginId || !currentDestId) return;

    const newCommute: SavedCommute = {
      id: `custom-${Date.now()}`,
      label: customLabel.trim(),
      fromStationId: currentOriginId,
      fromStationName: currentOriginId,
      toStationId: currentDestId,
      toStationName: currentDestId,
      icon: 'bookmark',
      quickNote: 'Saved by commuter',
    };

    setCommutes([newCommute, ...commutes]);
    setCustomLabel('');
    setIsAddingCustom(false);
  };

  const handleDeleteCommute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommutes(commutes.filter((c) => c.id !== id));
  };

  const handleResetDefaults = () => {
    setCommutes(DEFAULT_SAVED_COMMUTES);
  };

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">1-Tap Commutes:</span>
            <span className="sm:hidden">Favorites:</span>
          </span>
        </div>

        {/* Horizontal Shortcut Carousel */}
        <div className="flex-1 flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
          {commutes.map((commute) => {
            const isMatch =
              currentOriginId === commute.fromStationId &&
              currentDestId === commute.toStationId;

            return (
              <div
                key={commute.id}
                onClick={() => onSelectCommute(commute.fromStationId, commute.toStationId)}
                className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap transition-all ${
                  isMatch
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                }`}
                title={commute.quickNote || `${commute.fromStationName} to ${commute.toStationName}`}
              >
                <span className="text-blue-400 group-hover:scale-110 transition-transform">
                  ✦
                </span>
                <span>{commute.label}</span>

                {/* Subtle Delete trigger on hover */}
                {commutes.length > 2 && (
                  <button
                    onClick={(e) => handleDeleteCommute(commute.id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-1 text-slate-400 hover:text-rose-400 transition-opacity"
                    title="Remove shortcut"
                    aria-label="Remove shortcut"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Quick Add Custom Favorite Trigger */}
          {currentOriginId && currentDestId && currentOriginId !== currentDestId && (
            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-blue-500 text-[11px] text-slate-400 hover:text-blue-300 whitespace-nowrap transition-colors flex items-center space-x-1"
            >
              <span>+ Save Trip</span>
            </button>
          )}

          {commutes.length < DEFAULT_SAVED_COMMUTES.length && (
            <button
              onClick={handleResetDefaults}
              className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 underline whitespace-nowrap"
            >
              Restore defaults
            </button>
          )}
        </div>
      </div>

      {/* Add Custom Dialog popup inline */}
      {isAddingCustom && (
        <form onSubmit={handleSaveCurrent} className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Shortcut name (e.g. 'Daily Commute', 'Sunday Market')"
            className="flex-1 max-w-sm px-3 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Save Shortcut
          </button>
          <button
            type="button"
            onClick={() => setIsAddingCustom(false)}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
