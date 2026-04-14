/* ════════════════════════════════════════════════════════════
   SMART VENUE — ADMIN CONTROL DASHBOARD  |  dashboard.js
   All 13 modules: Heatmap, Queue, Alerts, AI, Control,
   Drone, Digital Twin, Timeline, Metrics, Stress Test
════════════════════════════════════════════════════════════ */
'use strict';

/* ──────────────────────────────────────────
   1. CONSTANTS & SHARED STATE
────────────────────────────────────────── */
const ZONES = ['Gate A','Gate B','Gate C','Food Court','Washrooms','Seating Area 1','Seating Area 2'];
const STALLS = [
  { name:'Main Food Court', icon:'🍔', capacity:120 },
  { name:'Beverage Bar',    icon:'🥤', capacity:80  },
  { name:'Snack Corner',    icon:'🍿', capacity:60  },
  { name:'VIP Lounge',      icon:'🍷', capacity:40  },
  { name:'Gate A Stall',    icon:'🌮', capacity:90  },
  { name:'Gate C Kiosk',    icon:'☕', capacity:50  },
];
const CAMERAS = ['Gate A Cam','Gate B Cam','Gate C Cam','Field Cam N','Field Cam S','Parking Cam'];

const state = {
  phase: 'pre-match',         // pre-match | match | halftime | post-match
  phaseTimer: 0,
  attendees: 42857,
  systemHealth: 'LIVE',       // LIVE | WARNING | CRITICAL
  emergencyActive: false,
  stressScenario: null,
  twinMode: 'real',
  zones: ZONES.map(z => ({
    name: z,
    density: Math.floor(30 + Math.random()*40),
    direction: randomDirection(),
    flowRate: Math.floor(20 + Math.random()*60),
  })),
  stalls: STALLS.map(s => ({
    ...s,
    queue: Math.floor(5 + Math.random()*50),
    waitTime: +(1 + Math.random()*8).toFixed(1),
    peakPredicted: Math.random() > 0.6,
  })),
  network: { load: 42, history: Array.from({length:20},()=>Math.floor(20+Math.random()*60)) },
  parking: [
    { label:'Zone P1', total:500, used:412 },
    { label:'Zone P2', total:400, used:198 },
    { label:'Zone P3', total:300, used:301 },
    { label:'Zone P4', total:350, used:210 },
    { label:'Zone P5', total:250, used:248 },
    { label:'Zone P6', total:200, used:88  },
  ],
  alerts: [],
  timeline: [],
  aiDecisions: [],
  actionLog: [],
  kpi: {
    wait: 4.2, congestion: 68, response: 142, satisfaction: 87,
    waitHistory:        Array.from({length:30},()=>+(2+Math.random()*7).toFixed(1)),
    congestionHistory:  Array.from({length:30},()=>Math.floor(30+Math.random()*60)),
    responseHistory:    Array.from({length:30},()=>Math.floor(80+Math.random()*200)),
    satisfactionHistory:Array.from({length:30},()=>Math.floor(65+Math.random()*30)),
  },
  gateStates: { 'Gate A': true, 'Gate B': true, 'Gate C': false },
  zoneRestrictions: { 'Seating Area 1': false, 'Food Court': false, 'Washrooms': false, 'Gate A': false },
};

window.twinMode = 'real';

function randomDirection() {
  const dirs = ['↑ N','↗ NE','→ E','↘ SE','↓ S','↙ SW','← W','↖ NW'];
  return dirs[Math.floor(Math.random()*dirs.length)];
}

/* ──────────────────────────────────────────
   2. SEED DATA — Alerts, AI, Timeline
────────────────────────────────────────── */
function seedAlerts() {
  const seedData = [
    { type:'CROWD_SPIKE',       zone:'Food Court',   message:'Density exceeded 85% — immediate action recommended', severity:'critical' },
    { type:'QUEUE_OVERFLOW',    zone:'Gate A',       message:'Queue length is 3× normal capacity', severity:'high' },
    { type:'NETWORK_CONGESTION',zone:'Seating Area 1',message:'Latency spiked to 450ms in sector 1', severity:'medium' },
  ];
  seedData.forEach(a => addAlert(a.type, a.zone, a.message, a.severity));
}

function seedAIDecisions() {
  const actions = [
    { type:'ROUTING',   action:'Redirected users from Gate A to Gate C',         reason:'Gate A density reached 88%, Gate C at 32%', confidence:94 },
    { type:'PREDICTION',action:'Predicted congestion in 5 min at Food Court',     reason:'Historical halftime pattern + sensor trend', confidence:87 },
    { type:'PRICING',   action:'Dynamic pricing activated at Stall B',             reason:'Queue > 90% capacity, reduce demand pressure', confidence:78 },
    { type:'ROUTING',   action:'Suggested alternate entry via South Gate',         reason:'North entrance flow rate dropped by 60%', confidence:91 },
    { type:'CAPACITY',  action:'Seating Area 2 capacity opened by 15%',           reason:'Seating Area 1 at 92% occupancy', confidence:83 },
  ];
  actions.forEach(a => addAIDecision(a));
}

function seedTimeline() {
  const events = [
    { type:'system', category:'system', desc:'Dashboard initialized — all modules online' },
    { type:'ai',     category:'ai',     desc:'AI Engine started — monitoring 7 zones' },
    { type:'admin',  category:'admin',  desc:'Admin session started' },
    { type:'alert',  category:'alert',  desc:'CROWD_SPIKE detected at Food Court' },
    { type:'ai',     category:'ai',     desc:'Dynamic routing activated — Gate A → Gate C' },
  ];
  events.forEach(e => addTimelineEvent(e.type, e.category, e.desc));
}

/* ──────────────────────────────────────────
   3. UTILITY FUNCTIONS
────────────────────────────────────────── */
function getDensityClass(d) {
  if (d >= 90) return 'density-critical';
  if (d >= 75) return 'density-high';
  if (d >= 40) return 'density-medium';
  return 'density-low';
}
function getDensityColor(d) {
  if (d >= 90) return '#ef4444';
  if (d >= 75) return '#f97316';
  if (d >= 40) return '#eab308';
  return '#22c55e';
}
function getQueueClass(pct) {
  if (pct >= 90) return 'q-crit';
  if (pct >= 70) return 'q-high';
  if (pct >= 40) return 'q-mid';
  return 'q-low';
}
function now() {
  return new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function el(id) { return document.getElementById(id); }
function formatTime(date) { return date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }

/* ──────────────────────────────────────────
   4. CLOCK
────────────────────────────────────────── */
function updateClock() {
  const clockEl = el('topbar-clock');
  if (clockEl) clockEl.textContent = new Date().toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
}
setInterval(updateClock, 1000);
updateClock();

/* ──────────────────────────────────────────
   5. NAVIGATION
────────────────────────────────────────── */
const panelTitles = {
  overview: 'Dashboard Overview',    crowd: 'Live Crowd Monitoring',
  queue:    'Queue Analytics',       alerts: 'Alerts & Incident Control',
  ai:       'AI Decision Insights',  control: 'Control Actions',
  drone:    'Drone + Camera View',   twin: 'Digital Twin Panel',
  timeline: 'System Events Timeline',metrics: 'Performance Metrics',
  stress:   'Stress Test Mode',
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const panel = item.dataset.panel;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const target = el(`panel-${panel}`);
    if (target) target.classList.add('active');
    const titleEl = el('panel-title');
    if (titleEl) titleEl.textContent = panelTitles[panel] || panel;
    // Close sidebar on mobile
    if (window.innerWidth <= 900) el('sidebar').classList.remove('open');
  });
});

