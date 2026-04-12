const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- Full Stadium Map Model ---
const nodes = {};
const edges = [];

const pitchCenter = { x: 300, y: 300 };

// 1. Gates (Outer perimeter)
const gateNames = ["Gate North", "Gate East", "Gate South", "Gate West"];
gateNames.forEach((name, i) => {
    const angle = (i * 90) * (Math.PI / 180);
    const radius = 320;
    nodes[name] = {
        x: Math.round(pitchCenter.x + radius * Math.sin(angle)),
        y: Math.round(pitchCenter.y - radius * Math.cos(angle)),
        type: 'gate'
    };
});

// 2. Sections (Inner and Outer Tiers)
const sectionsPerTier = 8;
const tiers = [
    { prefix: "10", radius: 180 }, // Lower tier
    { prefix: "20", radius: 260 }  // Upper tier
];

tiers.forEach(tier => {
    for (let i = 1; i <= sectionsPerTier; i++) {
        const name = `Section ${tier.prefix}${i}`;
        const angle = ((i - 1) * 45 + 22.5) * (Math.PI / 180); // Offset by 22.5 to be between ordinal directions
        nodes[name] = {
            x: Math.round(pitchCenter.x + tier.radius * Math.sin(angle)),
            y: Math.round(pitchCenter.y - tier.radius * Math.cos(angle)),
            type: 'section'
        };
    }
});

// 3. Facilities
nodes["North Food Court"] = { x: 300, y: 100, type: 'facility' };
nodes["South Food Court"] = { x: 300, y: 500, type: 'facility' };
nodes["East Washrooms"] = { x: 500, y: 300, type: 'facility' };
nodes["West Washrooms"] = { x: 100, y: 300, type: 'facility' };

// --- Edge Connections ---

// Connect Gates to nearest facilities/concourses
edges.push({ from: "Gate North", to: "North Food Court", dist: 50 });
edges.push({ from: "Gate South", to: "South Food Court", dist: 50 });
edges.push({ from: "Gate East", to: "East Washrooms", dist: 50 });
edges.push({ from: "Gate West", to: "West Washrooms", dist: 50 });

// Connect Sections in a ring (Concourses)
tiers.forEach(tier => {
    for (let i = 1; i <= sectionsPerTier; i++) {
        const current = `Section ${tier.prefix}${i}`;
        const nextIdx = (i % sectionsPerTier) + 1;
        const next = `Section ${tier.prefix}${nextIdx}`;
        edges.push({ from: current, to: next, dist: 100 });
    }
});

// Connect Inner tier to Outer tier
for (let i = 1; i <= sectionsPerTier; i++) {
    edges.push({ from: `Section 10${i}`, to: `Section 20${i}`, dist: 80 });
}

// Connect Facilities to nearby Sections
edges.push({ from: "North Food Court", to: "Section 101", dist: 60 });
edges.push({ from: "North Food Court", to: "Section 108", dist: 60 });
edges.push({ from: "South Food Court", to: "Section 104", dist: 60 });
edges.push({ from: "South Food Court", to: "Section 105", dist: 60 });
edges.push({ from: "East Washrooms", to: "Section 102", dist: 60 });
edges.push({ from: "East Washrooms", to: "Section 103", dist: 60 });
edges.push({ from: "West Washrooms", to: "Section 106", dist: 60 });
edges.push({ from: "West Washrooms", to: "Section 107", dist: 60 });

// --- Crowd Data Simulation ---
let crowdData = {};
Object.keys(nodes).forEach(node => {
    crowdData[node] = { density: 20, status: "Low" };
});

function updateCrowd() {
    Object.keys(crowdData).forEach(node => {
        let change = Math.floor(Math.random() * 15) - 7;
        let newDensity = Math.max(0, Math.min(100, crowdData[node].density + change));
        crowdData[node] = {
            density: newDensity,
            status: newDensity < 30 ? "Low" : (newDensity < 70 ? "Medium" : "High")
        };
    });
}
setInterval(updateCrowd, 3000);

// --- Dijkstra's Engine ---
function findPath(start, end, penaltied = true) {
    const dists = {};
    const prev = {};
    const queue = new Set(Object.keys(nodes));
    
    Object.keys(nodes).forEach(v => { dists[v] = Infinity; prev[v] = null; });
    dists[start] = 0;

    while (queue.size > 0) {
        let u = null;
        queue.forEach(v => { if (u === null || dists[v] < dists[u]) u = v; });
        if (u === end || dists[u] === Infinity) break;
        queue.delete(u);

        edges.filter(e => e.from === u || e.to === u).forEach(e => {
            const v = e.from === u ? e.to : e.from;
            if (!queue.has(v)) return;
            let cost = e.dist;
            if (penaltied) cost += crowdData[v].density * 4;
            let alt = dists[u] + cost;
            if (alt < dists[v]) { dists[v] = alt; prev[v] = u; }
        });
    }

    const path = [];
    let curr = end;
    while (curr) { path.unshift(curr); curr = prev[curr]; }
    return { path, dist: dists[end] };
}

// --- API ---
app.get('/api/crowd-data', (req, res) => res.json(crowdData));

app.get('/api/get-route', (req, res) => {
    const { source, destination, emergency } = req.query;
    if (!nodes[source] || !nodes[destination]) return res.status(400).json({ error: "Invalid locations" });

    const result = findPath(source, destination, emergency !== 'true');
    res.json({
        path: result.path.map(n => ({ name: n, ...nodes[n] })),
        eta: `${Math.ceil(result.dist / 60)} min`,
        congestionLevel: result.path.length > 0 ? crowdData[result.path[Math.floor(result.path.length/2)]].status : "Low"
    });
});

app.listen(PORT, () => console.log(`Nav Server with 24+ nodes running on :${PORT}`));
