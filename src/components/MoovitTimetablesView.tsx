import React from 'react';
import { ArrowLeft, Clock, Bus, Radio, CheckCircle2, ChevronRight } from 'lucide-react';

interface MoovitTimetablesViewProps {
  onBack: () => void;
  onSelectBus: (busCode: string) => void;
}

export const MoovitTimetablesView: React.FC<MoovitTimetablesViewProps> = ({
  onBack,
  onSelectBus,
}) => {
  const departures = [
    {
      code: '180',
      destination: 'Pasar Seni (Platform A6 - A8)',
      timeLabel: '8 min',
      isGreen: true,
      accurate: true,
      stopsInfo: '8 stops · 12 min',
      plate: 'WVE7352',
    },
    {
      code: '171',
      destination: 'BSN Lebuh Ampang',
      timeLabel: '11 min',
      isGreen: true,
      accurate: true,
      stopsInfo: '9 stops · 12 min',
      plate: 'WUW8426',
    },
    {
      code: '173',
      destination: 'BSN Lebuh Ampang',
      timeLabel: '13 min',
      subTime: '28 min',
      isGreen: false,
      accurate: false,
      stopsInfo: '8 stops · 12 min',
      plate: 'WUW1359',
    },
    {
      code: '151',
      destination: 'Pasar Seni (Platform A1 - A2)',
      timeLabel: '4:22 pm',
      subTime: '5:18 pm',
      isGreen: false,
      accurate: false,
      stopsInfo: '9 stops · 12 min',
      plate: 'WVE4092',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white">
      {/* Header (Screenshot 2) */}
      <div className="p-3 bg-[#18191c] border-b border-[#25262c]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#25262c] cursor-pointer"
            title="Back to directions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-white">Details & Timetables</h2>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-bold text-white">Chow Kit (Utara) (KI52)</h3>
          <p className="text-xs text-slate-400 mt-0.5">to LRT Masjid Jamek (KI107)</p>
        </div>
      </div>

      {/* Upcoming Arrivals Section (Screenshot 2) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Upcoming Arrivals
          </span>

          <div className="space-y-2">
            {departures.map((bus) => (
              <div
                key={bus.code}
                onClick={() => onSelectBus(bus.code)}
                className="p-3 rounded-xl bg-[#18191c] hover:bg-[#202227] border border-[#25262c] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#0070ba] text-white font-bold text-xs">
                      {bus.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {bus.destination}
                    </span>
                  </div>

                  {/* Arrival Time Badge */}
                  <div className="text-right">
                    {bus.isGreen ? (
                      <div className="px-2 py-0.5 rounded bg-[#0b291d] border border-[#00c269]/40 text-[#00c269] text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00c269] animate-ping" />
                        <span>{bus.timeLabel}</span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded bg-[#202227] text-slate-300 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{bus.timeLabel}</span>
                      </div>
                    )}
                    {bus.subTime && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">{bus.subTime}</span>
                    )}
                  </div>
                </div>

                {/* Subtext info */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {bus.accurate ? (
                      <span className="text-[#00c269] font-medium flex items-center gap-1">
                        <span>Arrival time is accurate</span>
                        <span>·</span>
                        <span>♿</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Based on previous arrivals</span>
                    )}
                  </div>

                  <span className="text-slate-500">{bus.stopsInfo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Times Section (Screenshot 2) */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Additional Times
          </span>

          <div className="p-3 rounded-xl bg-[#18191c] border border-[#25262c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#0070ba] text-white font-bold text-xs">
                173
              </span>
              <span className="text-xs font-semibold text-slate-200">
                BSN Lebuh Ampang
              </span>
            </div>

            <div className="px-2 py-0.5 rounded bg-[#202227] text-slate-300 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>4:23 pm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