el('menuToggle').addEventListener('click', () => {
  el('sidebar').classList.toggle('open');
});

/* ──────────────────────────────────────────
   6. TOPBAR STATS
────────────────────────────────────────── */
function updateTopbarStats() {
  state.attendees = Math.max(38000, Math.min(50000,
    state.attendees + Math.floor((Math.random()-0.48)*100)
  ));
  const alertCount = state.alerts.length;
  el('stat-attendees').textContent = state.attendees.toLocaleString();
  el('stat-alerts').textContent    = alertCount;
  el('alert-badge').textContent    = alertCount;

  // Health assessment
  const avgDensity = state.zones.reduce((s,z) => s+z.density,0)/state.zones.length;
  if (avgDensity >= 85 || state.emergencyActive) {
    state.systemHealth = 'CRITICAL';
    el('stat-health').textContent = 'CRITICAL';
    el('stat-health').style.color = '#ef4444';
    el('health-dot').style.color  = '#ef4444';
  } else if (avgDensity >= 65 || alertCount >= 3) {
    state.systemHealth = 'WARNING';
    el('stat-health').textContent = 'WARNING';
    el('stat-health').style.color = '#f97316';
    el('health-dot').style.color  = '#f97316';
  } else {
    state.systemHealth = 'LIVE';
    el('stat-health').textContent = 'LIVE';
    el('stat-health').style.color = '#22c55e';
    el('health-dot').style.color  = '#22c55e';
  }
}

/* ──────────────────────────────────────────
   7. SIMULATION ENGINE
────────────────────────────────────────── */
function tickSimulation() {
  state.phaseTimer += 3;
  if (state.phase === 'pre-match' && state.phaseTimer > 45)  state.phase = 'match';
  else if (state.phase === 'match'    && state.phaseTimer > 90)  state.phase = 'halftime';
  else if (state.phase === 'halftime' && state.phaseTimer > 120) { state.phase = 'match'; state.phaseTimer = 46; }

  state.zones = state.zones.map(z => {
    let delta = (Math.random()-0.48)*16;
    const ph = state.stressScenario || state.phase;
    if (ph === 'halftime' || ph === 'halftime_rush') {
      if (z.name === 'Food Court' || z.name === 'Washrooms') delta += 18;
      if (z.name.startsWith('Seating')) delta -= 12;
    } else if (ph === 'match') {
      if (z.name.startsWith('Gate')) delta -= 6;
      if (z.name.startsWith('Seating')) delta += 4;
    } else if (ph === 'matchend_exit') {
      if (z.name.startsWith('Gate')) delta += 22;
      if (z.name.startsWith('Seating')) delta += 10;
    } else if (ph === 'emergency') {
      delta = Math.random()*30 - 5;
    }
    let newD = Math.max(5, Math.min(100, z.density + delta));
    return { ...z, density: Math.round(newD), direction: Math.random()>0.85 ? randomDirection() : z.direction,
             flowRate: Math.max(5, Math.min(100, z.flowRate + (Math.random()-0.5)*12)) };
  });

  state.stalls = state.stalls.map(s => {
    const q = Math.max(0, Math.min(s.capacity*1.2, s.queue + (Math.random()-0.45)*8));
    const w = Math.max(0.5, Math.min(20, s.waitTime + (Math.random()-0.5)*0.8));
    return { ...s, queue: Math.round(q), waitTime: +w.toFixed(1), peakPredicted: w > 7 };
  });

  state.network.load = Math.max(5, Math.min(99, state.network.load + (Math.random()-0.48)*8));
  state.network.history.push(Math.round(state.network.load));
  if (state.network.history.length > 40) state.network.history.shift();

  state.kpi.congestion = Math.round(state.zones.reduce((s,z)=>s+z.density,0)/state.zones.length);
  state.kpi.wait       = +(state.stalls.reduce((s,st)=>s+st.waitTime,0)/state.stalls.length).toFixed(1);
  state.kpi.response   = Math.max(60, Math.min(500, state.kpi.response + (Math.random()-0.48)*20));
  state.kpi.satisfaction = Math.max(40, Math.min(100, state.kpi.satisfaction + (Math.random()-0.5)*2));

  state.kpi.congestionHistory.push(state.kpi.congestion); state.kpi.congestionHistory.shift();
  state.kpi.waitHistory.push(state.kpi.wait);             state.kpi.waitHistory.shift();
  state.kpi.responseHistory.push(Math.round(state.kpi.response)); state.kpi.responseHistory.shift();
  state.kpi.satisfactionHistory.push(Math.round(state.kpi.satisfaction)); state.kpi.satisfactionHistory.shift();

  // Auto-trigger random alerts
  if (Math.random() > 0.94) autoTriggerAlert();
  // AI decision generation
  if (Math.random() > 0.88) generateAIDecision();
}

/* ──────────────────────────────────────────
   8. HEATMAP RENDERER
────────────────────────────────────────── */
function renderHeatmap(containerId) {
  const container = el(containerId);
  if (!container) return;
  state.zones.forEach((z, i) => {
    let tile = container.querySelector(`[data-zone="${z.name}"]`);
    if (!tile) {
      tile = document.createElement('div');
      tile.className = 'zone-tile';
      tile.dataset.zone = z.name;
      tile.innerHTML = `
        <span class="zone-name">${z.name}</span>
        <span class="zone-density"></span>
        <span class="zone-flow"></span>`;
      tile.addEventListener('click', () => showZoneModal(z));
      container.appendChild(tile);
    }
    tile.className = `zone-tile ${getDensityClass(z.density)}`;
    tile.querySelector('.zone-density').textContent = z.density + '%';
    tile.querySelector('.zone-flow').textContent    = `${z.direction} ${Math.round(z.flowRate)}/min`;
  });
}

