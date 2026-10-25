import React from 'react';
import { CommuterPassType, FareBreakdown } from '../types/transit';

interface FarePassSelectorProps {
  currentPass: CommuterPassType;
  onPassChange: (pass: CommuterPassType) => void;
  fareBreakdown?: FareBreakdown;
  className?: string;
}

export const FarePassSelector: React.FC<FarePassSelectorProps> = ({
  currentPass,
  onPassChange,
  fareBreakdown,
  className = '',
}) => {
  const passes: {
    id: CommuterPassType;
    label: string;
    sublabel: string;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'tng',
      label: 'Touch \'n Go',
      sublabel: 'Cashless (Standard)',
    },
    {
      id: 'my50',
      label: 'My50 Pass',
      sublabel: 'Unlimited 30-day (RM 50/mo)',
      badge: 'Covered RM 0.00',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'concession',
      label: 'Concession 50%',
      sublabel: 'Student / Senior / OKU',
      badge: '50% Off',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'cash',
      label: 'Token Cash',
      sublabel: 'Single Journey Coin',
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Commuter Fare Category:</span>
        </span>
        {fareBreakdown && (
          <span className="font-mono text-[11px] text-emerald-400 font-medium">
            {currentPass === 'my50'
              ? 'RM 0.00 with My50 Pass'
              : currentPass === 'concession'
              ? `RM ${fareBreakdown.concessionRm.toFixed(2)} (Save RM ${fareBreakdown.savingsRm.toFixed(2)})`
              : `RM ${fareBreakdown.tngRm.toFixed(2)}`}
          </span>
        )}
      </div>

      {/* Segmented Pass Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
        {passes.map((p) => {
          const isSelected = currentPass === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPassChange(p.id)}
              className={`p-2 rounded-lg text-left transition-all relative ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold leading-tight truncate">
                  {p.label}
                </span>
                {p.badge && (
                  <span
                    className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                      isSelected
                        ? 'text-white bg-blue-700/80 border-blue-400'
                        : p.badgeColor
                    }`}
                  >
                    {p.badge}
                  </span>
                )}
              </div>
              <div
                className={`text-[10px] truncate mt-0.5 ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {p.sublabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
