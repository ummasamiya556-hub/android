# Klang Valley All-in-One Transit Navigator (Google Maps + Moovit + Rapid Pulse + Go KL)

A unified transit navigation engine that replaces the need to juggle three separate apps (**Google Maps**, **Moovit**, and **Rapid KL Pulse**). Combines Google Maps' intuitive directional navigation and passed-station grey tracking, Moovit's real-time confirmed green GPS signals and exclusive Go KL bus lines, and Rapid Pulse's live moving vehicle radar—with smart deduplication so identical routes are merged cleanly.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Revised Core Features Based on Commuter Pain Points**:
> 1. **Live Moving Bus & Train Radar (from Rapid Pulse)**: Watch buses (e.g. Bus 190, Bus 851, Go KL Magenta) and trains move in real-time along their routes between stops on both the map and line diagrams.
> 2. **Confirmed Live Signal in Green (from Moovit)**: Clear visual indicator showing when an arrival is verified via live GPS (bright green broadcast radar beacon `Confirmed 2 min`) versus timetable estimates.
> 3. **Smart Station Detection & Nearby Interchanges (Fixes Google Maps PWTC / Putra Court Issue)**: Properly connects nearby stations (e.g., recognizing Putra Court is walking distance to PWTC LRT and Putra KTM) to reach destinations like MITEC / MATRADE via Go KL Magenta (GOKL13) and Bus 190.
> 4. **Active Journey Follow Mode (Google Maps Style)**: Tap "Start Journey" to enter live navigation mode. As your trip progresses, crossed stations transition from active line color to muted grey, showing exact remaining stops, next interchange alerts, and live headway.
> 5. **Smart Unified Deduplication**: Google Maps, Moovit, and Rapid Pulse often overlap. The app merges identical line segments and schedules into a single authoritative card rather than displaying repeated duplicate entries.

---

### 1. Overview & Core Concept

- **The Problem It Solves**:
  - Today, a KL commuter must use **Google Maps** for general walking and train directions, **Moovit** because Go KL buses and live green "confirmed" signals only appear there, and **Rapid KL Pulse** to see where the physical bus actually is right now.
  - Furthermore, Google Maps often fails edge-case multi-modal connections (such as travelling from Putra Court near PWTC LRT to MITEC, failing to recommend the PWTC/Putra link to Bus 190 or Go KL 13 Magenta to MATRADE/MITEC).
- **The Solution**:
  - A single, cohesive transit command dashboard that unifies all 15 Go KL City Bus routes, Rapid KL buses (including 190, 851, trunk and feeder buses), LRT (Ampang, Sri Petaling, Kelana Jaya), MRT (Kajang & Putrajaya lines), KL Monorail, KTM Komuter, and ERL.
  - Real-time vehicle simulation matching published Rapid KL and Go KL dispatch cadences, providing moving vehicle icons on live routes.

---

### 2. User Experience & Visual Design

- **Layout Structure**:
  - **Desktop (1440px)**:
    1. *Left Panel (400px)*: Unified Journey Planner & Search, preset quick-routes (including Putra Court ↔ MITEC, Masjid Jamek ↔ Bus 851, KLCC ↔ Bukit Bintang), deduplicated itinerary comparison cards, and step-by-step active journey drawer.
    2. *Center Stage (Flexible)*: Dual-mode interactive canvas:
       - **Geographic Network & Live Radar Map**: Interactive Klang Valley map showing bus stops, train stations, moving bus/train markers with speed/bearing, and route polylines.
       - **Schematic Line Diagram**: London/Tokyo-style strip map where active vehicles glide along the line, and stations turn grey as the vehicle passes.
    3. *Right Panel (340px)*: Live Station Departure Board & Vehicle Inspector. Displays incoming arrivals with Moovit-style green "Confirmed GPS" badges, platform/bay numbers, and connecting Go KL/Rapid lines.
  - **Mobile Touch Layout (<768px)**:
    - Sticky top search bar with recent & favorite commute pills.
    - Full-screen interactive map with floating "Recenter / Locate Me" and "Toggle Diagram" buttons.
    - Draggable bottom sheet with 3 snap points (compact bar, half sheet for arrivals, full sheet for step-by-step navigation).
    - Bottom tab navigation: **Planner**, **Live Radar**, **All Lines (Go KL & Trains)**, **Active Trip**.

- **Active Navigation Mode ("Follow Trip")**:
  - Progress bar showing current segment (e.g. `Step 1: Walk 3 min to PWTC LRT` ➔ `Step 2: LRT Ampang Line` ➔ `Step 3: Go KL Magenta GOKL13 to MITEC`).
  - Passed stations turn from bright line color to **muted grey**, leaving upcoming stations vivid and prominent.
  - Real-time distance and estimated time remaining.