function showZoneModal(zone) {
  el('modalTitle').textContent = `Zone: ${zone.name}`;
  el('modalBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;">
        <span>Density</span><strong style="color:${getDensityColor(zone.density)}">${zone.density}%</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;">
        <span>Flow Direction</span><strong>${zone.direction}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;">
        <span>Flow Rate</span><strong>${Math.round(zone.flowRate)}/min</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;">
        <span>Status</span><strong>${getDensityClass(zone.density).replace('density-','').toUpperCase()}</strong>
      </div>
    </div>`;
  openModal(() => {});
}

function renderTop3(containerId) {
  const container = el(containerId);
  if (!container) return;
  const sorted = [...state.zones].sort((a,b)=>b.density-a.density).slice(0,3);
  container.innerHTML = sorted.map((z,i) => `
    <div class="top3-item">
      <span class="top3-rank r${i+1}">#${i+1}</span>
      <span class="top3-zone">${z.name}</span>
      <div class="top3-bar-wrap"><div class="top3-bar" style="width:${z.density}%;background:${getDensityColor(z.density)}"></div></div>
      <span class="top3-pct" style="color:${getDensityColor(z.density)}">${z.density}%</span>
    </div>`).join('');
}

function renderZoneDetails() {
  const container = el('zoneDetailsList');
  if (!container) return;
  container.innerHTML = state.zones.map(z => `
    <div class="zone-detail-item">
      <div class="zone-detail-dot" style="background:${getDensityColor(z.density)}; box-shadow:0 0 8px ${getDensityColor(z.density)}40"></div>
      <div class="zone-detail-info">
        <div class="zone-detail-name">${z.name}</div>
        <div class="zone-detail-meta">${z.direction} · Flow: ${Math.round(z.flowRate)}/min</div>
      </div>
      <span class="zone-detail-density" style="color:${getDensityColor(z.density)}">${z.density}%</span>
    </div>`).join('');
}

function renderTop3Podium() {
  const container = el('top3Podium');
  if (!container) return;
  const sorted = [...state.zones].sort((a,b)=>b.density-a.density).slice(0,3);
  const medals = ['🥇','🥈','🥉'];
  const rankClass = ['rank-1','rank-2','rank-3'];
  container.innerHTML = sorted.map((z,i) => `
    <div class="podium-item ${rankClass[i]}">
      <div class="podium-rank">${medals[i]}</div>
      <div class="podium-name">${z.name}</div>
      <div class="podium-density">${z.density}%</div>
      <div class="podium-label">density</div>
    </div>`).join('');
}

/* ──────────────────────────────────────────
   9. QUEUE BARS (OVERVIEW)
────────────────────────────────────────── */
function renderQueueBars(containerId) {
  const container = el(containerId);
  if (!container) return;
  container.innerHTML = state.stalls.slice(0,4).map(s => {
    const pct = Math.min(100, Math.round(s.queue/s.capacity*100));
    return `
      <div class="queue-bar-item">
        <div class="queue-bar-header">
          <span class="queue-bar-name">${s.icon} ${s.name}</span>
          <span class="queue-bar-meta">${s.queue}🧑 · ${s.waitTime}min</span>
        </div>
        <div class="queue-track">
          <div class="queue-fill ${getQueueClass(pct)}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────
   10. PARKING STATUS
────────────────────────────────────────── */
function renderParking() {
  const container = el('parkingGrid');
  if (!container) return;
  container.innerHTML = state.parking.map(p => {
    const pct = p.used/p.total;
    const cls = pct >= 1.0 ? 'p-full' : pct >= 0.7 ? 'p-half' : 'p-open';
    const avail = Math.max(0, p.total-p.used);
    const label = cls==='p-full' ? '🔴 FULL' : cls==='p-half' ? '🟡 PARTIAL' : '🟢 OPEN';
    return `
      <div class="parking-zone ${cls}">
        <div>${p.label}</div>
        <span class="parking-avail">${avail}</span>
        <div style="font-size:9px;margin-top:2px">${label}</div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────
   11. NETWORK CHART
────────────────────────────────────────── */
let networkChartInst = null;
function initNetworkChart() {
  const ctx = el('networkChart');
  if (!ctx) return;
  networkChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length:40},(_,i)=>''),
      datasets: [{
        label: 'Network Load %',
        data: state.network.history,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.08)',
        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { min: 0, max: 100, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}
function updateNetworkChart() {
  if (!networkChartInst) return;
  networkChartInst.data.datasets[0].data = [...state.network.history];
  networkChartInst.update('none');
}

/* ──────────────────────────────────────────
   12. QUEUE CHARTS
────────────────────────────────────────── */
let queueBarChartInst=null, queueTimeChartInst=null, demandSpikeChartInst=null;
const queueTimeHistory = Array.from({length:30},()=>state.stalls.reduce((s,st)=>s+st.queue,0));

function initQueueCharts() {
  const ctxBar = el('queueBarChart');
  if (ctxBar) {
    queueBarChartInst = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: state.stalls.map(s=>s.name),
        datasets: [{
          label:'Queue Length',
          data: state.stalls.map(s=>s.queue),
          backgroundColor: state.stalls.map(s=>{
            const pct=s.queue/s.capacity*100;
            return pct>=90?'rgba(239,68,68,0.7)':pct>=70?'rgba(249,115,22,0.7)':pct>=40?'rgba(234,179,8,0.7)':'rgba(34,197,94,0.7)';
          }),
          borderRadius: 6,
        }],
      },
      options: {
        responsive:true, maintainAspectRatio:false, animation:{duration:600},
        plugins:{ legend:{display:false} },
        scales:{
          x:{ ticks:{color:'#475569',font:{size:10}}, grid:{display:false} },
          y:{ ticks:{color:'#475569'}, grid:{color:'rgba(255,255,255,0.04)'} },
        },
      },
    });
  }

  const ctxTime = el('queueTimeChart');
  if (ctxTime) {
    queueTimeChartInst = new Chart(ctxTime, {
      type:'line',
      data:{ labels:Array.from({length:30},(_,i)=>`-${30-i}s`), datasets:[{
        label:'Total Queue',data:[...queueTimeHistory],
        borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,0.1)',
        borderWidth:2,tension:0.4,fill:true,pointRadius:0,
      }]},
      options:{
        responsive:true,maintainAspectRatio:false,animation:false,
        plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#475569',font:{size:9}},grid:{display:false}},
                y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'}}},
      },
    });
  }

  const ctxDemand = el('demandSpikeChart');
  if (ctxDemand) {
    demandSpikeChartInst = new Chart(ctxDemand, {
      type:'bar',
      data:{
        labels:['Pre-match','0-15min','15-30min','Halftime','45-60min','60-75min','Full Time'],
        datasets:[
          {label:'Food Court',data:[30,40,45,90,55,60,85],backgroundColor:'rgba(249,115,22,0.7)',borderRadius:4},
          {label:'Gate Traffic',data:[80,60,40,20,30,40,95],backgroundColor:'rgba(59,130,246,0.7)',borderRadius:4},
        ],
      },
      options:{
        responsive:true,maintainAspectRatio:false,animation:{duration:1000},
        plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},
        scales:{
          x:{ticks:{color:'#475569',font:{size:10}},grid:{display:false}},
          y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'}},
        },
      },
    });
  }
}
function updateQueueCharts() {
  if (queueBarChartInst) {
    queueBarChartInst.data.datasets[0].data = state.stalls.map(s=>s.queue);
    queueBarChartInst.data.datasets[0].backgroundColor = state.stalls.map(s=>{
      const pct=s.queue/s.capacity*100;
      return pct>=90?'rgba(239,68,68,0.7)':pct>=70?'rgba(249,115,22,0.7)':pct>=40?'rgba(234,179,8,0.7)':'rgba(34,197,94,0.7)';
    });
    queueBarChartInst.update('none');
  }
  const total = state.stalls.reduce((s,st)=>s+st.queue,0);
  queueTimeHistory.push(total); queueTimeHistory.shift();
  if (queueTimeChartInst) { queueTimeChartInst.data.datasets[0].data=[...queueTimeHistory]; queueTimeChartInst.update('none'); }
}

function renderStallWaitList() {
  const c = el('stallWaitList');
  if (!c) return;
  const sorted = [...state.stalls].sort((a,b)=>b.waitTime-a.waitTime);
  c.innerHTML = sorted.map(s=>`
    <div class="stall-wait-item">
      <span class="stall-icon">${s.icon}</span>
      <div class="stall-info">
        <div class="stall-name">${s.name}</div>
        <div class="stall-meta">Queue: ${s.queue} people</div>
      </div>
      <span class="stall-wait">${s.waitTime}m</span>
      ${s.peakPredicted?'<span class="stall-peak-badge">PEAK</span>':''}
    </div>`).join('');
}

/* ──────────────────────────────────────────
   13. ALERTS SYSTEM
────────────────────────────────────────── */
const alertIcons = { CROWD_SPIKE:'🔴', QUEUE_OVERFLOW:'🟠', NETWORK_CONGESTION:'🟡', EMERGENCY_ALERT:'🚨', CUSTOM:'🔔' };
function addAlert(type, zone, message, severity='medium') {
  const id = Date.now() + Math.random();
  state.alerts.unshift({ id, type, zone, message, severity, time: new Date() });
  if (state.alerts.length > 20) state.alerts.pop();
  renderAlerts();
  addTimelineEvent('alert','alert', `${type} @ ${zone}: ${message}`);
  showToast(type, message, severity==='critical'?'error':severity==='high'?'warning':'info');
}
function autoTriggerAlert() {
  const types  = ['CROWD_SPIKE','QUEUE_OVERFLOW','NETWORK_CONGESTION'];
  const t = types[Math.floor(Math.random()*types.length)];
  const z = ZONES[Math.floor(Math.random()*ZONES.length)];
  const msgs = { CROWD_SPIKE:`Density at ${z} hit ${60+Math.floor(Math.random()*35)}%`, QUEUE_OVERFLOW:`Queue at ${z} is ${2+Math.floor(Math.random()*4)}× normal`, NETWORK_CONGESTION:`Packet loss detected in sector ${Math.floor(Math.random()*5)+1}` };
  addAlert(t, z, msgs[t], Math.random()>0.5?'high':'medium');
}
function renderAlerts() {
  const c = el('alertsList');
  if (!c) return;
  if (state.alerts.length === 0) {
    c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">✅ No active alerts</div>';
    return;
  }
  c.innerHTML = state.alerts.map(a=>`
    <div class="alert-item severity-${a.severity}" data-alert-id="${a.id}">
      <span class="alert-icon">${alertIcons[a.type]||'⚠'}</span>
      <div class="alert-body">
        <div class="alert-type" style="color:${a.severity==='critical'?'#ef4444':a.severity==='high'?'#f97316':'#eab308'}">${a.type}</div>
        <div class="alert-message">${a.message}</div>
        <div class="alert-meta">📍 ${a.zone}  ·  🕐 ${formatTime(a.time)}</div>
      </div>
      <button class="alert-dismiss" onclick="dismissAlert(${a.id})">×</button>
    </div>`).join('');
}
window.dismissAlert = function(id) {
  state.alerts = state.alerts.filter(a=>a.id!==id);
  renderAlerts();
  updateTopbarStats();
};
el('clearAlertsBtn')?.addEventListener('click', ()=>{ state.alerts=[]; renderAlerts(); updateTopbarStats(); });

el('customAlertForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const type     = el('alertType').value;
  const zone     = el('alertZone').value;
  const message  = el('alertMessage').value || `Manual alert triggered for ${zone}`;
  const severity = el('alertSeverity').value;
  addAlert(type, zone, message, severity);
  addActionLog('🔔', `Custom alert triggered: ${type} @ ${zone}`);
  el('alertMessage').value = '';
  showToast('Alert Created', `${type} alert sent for ${zone}`, 'success');
});

el('broadcastBtn')?.addEventListener('click', ()=> window.adminActions.broadcast());

/* ──────────────────────────────────────────
   14. AI DECISION FEED
────────────────────────────────────────── */
let aiConfChartInst=null, predictionChartInst=null;
const aiTypeColors = { ROUTING:'#3b82f6',PREDICTION:'#8b5cf6',PRICING:'#f97316',CAPACITY:'#22c55e',ALERT:'#ef4444' };

function addAIDecision(dec) {
  dec.time = new Date();
  state.aiDecisions.unshift(dec);
  if (state.aiDecisions.length > 15) state.aiDecisions.pop();
  renderAIFeed();
  addTimelineEvent('ai','ai',`AI [${dec.type}]: ${dec.action}`);
}
function generateAIDecision() {
  const options = [
    { type:'ROUTING',   action:`Rerouting crowd from ${ZONES[Math.floor(Math.random()*3)]} to ${ZONES[3+Math.floor(Math.random()*4)]}`, reason:`Density differential > 35%`, confidence: 80+Math.floor(Math.random()*18) },
    { type:'PREDICTION',action:`Surge predicted at ${ZONES[Math.floor(Math.random()*ZONES.length)]} in ${3+Math.floor(Math.random()*8)} min`, reason:'Sensor trend + historical pattern', confidence: 70+Math.floor(Math.random()*25) },
    { type:'PRICING',   action:`Dynamic discount activated at ${STALLS[Math.floor(Math.random()*STALLS.length)].name}`, reason:`Queue exceeding 80% capacity threshold`, confidence: 65+Math.floor(Math.random()*30) },
    { type:'CAPACITY',  action:`Expanding seating allocation in Zone ${Math.floor(Math.random()*4)+1}`, reason:'Overflow risk detected in adjacent zones', confidence: 75+Math.floor(Math.random()*20) },
  ];
  addAIDecision(options[Math.floor(Math.random()*options.length)]);
}
function renderAIFeed() {
  const c = el('aiDecisionFeed');
  if (!c) return;
  c.innerHTML = state.aiDecisions.map(d=>`
    <div class="ai-decision-item">
      <div class="ai-dec-header">
        <span class="ai-dec-type" style="color:${aiTypeColors[d.type]||'#8b5cf6'}">◎ ${d.type}</span>
        <span class="ai-dec-time">${formatTime(d.time)}</span>
      </div>
      <div class="ai-dec-action">${d.action}</div>
      <div class="ai-dec-reason">📊 Reason: ${d.reason}</div>
      <div class="ai-confidence">
        <div class="ai-conf-bar"><div class="ai-conf-fill" style="width:${d.confidence}%"></div></div>
        <span class="ai-conf-val">${d.confidence}% confidence</span>
      </div>
    </div>`).join('');
}

function initAICharts() {
  const ctxConf = el('aiConfidenceChart');
  if (ctxConf) {
    aiConfChartInst = new Chart(ctxConf, {
      type: 'radar',
      data: {
        labels: ['Routing','Prediction','Pricing','Capacity','Alert'],
        datasets: [{
          label: 'Avg Confidence',
          data: [88,82,74,79,91],
          borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)',
          borderWidth: 2, pointBackgroundColor: '#8b5cf6',
        }],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false} },
        scales:{ r:{ ticks:{display:false}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'#94a3b8',font:{size:11}}, min:0, max:100 } },
      },
    });
  }
  const ctxPred = el('predictionChart');
  if (ctxPred) {
    predictionChartInst = new Chart(ctxPred, {
      type:'line',
      data:{
        labels:['Now','+1min','+2min','+3min','+4min','+5min','+6min','+7min','+8min','+9min','+10min'],
        datasets: ZONES.slice(0,4).map((z,i)=>({
          label: z,
          data: Array.from({length:11},(_,j)=>Math.max(5,Math.min(100,
            state.zones[i].density + j*((Math.random()-0.4)*8)
          ))),
          borderColor: ['#3b82f6','#22c55e','#f97316','#ef4444'][i],
          backgroundColor:'transparent', borderWidth:2, tension:0.4,
          pointRadius:3, pointHoverRadius:5,
        })),
      },
      options:{
        responsive:true, maintainAspectRatio:false, animation:false,
        plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},
        scales:{
          x:{ticks:{color:'#475569',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
          y:{min:0,max:100,ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'}},
        },
      },
    });
  }
}

/* ──────────────────────────────────────────
   15. CONTROL ACTIONS
────────────────────────────────────────── */
function renderGateControls() {
  const c = el('gateControls');
  if (!c) return;
  c.innerHTML = Object.entries(state.gateStates).map(([gate, isOpen])=>`
    <div class="gate-row">
      <div>
        <div class="gate-name">${gate}</div>
        <div class="gate-status" style="color:${isOpen?'#22c55e':'#ef4444'};font-size:11px">${isOpen?'● OPEN':'● CLOSED'}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${isOpen?'checked':''} onchange="toggleGate('${gate}', this.checked)">
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');
}
window.toggleGate = function(gate, isOpen) {
  state.gateStates[gate] = isOpen;
  addActionLog(isOpen?'🟢':'🔴', `${gate} ${isOpen?'OPENED':'CLOSED'} by admin`);
  addTimelineEvent('admin','admin',`${gate} ${isOpen?'opened':'closed'}`);
  showToast('Gate Updated', `${gate} is now ${isOpen?'OPEN':'CLOSED'}`, isOpen?'success':'warning');
  renderGateControls();
};

function renderZoneControls() {
  const c = el('zoneControls');
  if (!c) return;
  c.innerHTML = Object.entries(state.zoneRestrictions).map(([zone, restricted])=>`
    <div class="zone-row">
      <span style="flex:1;font-size:13px;font-weight:600">${zone}</span>
      <span class="zone-chip ${restricted?'restricted':'open'}">${restricted?'RESTRICTED':'OPEN'}</span>
      <button class="btn btn-sm ${restricted?'btn-success':'btn-danger'}" onclick="toggleZoneRestriction('${zone}')">
        ${restricted?'Lift Restriction':'Restrict Zone'}
      </button>
    </div>`).join('');
}
window.toggleZoneRestriction = function(zone) {
  state.zoneRestrictions[zone] = !state.zoneRestrictions[zone];
  const r = state.zoneRestrictions[zone];
  addActionLog(r?'🚫':'✅', `${zone} marked as ${r?'RESTRICTED':'OPEN'}`);
  addTimelineEvent('admin','admin',`Zone ${zone} ${r?'restricted':'reopened'}`);
  showToast('Zone Updated', `${zone} is now ${r?'RESTRICTED':'OPEN'}`, r?'warning':'success');
  renderZoneControls();
};

function addActionLog(icon, desc) {
  state.actionLog.unshift({ time: now(), icon, desc });
  if (state.actionLog.length > 30) state.actionLog.pop();
  renderActionLog();
}
function renderActionLog() {
  const c = el('actionLogList');
  if (!c) return;
  c.innerHTML = state.actionLog.map(a=>`
    <div class="action-log-item">
      <span class="log-time">${a.time}</span>
      <span class="log-icon">${a.icon}</span>
      <span class="log-desc">${a.desc}</span>
    </div>`).join('');
}

/* Admin action callbacks */
window.adminActions = {
  broadcast() {
    showToast('Broadcast Sent', '📢 Notification pushed to 42,857 devices', 'success');
    addActionLog('📢','Broadcast notification sent to all attendees');
    addTimelineEvent('admin','admin','Broadcast notification pushed to all users');
  },
  suggestRoutes() {
    const from = ZONES[Math.floor(Math.random()*3)];
    const to   = ZONES[3+Math.floor(Math.random()*4)];
    showToast('Routes Activated', `Redirecting users from ${from} to ${to}`, 'info');
    addActionLog('🗺️',`Alternate routes suggested: ${from} → ${to}`);
    addTimelineEvent('admin','admin',`Route suggestion: ${from} → ${to}`);
  },
  highlightZones() {
    const zone = ZONES[Math.floor(Math.random()*ZONES.length)];
    showToast('Zones Highlighted', `${zone} marked as danger zone on user maps`, 'warning');
    addActionLog('🎯',`${zone} highlighted as danger zone`);
  },
  redirectCrowd() {
    const from = el('redirectFrom').value;
    const to   = el('redirectTo').value;
    addActionLog('🔀',`Crowd redirected: ${from} → ${to}`);
    addTimelineEvent('admin','admin',`Admin override: redirect ${from} → ${to}`);
    showToast('Crowd Redirected', `Navigation redirected from ${from} to ${to}`, 'success');
  },
  emergencyMode() {
    openModal(()=>{
      state.emergencyActive = !state.emergencyActive;
      document.body.classList.toggle('emergency-active', state.emergencyActive);
      addActionLog('🚨',`Emergency mode ${state.emergencyActive?'ACTIVATED':'DEACTIVATED'}`);
      addTimelineEvent('admin','admin',`EMERGENCY MODE ${state.emergencyActive?'ACTIVATED':'DEACTIVATED'}`);
      addAlert('EMERGENCY_ALERT','ALL ZONES','Emergency mode active — all protocols engaged','critical');
      showToast('Emergency Mode', state.emergencyActive?'🚨 Emergency protocols activated!':'✅ Emergency mode deactivated', state.emergencyActive?'error':'success');
    }, '⚠️ Confirm Emergency Mode', 'This will activate full emergency protocols across the venue. All zones will be alerted. Are you sure?');
  },
  triggerEvacuation() {
    openModal(()=>{
      addActionLog('🚪','FULL STADIUM EVACUATION triggered');
      addTimelineEvent('admin','admin','EMERGENCY EVACUATION TRIGGERED');
      addAlert('EMERGENCY_ALERT','ALL ZONES','EVACUATION IN PROGRESS — all attendees directed to exits','critical');
      showToast('EVACUATION', '🚨 Emergency evacuation protocol activated', 'error');
    }, '🚨 Trigger Full Evacuation', 'This will trigger venue-wide evacuation alerts and redirect ALL crowd flow to exits. This action cannot be undone quickly.');
  },
  optimizeFlow() {
    addActionLog('✅','AI Flow Optimization activated across all zones');
    addTimelineEvent('admin','admin','Admin triggered full flow optimization');
    showToast('Flow Optimized', '✅ AI has re-optimized all zone flow paths', 'success');
    state.zones = state.zones.map(z=>({...z, density: Math.max(10, z.density-Math.floor(Math.random()*15+5)) }));
  },
};

/* ──────────────────────────────────────────
   16. DRONE & CAMERA VIEW
────────────────────────────────────────── */
let droneAngle = 0;
let droneCamCtxs = [];
function initDroneView() {
  const droneCanvas = el('droneCanvas');
  if (!droneCanvas) return;
  const ctx = droneCanvas.getContext('2d');
  animateDroneFeed(ctx, droneCanvas);

  const camGrid = el('cameraGrid');
  if (camGrid) {
    camGrid.innerHTML = CAMERAS.map((cam,i)=>`
      <div class="camera-cell" id="cam-cell-${i}">
        <canvas id="camCanvas-${i}" width="120" height="90"></canvas>
        <div class="camera-label">${cam}</div>
        <div class="camera-live-dot"></div>
      </div>`).join('');
    CAMERAS.forEach((_,i)=>{
      const c = el(`camCanvas-${i}`);
      if (c) { const x = c.getContext('2d'); droneCamCtxs[i]={ctx:x,canvas:c}; animateCam(x,c,i); }
    });
  }
  renderBlindSpots();
  renderRiskAreas();
}

function animateDroneFeed(ctx, canvas) {
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // dark background
    ctx.fillStyle='#050a12';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Grid
    ctx.strokeStyle='rgba(6,182,212,0.15)';
    ctx.lineWidth=0.5;
    for(let x=0;x<canvas.width;x+=30){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke(); }
    for(let y=0;y<canvas.height;y+=30){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke(); }
    // Stadium oval outline
    ctx.strokeStyle='rgba(6,182,212,0.4)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.ellipse(canvas.width/2, canvas.height/2, canvas.width*0.38, canvas.height*0.38, 0, 0, Math.PI*2);
    ctx.stroke();
    // Crowd dots (simulated)
    const time = Date.now()/1000;
    state.zones.forEach((z,idx)=>{
      const cx = 80+idx*55; const cy = 80+Math.sin(idx*1.3)*60;
      const r = 8+z.density/12;
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.5);
      grd.addColorStop(0, getDensityColor(z.density)+'cc');
      grd.addColorStop(1, getDensityColor(z.density)+'00');
      ctx.fillStyle=grd;
      ctx.beginPath();ctx.arc(cx,cy,r*2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.font='bold 9px JetBrains Mono, monospace';
      ctx.fillText(`${z.density}%`,cx-10,cy+16);
    });
    // Scanning circle
    droneAngle += 0.02;
    const scanX = canvas.width/2, scanY = canvas.height/2;
    ctx.strokeStyle=`rgba(34,197,94,${0.4+Math.sin(droneAngle*8)*0.3})`;
    ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.arc(scanX,scanY, 50+20*Math.sin(droneAngle*3), 0, Math.PI*2);
    ctx.stroke();
    // Scan line
    ctx.save();
    ctx.translate(scanX,scanY);
    ctx.rotate(droneAngle);
    const grad = ctx.createLinearGradient(0,0,80,0);
    grad.addColorStop(0,'rgba(34,197,94,0.8)');
    grad.addColorStop(1,'rgba(34,197,94,0)');
    ctx.strokeStyle=grad;
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(80,0);ctx.stroke();
    ctx.restore();
    requestAnimationFrame(draw);
  }
  draw();
  // HUD updates
  setInterval(()=>{
    const alt = 30+Math.floor(Math.random()*30);
    const bat = Math.max(20, 95-Math.floor(state.phaseTimer/3));
    const zone = ZONES[Math.floor(Math.random()*ZONES.length)];
    if(el('hudAlt')) el('hudAlt').textContent=alt+'m';
    if(el('hudBat')) el('hudBat').textContent=bat+'%';
    if(el('hudZone')) el('hudZone').textContent=zone;
  }, 4000);
}

function animateCam(ctx, canvas, idx) {
  const colors = ['#22c55e','#ef4444','#eab308','#3b82f6','#f97316','#06b6d4'];
  let frame=0;
  function draw() {
    ctx.fillStyle='#050a12'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle=`rgba(${idx*40%255},${idx*80%255},${idx*120%255},0.1)`;
    ctx.lineWidth=0.5;
    for(let x=0;x<canvas.width;x+=12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
    // Simulated crowd blobs
    const n = 3+idx;
    for(let i=0;i<n;i++){
      const bx=20+Math.sin(frame*0.02+i*1.5)*40;
      const by=15+Math.cos(frame*0.03+i*2)*20;
      const density = state.zones[idx%state.zones.length].density;
      ctx.fillStyle=colors[idx]+'66';
      ctx.beginPath();ctx.arc(bx,by,4+density/20,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle=colors[idx]+'66';
    ctx.lineWidth=1;
    ctx.strokeRect(1,1,canvas.width-2,canvas.height-2);
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}

function renderBlindSpots() {
  const c = el('blindSpots');
  if (!c) return;
  c.innerHTML = [
    {icon:'👁️‍🗨️', name:'North Corridor B3', desc:'Camera angle blocked by scaffolding', level:'high'},
    {icon:'👁️‍🗨️', name:'Parking Zone P4 Corner', desc:'Low light, no IR coverage', level:'medium'},
    {icon:'👁️‍🗨️', name:'Under-Stand Row 22', desc:'Partial obstruction by banner', level:'low'},
  ].map(r=>`
    <div class="risk-item">
      <span class="risk-icon">${r.icon}</span>
      <div class="risk-info"><div class="risk-name">${r.name}</div><div class="risk-desc">${r.desc}</div></div>
      <span class="risk-level ${r.level}">${r.level.toUpperCase()}</span>
    </div>`).join('');
}

function renderRiskAreas() {
  const c = el('riskAreas');
  if (!c) return;
  c.innerHTML = [
    {icon:'⚡', name:'Gate A Funnel', desc:'High-speed bidirectional movement', level:'high'},
    {icon:'⚡', name:'Food Court Exit', desc:'Collision risk during peak hours', level:'high'},
    {icon:'⚡', name:'Stairwell S2', desc:'Counter-flow detected, 45 people/min', level:'medium'},
    {icon:'⚡', name:'VIP Concourse', desc:'Crowd density gradient too steep', level:'medium'},
    {icon:'⚡', name:'Parking Ramp', desc:'Limited exit capacity at match end', level:'low'},
  ].map(r=>`
    <div class="risk-item">
      <span class="risk-icon">${r.icon}</span>
      <div class="risk-info"><div class="risk-name">${r.name}</div><div class="risk-desc">${r.desc}</div></div>
      <span class="risk-level ${r.level}">${r.level.toUpperCase()}</span>
    </div>`).join('');
}

/* ──────────────────────────────────────────
   17. DIGITAL TWIN
────────────────────────────────────────── */
let twinImpactChartInst=null, twinMovementChartInst=null;
function initTwinCharts() {
  const ctxI = el('twinImpactChart');
  if (ctxI) {
    twinImpactChartInst = new Chart(ctxI, {
      type:'bar',
      data:{
        labels: ZONES,
        datasets:[
          {label:'Current',data:state.zones.map(z=>z.density),backgroundColor:'rgba(59,130,246,0.6)',borderRadius:4},
          {label:'+5 min',data:state.zones.map(z=>Math.min(100,z.density+(Math.random()-0.4)*20)),backgroundColor:'rgba(249,115,22,0.6)',borderRadius:4},
        ],
      },
      options:{
        responsive:true,maintainAspectRatio:false,animation:{duration:600},
        plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},
        scales:{x:{ticks:{color:'#475569',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'},min:0,max:100}},
      },
    });
  }
  const ctxM=el('twinMovementChart');
  if(ctxM) {
    twinMovementChartInst = new Chart(ctxM, {
      type:'line',
      data:{
        labels:Array.from({length:20},(_,i)=>`T+${i*30}s`),
        datasets: ZONES.slice(0,3).map((z,i)=>({
          label:z, borderColor:['#3b82f6','#22c55e','#f97316'][i],
          backgroundColor:'transparent',
          data:Array.from({length:20},(_,j)=>Math.max(5,Math.min(100,state.zones[i].density+j*(Math.random()-0.45)*4))),
          borderWidth:2,tension:0.4,pointRadius:0,
        })),
      },
      options:{
        responsive:true,maintainAspectRatio:false,animation:false,
        plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},
        scales:{x:{ticks:{color:'#475569',font:{size:9}},grid:{display:false}},y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'},min:0,max:100}},
      },
    });
  }
}

window.updateTwin = function() {
  const btns = document.querySelectorAll('.twin-btn');
  btns.forEach(b=>b.classList.remove('active'));
  const modeMap = { real:'twinRealBtn', predicted:'twinPredBtn', predicted10:'twinPred10Btn' };
  el(modeMap[window.twinMode])?.classList.add('active');
  el('twinMapTitle').textContent = { real:'Real-Time Twin View', predicted:'5-Minute Prediction', predicted10:'10-Minute Prediction'}[window.twinMode];
  el('twinLivePill').textContent = window.twinMode==='real'?'● LIVE':'⏩ SIMULATED';
  renderHeatmap('twinMap');
  if (twinImpactChartInst) {
    const mult = window.twinMode==='predicted10' ? 1.5 : 1.0;
    twinImpactChartInst.data.datasets[1].data = state.zones.map(z=>Math.min(100,z.density+mult*(Math.random()-0.3)*25));
    twinImpactChartInst.update('none');
  }
};

/* ──────────────────────────────────────────
   18. TIMELINE
────────────────────────────────────────── */
function addTimelineEvent(type, category, desc) {
  state.timeline.unshift({ type, category, desc, time: new Date() });
  if (state.timeline.length > 60) state.timeline.pop();
  renderTimeline('all');
}
function renderTimeline(filter='all') {
  const c = el('timeline');
  if (!c) return;
  const events = filter==='all' ? state.timeline : state.timeline.filter(e=>e.category===filter);
  c.innerHTML = events.map(e=>`
    <div class="timeline-event ev-${e.type}">
      <div class="ev-time">${formatTime(e.time)}</div>
      <div class="ev-type ${e.category}">${e.category.toUpperCase()}</div>
      <div class="ev-desc">${e.desc}</div>
    </div>`).join('');
}
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderTimeline(btn.dataset.filter);
  });
});

/* ──────────────────────────────────────────
   19. PERFORMANCE METRICS
────────────────────────────────────────── */
let kpiTrendInst=null, resourceInst=null;
let ringCharts = {};

function initRingCharts() {
  const rings = [
    { id:'ringWait',        val:state.kpi.wait, max:20, color:'#3b82f6', label:'wait' },
    { id:'ringCongestion',  val:state.kpi.congestion, max:100, color:'#f97316', label:'congestion' },
    { id:'ringResponse',    val:Math.min(100,state.kpi.response/5), max:100, color:'#8b5cf6', label:'response' },
    { id:'ringSatisfaction',val:state.kpi.satisfaction, max:100, color:'#22c55e', label:'satisfaction' },
  ];
  rings.forEach(r=>{
    const canvas = el(r.id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ringCharts[r.id] = new Chart(ctx, {
      type:'doughnut',
      data:{ datasets:[{
        data:[r.val/r.max*100, 100-r.val/r.max*100],
        backgroundColor:[ r.color+'d0','rgba(255,255,255,0.04)' ],
        borderWidth:0, hoverOffset:0,
      }]},
      options:{ responsive:false, maintainAspectRatio:false, cutout:'78%', animation:{duration:800},
        plugins:{ legend:{display:false}, tooltip:{enabled:false} } },
    });
  });
}
function updateRingCharts() {
  const data = [
    { id:'ringWait', val:state.kpi.wait, max:20, display:`${state.kpi.wait} min`, key:'ring-wait-val' },
    { id:'ringCongestion', val:state.kpi.congestion, max:100, display:state.kpi.congestion.toString(), key:'ring-congestion-val' },
    { id:'ringResponse', val:Math.min(100,state.kpi.response/5), max:100, display:`${Math.round(state.kpi.response)} ms`, key:'ring-response-val' },
    { id:'ringSatisfaction', val:state.kpi.satisfaction, max:100, display:`${Math.round(state.kpi.satisfaction)}%`, key:'ring-satisfaction-val' },
  ];
  data.forEach(d=>{
    if (ringCharts[d.id]) {
      const pct = d.val/d.max*100;
      ringCharts[d.id].data.datasets[0].data = [pct, 100-pct];
      ringCharts[d.id].update('none');
    }
    const dispEl = el(d.key);
    if (dispEl) dispEl.textContent = d.display;
  });
}

function initKPICharts() {
  const ctxT = el('kpiTrendChart');
  if (ctxT) {
    kpiTrendInst = new Chart(ctxT, {
      type:'line',
      data:{
        labels:Array.from({length:30},(_,i)=>`-${30-i}m`),
        datasets:[
          {label:'Congestion',data:[...state.kpi.congestionHistory],borderColor:'#f97316',backgroundColor:'rgba(249,115,22,0.05)',borderWidth:2,tension:0.4,fill:true,pointRadius:0},
          {label:'Satisfaction',data:[...state.kpi.satisfactionHistory],borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,0.05)',borderWidth:2,tension:0.4,fill:true,pointRadius:0},
        ],
      },
      options:{
        responsive:true,maintainAspectRatio:false,animation:false,
        plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},
        scales:{x:{ticks:{color:'#475569',font:{size:9}},grid:{display:false}},y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'},min:0,max:100}},
      },
    });
  }
  const ctxR = el('resourceChart');
  if (ctxR) {
    resourceInst = new Chart(ctxR, {
      type:'bar',
      data:{
        labels:['CPU','Memory','Network','Storage','GPU','API'],
        datasets:[{
          label:'Usage %',
          data:[42,68,state.network.load,38,22,55],
          backgroundColor:['rgba(59,130,246,0.7)','rgba(139,92,246,0.7)','rgba(6,182,212,0.7)','rgba(34,197,94,0.7)','rgba(249,115,22,0.7)','rgba(236,72,153,0.7)'],
          borderRadius:5,
        }],
      },
      options:{
        responsive:true,maintainAspectRatio:false,animation:{duration:600},
        plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'#475569'},grid:{display:false}},y:{ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'},min:0,max:100}},
      },
    });
  }
}
function updateKPICharts() {
  if (kpiTrendInst) {
    kpiTrendInst.data.datasets[0].data=[...state.kpi.congestionHistory];
    kpiTrendInst.data.datasets[1].data=[...state.kpi.satisfactionHistory];
    kpiTrendInst.update('none');
  }
  if (resourceInst) {
    resourceInst.data.datasets[0].data[2] = Math.round(state.network.load);
    resourceInst.update('none');
  }
}

/* ──────────────────────────────────────────
   20. SPARKLINES
────────────────────────────────────────── */
let sparkCharts = {};
const sparkData = {
  sparkDensity:      { data: Array.from({length:15},()=>Math.floor(30+Math.random()*60)), color:'#3b82f6' },
  sparkWait:         { data: Array.from({length:15},()=>+(2+Math.random()*7).toFixed(1)),  color:'#8b5cf6' },
  sparkResponse:     { data: Array.from({length:15},()=>Math.floor(80+Math.random()*200)), color:'#22c55e' },
  sparkSatisfaction: { data: Array.from({length:15},()=>Math.floor(65+Math.random()*30)),  color:'#f97316' },
};
function initSparklines() {
  Object.entries(sparkData).forEach(([id,{data,color}])=>{
    const canvas = el(id);
    if (!canvas) return;
    sparkCharts[id] = new Chart(canvas, {
      type:'line',
      data:{ labels:Array.from({length:data.length},()=>''), datasets:[{data,borderColor:color,borderWidth:1.5,pointRadius:0,tension:0.4,fill:false}]},
      options:{ responsive:false, maintainAspectRatio:false, animation:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} },
    });
  });
}
function updateSparklines() {
  const updates = {
    sparkDensity: state.kpi.congestion,
    sparkWait: state.kpi.wait,
    sparkResponse: Math.round(state.kpi.response),
    sparkSatisfaction: Math.round(state.kpi.satisfaction),
  };
  Object.entries(updates).forEach(([id,val])=>{
    if(sparkCharts[id]) {
      sparkCharts[id].data.datasets[0].data.push(val);
      sparkCharts[id].data.datasets[0].data.shift();
      sparkCharts[id].update('none');
    }
  });
  el('kpi-density-val').textContent = state.kpi.congestion + '%';
  el('kpi-wait-val').textContent    = state.kpi.wait + ' min';
  el('kpi-response-val').textContent= Math.round(state.kpi.response) + ' ms';
  el('kpi-satisfaction-val').textContent = Math.round(state.kpi.satisfaction) + '%';
}

/* ──────────────────────────────────────────
   21. STRESS TEST
────────────────────────────────────────── */
let stressChartInst=null, stressInterval=null;
const stressHistory = Array.from({length:30},()=>50);

window.stressTest = {
  run(scenario) {
    state.stressScenario = scenario==='halftime'?'halftime_rush':scenario==='matchend'?'matchend_exit':'emergency';
    ['halftime','matchend','emergency'].forEach(s=>{
      const sEl=el(`status-${s}`);
      if(sEl){ sEl.textContent='READY'; sEl.className='scenario-status'; }
    });
    const sEl=el(`status-${scenario}`);
    if(sEl){ sEl.textContent='RUNNING'; sEl.className='scenario-status running'; }
    addTimelineEvent('admin','admin',`Stress test STARTED: ${scenario.toUpperCase()}`);
    addAlert('EMERGENCY_ALERT','ALL ZONES',`STRESS TEST: ${scenario} simulation in progress`,'critical');
    appendStressLog(`[${now()}] 🚀 Stress test "${scenario}" started`);
    appendStressLog(`[${now()}] Simulating ${scenario==='emergency'?'emergency evacuation':scenario==='halftime'?'halftime crowd surge':'match-end exodus'}...`);
    if (stressInterval) clearInterval(stressInterval);
    stressInterval = setInterval(()=>{
      const val = 50+Math.sin(Date.now()/2000)*35+Math.random()*20;
      stressHistory.push(Math.min(100,val));
      stressHistory.shift();
      if(stressChartInst){ stressChartInst.data.datasets[0].data=[...stressHistory]; stressChartInst.update('none'); }
      appendStressLog(`[${now()}] Density: ${state.kpi.congestion}% | Wait: ${state.kpi.wait}min | Health: ${state.systemHealth}`);
    }, 2500);
    setTimeout(()=>{
      this.stop(scenario);
      appendStressLog(`[${now()}] ✅ Stress test completed — system held stable`);
      showToast('Stress Test Done', `${scenario} simulation completed successfully`, 'success');
    }, 30000);
  },
  stop(scenario='') {
    if(stressInterval){ clearInterval(stressInterval); stressInterval=null; }
    state.stressScenario = null;
    if(scenario){ const s=el(`status-${scenario}`); if(s){s.textContent='DONE';s.className='scenario-status done';} }
    addTimelineEvent('admin','admin','Stress test stopped');
  },
};

function appendStressLog(line) {
  const log = el('stressLog');
  if (!log) return;
  log.innerHTML += line + '\n';
  log.scrollTop = log.scrollHeight;
}

function initStressChart() {
  const ctx = el('stressChart');
  if (!ctx) return;
  stressChartInst = new Chart(ctx, {
    type:'line',
    data:{
      labels:Array.from({length:30},(_,i)=>`-${30-i}s`),
      datasets:[{
        label:'System Load %',data:[...stressHistory],
        borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.08)',
        borderWidth:2,tension:0.4,fill:true,pointRadius:0,
      }],
    },
    options:{
      responsive:true,maintainAspectRatio:false,animation:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'#475569',font:{size:9}},grid:{display:false}},
        y:{min:0,max:100,ticks:{color:'#475569'},grid:{color:'rgba(255,255,255,0.04)'}},
      },
    },
  });
}

