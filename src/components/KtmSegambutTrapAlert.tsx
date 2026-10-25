import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  ArrowRight,
  Footprints,
  Clock,
  CheckCircle2,
  Train,
  Bus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTransit } from '../context/TransitContext';

interface KtmSegambutTrapAlertProps {
  onActivateBypass?: () => void;
  onOpenWalkingGuide?: () => void;
}

export const KtmSegambutTrapAlert: React.FC<KtmSegambutTrapAlertProps> = ({
  onActivateBypass,
  onOpenWalkingGuide,
}) => {
  const {
    originStationId,
    destStationId,
    setOriginStationId,
    setDestStationId,
    setIsDisruptionActive,
  } = useTransit();

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Relevant when traveling from Segambut or towards Putra/KL Sentral
  const isRelevant =
    (originStationId === 'segambut_station' || destStationId === 'putra_ktm') && !isDismissed;

  if (!isRelevant) return null;

  const handleSwitchToBus190 = () => {
    // Switch route to Bus 190 bypass
    setIsDisruptionActive(true);
    setOriginStationId('smk_segambut');
    setDestStationId('pwtc_lrt');
    if (onActivateBypass) onActivateBypass();
    if (onOpenWalkingGuide) onOpenWalkingGuide();
  };

  return (
    <div className="mx-3 md:mx-4 my-2 rounded-xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 p-3 shadow-xl shadow-amber-950/30 text-slate-100 transition-all">
      {/* Alert Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                PROACTIVE HEADWAY WARNING
              </span>
              <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[10px] font-bold text-red-300">
                40+ MIN WAIT DETECTED
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mt-0.5">
              Avoid KTM Segambut Delay Trap (Next train at 8:10 PM)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Waiting for KTM Komuter to Putra takes <span className="font-bold text-amber-300">42 minutes</span>. Walk 3 mins to SMK Segambut Stop and catch <span className="font-bold text-sky-400">Bus 190</span> instead!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 shrink-0 cursor-pointer"
        >
          Dismiss
        </button>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-xs">
        {/* Option A: Wait for KTM */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">KTM Train to Putra</span>
              <span className="text-[11px] text-red-400 font-medium">Headway: 42 min wait</span>
            </div>
          </div>
          <span className="text-xs font-bold text-red-400 tabular-nums">ETA: 8:16 PM</span>
        </div>

        {/* Option B: Fast Bus 190 Bypass */}
        <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Bus 190 (SMK Segambut)</span>
              <span className="text-[11px] text-emerald-400 font-medium">3 min walk · Bus in 4 min</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-300 tabular-nums">ETA: 7:42 PM (Save 34 min!)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Hide walking directions</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>View 3-min walking shortcut to Bus 190</span>
            </>
          )}
        </button>

        <button
          onClick={handleSwitchToBus190}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/40 cursor-pointer active:scale-95 transition-all"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>⚡ Switch to Bus 190 Bypass (Save 34 min)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Walk Instructions */}
      {isExpanded && (
        <div className="mt-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span>Waze Walking Shortcut (210 meters · 3 min walk)</span>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
            <li>Exit Segambut KTM station concourse through the fare gates.</li>
            <li>Turn left onto the covered pedestrian canopy along Jalan Segambut Pusat.</li>
            <li>Walk past 7-Eleven Segambut (110m).</li>
            <li>Push the pedestrian traffic light button and cross Jalan Segambut safely.</li>
            <li>Wait at SMK Segambut Bus Stop (KL522) on the school curb. <span className="text-amber-300 font-semibold">Do NOT cross back!</span> Bus 190 stops directly here.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
