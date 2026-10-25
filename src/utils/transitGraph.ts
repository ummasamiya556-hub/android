import { ALL_LINES, ALL_STATIONS, LINES_BY_ID, STATIONS_BY_ID, calculateFareBreakdown, getCrowdDensity } from '../data/transitData';
import {
  CommuterPassType,
  CoveredWalkwayInfo,
  Departure,
  LatLng,
  PlatformInfo,
  RouteItinerary,
  RouteLeg,
  Station,
  TransitAgency,
  TransitLine,
  Vehicle,
  WalkingOrientationGuide,
} from '../types/transit';

/**
 * Evaluates pedestrian covered shelter conditions for walking legs between hubs
 */
export function evaluateCoveredWalkway(fromStationId: string, toStationId: string): CoveredWalkwayInfo {
  // Segambut KTM <-> SMK Segambut (Jalan Segambut Pusat covered canopy)
  if (
    (fromStationId === 'segambut_station' && toStationId === 'smk_segambut') ||
    (fromStationId === 'smk_segambut' && toStationId === 'segambut_station')
  ) {
    return {
      isCovered: true,
      coveredPercentage: 85,
      shelterDescription: '85% covered pedestrian canopy along Jalan Segambut Pusat with push-button signal crossing',
      rainShieldStatus: 'partial',
    };
  }

  // Putra KTM <-> PWTC LRT or Putra Court (elevated weather linkbridge)
  if (
    (fromStationId === 'putra_ktm' && (toStationId === 'pwtc_lrt' || toStationId === 'putra_court' || toStationId === 'sunway_putra')) ||
    ((toStationId === 'putra_ktm') && (fromStationId === 'pwtc_lrt' || fromStationId === 'putra_court' || fromStationId === 'sunway_putra'))
  ) {
    return {
      isCovered: true,
      coveredPercentage: 100,
      shelterDescription: '100% weather-sheltered elevated pedestrian linkbridge over railway corridor',
      rainShieldStatus: 'full',
    };
  }

  // PWTC LRT <-> Sunway Putra Mall
  if (
    (fromStationId === 'pwtc_lrt' && toStationId === 'sunway_putra') ||
    (fromStationId === 'sunway_putra' && toStationId === 'pwtc_lrt')
  ) {
    return {
      isCovered: true,
      coveredPercentage: 100,
      shelterDescription: 'Air-conditioned indoor overhead skybridge link into Sunway Putra Mall',
      rainShieldStatus: 'full',
    };
  }

  return {
    isCovered: false,
    coveredPercentage: 20,
    shelterDescription: 'Standard sidewalk curb (bring umbrella during tropical downpours)',
    rainShieldStatus: 'exposed',
  };
}


/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const aVal =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return Math.round(R * c * 100) / 100;
}

/**
 * Walking speed average in KL: 4.5 km/h (~13.3 mins per km)
 */
export function estimateWalkMinutes(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm * 13.3));
}

/**
 * Find nearby stations within walk distance (default 0.45 km)
 */
