const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// The 7 required zones
const zones = [
    "Gate A",
    "Gate B",
    "Gate C",
    "Food Court",
    "Washrooms",
    "Seating Area 1",
    "Seating Area 2"
];

// Current state of the simulation
let crowdData = zones.map(zone => ({
    zone: zone,
    density: Math.floor(Math.random() * 101),
    status: "Medium"
}));

// Helper to determine status based on density
function getStatus(density) {
    if (density < 40) return "Low";
    if (density < 75) return "Medium";
    return "High";
}

// Ensure initial status is calculated properly
crowdData.forEach(item => {
    item.status = getStatus(item.density);
});

// Simulation Phase ("pre-match", "match", "halftime")
let matchPhase = "pre-match";
let phaseTimer = 0;

function updateSimulation() {
    phaseTimer += 3;
    
    // Simple state machine for realistic phase changes over time
    if (matchPhase === "pre-match" && phaseTimer > 30) {
        matchPhase = "match";
    } else if (matchPhase === "match" && phaseTimer > 60) {
        matchPhase = "halftime";
    } else if (matchPhase === "halftime" && phaseTimer > 90) {
        matchPhase = "match";
        phaseTimer = 31; // Go back to match state
    }

    crowdData = crowdData.map(item => {
        let currentDensity = item.density;
        
        // Random fluctuation between -5 and +5
        // More aggressive random fluctuation between -15 and +15 to ensure visibility
        let change = Math.floor(Math.random() * 31) - 15;
        
        // Apply realism modifiers based on phase
        if (matchPhase === "pre-match") {
            if (item.zone.startsWith("Gate")) change += 5;
            if (item.zone.startsWith("Seating")) change += 3;
        } else if (matchPhase === "match") {
            if (item.zone.startsWith("Gate")) change -= 8;
            if (item.zone.startsWith("Seating")) change += 5;
            if (item.zone === "Food Court") change -= 5;
            if (item.zone === "Washrooms") change -= 2;
        } else if (matchPhase === "halftime") {
            if (item.zone.startsWith("Seating")) change -= 8;
            if (item.zone === "Food Court") change += 10;
            if (item.zone === "Washrooms") change += 8;
        }

        // Apply change and clamp
        let newDensity = currentDensity + change;
        
        // If it gets stuck at boundaries, bounce it
        if (newDensity >= 100) newDensity = 90 - Math.floor(Math.random() * 20);
        if (newDensity <= 0) newDensity = 10 + Math.floor(Math.random() * 20);
        
        newDensity = Math.max(0, Math.min(100, newDensity));

        return {
            zone: item.zone,
            density: newDensity,
            status: getStatus(newDensity)
        };
    });
}

// Update the simulation every 3 seconds
setInterval(updateSimulation, 3000);

// API Endpoint
app.get('/crowd-data', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(crowdData);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