/* ──────────────────────────────────────────
   22. TOAST NOTIFICATIONS
────────────────────────────────────────── */
function showToast(title, message, type='info') {
  const container = el('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${message}</div>`;
  container.appendChild(toast);
  setTimeout(()=>{ toast.classList.add('removing'); setTimeout(()=>toast.remove(), 300); }, 4000);
}

/* ──────────────────────────────────────────
   23. MODAL
────────────────────────────────────────── */
let modalCallback = null;
function openModal(callback, title='Confirm Action', body='Are you sure you want to proceed?') {
  el('modalTitle').textContent = title;
  el('modalBody').textContent  = body;
  el('modalOverlay').classList.add('open');
  modalCallback = callback;
}
el('modalClose')?.addEventListener('click',  ()=>el('modalOverlay').classList.remove('open'));
el('modalCancel')?.addEventListener('click', ()=>el('modalOverlay').classList.remove('open'));
el('modalConfirm')?.addEventListener('click',()=>{
  el('modalOverlay').classList.remove('open');
  if (modalCallback) modalCallback();
});
el('modalOverlay')?.addEventListener('click', e=>{ if(e.target===el('modalOverlay')) el('modalOverlay').classList.remove('open'); });

/* ──────────────────────────────────────────
   24. WEBSOCKET EMULATION
   (Simulated real-time data bus — no backend required)
────────────────────────────────────────── */
class VenueEventBus {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] = this.listeners[event]||[]).push(fn); }
  emit(event, data) { (this.listeners[event]||[]).forEach(fn=>fn(data)); }
}
const eventBus = new VenueEventBus();