export function findNearbyStations(stationId: string, maxRadiusKm = 0.45): { station: Station; distanceKm: number; walkMinutes: number }[] {
  const current = STATIONS_BY_ID.get(stationId);
  if (!current) return [];

  const nearby: { station: Station; distanceKm: number; walkMinutes: number }[] = [];
  for (const s of ALL_STATIONS) {
    if (s.id === stationId) continue;
    const dist = calculateDistanceKm(current, s);
    if (dist <= maxRadiusKm) {
      nearby.push({
        station: s,
        distanceKm: dist,
        walkMinutes: estimateWalkMinutes(dist),
      });
    }
  }

  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Checks if two stations are on the same line in an ordered direction
 */
export function getDirectLineSegment(
  fromId: string,
  toId: string,
  line: TransitLine
): { intermediate: string[]; stopCount: number; valid: boolean } {
  const fromIndex = line.stations.indexOf(fromId);
  const toIndex = line.stations.indexOf(toId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return { intermediate: [], stopCount: 0, valid: false };
  }

  if (fromIndex < toIndex) {
    const intermediate = line.stations.slice(fromIndex, toIndex + 1);
    return {
      intermediate,
      stopCount: toIndex - fromIndex,
      valid: true,
    };
  } else {
    // Reverse direction
    const intermediate = line.stations.slice(toIndex, fromIndex + 1).reverse();
    return {
      intermediate,
      stopCount: fromIndex - toIndex,
      valid: true,
    };
  }
}

/**
 * Computes travel time for transit leg based on stops and mode
 */
export function estimateLegTimeMinutes(stopCount: number, mode: TransitLine['mode']): number {
  // Rail: ~2.5 mins per stop (including dwell)
  // Bus / Go KL: ~3-4 mins per stop
  const timePerStop = mode === 'rail' ? 2.5 : 3.5;
  return Math.max(3, Math.round(stopCount * timePerStop));
}

/**
 * Find exact platform for destination station at an origin station
 */
export function findPlatformForDestination(stationId: string, destStationIdOrName: string): PlatformInfo | undefined {
  const station = STATIONS_BY_ID.get(stationId);
  if (!station || !station.platforms || station.platforms.length === 0) return undefined;

  const targetStation = STATIONS_BY_ID.get(destStationIdOrName);
  const targetName = targetStation?.name || targetStation?.shortName || destStationIdOrName;

  for (const plat of station.platforms) {
    if (
      plat.destinations.some(
        (d) =>
          d.toLowerCase().includes(targetName.toLowerCase()) ||
          (targetStation && targetStation.shortName && d.toLowerCase().includes(targetStation.shortName.toLowerCase())) ||
          (targetStation && d.toLowerCase().includes(targetStation.id))
      )
    ) {
      return plat;
    }
  }

  return station.platforms[0];
}

/**
 * Generate comprehensive itineraries between origin and destination
 */
export function findItineraries(
  originId: string,
  destId: string,
  preferredPass: CommuterPassType = 'tng',
  activeDisruption: boolean = false
): RouteItinerary[] {
  if (originId === destId) return [];

  const origin = STATIONS_BY_ID.get(originId);
  const dest = STATIONS_BY_ID.get(destId);
  if (!origin || !dest) return [];

  const rawItineraries: RouteItinerary[] = [];

  // 1. Direct Lines
  for (const line of ALL_LINES) {
    const segment = getDirectLineSegment(originId, destId, line);
    if (segment.valid) {
      const legDuration = estimateLegTimeMinutes(segment.stopCount, line.mode);
      const legDist = Math.round(segment.stopCount * 1.4 * 10) / 10;
      const legFareRm = line.fareRm !== undefined ? line.fareRm : line.isGoKL ? 0 : line.mode === 'rail' ? 1.60 : 1.00;
      const platGuide = findPlatformForDestination(originId, destId);

      const leg: RouteLeg = {
        id: `leg-${line.id}-${originId}-${destId}`,
        mode: line.mode,
        lineId: line.id,
        lineCode: line.code,
        lineName: line.name,
        color: line.color,
        fromStationId: originId,
        fromStationName: origin.name,
        toStationId: destId,
        toStationName: dest.name,
        stopCount: segment.stopCount,
        intermediateStations: segment.intermediate,
        durationMinutes: legDuration,
        distanceKm: legDist,
        instruction: `Board ${line.code} towards ${dest.shortName || dest.name}`,
        isGpsConfirmed: true,
        isGoKL: line.isGoKL,
        fareRm: legFareRm,
        platformGuide: platGuide,
      };

      const isKtm = line.id.startsWith('ktm');
      const longWait = isKtm && (originId === 'segambut_station' || destId === 'segambut_station')
        ? '⚠️ High Headway Notice: KTM Komuter runs every 40-45 min. For faster transit, use Rapid KL Bus 190 (arrives every 10 min, RM 1.00).'
        : undefined;

      const platAlert = platGuide
        ? `${platGuide.sideName}. ${platGuide.tips}`
        : undefined;

      rawItineraries.push({
        id: `direct-${line.id}`,
        title: line.name,
        summary: `Direct via ${line.code} (${segment.stopCount} stops)`,
        totalDurationMinutes: isKtm ? legDuration + 25 : legDuration,
        totalDistanceKm: legDist,
        totalFare: line.fare,
        totalFareRm: legFareRm,
        transferCount: 0,
        legs: [leg],
        sources: line.agency,
        isRecommended: line.isGoKL || (!isKtm && line.code === 'Bus 190'),
        isFastest: !isKtm,
        isFreeOrCheapest: line.isGoKL,
        highlights: [
          line.isGoKL ? 'Go KL Free City Bus (RM 0.00)' : `Moovit Fare: RM ${legFareRm.toFixed(2)}`,
          'Live GPS Signal Confirmed',
          platGuide ? `Stand on ${platGuide.platformNumber} (${platGuide.headingDirection})` : `${segment.stopCount} stops without transfer`,
        ],
        longWaitAlert: longWait,
        platformAlert: platAlert,
      });
    }
  }

  // 2. Walk link + Direct Line (Crucial for Putra Court <-> PWTC LRT <-> MITEC)
  const originNearby = findNearbyStations(originId, 0.45);
  for (const near of originNearby) {
    for (const line of ALL_LINES) {
      const segment = getDirectLineSegment(near.station.id, destId, line);
      if (segment.valid) {
        const legDuration = estimateLegTimeMinutes(segment.stopCount, line.mode);
        const legDist = Math.round(segment.stopCount * 1.4 * 10) / 10;
        const legFareRm = line.fareRm !== undefined ? line.fareRm : line.isGoKL ? 0 : line.mode === 'rail' ? 1.60 : 1.00;
        const platGuide = findPlatformForDestination(near.station.id, destId);

        // Find relevant walking orientation guide
        const walkGuide = origin.walkingGuides?.find(
          (g) =>
            g.toLocation.toLowerCase().includes(near.station.shortName?.toLowerCase() || '') ||
            g.toLocation.toLowerCase().includes(line.code.toLowerCase())
        );

        const walkway = evaluateCoveredWalkway(originId, near.station.id);

        const walkLeg: RouteLeg = {
          id: `walk-${originId}-${near.station.id}`,
          mode: 'walk',
          color: '#94a3b8',
          fromStationId: originId,
          fromStationName: origin.name,
          toStationId: near.station.id,
          toStationName: near.station.name,
          stopCount: 0,
          intermediateStations: [originId, near.station.id],
          durationMinutes: near.walkMinutes,
          distanceKm: near.distanceKm,
          instruction: walkGuide
            ? `${walkGuide.compassHeading}: ${walkGuide.stepByStep[0]}`
            : `Walk ${near.walkMinutes} min (${Math.round(near.distanceKm * 1000)}m) to ${near.station.shortName || near.station.name}`,
          walkingOrientation: walkGuide,
          coveredWalkway: walkway,
        };

        const transitLeg: RouteLeg = {
          id: `transit-${line.id}-${near.station.id}-${destId}`,
          mode: line.mode,
          lineId: line.id,
          lineCode: line.code,
          lineName: line.name,
          color: line.color,
          fromStationId: near.station.id,
          fromStationName: near.station.name,
          toStationId: destId,
          toStationName: dest.name,
          stopCount: segment.stopCount,
          intermediateStations: segment.intermediate,
          durationMinutes: legDuration,
          distanceKm: legDist,
          instruction: `Board ${line.code} towards ${dest.shortName || dest.name}`,
          isGpsConfirmed: true,
          isGoKL: line.isGoKL,
          fareRm: legFareRm,
          platformGuide: platGuide,
        };

        rawItineraries.push({
          id: `walk-direct-${near.station.id}-${line.id}`,
          title: `Walk to ${near.station.shortName} + ${line.code}`,
          summary: `Walk ${near.walkMinutes} min to ${near.station.shortName} ➔ ${line.code}`,
          totalDurationMinutes: near.walkMinutes + legDuration,
          totalDistanceKm: Math.round((near.distanceKm + legDist) * 10) / 10,
          totalFare: line.fare,
          totalFareRm: legFareRm,
          transferCount: 1,
          legs: [walkLeg, transitLeg],
          sources: ['google', 'moovit', 'rapid_pulse'],
          isRecommended: line.isGoKL,
          isFreeOrCheapest: line.isGoKL,
          coveredWalkwaySummary: walkway,
          highlights: [
            `Walk ${Math.round(near.distanceKm * 1000)}m to nearby interchange`,
            walkway.isCovered ? `Covered Shelter: ${walkway.shelterDescription}` : 'Outdoor sidewalk',
            line.isGoKL ? 'Go KL Free Route' : 'Rapid Transit',
            'Moovit Green GPS Signal',
          ],
        });
      }
    }
  }

  // 3. 1-Transfer Journeys across Lines (e.g. Line A -> Interchange -> Line B)
  const candidateLinesA = ALL_LINES.filter((l) => l.stations.includes(originId));
  const candidateLinesB = ALL_LINES.filter((l) => l.stations.includes(destId));

  for (const lineA of candidateLinesA) {
    for (const lineB of candidateLinesB) {
      if (lineA.id === lineB.id) continue;

      // Find common stations
      const commonStations = lineA.stations.filter((s) => lineB.stations.includes(s));
      for (const transferId of commonStations) {
        if (transferId === originId || transferId === destId) continue;

        const segA = getDirectLineSegment(originId, transferId, lineA);
        const segB = getDirectLineSegment(transferId, destId, lineB);

        if (segA.valid && segB.valid) {
          const transferStation = STATIONS_BY_ID.get(transferId);
          const durA = estimateLegTimeMinutes(segA.stopCount, lineA.mode);
          const durB = estimateLegTimeMinutes(segB.stopCount, lineB.mode);
          const transferWait = 4; // average wait at interchange

          const legA: RouteLeg = {
            id: `transfer-a-${lineA.id}`,
            mode: lineA.mode,
            lineId: lineA.id,
            lineCode: lineA.code,
            lineName: lineA.name,
            color: lineA.color,
            fromStationId: originId,
            fromStationName: origin.name,
            toStationId: transferId,
            toStationName: transferStation?.name || transferId,
            stopCount: segA.stopCount,
            intermediateStations: segA.intermediate,
            durationMinutes: durA,
            distanceKm: Math.round(segA.stopCount * 1.3 * 10) / 10,
            instruction: `Take ${lineA.code} to ${transferStation?.shortName || transferStation?.name}`,
            isGpsConfirmed: true,
            isGoKL: lineA.isGoKL,
          };

          const legB: RouteLeg = {
            id: `transfer-b-${lineB.id}`,
            mode: lineB.mode,
            lineId: lineB.id,
            lineCode: lineB.code,
            lineName: lineB.name,
            color: lineB.color,
            fromStationId: transferId,
            fromStationName: transferStation?.name || transferId,
            toStationId: destId,
            toStationName: dest.name,
            stopCount: segB.stopCount,
            intermediateStations: segB.intermediate,
            durationMinutes: durB,
            distanceKm: Math.round(segB.stopCount * 1.3 * 10) / 10,
            instruction: `Transfer to ${lineB.code} towards ${dest.shortName || dest.name}`,
            isGpsConfirmed: true,
            isGoKL: lineB.isGoKL,
          };

          rawItineraries.push({
            id: `transfer-${lineA.id}-${lineB.id}-${transferId}`,
            title: `${lineA.code} ➔ ${lineB.code}`,
            summary: `Transfer at ${transferStation?.shortName || transferStation?.name} (${durA + durB + transferWait} min)`,
            totalDurationMinutes: durA + durB + transferWait,
            totalDistanceKm: Math.round((legA.distanceKm + legB.distanceKm) * 10) / 10,
            totalFare: `${lineA.fare} + ${lineB.fare}`,
            transferCount: 1,
            legs: [legA, legB],
            sources: ['google', 'moovit', 'rapid_pulse'],
            highlights: [
              `Interchange at ${transferStation?.shortName || transferStation?.name}`,
              `Total ${segA.stopCount + segB.stopCount} stops`,
            ],
          });
        }
      }
    }
  }

  // Smart Deduplication: deduplicate overlapping routes, add fare pass rates, crowd level & disruption bypass
  return deduplicateItineraries(rawItineraries, preferredPass, activeDisruption);
}

/**
 * Smart Deduplication Engine:
 * Combines overlapping routes from Google Maps, Moovit, and Rapid Pulse into
 * single authoritative entries with merged source badges, multi-tier fares, and crowd indicators.
 */
export function deduplicateItineraries(
  itineraries: RouteItinerary[],
  preferredPass: CommuterPassType = 'tng',
  activeDisruption: boolean = false
): RouteItinerary[] {
  const mergedMap = new Map<string, RouteItinerary>();

  for (const item of itineraries) {
    const signature = item.legs
      .map((l) => `${l.mode}:${l.lineId || 'walk'}:${l.fromStationId}->${l.toStationId}`)
      .join('|');

    if (mergedMap.has(signature)) {
      const existing = mergedMap.get(signature)!;
      const allSources = Array.from(new Set([...existing.sources, ...item.sources]));
      existing.sources = allSources as TransitAgency[];
      if (item.totalDurationMinutes < existing.totalDurationMinutes) {
        existing.totalDurationMinutes = item.totalDurationMinutes;
      }
      existing.highlights = Array.from(new Set([...existing.highlights, ...item.highlights]));
    } else {
      mergedMap.set(signature, { ...item });
    }
  }

  const results = Array.from(mergedMap.values());
  const currentCrowd = getCrowdDensity();

  for (const it of results) {
    // Populate dynamic multi-tier fares
    const baseFare = it.totalFareRm !== undefined ? it.totalFareRm : 1.60;
    it.fares = calculateFareBreakdown(baseFare, preferredPass);
    it.crowdDensity = currentCrowd;

    // Attach covered walkway summary if walking leg exists
    const walkLeg = it.legs.find((l) => l.mode === 'walk');
    if (walkLeg && !it.coveredWalkwaySummary) {
      const walkway = evaluateCoveredWalkway(walkLeg.fromStationId, walkLeg.toStationId);
      walkLeg.coveredWalkway = walkway;
      it.coveredWalkwaySummary = walkway;
    }

    // Handle Active Rail Disruption
    const hasKtmLeg = it.legs.some((l) => l.lineId?.startsWith('ktm'));
    const isBusBypass = it.legs.some((l) => l.lineCode === 'Bus 190' || l.lineCode === 'GOKL 13');

    if (activeDisruption && hasKtmLeg) {
      it.totalDurationMinutes += 40;
      it.isRecommended = false;
      it.longWaitAlert = '🚨 KTM Track Maintenance Delay: Estimated 40-minute wait on platform. Use Bus 190 bypass!';
    }

    if (activeDisruption && isBusBypass && !hasKtmLeg) {
      it.isBypassRoute = true;
      it.isRecommended = true;
      it.highlights.unshift('⚡ Recommended Disruption Bypass (Avoids KTM Delay)');
    }
  }

  // Rank itineraries
  results.sort((a, b) => {
    if (activeDisruption) {
      if (a.isBypassRoute && !b.isBypassRoute) return -1;
      if (!a.isBypassRoute && b.isBypassRoute) return 1;
    }
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.transferCount !== b.transferCount) return a.transferCount - b.transferCount;
    return a.totalDurationMinutes - b.totalDurationMinutes;
  });

  if (results.length > 0 && !results.some((r) => r.isRecommended)) {
    results[0].isRecommended = true;
  }

  return results;
}

