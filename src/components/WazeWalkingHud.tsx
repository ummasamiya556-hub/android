import React, { useState, useEffect } from 'react';
import {
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  RotateCcw,
  Footprints,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  MapPin,
  Clock,
} from 'lucide-react';
import { WazeManeuverStep, WazeManeuverType, WazeWalkingTrip } from '../types/transit';
import { DEFAULT_WAZE_TRIPS } from '../data/transitData';

interface WazeWalkingHudProps {
  activeTripId?: string;
  onClose?: () => void;
  onTripChange?: (tripId: string) => void;
  isCompact?: boolean;
}

export const WazeWalkingHud: React.FC<WazeWalkingHudProps> = ({
  activeTripId = 'waze-segambut-to-bus190',
  onClose,
  onTripChange,
  isCompact = false,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<string>(activeTripId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [meterProgress, setMeterProgress] = useState<number>(0);

  // Sync external trip changes
  useEffect(() => {
    if (activeTripId) {
      setSelectedTripId(activeTripId);
      setCurrentStepIndex(0);
      setMeterProgress(0);
    }
  }, [activeTripId]);

  const currentTrip: WazeWalkingTrip =
    DEFAULT_WAZE_TRIPS.find((t) => t.id === selectedTripId) || DEFAULT_WAZE_TRIPS[0];

  const currentStep: WazeManeuverStep = currentTrip.steps[currentStepIndex] || currentTrip.steps[0];
  const nextStep: WazeManeuverStep | undefined = currentTrip.steps[currentStepIndex + 1];

  // Auto walking simulator
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setMeterProgress((prev) => {
        if (prev + 5 >= currentStep.distanceMeters) {
          // Advance to next step
          if (currentStepIndex < currentTrip.steps.length - 1) {
            setCurrentStepIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsSimulating(false);
            return currentStep.distanceMeters;
          }
        }
        return prev + 5;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [isSimulating, currentStepIndex, currentStep.distanceMeters, currentTrip.steps.length]);

  const remainingMetersForStep = Math.max(0, currentStep.distanceMeters - meterProgress);

  const getManeuverIcon = (type: WazeManeuverType, className = 'w-9 h-9') => {
    switch (type) {
      case 'u-turn':
        return <RotateCcw className={`${className} text-cyan-400 rotate-45 stroke-[2.5]`} />;
      case 'turn-left':
      case 'sharp-left':
      case 'slight-left':
        return <CornerUpLeft className={`${className} text-cyan-400 stroke-[2.5]`} />;
      case 'turn-right':
      case 'sharp-right':
      case 'slight-right':
        return <CornerUpRight className={`${className} text-cyan-400 stroke-[2.5]`} />;
      case 'zebra-crossing':
        return <Footprints className={`${className} text-amber-400 stroke-[2.5]`} />;
      case 'destination':
        return <MapPin className={`${className} text-emerald-400 stroke-[2.5]`} />;
      case 'straight':
      default:
        return <ArrowUp className={`${className} text-cyan-400 stroke-[2.5]`} />;
    }
  };

  return (
    <div className="w-full bg-slate-950/95 border-b border-cyan-500/30 text-white shadow-2xl transition-all z-20">
      {/* Top Trip Switcher & Waze Header Pill */}
      <div className="flex items-center justify-between px-3 md:px-5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold tracking-wide text-[11px] whitespace-nowrap">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>WAZE PEDESTRIAN HUD</span>
          </div>

          {DEFAULT_WAZE_TRIPS.map((trip) => (
            <button
              key={trip.id}
              onClick={() => {
                setSelectedTripId(trip.id);
                setCurrentStepIndex(0);
                setMeterProgress(0);
                setIsSimulating(false);
                if (onTripChange) onTripChange(trip.id);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                trip.id === selectedTripId
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {trip.id === 'waze-segambut-to-bus190'
                ? '⚡ Segambut ➔ Bus 190 (KL522)'
                : '🚶 Jln Ipoh Kecil ➔ Chow Kit (KI52)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isSimulating ? 'Pause walking simulation' : 'Simulate walking'}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Simulate Walk</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Waze-Style High-Contrast Turn Banner */}
      <div className="px-3 md:px-6 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        {/* Left: Direction Icon + Big Distance + Active Street Name */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {/* High-Contrast Direction Box */}
          <div className="w-13 h-13 md:w-16 md:h-16 rounded-xl bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-950/40 shrink-0">
            {getManeuverIcon(currentStep.maneuverType, 'w-8 h-8 md:w-10 md:h-10')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-white tabular-nums">
                {remainingMetersForStep}
              </span>
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-cyan-400">
                meters
              </span>
              {currentStep.crossStreetPill && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-semibold text-cyan-300">
                  {currentStep.crossStreetPill}
                </span>
              )}
            </div>

            <div className="text-sm md:text-base font-semibold text-slate-100 truncate flex items-center gap-2">
              <span>{currentStep.streetName}</span>
              {currentStep.isCoveredWalkway && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Covered Canopy</span>
                </span>
              )}
            </div>

            {/* Instruction description */}
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {currentStep.instruction}
            </p>
          </div>
        </div>

        {/* Right / Next Step Preview ("Then...") */}
        <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-3 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
          {nextStep ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left max-w-[260px]">
              <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center shrink-0">
                {getManeuverIcon(nextStep.maneuverType, 'w-4 h-4')}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Then
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate block">
                  {nextStep.streetName} ({nextStep.distanceMeters}m)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Arriving at Stop</span>
            </div>
          )}

          {/* Stepper Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (currentStepIndex > 0) {
                  setCurrentStepIndex((idx) => idx - 1);
                  setMeterProgress(0);
                }
              }}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous maneuver"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-400 px-1 tabular-nums">
              {currentStepIndex + 1}/{currentTrip.steps.length}
            </span>
            <button
              onClick={() => {
                if (currentStepIndex < currentTrip.steps.length - 1) {
                  setCurrentStepIndex((idx) => idx + 1);
                  setMeterProgress(0);
                }
              }}
              disabled={currentStepIndex === currentTrip.steps.length - 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next maneuver"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hazard or Critical Road Crossing Warning (e.g. Jalan Segambut Traffic) */}
      {currentStep.hazardAlert && (
        <div className="px-4 py-1.5 bg-amber-950/90 border-t border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium">{currentStep.hazardAlert}</span>
        </div>
      )}

      {/* Trip Meta Footer: Total Walk Dist + ETA + Covered Percentage */}
      <div className="flex items-center justify-between px-3 md:px-6 py-1 bg-slate-950 text-[11px] text-slate-400 border-t border-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>ETA {currentTrip.etaTime}</span>
            <span className="text-slate-500 font-mono">({currentTrip.totalDurationMinutes} min)</span>
          </span>
          <span className="text-slate-600">·</span>
          <span>{currentTrip.totalDistanceMeters} meters total</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-medium">
            {currentTrip.coveredPercentage}% Weather-Covered
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden sm:inline">{currentTrip.title}</span>
        </div>
      </div>
    </div>
  );
};
