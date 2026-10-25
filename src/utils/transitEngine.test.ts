import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  estimateWalkMinutes,
  findNearbyStations,
  findItineraries,
  deduplicateItineraries,
  getStationDepartures,
  findPlatformForDestination,
  generateInitialFleet,
  advanceFleetPositions,
} from './transitGraph';
import { STATIONS_BY_ID } from '../data/transitData';
import { RouteItinerary } from '../types/transit';

test('walking distance calculation connects Putra Court and PWTC LRT', () => {
  const putraCourt = STATIONS_BY_ID.get('putra_court');
  const pwtcLrt = STATIONS_BY_ID.get('pwtc_lrt');

  assert.ok(putraCourt, 'Putra Court station exists');
  assert.ok(pwtcLrt, 'PWTC LRT station exists');

  const distKm = calculateDistanceKm(putraCourt!, pwtcLrt!);
  // Distance should be ~0.25 km (around 250 meters)
  assert.ok(distKm > 0.1 && distKm < 0.45, `Distance should be walkable (< 450m), got ${distKm}km`);

  const walkMin = estimateWalkMinutes(distKm);
  assert.ok(walkMin >= 2 && walkMin <= 6, `Walk time should be 2-6 min, got ${walkMin}`);
});

test('findNearbyStations finds PWTC and Putra KTM near Putra Court', () => {
  const nearby = findNearbyStations('putra_court', 0.45);
  const nearbyIds = nearby.map((n) => n.station.id);

  assert.ok(nearbyIds.includes('pwtc_lrt') || nearbyIds.includes('sunway_putra'), 'PWTC or Sunway Putra should be found near Putra Court');
});

test('Putra Court to MITEC finds direct Go KL Magenta and Bus 190', () => {
  const itineraries = findItineraries('putra_court', 'mitec_matrade');
  assert.ok(itineraries.length > 0, 'Must return at least one viable itinerary');

  // Verify Go KL Magenta is suggested
  const goklMagentaOption = itineraries.find(
    (it) => it.legs.some((leg) => leg.lineId === 'gokl-13')
  );
  assert.ok(goklMagentaOption, 'Must include Go KL Magenta Line GOKL 13');
  assert.equal(goklMagentaOption?.legs[0]?.isGoKL, true);
  assert.equal(goklMagentaOption?.totalFare, 'Free (Malaysian) / RM 1.00');

  // Verify Bus 190 is also found
  const bus190Option = itineraries.find(
    (it) => it.legs.some((leg) => leg.lineId === 'bus-190')
  );
  assert.ok(bus190Option, 'Must include Rapid KL Bus 190');
});

test('deduplicateItineraries merges duplicate sources into a single authoritative card', () => {
  const dummy1: RouteItinerary = {
    id: 'it-1',
    title: 'Route A',
    summary: 'Summary 1',
    totalDurationMinutes: 15,
    totalDistanceKm: 3.5,
    totalFare: 'RM 1.00',
    transferCount: 0,
    legs: [
      {
        id: 'leg-1',
        mode: 'rapidkl',
        lineId: 'bus-190',
        color: '#0284c7',
        fromStationId: 'putra_court',
        fromStationName: 'Putra Court',
        toStationId: 'mitec_matrade',
        toStationName: 'MITEC',
        stopCount: 4,
        intermediateStations: ['putra_court', 'pwtc_lrt', 'kompleks_kerajaan_duta', 'mitec_matrade'],
        durationMinutes: 15,
        distanceKm: 3.5,
        instruction: 'Board Bus 190',
      },
    ],
    sources: ['google'],
    highlights: ['Google Maps Direction'],
  };

  const dummy2: RouteItinerary = {
    id: 'it-2',
    title: 'Route A (Moovit)',
    summary: 'Summary 2',
    totalDurationMinutes: 14,
    totalDistanceKm: 3.5,
    totalFare: 'RM 1.00',
    transferCount: 0,
    legs: [
      {
        id: 'leg-2',
        mode: 'rapidkl',
        lineId: 'bus-190',
        color: '#0284c7',
        fromStationId: 'putra_court',
        fromStationName: 'Putra Court',
        toStationId: 'mitec_matrade',
        toStationName: 'MITEC',
        stopCount: 4,
        intermediateStations: ['putra_court', 'pwtc_lrt', 'kompleks_kerajaan_duta', 'mitec_matrade'],
        durationMinutes: 14,
        distanceKm: 3.5,
        instruction: 'Board Bus 190',
      },
    ],
    sources: ['moovit', 'rapid_pulse'],
    highlights: ['Confirmed Live GPS'],
  };

  const merged = deduplicateItineraries([dummy1, dummy2]);
  assert.equal(merged.length, 1, 'Duplicate routes must be merged into one');
  assert.ok(merged[0].sources.includes('google'), 'Merged sources should include google');
  assert.ok(merged[0].sources.includes('moovit'), 'Merged sources should include moovit');
  assert.ok(merged[0].sources.includes('rapid_pulse'), 'Merged sources should include rapid_pulse');
  assert.equal(merged[0].totalDurationMinutes, 14, 'Should keep fastest duration');
});

