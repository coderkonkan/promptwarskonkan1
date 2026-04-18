const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const AIEngine = require('./engine');
const DecisionMaker = require('./decision-maker');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const engine = new AIEngine();
const decisionMaker = new DecisionMaker();

// Broadcast simulation state every 2 seconds
setInterval(() => {
    const rawState = engine.tick(); // advances the ML prediction models
    const decisions = decisionMaker.analyze(rawState);
    
    const payload = {
        state: rawState,
        decisions: decisions.adminDecisions,
        userAlerts: decisions.userAlerts
    };

    io.emit('prediction_update', payload);
}, 2000);

// API to trigger events (e.g. from Admin Dashboard)
app.post('/api/event', (req, res) => {
    const { eventType } = req.body;
    if (!eventType) return res.status(400).send({ error: 'Missing eventType' });
    
    engine.triggerEvent(eventType);
    
    return res.send({ message: `Simulated event ${eventType} triggered.`});
});

server.listen(3000, () => {
    console.log('AI Simulation Engine running on http://localhost:3000');
});