/**
 * Live Departures Generator for Station Inspector
 * Formats departures with Moovit green GPS confirmation badge, crowd density, and disruption bypass
 */
export function getStationDepartures(stationId: string, activeDisruption: boolean = false): Departure[] {
  const station = STATIONS_BY_ID.get(stationId);
  if (!station) return [];

  const departures: Departure[] = [];

  for (const lineId of station.lines) {
    const line = LINES_BY_ID.get(lineId);
    if (!line) continue;

    const stationIdx = line.stations.indexOf(stationId);
    if (stationIdx === -1) continue;

    // Outbound destination (last station)
    const lastStationId = line.stations[line.stations.length - 1];
    const firstStationId = line.stations[0];

    // Determine viable destinations
    const destinations: string[] = [];
    if (stationIdx < line.stations.length - 1) {
      const destStation = STATIONS_BY_ID.get(lastStationId);
      if (destStation) destinations.push(destStation.shortName || destStation.name);
    }
    if (stationIdx > 0) {
      const origStation = STATIONS_BY_ID.get(firstStationId);
      if (origStation) destinations.push(origStation.shortName || origStation.name);
    }

    if (destinations.length === 0) {
      destinations.push(line.name);
    }

    // Generate upcoming arrivals with realistic countdown
    destinations.forEach((dest, i) => {
      let minOffset = (stationIdx * 3 + i * 6) % 11 + 2;
      const isKtm = line.id === 'ktm-seremban' || line.id === 'ktm-batu-caves';
      const isKtmAtSegambut = isKtm && stationId === 'segambut_station';
      const isHeadingPutraOrKl = dest.toLowerCase().includes('putra') || dest.toLowerCase().includes('kl sentral');

      // Specifically model the commuter's real-life pain point at Segambut KTM
      if (activeDisruption && isKtm) {
        minOffset += 38;
      } else if (isKtmAtSegambut && isHeadingPutraOrKl) {
        minOffset = 42; // Next train in 42 min
      } else if (line.id === 'bus-190' && (stationId === 'segambut_station' || stationId === 'smk_segambut')) {
        minOffset = 3; // Bus 190 is nearby!
      }

      const platGuide = findPlatformForDestination(stationId, dest);
      const isLongWait = minOffset > 25;

      const altSuggestion = isLongWait && (isKtmAtSegambut || (activeDisruption && isKtm))
        ? {
            lineCode: 'Bus 190',
            minutesAway: 3,
            fare: 'RM 1.00 (Touch \'n Go / My50)',
            description: 'Avoid 40+ min KTM delay! Rapid KL Bus 190 arrives in 3 min at the station front bay to reach Putra / PWTC in 14 min.',
          }
        : undefined;

      const currentCrowd = getCrowdDensity();
      const crowdLvl: 'low' | 'moderate' | 'packed' =
        minOffset <= 5 ? currentCrowd.level : minOffset <= 15 ? 'moderate' : 'low';

      departures.push({
        lineId: line.id,
        lineCode: line.code,
        lineName: line.name,
        destination: dest,
        color: line.color,
        mode: line.mode,
        minutesAway: minOffset,
        isGpsConfirmed: true, // Moovit-style verified GPS
        isGoKL: line.isGoKL,
        vehicleNumber: `${line.code.replace(/\s+/g, '')}-${100 + ((stationIdx * 7 + i * 3) % 900)}`,
        platform: platGuide ? `Platform ${platGuide.platformNumber} (${platGuide.headingDirection})` : line.mode === 'rail' ? `Platform ${(i % 2) + 1}` : undefined,
        bay: line.mode !== 'rail' ? (stationId === 'smk_segambut' ? 'KL526 School Curb' : stationId === 'segambut_station' ? 'Station Front Bay' : `Bay ${((stationIdx + i) % 3) + 1}`) : undefined,
        sources: line.agency,
        fareRm: line.fareRm !== undefined ? line.fareRm : line.isGoKL ? 0 : line.mode === 'rail' ? 1.60 : 1.00,
        platformGuide: platGuide,
        isLongWaitWarning: isLongWait,
        crowdLevel: crowdLvl,
        alternativeSuggestion: altSuggestion,
      });
    });
  }

  return departures.sort((a, b) => a.minutesAway - b.minutesAway);
}