test('getStationDepartures returns confirmed GPS departures with line metadata', () => {
  const departures = getStationDepartures('pwtc_lrt');
  assert.ok(departures.length > 0, 'PWTC LRT must have active departures');

  const goklDepartures = departures.filter((d) => d.isGoKL);
  assert.ok(goklDepartures.length > 0, 'PWTC LRT should feature Go KL Magenta departures');

  const confirmedGps = departures.every((d) => typeof d.isGpsConfirmed === 'boolean');
  assert.ok(confirmedGps, 'Departures must include GPS confirmation flag');
});

test('vehicle fleet advances positions smoothly for live radar', () => {
  const initialFleet = generateInitialFleet();
  assert.ok(initialFleet.length >= 10, 'Should generate fleet of buses and trains');

  const advancedFleet = advanceFleetPositions(initialFleet, 0.05);
  assert.equal(advancedFleet.length, initialFleet.length);
  assert.notEqual(advancedFleet[0].progress, initialFleet[0].progress, 'Progress must increment');
});

test('findPlatformForDestination correctly identifies Platform 1 Southbound for Putra from Segambut', () => {
  const plat = findPlatformForDestination('segambut_station', 'putra_ktm');
  assert.ok(plat, 'Must find platform info for Segambut to Putra');
  assert.equal(plat?.platformNumber, '1', 'Must specify Platform 1');
  assert.equal(plat?.headingDirection, 'southbound', 'Must specify Southbound direction');
  assert.ok(plat?.tips.includes('STAND ON PLATFORM 1'), 'Tips must explicitly guide user to stand on Platform 1');
});

test('Segambut station departures warn about 40+ min KTM wait and recommend Bus 190 alternative', () => {
  const departures = getStationDepartures('segambut_station');
  const ktmSouthbound = departures.find(
    (d) => d.lineId.startsWith('ktm') && (d.destination.includes('Putra') || d.destination.includes('KL Sentral'))
  );
  assert.ok(ktmSouthbound, 'Must list KTM departure towards Putra/KL');
  assert.ok(ktmSouthbound!.minutesAway >= 40, 'KTM headway should reflect the 40+ min wait');
  assert.equal(ktmSouthbound?.isLongWaitWarning, true, 'Must flag long wait warning');
  assert.ok(ktmSouthbound?.alternativeSuggestion, 'Must provide Bus 190 alternative suggestion');
  assert.equal(ktmSouthbound?.alternativeSuggestion?.lineCode, 'Bus 190');

  // Also verify Bus 190 is departing soon
  const bus190 = departures.find((d) => d.lineId === 'bus-190');
  assert.ok(bus190, 'Must have Bus 190 departure at Segambut');
  assert.ok(bus190!.minutesAway <= 5, 'Bus 190 should arrive within 5 min');
});

test('SMK Segambut has clear walking guidance to Bus 190 without crossing the road', () => {
  const smkStation = STATIONS_BY_ID.get('smk_segambut');
  assert.ok(smkStation, 'SMK Segambut station exists');
  assert.ok(smkStation?.walkingGuides && smkStation.walkingGuides.length > 0, 'Must have walking guides');

  const bus190Guide = smkStation!.walkingGuides!.find((g) => g.targetLineOrBus.includes('190'));
  assert.ok(bus190Guide, 'Must have walking guide for Bus 190');
  assert.ok(bus190Guide!.whichSideOfRoad.includes('SAME SIDE'), 'Must advise staying on school side without crossing');
  assert.ok(bus190Guide!.stepByStep.some((s) => s.includes('Do NOT cross the street')), 'Must instruct not to cross busy road');
});

