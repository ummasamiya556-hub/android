# Klang Valley Transit Companion: Moovit Live Corridors, Waze Walking HUD & Rapid Pulse Radar

A unified transit navigation system for Kuala Lumpur and Selangor commuters that solves multi-bus corridor uncertainty, prevents lengthy KTM wait traps (such as the 40+ minute KTM Segambut wait to Putra) via automated smart bypass alerts to Bus 190, and provides high-contrast Waze-style turn-by-turn pedestrian guidance between stations and bus stops.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design and functional choices were confirmed based on your requirements and real-world commute scenarios:

- **Confirmed Layout**: All-in-one responsive screen integrating Moovit multi-line departure corridors, Waze turn-by-turn pedestrian HUD, and Rapid Pulse live bus fleet radar without jarring screen swaps.
- **Confirmed KTM Segambut Bypass**: Proactive delay detection (e.g., KTM headway >20 min) that triggers an immediate high-contrast alert card with a one-tap switch to the 3-minute walking route to Bus Stop KL522 (SMK Segambut) for Bus 190 (arriving in 6–10 mins).
- **Confirmed Walking HUD**: Waze-style top high-contrast maneuver banner with bold directional icons (U-turn, turn left/right, keep straight), remaining meter countdowns, and active street names (`Jalan Ipoh Kecil`, `Jalan Segambut Covered Canopy`, `Jalan 1/64A`).
- **Confirmed Live Bus Status**: Multi-line corridor grouping (`180 / 171 / 173 / 151`) showing green live GPS signal badges (`Leaves in 2, 8, 9 mins`), exact timetable times (`4:23 pm`, `5:05 pm`), and "Arrival time is accurate" verified indicators.
- **Confirmed Fleet Radar**: Rapid Pulse bus tracker showing active vehicle registration IDs (`WVE7352`, `WUW8426`), stops away (`Arriving soon`, `3 stops away`), line traversal stepper, and terminus departure status.

---

## 1. Overview & Core Concept

### What It Does
This application is a commuter co-pilot tailored to the unique operational realities of Klang Valley transit (Rapid KL Buses, LRT, MRT, Monorail, and KTM Komuter). It eliminates the two most frustrating commuter experiences: guessing whether a bus is actually running along a multi-bus corridor, and getting stranded on platforms with 40+ minute KTM headways when a fast bus alternative is just a short walk away.

### Target Audience & Persona
- **Daily Klang Valley Commuters**: Transit riders navigating multi-operator hubs (Chow Kit, Segambut, Pasar Seni, KL Sentral, PWTC, Masjid Jamek).
- **First-and-Last Mile Walkers**: Pedestrians needing clear, unambiguous street signs to find obscure bus stops, covered pedestrian walkways, and station exits without getting lost on multi-lane Malaysian arterial roads.

### Key Value
- **Zero Transit Traps**: Proactively detects 25–45+ minute KTM headways before you tap your card at KTM Segambut, offering a 3-minute walk to Bus 190 to save over 35 minutes.
- **Corridor Awareness**: Instead of tracking just one bus, tracks all overlapping lines on shared segments (e.g., Chow Kit Utara KI52 lines `180 / 171 / 173 / 151`) with combined countdown badges.
- **Stress-Free Pedestrian Navigation**: Adapts Waze's proven driver navigation clarity to sidewalks, zebra crossings, overhead pedestrian bridges, and station concourse exits.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Corridor Departure Scanning (Moovit Paradigm)**:
   - The user selects or searches a station (e.g., `Chow Kit Utara (KI52)` or `KTM Segambut`).
   - Grouped bus lines (`180 / 171 / 173`) appear in a unified card with a green GPS signal indicator: `Leaves in 2, 8, 9 mins`.
   - Expanding the card reveals individual scheduled and real-time departures, verified vehicle IDs, and crowdedness badges.

2. **KTM Segambut Delay & Auto-Bypass (The 40+ Min Trap Prevention)**:
   - When viewing or arriving at KTM Segambut towards Putra/KL Sentral, the engine evaluates KTM live train headway (e.g., Next train in 42 mins at 8:10 PM).
   - A high-priority amber warning banner slides in: `High KTM Wait Detected (42 min) · Bus 190 arrives in 7 min at SMK Segambut Stop`.
   - Tapping `Switch to Bus 190 Bypass (Save 35 min)` immediately recalculates the itinerary and activates the Waze Walking HUD.

3. **Waze-Style Pedestrian Turn-by-Turn HUD**:
   - The top banner turns deep slate/obsidian (`#0f172a`) with bright white and electric teal typography.
   - Large directional maneuver icons (sharp left, right, U-turn, straight) indicate the next move with precise meter counts (`In 15 m`).
   - A bold street pill (`Jalan Ipoh Kecil` ➔ `Jalan Segambut Walkway`) shows the current and upcoming street names with covered walkway indicators.
   - Live progress bar updates as the user moves closer to the bus stop or station gantry.

4. **Rapid Pulse Live Fleet Radar & Station Stepper**:
   - Tapping any bus route (e.g., `Route 190: Desa Sri Hartamas ~ Lin Ho / Jln Lekiu`) opens the live fleet view.
   - Active bus units display their actual vehicle license plates (`WVE7352`, `WUW8426`, `WUW1359`), current speed, and wheelchair accessibility.
   - A vertical progression line shows the bus leaving the initial terminus, crossing intermediate stops in real time, and estimating time to arrival (`Arriving soon` or `15 stops away`).

