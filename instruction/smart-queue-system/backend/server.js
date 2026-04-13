const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Initial Data Store ---
let facilities = [
    { stall_id: "F1", name: "Goalpost Grill", type: "food", location: "North Zone", queue_length: 12, service_rate: 2, discount: 0, predicted_wait_time: 0 },
    { stall_id: "F2", name: "Penalty Pizza", type: "food", location: "South Zone", queue_length: 25, service_rate: 3, discount: 0, predicted_wait_time: 0 },
    { stall_id: "F3", name: "Winner's Wings", type: "food", location: "East Zone", queue_length: 8, service_rate: 1.5, discount: 0, predicted_wait_time: 0 },
    { stall_id: "W1", name: "Premium Washrooms", type: "washroom", location: "Section A", queue_length: 5, service_rate: 5, discount: 0, predicted_wait_time: 0 },
    { stall_id: "W2", name: "Standard Washrooms", type: "washroom", location: "Section B", queue_length: 18, service_rate: 4, discount: 0, predicted_wait_time: 0 },
    { stall_id: "M1", name: "Merch Megastore", type: "merchandise", location: "Main Plaza", queue_length: 30, service_rate: 1, discount: 0, predicted_wait_time: 0 },
    { stall_id: "M2", name: "Fan Stand", type: "merchandise", location: "West Wing", queue_length: 6, service_rate: 0.8, discount: 0, predicted_wait_time: 0 }
];

// --- Simulation Logic ---
let matchPhase = "match"; // pre-match, match, halftime, post-match
let simulationTime = 0;

function updateWaitTimes() {
    facilities.forEach(f => {
        // Simple formula: wait_time = length / rate
        f.avg_wait_time = Math.ceil(f.queue_length / f.service_rate);
    });
}

function simulateSurge() {
    simulationTime += 1;
    
    // Cycle phases every 30 intervals (90 seconds total per phase)
    if (simulationTime < 30) matchPhase = "pre-match";
    else if (simulationTime < 60) matchPhase = "match";
    else if (simulationTime < 90) matchPhase = "halftime";
    else { matchPhase = "post-match"; if (simulationTime > 120) simulationTime = 0; }

    const isNearingHalftime = (matchPhase === "match" && simulationTime > 50);

    facilities.forEach(f => {
        let change = Math.floor(Math.random() * 5) - 2; // Default fluctuation

        if (matchPhase === "halftime") {
            if (f.type === "food" || f.type === "washroom") change += 4;
        } else if (matchPhase === "match") {
            change -= 2;
        } else if (matchPhase === "pre-match") {
            if (f.type === "merchandise") change += 3;
        }

        f.queue_length = Math.max(0, Math.min(60, f.queue_length + change));

        // Intelligent Load Balancing: Apply incentives for low-traffic stalls
        if (f.queue_length < 10 && (f.type === "food" || f.type === "merchandise")) {
            f.discount = 15; // 15% incentive
        } else {
            f.discount = 0;
        }

        // Prediction Logic: Forecast future wait times
        if (isNearingHalftime && (f.type === "food" || f.type === "washroom")) {
            // Predict a much higher wait time in 5 minutes (approx 10 steps)
            f.predicted_wait_time = Math.ceil((f.queue_length + 20) / f.service_rate);
        } else {
            f.predicted_wait_time = Math.ceil((f.queue_length + (change * 2)) / f.service_rate);
        }
    });
    
    updateWaitTimes();
}

// Update simulation every 3 seconds
setInterval(simulateSurge, 3000);
updateWaitTimes(); // Initial calculation

// --- API Endpoints ---

// GET /api/queue-status
app.get('/api/queue-status', (req, res) => {
    res.json(facilities);
});

// GET /api/best-option?type=food
app.get('/api/best-option', (req, res) => {
    const type = req.query.type;
    if (!type) return res.status(400).json({ error: "Missing type query parameter" });

    const filtered = facilities.filter(f => f.type === type);
    if (filtered.length === 0) return res.status(404).json({ error: "No facilities found for this type" });

    const best = filtered.reduce((prev, curr) => (prev.avg_wait_time < curr.avg_wait_time) ? prev : curr);
    res.json(best);
});

// POST /api/pre-order
app.post('/api/pre-order', (req, res) => {
    const { stall_id, items } = req.body;
    const stall = facilities.find(f => f.stall_id === stall_id);
    
    if (!stall) return res.status(404).json({ error: "Stall not found" });

    const token = `TKN-${Math.floor(Math.random() * 9000) + 1000}`;
    const pickupIn = Math.ceil(stall.avg_wait_time * 0.7); // Faster than queue

    res.json({
        success: true,
        token,
        pickupIn: `${pickupIn} min`,
        message: "Your order has been received. Please head to the digital pickup counter."
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Queue Backend running on http://0.0.0.0:${PORT}`);
    console.log(`Simulation active. Phase: ${matchPhase}`);
});