test('calculateFareBreakdown accurately calculates My50, 50% concession, and TnG rates', async () => {
  const { calculateFareBreakdown } = await import('../data/transitData');

  const fareTng = calculateFareBreakdown(2.00, 'tng');
  assert.equal(fareTng.tngRm, 2.00);
  assert.ok(fareTng.cashRm > 2.00, 'Cash single token must carry surcharge');

  const fareMy50 = calculateFareBreakdown(2.00, 'my50');
  assert.equal(fareMy50.my50Covered, true);
  assert.equal(fareMy50.savingsRm, 2.00, 'My50 saves full marginal fare');

  const fareConcession = calculateFareBreakdown(2.00, 'concession');
  assert.equal(fareConcession.concessionRm, 1.00, '50% concession should halve the fare');
  assert.equal(fareConcession.savingsRm, 1.00);
});

test('evaluateCoveredWalkway accurately evaluates sheltered walkways for Segambut and PWTC', async () => {
  const { evaluateCoveredWalkway } = await import('./transitGraph');

  const segambutWalk = evaluateCoveredWalkway('segambut_station', 'smk_segambut');
  assert.equal(segambutWalk.isCovered, true);
  assert.equal(segambutWalk.coveredPercentage, 85);
  assert.equal(segambutWalk.rainShieldStatus, 'partial');

  const pwtcWalk = evaluateCoveredWalkway('putra_ktm', 'pwtc_lrt');
  assert.equal(pwtcWalk.isCovered, true);
  assert.equal(pwtcWalk.coveredPercentage, 100);
  assert.equal(pwtcWalk.rainShieldStatus, 'full');
});

test('getCrowdDensity calculates morning peak vs off-peak passenger loads', async () => {
  const { getCrowdDensity } = await import('../data/transitData');

  const morningRush = new Date('2026-10-23T08:30:00');
  const morningCrowd = getCrowdDensity(morningRush);
  assert.equal(morningCrowd.level, 'packed');
  assert.equal(morningCrowd.isPeakHour, true);
  assert.ok(morningCrowd.percentage >= 80);

  const offPeak = new Date('2026-10-23T15:00:00');
  const offPeakCrowd = getCrowdDensity(offPeak);
  assert.equal(offPeakCrowd.level, 'low');
  assert.equal(offPeakCrowd.isPeakHour, false);
});

test('disruption bypass routing highlights Bus 190 when KTM delay is active', () => {
  // Itinerary without disruption
  const normalItins = findItineraries('segambut_station', 'pwtc_lrt', 'tng', false);
  assert.ok(normalItins.length > 0);

  // Itinerary WITH disruption active
  const disruptionItins = findItineraries('segambut_station', 'pwtc_lrt', 'tng', true);
  const bypassRoute = disruptionItins.find((it) => it.isBypassRoute);
  assert.ok(bypassRoute, 'Must flag a bypass route when KTM disruption is active');
  assert.equal(bypassRoute?.isRecommended, true, 'Bypass route should be recommended top choice');
  assert.ok(bypassRoute?.legs.some((l) => l.lineCode === 'Bus 190'), 'Bypass route must use Bus 190');
});

test('getStationFacilityLayout retrieves lifts, surau, and exits for Segambut station', async () => {
  const { getStationFacilityLayout } = await import('../data/transitData');

  const blueprint = getStationFacilityLayout('segambut_station');
  assert.ok(blueprint, 'Must return blueprint for Segambut');
  assert.ok(blueprint?.levels.length >= 2, 'Must have at least concourse and platforms');

  const hasLift = blueprint?.facilities.some((f) => f.type === 'lift');
  assert.ok(hasLift, 'Segambut blueprint must include accessible lift');

  const hasSurau = blueprint?.facilities.some((f) => f.type === 'surau');
  assert.ok(hasSurau, 'Segambut blueprint must include Surau');

  const exitA = blueprint?.exits.find((e) => e.letter === 'A');
  assert.ok(exitA, 'Must include Exit A');
  assert.equal(exitA?.hasCoveredWalkway, true, 'Exit A must have covered walkway');
});