- **Visual Cues & Color System**:
  - **Moovit Confirmed Green**: `#10b981` (Emerald green radar pulse with text `Confirmed · Live GPS`).
  - **Scheduled Estimate**: `#64748b` (Slate grey clock icon `Scheduled`).
  - **Passed Stations**: `#94a3b8` (Muted slate with dashed track line).
  - **Active Route Polyline**: Official line branding color with glowing head indicator for the moving vehicle.
  - **Go KL Exclusive Badge**: Quiet pill-free text indicator `Go KL · Free City Bus` with official line color dot.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Rapid Pulse Vehicle Radar Engine**:
  - *Chosen Approach*: Implement an interpolated GPS simulator running on real transit waypoints with realistic velocities (20–45 km/h) and station dwell times (20–45 seconds) based on time-of-day traffic models.
  - *Why*: Allows users to visibly watch Bus 190, Bus 851, and Go KL buses approaching their stop on the map just like the Rapid Pulse app, eliminating guesswork.
  - *Alternatives Considered*: Static arrival countdown alone (lacks the reassurance of seeing the vehicle physically move).

- **Decision 2: Smart Multi-Modal Routing with Go KL Priority**:
  - *Chosen Approach*: Custom transit graph solver connecting rail stations, Rapid KL bus stops, and Go KL bus bays within realistic walking transfer thresholds (up to 400m transfer radius). Specifically addresses missing connections like PWTC/Putra to MATRADE/MITEC.
  - *Why*: Solves the Google Maps routing blindspot for Go KL routes and short inter-station connections.

- **Decision 3: Seamless Deduplication Architecture**:
  - *Chosen Approach*: Group route options by corridor and vehicle dispatch; if two services overlap (e.g., duplicate bus schedules or shared trunk segments), merge them into a single consolidated card with multi-agency tags (`Rapid KL + Go KL Corridor`).

---

### 4. Technical Architecture & Component Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Klang Valley All-in-One Transit Navigator                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────────┐ │
│  │   Journey Planner    │  │          Interactive Transit Canvas           │ │
│  │  - Search Origin/Dest│  │  ┌────────────────────┐ ┌──────────────────┐  │ │
│  │  - Multi-Modal Filter│  │  │ Geographic Live Map│ │ Line Diagram    │  │ │
│  │  - Deduplicated Cards│  │  │ (Moving Bus Radar) │ │ (Grey Tracked)   │  │ │
│  │  - "Start Journey"   │  │  └────────────────────┘ └──────────────────┘  │ │
│  └──────────┬───────────┘  └──────────────────────┬───────────────────────┘ │
│             │                                     │                         │
│             ▼                                     ▼                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │               Active Journey Manager & Tracker State                   │ │
│  │  - Current Station Index      - Blue -> Grey Passed Stations           │ │
│  │  - Live Speed / Heading       - Next Transfer Notification             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │          Klang Valley Unified Transit Engine & Radar Simulator         │ │
│  │  - All 15 Go KL Bus Lines (Green, Purple, Blue, Red, Magenta GOKL13...) │ │
│  │  - Rapid KL Bus Network (Bus 190, 851, feeders & trunks)               │ │
│  │  - Integrated Rail (MRT 9 & 12, LRT 3, 4, 5, Monorail 8, KTM, ERL)     │ │
│  │  - Real-Time Moving Vehicle Engine (interpolated physics)              │ │
│  │  - Moovit Confirmed Green Signal Generator                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component Mapping**:
  - `JourneyPlanner`: Input fields for origin/destination with 1-tap quick presets (e.g. `Putra Court -> MITEC`, `Masjid Jamek -> Bus 851 / Sentul`, `KLCC -> Pavilion`). Computes direct & transfer itineraries.
  - `TransitCanvas`: Switchable between Geographic Radar Map (interactive SVG/canvas with live bus/train pucks moving along polylines) and Subway-style Schematic Line Diagram.
  - `ActiveJourneyTracker`: "Start Trip" triggers follow mode; tracks current stop, fades passed stops to muted grey, highlights active transfer, and displays remaining ETA.
  - `StationInspector`: Displays next departures with green `Confirmed GPS` badges vs. scheduled times, connecting lines, and stop coordinates.
  - `LineDirectory`: Directory of all 15 Go KL lines and all rail lines with full stop listings and live fleet positions.

- **Verification Scenarios**:
  - Test Case 1: Search `Putra Court` to `MITEC / MATRADE` -> Verifies PWTC LRT / Putra station connects with Bus 190 and Go KL 13 Magenta, displaying live bus moving along Jalan Kuching / Jalan Tuanku Abdul Halim.
  - Test Case 2: Search `Masjid Jamek` with Bus 851 -> Verifies line progress where passed stations turn grey and bus moves live on the radar.
  - Test Case 3: Verify green "Confirmed GPS" indicator appears on active dispatches.
  - Test Case 4: Verify zero duplication of overlapping routes and clean responsive design on mobile and desktop.