### Visual Identity & Theme
- **Color Palette**:
  - Dominant Neutral: Obsidian Slate (`#0B0F19`) and Crisp White (`#FFFFFF`) with cool slate structural borders (`#E2E8F0` / `#1E293B`).
  - Moovit Live Signal: Emerald Green (`#10B981`) for confirmed live GPS arrivals vs Muted Slate (`#64748B`) for static timetable entries.
  - Waze Navigation Accent: Deep Navy Banner (`#0F172A`) with Waze Cyan (`#06B6D4`) and Caution Amber (`#F59E0B`).
  - Operator Brand Marks: Rapid KL Crimson (`#DC2626`), MRT Green (`#059669`), LRT Yellow (`#D97706`), and KTM Blue (`#2563EB`).
- **Typography**:
  - Headings & Wordmark: Plus Jakarta Sans with crisp geometric clarity and balanced headline wrapping.
  - Tabular Numerals: Tabular figures (`tabular-nums`) for departure minutes, vehicle speeds, and countdown timers to eliminate visual jitter.
  - Waze Maneuver Typography: Bold, high-contrast, condensed signage type for immediate legibility in bright sunlight.
- **Ergonomics & Layout**:
  - Standard 44px+ touch targets across all mobile tap rows and buttons.
  - 15% sticky surface cap on mobile viewports to prevent screen claustrophobia.
  - Seamless desktop expansion into a balanced 3-column command dashboard.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Corridor Grouping vs. Single-Line Departure Rows
- **Chosen Approach**: Group all bus routes that share a common corridor into a single multi-badge row (`180 · 171 · 173 · 151` ➔ `Leaves in 2, 8, 9 mins`), matching Moovit's signature real-world UX.
- **Why**: Commuters traveling along shared trunk roads (e.g., Jalan Ipoh to Chow Kit, or Segambut to Medan Tuanku) do not care which specific route number arrives first, as long as it reaches their destination. Grouping eliminates duplicate scanning.
- **Alternatives Considered**: Individual route rows (Rapid Pulse style only) force users to mentally compare 5 different timetable cards to see which arrives first.

### Decision 2: Automated Delay Bypass Trigger for KTM Segambut
- **Chosen Approach**: Proactively trigger an automated bypass suggestion whenever KTM train wait exceeds 20 minutes, comparing door-to-door ETA between waiting for KTM vs walking 3 minutes to Bus 190.
- **Why**: KTM Komuter operates on 30–60 minute headways outside peak hours. Users who enter the station without checking face up to 45 minutes of wasted platform time.
- **Alternatives Considered**: Silent listing of alternatives in a dropdown requires the user to already know they need to search for alternatives.

### Decision 3: Pedestrian-Optimized Waze Navigation
- **Chosen Approach**: Adapt Waze's top high-contrast maneuver bar for walking, with pedestrian-specific landmarks (covered canopy entrances, escalator exits, zebra crossings, pedestrian overpasses).
- **Why**: Commuters frequently struggle to locate hidden bus stops like SMK Segambut KL522 or connecting bridges between LRT and KTM stations.
- **Alternatives Considered**: Standard Google Maps overhead polyline without prominent maneuver signs is difficult to read while walking under bright sun.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Transit Navigation Engine                       │
│  ┌──────────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │ Moovit Corridor Bus  │  │ Rapid Pulse Fleet │  │ Waze Pedestrian │  │
│  │ Grouping & Countdown │  │ Radar & Stepper   │  │ Navigation HUD  │  │
│  └──────────┬───────────┘  └─────────┬─────────┘  └────────┬────────┘  │
└─────────────┼────────────────────────┼─────────────────────┼───────────┘
              │                        │                     │
              ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Unified Transit State                           │
│  • Active Route & Itinerary Selection                                  │
│  • Live GPS Departures (Emerald Signal vs Scheduled)                  │
│  • KTM Segambut Headway Monitor & Bus 190 Bypass Engine               │
│  • Pedestrian Waypoints, Maneuver Steps & Covered Walkways             │
│  • Active Bus Fleet Units (WVE7352, WUW8426, Stops Away, Speed)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface Views                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Waze Walking HUD: Top Obsidian Banner (Maneuver + Distance + St) │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ KTM Segambut Trap Alert: Auto-Bypass to Bus 190 Card             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Moovit Corridor Board: Multi-Line Countdown Badges (180/171/173) │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Rapid Pulse Live Radar: Fleet Plate IDs, Stops Away & Stepper    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Corridor Departure**: Route numbers array (`['180', '171', '173', '151']`), destination label, departure countdowns array (`[2, 8, 9]`), live GPS flag, scheduled departure times (`['4:23 PM', '5:05 PM']`), verified accuracy flag.
- **Fleet Bus Unit**: Unit plate (`WVE7352`), route ID (`190`), heading, current speed (`24 km/h`), stops away (`0 - Arriving soon`, `15 stops away`), last station crossed (`Segambut Bahagia`), terminus departure timestamp.
- **Walking Maneuver Step**: Maneuver icon (`u-turn`, `turn-left`, `turn-right`, `straight`), distance in meters, street/pathway name, next instruction preview, covered walkway flag, accessibility rating.
- **KTM Headway Alert**: Active origin (`KTM Segambut`), destination (`Putra`), KTM wait time (`42 min`), alternative bus line (`Bus 190`), walking distance to bus stop (`210 m`, `3 min`), time saved (`35 min`).

### Interactive Component & State Mapping
- **Moovit Corridor Card**: Clicking any corridor expands the departure timetable and enables filtering by specific line.
- **Bypass Action Button**: Clicking `Switch to Bus 190 Bypass` automatically loads the walking HUD to Bus Stop KL522 and focuses the Rapid Pulse live bus tracker on Route 190.
- **Waze Walking HUD**: Interactive next/previous step controls, simulation mode (advancing steps and meters), and toggle for covered walkway highlights.
- **Rapid Pulse Radar**: Clicking on any vehicle unit (`WVE7352`) centers the map radar on the bus and highlights its traversal path along the line stops.