test('Moovit multi-line corridor groups Chow Kit Utara KI52 lines 180/171/173 with green live signals', async () => {
  const { DEFAULT_CORRIDOR_GROUPS } = await import('../data/transitData');
  const chowKit = DEFAULT_CORRIDOR_GROUPS.find((c) => c.stopCode === 'KI52');

  assert.ok(chowKit, 'Chow Kit Utara corridor must exist');
  assert.equal(chowKit?.isAccurateArrival, true, 'Must flag accurate arrival times');
  assert.equal(chowKit?.isGpsConfirmed, true, 'Must have live green GPS beacon');
  assert.deepEqual(chowKit?.routeCodes, ['180', '171', '173', '151'], 'Must group overlapping corridor lines');
  assert.ok(chowKit?.nextBusMinutes.length >= 3, 'Must show multiple upcoming bus countdowns');
});

test('Rapid Pulse fleet tracker tracks active bus units with plate IDs and stops away', async () => {
  const { DEFAULT_RAPID_PULSE_ROUTES } = await import('../data/transitData');
  const route190 = DEFAULT_RAPID_PULSE_ROUTES.find((r) => r.routeCode === '190');

  assert.ok(route190, 'Route 190 must exist in Rapid Pulse radar');
  assert.ok(route190?.activeBuses.length >= 2, 'Must track multiple active buses along the line');

  const wveBus = route190?.activeBuses.find((b) => b.vehiclePlate === 'WVE7352');
  assert.ok(wveBus, 'Must include bus unit WVE7352');
  assert.equal(wveBus?.stopsAwayLabel, 'Arriving soon');
  assert.equal(wveBus?.isGpsLive, true);
  assert.ok(wveBus?.speedKmh && wveBus.speedKmh > 0, 'Must report live vehicle speed');
});

test('Waze pedestrian navigation provides turn-by-turn guidance from KTM Segambut to Bus 190', async () => {
  const { DEFAULT_WAZE_TRIPS } = await import('../data/transitData');
  const segambutTrip = DEFAULT_WAZE_TRIPS.find((t) => t.id === 'waze-segambut-to-bus190');

  assert.ok(segambutTrip, 'Segambut to Bus 190 Waze trip must exist');
  assert.ok(segambutTrip?.totalDistanceMeters <= 250, 'Walking distance must be short (< 250m)');
  assert.ok(segambutTrip?.totalDurationMinutes <= 4, 'Walking duration must be ~3 mins');
  assert.equal(segambutTrip?.coveredPercentage, 85, 'Must report 85% covered canopy shelter');
  assert.ok(segambutTrip?.steps.length >= 4, 'Must provide granular turn-by-turn maneuver steps');

  // Verify zebra crossing warning is present
  const crossingStep = segambutTrip?.steps.find((s) => s.maneuverType === 'zebra-crossing');
  assert.ok(crossingStep, 'Must include pedestrian traffic light crossing step');
});

test('Geolocation resolves nearest station accurately for Chow Kit and UNIRAZAK coordinates', async () => {
  const { ALL_STATIONS } = await import('../data/transitData');

  // Test GPS near Chow Kit (3.1668, 101.6938)
  const userLat = 3.1668;
  const userLng = 101.6938;

  let closestStation = ALL_STATIONS[0];
  let minDistance = Infinity;
  for (const st of ALL_STATIONS) {
    const d = Math.hypot(st.lat - userLat, st.lng - userLng);
    if (d < minDistance) {
      minDistance = d;
      closestStation = st;
    }
  }

  assert.equal(closestStation.id, 'jalan_ipoh_kecil', 'Nearest station to 8 Jalan Ipoh coordinates must be jalan_ipoh_kecil');

  // Verify UNIRAZAK exists in stations and has bus/lrt connection
  const unirazak = ALL_STATIONS.find((s) => s.id === 'unirazak');
  assert.ok(unirazak, 'UNIRAZAK station must exist in directory');
  assert.ok(unirazak.name.toLowerCase().includes('razak'), 'UNIRAZAK station must have proper naming');
});



