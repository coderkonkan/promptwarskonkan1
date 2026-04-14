# 🏟️ Smart Venue Experience System — Admin Control Dashboard

A fully interactive, production-quality **Admin Command Center** for real-time venue monitoring, crowd management, AI-driven decision making, and emergency control.

---

## 🚀 How to Run

This is a **pure front-end** dashboard — no server required.

**Option 1 — Direct Open:**
Double-click `index.html` to open it in your browser.

**Option 2 — VS Code Live Server:**
Right-click `index.html` → **"Open with Live Server"**

> Requires an active internet connection for Chart.js and Google Fonts CDNs.

---

## 📁 File Structure

```
Admin Control/
├── index.html      — Main HTML shell (all 11 panel sections)
├── styles.css      — Full design system (dark theme, animations, responsive)
├── dashboard.js    — All 13 modules, real-time simulation engine
└── README.md       — This file
```

---

## 🔧 Modules Implemented

| # | Module | Description |
|---|--------|-------------|
| 1 | **Dashboard Overview** | KPI cards, heatmap, queue bars, network load, parking |
| 2 | **Live Crowd Monitoring** | Interactive stadium map, color-coded zones, Top 3 congested |
| 3 | **Queue Analytics** | Stall-wise queue, wait times, demand spike charts |
| 4 | **Alerts & Incident Control** | Live alert feed, custom alert creator, broadcast actions |
| 5 | **AI Decision Insights** | Real-time AI feed, confidence scores, 10-min prediction |
| 6 | **Control Actions** | Gate open/close, zone restrictions, crowd redirect, evacuation |
| 7 | **Drone + Camera View** | Simulated drone canvas, 6 camera feeds, blind spots, risk areas |
| 8 | **Digital Twin Panel** | Real-time / 5-min / 10-min prediction views, impact simulation |
| 9 | **Event Timeline** | Filterable timestamp log (Alerts / AI / Admin / System) |
| 10 | **Performance Metrics** | Donut ring KPIs, trend charts, resource usage |
| 11 | **Stress Test Mode** | Halftime rush / Match-end exit / Emergency evacuation sims |

---

## 🎛️ Key Features

### Real-Time Simulation Engine
- Ticks every **3 seconds** via `setInterval` (simulates WebSocket push)
- 4 match phases: `pre-match → match → halftime → match`
- Crowd density fluctuates based on match phase + random variation
- All panels update **simultaneously** via a shared `VenueEventBus`

### Alert System
- Auto-triggers alerts when density spikes occur
- Severity levels: `low | medium | high | critical`
- Toast notifications for all events
- Custom alert creator with zone, type & severity selectors

### AI Decision Feed
- Generates realistic AI decisions every ~18 seconds
- Decision types: `ROUTING | PREDICTION | PRICING | CAPACITY`
- Shows confidence score + human-readable reason

### Control Actions
- Toggle gate open/closed (with UI state sync)
- Mark zones as restricted (visual chip updates)
- One-click crowd redirect, flow optimization, evacuation
- Confirmation modal for destructive actions (Emergency / Evacuation)

### Digital Twin
- Switch between Real-Time, 5-min and 10-min predicted views
- Impact chart shows current vs. future density per zone

### Stress Test Mode
- 3 scenarios: Halftime Rush, Match End Exit, Emergency Evacuation
- Live `stressChart` monitors system load during simulation
- Console log with timestamped system responses
- Auto-stops after 30s with "test completed" confirmation

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#060a14` (deep navy void) |
| Card Surface | `#101828` |
| Accent Blue | `#3b82f6` |
| Accent Violet | `#8b5cf6` |
| Accent Cyan | `#06b6d4` |
| Success | `#22c55e` |
| Warning | `#f97316` |
| Danger | `#ef4444` |
| Font | Inter + JetBrains Mono |

- Full **responsive layout** (sidebar collapses on mobile)
- **Glassmorphism** topbar with backdrop blur
- Smooth **panel transition** animations
- Animated **pulse effects** on critical alerts
- **Emergency mode** — entire UI shifts to red theme

---

## 📡 Connectivity

The dashboard uses a **simulated WebSocket event bus** (`VenueEventBus`) internally. To connect it to a real backend:

```js
// Replace the masterUpdate setInterval with:
const ws = new WebSocket('ws://your-server/admin-feed');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  Object.assign(state, data);          // merge incoming state
  eventBus.emit('crowd_update');       // trigger UI refresh
  eventBus.emit('queue_update');
  // ... etc
};
```

Compatible with the existing **SVES backends**:
- `server.js` — crowd density data at `GET /crowd-data`
- `Alert System/backend` — alert streaming
- `stadium-smart-navigation/backend` — routing engine

---

## ⚠️ Notes

- No build step required — vanilla HTML/CSS/JS + Chart.js CDN
- All data is **simulated** — replace with real API calls for production
- Browser must support `canvas`, `CSS custom properties`, and `ES2020`
- Tested on Chrome 122+, Firefox 124+, Edge 122+
