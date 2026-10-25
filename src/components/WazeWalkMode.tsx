import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  Footprints,
  MapPin,
  X,
  Volume2,
  Navigation,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { DEFAULT_WAZE_TRIPS } from '../data/transitData';
import { WazeWalkingTrip, WazeManeuverStep } from '../types/transit';

interface WazeWalkModeProps {
  tripId?: string;
  onExit: () => void;
}

export const WazeWalkMode: React.FC<WazeWalkModeProps> = ({
  tripId = 'waze-ipoh-to-chowkit',
  onExit,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [meterCountdown, setMeterCountdown] = useState(10);

  const trip: WazeWalkingTrip =
    DEFAULT_WAZE_TRIPS.find((t) => t.id === tripId) || DEFAULT_WAZE_TRIPS[1];

  const currentStep: WazeManeuverStep = trip.steps[currentStepIndex] || trip.steps[0];
  const nextStep: WazeManeuverStep | undefined = trip.steps[currentStepIndex + 1];

  // Auto-simulate meter progression
  useEffect(() => {
    setMeterCountdown(currentStep.distanceMeters);
    const timer = setInterval(() => {
      setMeterCountdown((prev) => {
        if (prev <= 5) {
          if (currentStepIndex < trip.steps.length - 1) {
            setCurrentStepIndex((i) => i + 1);
            return trip.steps[currentStepIndex + 1]?.distanceMeters || 10;
          }
          return 0;
        }
        return prev - 5;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [currentStepIndex, currentStep.distanceMeters, trip.steps]);

  return (
    <div className="fixed inset-0 z-50 bg-[#090a0f] text-white flex flex-col justify-between">
      {/* Top High-Contrast Waze Maneuver Sign (Screenshot 5: Waze) */}
      <div className="bg-[#0f1118] border-b-2 border-cyan-500 shadow-2xl p-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Big Maneuver Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#161926] border-2 border-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50">
            {currentStep.maneuverType === 'u-turn' ? (
              <RotateCcw className="w-10 h-10 text-cyan-400 rotate-45 stroke-[2.5]" />
            ) : currentStep.maneuverType === 'turn-left' ? (
              <CornerUpLeft className="w-10 h-10 text-cyan-400 stroke-[2.5]" />
            ) : currentStep.maneuverType === 'turn-right' ? (
              <CornerUpRight className="w-10 h-10 text-cyan-400 stroke-[2.5]" />
            ) : currentStep.maneuverType === 'zebra-crossing' ? (
              <Footprints className="w-10 h-10 text-amber-400 stroke-[2.5]" />
            ) : (
              <ArrowUp className="w-10 h-10 text-cyan-400 stroke-[2.5]" />
            )}
          </div>

          {/* Maneuver Distance & Street Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight tabular-nums">
                {meterCountdown}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                m
              </span>
            </div>

            <div className="text-lg font-bold text-slate-100 truncate mt-0.5">
              {currentStep.streetName}
            </div>

            {/* "Then..." Preview */}
            {nextStep && (
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Then</span>
                <span className="text-slate-300 truncate">{nextStep.streetName}</span>
              </div>
            )}
          </div>

          {/* Close / Exit Button */}
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-full bg-[#1e2230] hover:bg-[#282d40] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Exit walking mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle: Clean Walking Navigation Visualizer */}
      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center items-center text-center space-y-6">
        <div className="relative">
          <div className="w-36 h-36 rounded-full bg-cyan-950/40 border-4 border-cyan-500/40 flex items-center justify-center animate-pulse">
            <Footprints className="w-16 h-16 text-cyan-400 animate-bounce" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs">
            4 km/h
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{currentStep.instruction}</h3>
          {currentStep.landmark && (
            <p className="text-xs text-slate-400">{currentStep.landmark}</p>
          )}
        </div>

        {/* Step navigation buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            disabled={currentStepIndex === 0}
            className="p-2.5 rounded-full bg-[#181a24] text-slate-300 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-400">
            Step {currentStepIndex + 1} of {trip.steps.length}
          </span>
          <button
            onClick={() =>
              setCurrentStepIndex((i) => Math.min(trip.steps.length - 1, i + 1))
            }
            disabled={currentStepIndex === trip.steps.length - 1}
            className="p-2.5 rounded-full bg-[#181a24] text-slate-300 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Bar (Screenshot 5: Waze ETA, Remaining Min, Remaining Dist, Stop Button) */}
      <div className="bg-[#0f1118] border-t border-[#1e2230] p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-white">{trip.etaTime}</div>
            <div className="text-xs text-slate-400">
              <span>{trip.totalDurationMinutes} min</span>
              <span className="mx-1.5">·</span>
              <span>{trip.totalDistanceMeters} m</span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 cursor-pointer"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
};
