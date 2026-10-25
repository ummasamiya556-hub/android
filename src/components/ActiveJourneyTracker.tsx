import React, { useState, useEffect } from 'react';
import { useTransit } from '../context/TransitContext';
import { STATIONS_BY_ID } from '../data/transitData';
import {
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  FastForward,
  X,
  ChevronRight,
  Clock,
  Radio,
  Footprints,
  Bus,
  Train,
  ArrowRight,
  Compass,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const ActiveJourneyTracker: React.FC = () => {
  const {
    selectedItinerary,
    isJourneyActive,
    stopJourney,
    currentLegIndex,
    currentStationPassedIndex,
    passedStationIds,
    advanceJourneyStation,
    simulationSpeed,
    setSimulationSpeed,
    setSelectedStationId,
  } = useTransit();

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  if (!isJourneyActive || !selectedItinerary) return null;

  const currentLeg = selectedItinerary.legs[currentLegIndex];
  if (!currentLeg) return null;

  const intermediate = currentLeg.intermediateStations;
  const currentStationId = intermediate[currentStationPassedIndex] || currentLeg.toStationId;
  const currentStation = STATIONS_BY_ID.get(currentStationId);

  const nextStationId =
    currentStationPassedIndex < intermediate.length - 1
      ? intermediate[currentStationPassedIndex + 1]
      : currentLegIndex < selectedItinerary.legs.length - 1
      ? selectedItinerary.legs[currentLegIndex + 1].fromStationId
      : null;
  const nextStation = nextStationId ? STATIONS_BY_ID.get(nextStationId) : null;

  const totalRemainingStops =
    intermediate.length - 1 - currentStationPassedIndex +
    selectedItinerary.legs.slice(currentLegIndex + 1).reduce((acc, l) => acc + l.stopCount, 0);

  const isTripCompleted =
    currentLegIndex === selectedItinerary.legs.length - 1 &&
    currentStationPassedIndex >= intermediate.length - 1;

  // Web Speech audio announcement hook for station arrival chimes
  useEffect(() => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      let text = '';
      if (isTripCompleted) {
        text = `Arrived at destination, ${selectedItinerary.legs[selectedItinerary.legs.length - 1].toStationName}. Thank you for riding!`;
      } else if (nextStation) {
        text = `Approaching next stop: ${nextStation.shortName || nextStation.name}.`;
      }
      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Gracefully ignore speech synthesis failures
    }
  }, [isVoiceEnabled, currentStationPassedIndex, currentLegIndex, isTripCompleted, nextStation, selectedItinerary]);

  return (
    <div className="bg-slate-900/95 border-b border-emerald-500/40 text-white p-3.5 shadow-2xl backdrop-blur-md relative z-20">
      <div className="max-w-7xl mx-auto">
        {/* Top Header: Active Journey Status & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Google Maps Style · Live Navigation
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {simulationSpeed > 0 ? `${simulationSpeed}x Auto-Tracking` : 'Paused'}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
                {isTripCompleted ? (
                  <span className="text-emerald-400">🎉 Arrived at {selectedItinerary.legs[selectedItinerary.legs.length - 1].toStationName}</span>
                ) : (
                  <>
                    <span className="text-slate-400">Next stop:</span>
                    <span className="text-emerald-300 font-extrabold underline decoration-emerald-500/50">
                      {nextStation?.shortName || nextStation?.name || 'Destination'}
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({totalRemainingStops} stops remaining)
                    </span>
                  </>
                )}
              </h3>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="flex items-center gap-2">
            {/* Step Next Stop Button */}
            {!isTripCompleted && (
              <button
                onClick={advanceJourneyStation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                title="Advance to next station (simulate arrival)"
              >
                <span>Advance 1 Stop</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Speed Toggle */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setSimulationSpeed(simulationSpeed === 0 ? 1 : 0)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  simulationSpeed === 0
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={simulationSpeed === 0 ? 'Resume tracking' : 'Pause tracking'}
              >
                {simulationSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setSimulationSpeed(1)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  simulationSpeed === 1 ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSimulationSpeed(2)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  simulationSpeed === 2 ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                2x
              </button>
              <button
                onClick={() => setSimulationSpeed(4)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  simulationSpeed === 4 ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                4x
              </button>
            </div>

            {/* Voice Announcement Toggle */}
            <button
              onClick={() => setIsVoiceEnabled((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                isVoiceEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isVoiceEnabled ? 'Voice Announcements ON (click to mute)' : 'Turn on Station Voice Announcements'}
            >
              {isVoiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline text-[11px] font-medium">
                {isVoiceEnabled ? 'Audio ON' : 'Audio'}
              </span>
            </button>

            {/* Exit Journey */}
            <button
              onClick={stopJourney}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
              title="Exit Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Leg Info Banner */}
        <div className="flex items-center gap-2 text-xs bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 mb-2.5">
          {currentLeg.mode === 'walk' ? (
            <Footprints className="w-4 h-4 text-slate-400 shrink-0" />
          ) : currentLeg.mode === 'rail' ? (
            <Train className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Bus className="w-4 h-4 text-pink-400 shrink-0" />
          )}
          <span className="font-semibold text-white">
            Leg {currentLegIndex + 1} of {selectedItinerary.legs.length}:
          </span>
          <span className="text-slate-300 font-medium">{currentLeg.instruction}</span>
          {currentLeg.fareRm !== undefined && (
            <span className="text-emerald-400 font-bold ml-1">
              • {currentLeg.fareRm === 0 ? 'FREE' : `RM ${currentLeg.fareRm.toFixed(2)}`}
            </span>
          )}
          {currentLeg.isGoKL && (
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
              Go KL Free Bus
            </span>
          )}
        </div>

        {/* Platform Guidance Banner (Which Side to Stand) */}
        {currentLeg.platformGuide && (
          <div className="flex items-start gap-2 text-xs bg-emerald-950/70 rounded-lg p-2.5 border border-emerald-500/50 mb-2.5 text-emerald-200">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-white block">
                👉 {currentLeg.platformGuide.sideName}
              </span>
              <span className="text-emerald-100">{currentLeg.platformGuide.tips}</span>
            </div>
          </div>
        )}

        {/* Walking Street Orientation Guidance Banner */}
        {currentLeg.walkingOrientation && (
          <div className="flex items-start gap-2 text-xs bg-sky-950/70 rounded-lg p-2.5 border border-sky-500/50 mb-2.5 text-sky-200">
            <Navigation className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-amber-300 block">
                🛣️ Road Side: {currentLeg.walkingOrientation.whichSideOfRoad}
              </span>
              <span className="text-slate-200">
                Direction: {currentLeg.walkingOrientation.compassHeading} • Distance: {currentLeg.walkingOrientation.walkingDistanceMeters}m
              </span>
            </div>
          </div>
        )}

        {/* Linear Station Progress Strip (Tokyo/Google Maps Style with Passed Grey Tracking) */}
        <div className="relative pt-1 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max gap-3 px-2">
            {intermediate.map((stationId, sIdx) => {
              const station = STATIONS_BY_ID.get(stationId);
              const isPassed = passedStationIds.has(stationId);
              const isCurrent = sIdx === currentStationPassedIndex;
              const isUpcoming = !isPassed && !isCurrent;

              return (
                <React.Fragment key={stationId}>
                  {/* Station Node */}
                  <div
                    onClick={() => setSelectedStationId(stationId)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Pulse ring for current station */}
                      {isCurrent && (
                        <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-emerald-400 opacity-75" />
                      )}

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isPassed
                            ? 'bg-slate-700 text-slate-400 ring-2 ring-slate-600' // Passed station in MUTED GREY
                            : isCurrent
                            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/50'
                            : 'bg-slate-800 text-slate-300 ring-2 ring-slate-700 group-hover:ring-slate-500'
                        }`}
                        style={{
                          backgroundColor: isUpcoming
                            ? currentLeg.color
                            : isPassed
                            ? '#64748b' // Muted grey
                            : '#10b981', // Emerald green current
                        }}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                        ) : isCurrent ? (
                          <Radio className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                        ) : (
                          <span>{sIdx + 1}</span>
                        )}
                      </div>
                    </div>

                    {/* Station Name */}
                    <span
                      className={`text-[11px] font-medium mt-1.5 transition-colors max-w-[100px] text-center truncate ${
                        isPassed
                          ? 'text-slate-500 line-through' // Crossed stations greyed out
                          : isCurrent
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {station?.shortName || station?.name || stationId}
                    </span>
                  </div>

                  {/* Connector Track */}
                  {sIdx < intermediate.length - 1 && (
                    <div
                      className={`h-1 w-12 rounded transition-colors ${
                        isPassed
                          ? 'bg-slate-700' // Passed segment grey
                          : sIdx === currentStationPassedIndex
                          ? 'bg-gradient-to-r from-emerald-500 to-slate-700 animate-pulse'
                          : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