/**
 * Calculates geographic bearing in degrees (0 - 360) from point A to point B
 */
export function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const dLng = destLngRad - startLngRad;
  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Generate initial fleet of live moving buses and trains for Rapid Pulse radar
 */
export function generateInitialFleet(): Vehicle[] {
  const fleet: Vehicle[] = [];

  ALL_LINES.forEach((line) => {
    if (line.stations.length < 2) return;

    // Place 1 or 2 vehicles along each line
    const vehicleCount = line.stations.length >= 5 ? 2 : 1;
    for (let v = 0; v < vehicleCount; v++) {
      const curIdx = (v * Math.floor(line.stations.length / 2) + 1) % (line.stations.length - 1);
      const nextIdx = curIdx + 1;
      const curStation = STATIONS_BY_ID.get(line.stations[curIdx]);
      const nextStation = STATIONS_BY_ID.get(line.stations[nextIdx]);

      if (!curStation || !nextStation) continue;

      const progress = 0.25 + v * 0.4;
      const lat = curStation.lat + (nextStation.lat - curStation.lat) * progress;
      const lng = curStation.lng + (nextStation.lng - curStation.lng) * progress;

      // Accurate spherical bearing
      const bearing = calculateBearing(curStation.lat, curStation.lng, nextStation.lat, nextStation.lng);

      fleet.push({
        id: `veh-${line.id}-${v + 1}`,
        lineId: line.id,
        vehicleNumber: `${line.code.replace(/\s+/g, '')}-${200 + (line.stations.length * 9 + v * 17) % 700}`,
        currentStationId: curStation.id,
        nextStationId: nextStation.id,
        progress,
        lat,
        lng,
        bearing,
        speedKmh: line.mode === 'rail' ? 42 : 28,
        isGpsConfirmed: true,
        occupancy: v % 3 === 0 ? 'medium' : v % 2 === 0 ? 'low' : 'high',
        direction: 'outbound',
        lastUpdatedSecondsAgo: 2,
      });
    }
  });

  return fleet;
}