eventBus.on('zone_update',   ()=>{ renderHeatmap('overviewHeatmap'); renderTop3('top3Zones'); });
eventBus.on('crowd_update',  ()=>{ renderHeatmap('fullHeatmap'); renderHeatmap('twinMap'); renderZoneDetails(); renderTop3Podium(); renderTop3('top3Zones'); });
eventBus.on('queue_update',  ()=>{ renderQueueBars('overviewQueueBars'); renderStallWaitList(); updateQueueCharts(); });
eventBus.on('network_update',()=>updateNetworkChart());
eventBus.on('topbar_update', ()=>updateTopbarStats());
eventBus.on('parking_update',()=>renderParking());
eventBus.on('kpi_update',    ()=>{ updateSparklines(); updateRingCharts(); updateKPICharts(); });
eventBus.on('ai_update',     ()=>renderAIFeed());
eventBus.on('alerts_update', ()=>renderAlerts());
eventBus.on('timeline_update',()=>renderTimeline(document.querySelector('.filter-btn.active')?.dataset.filter||'all'));

/* Master update loop at 3-second intervals (simulating WebSocket push) */
function masterUpdate() {
  tickSimulation();
  eventBus.emit('zone_update');
  eventBus.emit('crowd_update');
  eventBus.emit('queue_update');
  eventBus.emit('network_update');
  eventBus.emit('topbar_update');
  eventBus.emit('parking_update');
  eventBus.emit('kpi_update');
  eventBus.emit('timeline_update');
}

