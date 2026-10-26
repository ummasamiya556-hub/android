import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Footprints,
  Bus,
  Train,
  Play,
  Radio,
  Share2,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  RotateCcw,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useTransit } from '../context/TransitContext';

interface MoovitDirectionsViewProps {
  routeId: string;
  onBack: () => void;
  onOpenLiveRadar: () => void;
  onOpenTimetables: () => void;
  onStartNavigation: () => void;
}

export const MoovitDirectionsView: React.FC<MoovitDirectionsViewProps> = ({
  routeId,
  onBack,
  onOpenLiveRadar,
  onOpenTimetables,
  onStartNavigation,
}) => {
  const { originStationId, destStationId, setOriginStationId, setDestStationId } = useTransit();
  const [isWalkExpanded, setIsWalkExpanded] = useState<boolean>(true);
  const [selectedDepartureBus, setSelectedDepartureBus] = useState<string>('180');

  const isSegambutScenario =
    originStationId === 'segambut_station' || originStationId === 'smk_segambut';
  const isPutraCourtWalk =
    routeId === 'route-putra-court-walk-pwtc' ||
    (originStationId === 'putra_court' &&
      (destStationId === 'pwtc_lrt' || destStationId === 'sunway_putra') &&
      !routeId?.includes('bus'));

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white">
      {/* Top Header (Screenshot 1) */}
      <div className="p-3 bg-[#18191c] border-b border-[#25262c]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#25262c] cursor-pointer"
            title="Back to route options"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base font-bold text-white">Directions</h2>
        </div>

        {/* Route Chain Strip */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {isPutraCourtWalk ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#4338ca] text-white">
              <Footprints className="w-3.5 h-3.5 text-indigo-200" />
              <span>Walk 4 min (350 m via Jalan 1/64d)</span>
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <span className="text-slate-600 font-bold">›</span>

              {isSegambutScenario ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#0070ba] text-white">
                  <Bus className="w-3 h-3" />
                  <span>190 / GOKL 13</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#0070ba] text-white">
                  <Bus className="w-3 h-3" />
                  <span>180 / 171 / 173 / 151</span>
                </span>
              )}

              <span className="text-slate-600 font-bold">›</span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#0284c7] text-white">
                <Bus className="w-3 h-3" />
                <span>851</span>
              </span>

              <span className="text-slate-600 font-bold">›</span>

              <span className="inline-flex items-center gap-1 text-slate-300">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </>
          )}
        </div>

        {/* Tips banner (Screenshot 1) */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2f1c4a] via-[#241738] to-[#1a1226] border border-[#4c2d79] flex items-center justify-between text-xs cursor-pointer">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div>
              <span className="font-semibold text-white block">Tips that make travel better</span>
              <span className="text-[10px] text-pink-300/80">Arrival time is accurate · Verified live GPS</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Time Range Bar: < Earlier | 3:43 pm - 4:28 pm | Later > (Screenshot 1) */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#151619] border-b border-[#202227] text-xs font-medium text-slate-400">
        <button className="flex items-center gap-1 hover:text-white cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
          <span>Earlier</span>
        </button>

        <span className="text-slate-200 font-semibold">3:43 pm - 4:28 pm</span>

        <button className="flex items-center gap-1 hover:text-white cursor-pointer">
          <span>Later</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Vertical Transit Line (Screenshot 1) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Step 1: Origin Starting Point */}
        <div className="relative flex items-start gap-3">
          {/* Origin Ring */}
          <div
            className={`w-6 h-6 rounded-full border-4 ${
              isPutraCourtWalk ? 'border-[#00c269]' : 'border-orange-500'
            } bg-[#121316] flex items-center justify-center shrink-0 z-10`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isPutraCourtWalk ? 'bg-[#00c269]' : 'bg-orange-500'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">
                {isPutraCourtWalk
                  ? 'Putra Court Condominium (Jalan 1/64d)'
                  : isSegambutScenario
                  ? 'Segambut KTM Komuter Station'
                  : '8, Jalan Ipoh Kecil, Chow Kit, 50350 Kuala Lumpur'}
              </h3>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-white block">3:45 pm</span>
                <span className="text-[10px] text-slate-400">Leave at</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Walk Leg (Screenshot 1: Walk 370 m | 4 min ⌵) */}
        <div className="relative pl-3 ml-3 border-l-2 border-dotted border-slate-600 space-y-2">
          <button
            onClick={() => setIsWalkExpanded(!isWalkExpanded)}
            className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            <Footprints className="w-4 h-4 text-slate-400" />
            <span>
              {isPutraCourtWalk
                ? 'Walk 350 m | 4 min along Jalan 1/64d'
                : isSegambutScenario
                ? 'Walk 210 m | 3 min'
                : 'Walk 370 m | 4 min'}
            </span>
            {isWalkExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Waze Walking Turn-by-Turn signs inside the walk step */}
          {isWalkExpanded && (
            <div className="p-3 rounded-xl bg-[#1a1b20] border border-[#2a2c34] space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold border-b border-[#282a33] pb-1.5">
                <span>WAZE PEDESTRIAN SIGNS</span>
                <span className="text-emerald-400 font-normal">
                  {isPutraCourtWalk ? 'Covered Pavement & River Walk' : '85% Covered canopy'}
                </span>
              </div>

              {isPutraCourtWalk ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <ArrowUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>Exit Putra Court north concourse onto Jalan 1/64d sidewalk.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <CornerUpRight className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span>
                      Follow continuous pedestrian curve along Jalan 1/64d past river/track corridor (220 m).
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <Footprints className="w-4 h-4 text-amber-400" />
                    </div>
                    <span>
                      Walk past Sunway Putra Hotel entrance toward PWTC AG4/SP4 covered bridge (130 m).
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-semibold text-white">
                      Arrive at PWTC (World Trade Centre KL) / Sunway Putra Mall!
                    </span>
                  </div>
                </>
              ) : isSegambutScenario ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <ArrowUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>Exit Segambut KTM concourse through the ticket barriers.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <CornerUpLeft className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>Turn left onto the covered pedestrian canopy along Jalan Segambut Pusat (45m).</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <Footprints className="w-4 h-4 text-amber-400" />
                    </div>
                    <span>Push button at pedestrian signal light and cross Jalan Segambut safely.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-semibold text-white">
                      Wait at SMK Segambut Stop (KL522) on the school curb. Do NOT cross back!
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4 text-cyan-400 rotate-45" />
                    </div>
                    <span>Make U-turn in 10 m onto Jalan Ipoh Kecil.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      <CornerUpLeft className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>Turn left onto Jalan 1/64A (85 m) towards Jalan Ipoh main trunk.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-semibold text-white">
                      Arrive at Chow Kit (Utara) (KI52) covered bus hub.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Bus Boarding Station (Only if NOT pure walk) */}
        {!isPutraCourtWalk && (
          <div className="relative flex items-start gap-3">
            {/* Blue Bus Icon Circle */}
            <div className="w-6 h-6 rounded-full bg-[#0070ba] text-white flex items-center justify-center shrink-0 z-10">
              <Bus className="w-3.5 h-3.5" />
            </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px]">
                  BUS
                </span>
                <h4 className="text-sm font-bold text-white">
                  {isSegambutScenario
                    ? 'SMK Segambut (KL522 / KL526)'
                    : 'Chow Kit (Utara) (KI52)'}
                </h4>
              </div>

              {/* Station Photo Indicator (Screenshot 1) */}
              <div className="w-10 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">Photo</span>
              </div>
            </div>

            {/* Departure Card (Screenshot 1) */}
            <div className="p-3 rounded-xl bg-[#191b22] border border-[#2a2e3a] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#0070ba] text-white font-bold text-xs">
                    {isSegambutScenario ? '190' : '180'}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {isSegambutScenario
                      ? 'PWTC / Sunway Putra / Medan Pasar'
                      : 'Pasar Seni (Platform A6 - A8)'}
                  </span>
                </div>

                {/* Green Live Beacon (Live GPS transponder) */}
                <div className="px-2 py-0.5 rounded bg-[#0b291d] border border-[#00c269]/40 text-[#00c269] text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#00c269] animate-ping" />
                  <span>2 min</span>
                  <span className="text-[9px] uppercase px-1 rounded bg-[#00c269]/20 text-[#00c269]">
                    Live GPS
                  </span>
                </div>
              </div>

              {/* Scheduled Times vs Live Timing Explanation */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#252832]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400">Later:</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#252830] text-slate-200 border border-slate-700 font-semibold text-[10px]">
                    8 min (Sched)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#252830] text-slate-200 border border-slate-700 font-semibold text-[10px]">
                    9 min (Sched)
                  </span>
                </div>
                <span className="text-[#00c269] font-medium flex items-center gap-1 text-[10px]">
                  <span>🟢 Accurate Live GPS</span>
                </span>
              </div>
            </div>

            {/* Proactive Delay Warning if Segambut KTM is selected */}
            {isSegambutScenario && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-xs text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>KTM Segambut Warning: 42 Min Delay to Putra</span>
                </div>
                <p className="text-[11px] text-amber-100/90 leading-relaxed">
                  Next KTM train departs at <span className="font-bold text-white">8:10 PM</span>. Taking Bus 190 here at SMK Segambut Stop departs in <span className="font-bold text-emerald-300">4 mins</span> and saves <span className="font-bold text-white">35 minutes</span>!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Step 4: Destination Arrival */}
        <div className="relative flex items-start gap-3">
          {/* Red Pin Ring */}
          <div className="w-6 h-6 rounded-full border-4 border-red-500 bg-[#121316] flex items-center justify-center shrink-0 z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">
                {isPutraCourtWalk
                  ? 'PWTC (World Trade Centre KL) AG4 / SP4'
                  : isSegambutScenario
                  ? 'PWTC (World Trade Centre KL) / Putra'
                  : 'LRT Masjid Jamek / Pasar Seni'}
              </h3>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-white block">
                  {isPutraCourtWalk ? '3:49 pm' : '4:28 pm'}
                </span>
                <span className="text-[10px] text-slate-400">Arrive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Screenshot 1: Start | Live Location | Share) */}
      <div className="p-3 bg-[#18191c] border-t border-[#25262c] flex items-center gap-2">
        {/* Big Green Start Button */}
        <button
          onClick={onStartNavigation}
          className="flex-1 py-3 px-3 rounded-full bg-[#00c269] hover:bg-[#00ad5d] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Start</span>
        </button>

        {/* Blue Live Bus Radar Button (Screenshot 1: Live location) */}
        <button
          onClick={onOpenLiveRadar}
          className="flex-1 py-3 px-3 rounded-full bg-[#0070ba] hover:bg-[#00609e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 cursor-pointer active:scale-95 transition-all"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Live location</span>
        </button>

        {/* Timetables drilldown button */}
        <button
          onClick={onOpenTimetables}
          className="p-3 rounded-full bg-[#202227] hover:bg-[#2a2c33] text-slate-300 hover:text-white border border-[#2e3037] cursor-pointer"
          title="Details & Timetables"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
