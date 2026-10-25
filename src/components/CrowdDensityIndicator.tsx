import React from 'react';
import { CrowdDensity } from '../types/transit';
import { getCrowdDensity } from '../data/transitData';

interface CrowdDensityIndicatorProps {
  density?: CrowdDensity;
  stationName?: string;
  className?: string;
  compact?: boolean;
}

export const CrowdDensityIndicator: React.FC<CrowdDensityIndicatorProps> = ({
  density: propDensity,
  stationName,
  className = '',
  compact = false,
}) => {
  const density = propDensity || getCrowdDensity();
  const now = new Date();
  const currentHour = now.getHours();

  // 24-hour baseline curve for Kuala Lumpur Transit
  const hourlyCurve = [
    { hour: '6am', pct: 20 },
    { hour: '7am', pct: 65 },
    { hour: '8am', pct: 95 }, // Morning Peak
    { hour: '9am', pct: 85 },
    { hour: '10am', pct: 40 },
    { hour: '11am', pct: 35 },
    { hour: '12pm', pct: 55 }, // Lunch
    { hour: '1pm', pct: 50 },
    { hour: '2pm', pct: 35 },
    { hour: '3pm', pct: 40 },
    { hour: '4pm', pct: 55 },
    { hour: '5pm', pct: 80 },
    { hour: '6pm', pct: 92 }, // Evening Peak
    { hour: '7pm', pct: 88 },
    { hour: '8pm', pct: 60 },
    { hour: '9pm', pct: 40 },
    { hour: '10pm', pct: 25 },
  ];

  const getStatusColor = (level: CrowdDensity['level']) => {
    switch (level) {
      case 'packed':
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          bar: 'bg-rose-500',
          label: 'Heavy Congestion',
        };
      case 'moderate':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          bar: 'bg-amber-500',
          label: 'Moderate Traffic',
        };
      case 'low':
      default:
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          bar: 'bg-emerald-500',
          label: 'Low / Seats Available',
        };
    }
  };

  const status = getStatusColor(density.level);

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${status.bg} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status.bar} animate-pulse`} />
        <span className={status.text}>{density.percentage}% Platform Load</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Platform Density {stationName ? `· ${stationName}` : ''}
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${status.bg} ${status.text}`}>
          {status.label} ({density.percentage}%)
        </div>
      </div>

      {/* Progress Load Meter */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${status.bar}`}
            style={{ width: `${density.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0% Empty</span>
          <span>50% Seated</span>
          <span>100% Packed</span>
        </div>
      </div>

      {/* Rush Hour 24h Mini-Histogram Curve */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>Today's Peak Rush Curve (KL Metro Pattern)</span>
          <span className="text-blue-400">Current Time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-end justify-between h-14 gap-1 px-1">
          {hourlyCurve.map((item, idx) => {
            const hourNum = idx + 6;
            const isCurrent = hourNum === currentHour;
            const barHeight = Math.max(8, Math.round((item.pct / 100) * 48));
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isCurrent
                      ? 'bg-blue-400 ring-2 ring-blue-500/50'
                      : item.pct > 75
                      ? 'bg-rose-500/60'
                      : item.pct > 45
                      ? 'bg-amber-500/50'
                      : 'bg-slate-700/60'
                  }`}
                  style={{ height: `${barHeight}px` }}
                  title={`${item.hour}: ${item.pct}% typical rush`}
                />
                <span className={`text-[8px] font-mono mt-1 ${isCurrent ? 'text-blue-300 font-bold' : 'text-slate-500'}`}>
                  {idx % 3 === 0 ? item.hour : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable recommendation text */}
      <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex items-start space-x-2">
        <span className="text-blue-400 font-bold shrink-0 mt-0.5">ℹ</span>
        <span className="leading-relaxed">{density.recommendation}</span>
      </div>
    </div>
  );
};
