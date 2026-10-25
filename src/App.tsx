import React, { useState } from 'react';
import { TransitProvider, useTransit } from './context/TransitContext';
import { MoovitRouteList } from './components/MoovitRouteList';
import { MoovitDirectionsView } from './components/MoovitDirectionsView';
import { MoovitTimetablesView } from './components/MoovitTimetablesView';
import { MoovitLiveRadarModal } from './components/MoovitLiveRadarModal';
import { GeographicRadarMap } from './components/GeographicRadarMap';
import { Compass, Map, List, Radio, ArrowLeft, Navigation, X } from 'lucide-react';

type MoovitView = 'routes' | 'directions' | 'timetables' | 'radar';

const MoovitMain: React.FC = () => {
  const [currentView, setCurrentView] = useState<MoovitView>('routes');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-chowkit-corridor');
  const [mobileShowMap, setMobileShowMap] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const { originStationId, destStationId, destStation } = useTransit();
  const wazeTripId =
    destStationId === 'unirazak'
      ? 'waze-to-unirazak'
      : originStationId === 'segambut_station' || originStationId === 'smk_segambut'
      ? 'waze-segambut-to-bus190'
      : 'waze-ipoh-to-chowkit';

  const startNavigation = (routeId?: string) => {
    if (routeId) setSelectedRouteId(routeId);
    setIsNavigating(true);
    setMobileShowMap(true);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0e0f12] text-white overflow-hidden font-sans">
      {/* Primary Left Panel (Mobile & Desktop) */}
      <div
        className={`w-full md:w-[460px] lg:w-[480px] h-full flex flex-col shrink-0 border-r border-[#22242c] bg-[#121316] z-20 shadow-2xl relative ${
          mobileShowMap ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Active Navigation Indicator banner on left side if user is navigating */}
        {isNavigating && (
          <div className="bg-gradient-to-r from-sky-950 via-[#132035] to-[#121316] p-3 border-b border-sky-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Waze Navigation Active</span>
                </div>
                <div className="text-[11px] text-cyan-200">
                  Following route to {destStation?.shortName || destStation?.name || 'Destination'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={stopNavigation}
              className="px-3 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs cursor-pointer shadow"
            >
              Exit
            </button>
          </div>
        )}

        {/* View 1: Clean Moovit Route Search & Itinerary List */}
        {currentView === 'routes' && (
          <MoovitRouteList
            onSelectRoute={(id) => {
              setSelectedRouteId(id);
              setCurrentView('directions');
            }}
            onOpenLiveRadar={() => setCurrentView('radar')}
            onToggleMobileMap={() => setMobileShowMap(true)}
            onStartNavigation={(id) => startNavigation(id)}
          />
        )}

        {/* View 2: Clean Moovit Directions & Steps */}
        {currentView === 'directions' && (
          <MoovitDirectionsView
            routeId={selectedRouteId}
            onBack={() => setCurrentView('routes')}
            onOpenLiveRadar={() => setCurrentView('radar')}
            onOpenTimetables={() => setCurrentView('timetables')}
            onStartNavigation={() => startNavigation()}
          />
        )}

        {/* View 3: Clean Moovit Details & Timetables */}
        {currentView === 'timetables' && (
          <MoovitTimetablesView
            onBack={() => setCurrentView('directions')}
            onSelectBus={() => setCurrentView('radar')}
          />
        )}

        {/* View 4: Clean Rapid Pulse Live Bus Radar */}
        {currentView === 'radar' && (
          <MoovitLiveRadarModal
            onBack={() => setCurrentView('directions')}
            initialRouteCode="190"
          />
        )}
      </div>

      {/* Full-Fledged Live Interactive Map (Always visible on desktop right side, full on mobile during navigation) */}
      <div
        className={`flex-1 h-full relative overflow-hidden bg-[#0c1017] flex-col ${
          mobileShowMap ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* The Live Map with Waze Navigation HUD overlay */}
        <div className="w-full h-full relative">
          <GeographicRadarMap
            onBackToDirections={() => setMobileShowMap(false)}
            isNavigating={isNavigating}
            onStopNavigation={stopNavigation}
            tripId={wazeTripId}
            currentView={currentView}
            selectedRouteId={selectedRouteId}
          />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TransitProvider>
      <MoovitMain />
    </TransitProvider>
  );
}
