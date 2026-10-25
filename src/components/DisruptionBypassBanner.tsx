import React from 'react';
import { DisruptionAlert } from '../types/transit';

interface DisruptionBypassBannerProps {
  alert: DisruptionAlert;
  isDisruptionActive: boolean;
  onToggleDisruption: () => void;
  onApplyBypassRoute?: () => void;
  className?: string;
}

export const DisruptionBypassBanner: React.FC<DisruptionBypassBannerProps> = ({
  alert,
  isDisruptionActive,
  onToggleDisruption,
  onApplyBypassRoute,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border transition-all ${
        isDisruptionActive
          ? 'bg-rose-950/40 border-rose-600/50 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/60 border-slate-800'
      } p-3.5 sm:p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isDisruptionActive
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isDisruptionActive ? '⚠️' : '⚡'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-100">
                {alert.title}
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isDisruptionActive
                    ? 'text-rose-300 bg-rose-500/20 border-rose-500/40 animate-pulse'
                    : 'text-slate-400 bg-slate-800 border-slate-700'
                }`}
              >
                {isDisruptionActive ? `+${alert.delayMinutes} min Delay Active` : 'Disruption Simulator'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isDisruptionActive ? alert.description : 'Simulate real-life KTM Komuter track delays to test instant bus bypass routing.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onToggleDisruption}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isDisruptionActive
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-sm'
            }`}
          >
            {isDisruptionActive ? 'Reset Live Mode' : 'Simulate Rail Delay'}
          </button>

          {isDisruptionActive && onApplyBypassRoute && (
            <button
              type="button"
              onClick={onApplyBypassRoute}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md transition-colors flex items-center space-x-1"
            >
              <span>⚡ Route Bus Bypass</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Bypass Instructions when Active */}
      {isDisruptionActive && (
        <div className="mt-3 pt-3 border-t border-rose-900/60 bg-rose-950/30 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 p-3.5 sm:p-4 rounded-b-xl">
          <div className="flex items-start space-x-2 text-xs text-rose-200">
            <span className="font-bold text-emerald-400 shrink-0">Bypass Route:</span>
            <span>{alert.bypassInstructions}</span>
          </div>
        </div>
      )}
    </div>
  );
};