/**
 * Smoothly advance vehicle positions for live moving radar
 */
export function advanceFleetPositions(fleet: Vehicle[], deltaProgress = 0.03): Vehicle[] {
  return fleet.map((v) => {
    const line = LINES_BY_ID.get(v.lineId);
    if (!line || line.stations.length < 2) return v;

    let newProgress = v.progress + deltaProgress;
    let curStationId = v.currentStationId;
    let nextStationId = v.nextStationId;

    if (newProgress >= 1.0) {
      newProgress = 0.0;
      const nextIdx = line.stations.indexOf(nextStationId);
      if (nextIdx !== -1 && nextIdx < line.stations.length - 1) {
        curStationId = nextStationId;
        nextStationId = line.stations[nextIdx + 1];
      } else {
        // Loop back to start
        curStationId = line.stations[0];
        nextStationId = line.stations[1];
      }
    }

    const curStation = STATIONS_BY_ID.get(curStationId);
    const nextStation = STATIONS_BY_ID.get(nextStationId);

    if (!curStation || !nextStation) return v;

    const lat = curStation.lat + (nextStation.lat - curStation.lat) * newProgress;
    const lng = curStation.lng + (nextStation.lng - curStation.lng) * newProgress;
    const bearing = calculateBearing(curStation.lat, curStation.lng, nextStation.lat, nextStation.lng);

    return {
      ...v,
      currentStationId: curStationId,
      nextStationId,
      progress: newProgress,
      lat,
      lng,
      bearing,
      lastUpdatedSecondsAgo: 1,
    };
  });
}