/* ──────────────────────────────────────────
   25. INITIALIZATION
────────────────────────────────────────── */
function initDashboard() {
  // Seed initial data
  seedAlerts();
  seedAIDecisions();
  seedTimeline();

  // Initial renders (sync)
  renderHeatmap('overviewHeatmap');
  renderHeatmap('fullHeatmap');
  renderHeatmap('twinMap');
  renderTop3('top3Zones');
  renderTop3Podium();
  renderZoneDetails();
  renderQueueBars('overviewQueueBars');
  renderStallWaitList();
  renderParking();
  renderAlerts();
  renderAIFeed();
  renderGateControls();
  renderZoneControls();
  renderActionLog();
  renderTimeline('all');

  // Init charts (Chart.js)
  initNetworkChart();
  initQueueCharts();
  initAICharts();
  initRingCharts();
  initKPICharts();
  initSparklines();
  initTwinCharts();
  initDroneView();
  initStressChart();

  // Topbar
  updateTopbarStats();

  // Start simulation loop (3-second tick — simulates WebSocket)
  setInterval(masterUpdate, 3000);

  // Intro toast
  setTimeout(()=>showToast('Dashboard Online','All 13 modules initialized successfully','success'), 500);
  setTimeout(()=>showToast('AI Engine Live','AI decision engine is monitoring all 7 zones','info'), 1800);
}

// Boot
document.addEventListener('DOMContentLoaded', initDashboard);
