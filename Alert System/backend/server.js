const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3003;

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let alertHistory = [];

// Configuration
const THRESHOLDS = {
    CROWD_DENSITY: 80,
    QUEUE_WAIT: 20
};

// Simulation State
let systemStatus = "Normal";

// Function to broadcast alert
function broadcast(alert) {
    const message = JSON.stringify(alert);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
    alertHistory.unshift({ ...alert, timestamp: new Date() });
    if (alertHistory.length > 50) alertHistory.pop();
}

// Monitoring Logic
async function monitorModules() {
    try {
        // 1. Monitor Crowd Density (Port 3000)
        const crowdRes = await axios.get('http://localhost:3000/crowd-data');
        const crowdData = crowdRes.data;
        
        crowdData.forEach(zone => {
            if (zone.density > THRESHOLDS.CROWD_DENSITY) {
                broadcast({
                    type: 'CROWD_SPIKE',
                    priority: 'High',
                    zone: zone.zone,
                    message: `CRITICAL: ${zone.zone} is overcrowded (${zone.density}%)!`,
                    action: 'Redirect users to alternate gates.'
                });
            }
        });

        // 2. Monitor Queue Overflow (Port 3002)
        const queueRes = await axios.get('http://localhost:3002/api/queue-status');
        const queueData = queueRes.data;
        
        queueData.forEach(stall => {
            if (stall.avg_wait_time > THRESHOLDS.QUEUE_WAIT) {
                broadcast({
                    type: 'QUEUE_OVERFLOW',
                    priority: 'Medium',
                    stall: stall.name,
                    message: `Long wait at ${stall.name}: ${stall.avg_wait_time} mins.`,
                    action: 'Check nearby stalls for shorter queues.'
                });
            }
        });

    } catch (error) {
        console.error("Monitoring error (Check if basic servers are running on 3000 and 3002):", error.message);
    }
}

// Simulation of Match Events
function simulateMatchEvents() {
    const random = Math.random();
    if (random > 0.95) {
        broadcast({
            type: 'MATCH_EVENT',
            priority: 'Medium',
            message: 'GOAL SCORED! Expect surge near seating exits.',
            action: 'Stay seated until the rush subsides.'
        });
    } else if (random > 0.98) {
        broadcast({
            type: 'PREDICTED_CONGESTION',
            priority: 'Low',
            message: 'Halftime starting in 5 mins. Food court surge expected.',
            action: 'Pre-order drinks now to save time.'
        });
    }
}

// WebSocket Connection Handling
wss.on('connection', (ws) => {
    console.log('New client connected to Alerts Hub');
    // Send recent history
    ws.send(JSON.stringify({ type: 'HISTORY', data: alertHistory }));
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'MANUAL_BROADCAST') {
            broadcast({
                type: 'ADMIN_BROADCAST',
                priority: data.priority || 'Medium',
                message: data.message,
                action: data.action || 'Awaiting further instructions.'
            });
        } else if (data.type === 'EMERGENCY_TRIGGER') {
            systemStatus = "Emergency";
            broadcast({
                type: 'EMERGENCY_ALERT',
                priority: 'Critical',
                message: 'EMERGENCY: PLEASE PROCEED TO THE NEAREST EXIT IMMEDIATELY.',
                action: 'Follow emergency lighting strictly.'
            });
        }
    });
});

// Run monitoring loops
setInterval(monitorModules, 5000);
setInterval(simulateMatchEvents, 15000);

server.listen(PORT, () => {
    console.log(`Alerts Hub running on http://localhost:${PORT}`);
});
