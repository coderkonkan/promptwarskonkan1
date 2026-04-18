const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const CoreBrain = require('./core-brain');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const brain = new CoreBrain();

// Real-Time Event Loop Engine
// Ticks every 1.5 seconds, emitting system-wide synchronized state to all clients
setInterval(() => {
    const unifiedSnapshot = brain.tick();
    io.emit('SVES_UPDATE', unifiedSnapshot);
}, 1500);

// API Endpoints for Admin Triggers
app.post('/api/trigger', (req, res) => {
    const { eventType } = req.body;
    if (!eventType) return res.status(400).send({ error: 'Missing eventType' });
    
    brain.triggerEvent(eventType);
    
    // Broadcast immediate shockwave to clients
    const snap = brain.getUnifiedSnapshot();
    io.emit('SVES_UPDATE', snap);
    
    return res.send({ success: true, event: eventType });
});

server.listen(4000, () => {
    console.log('[SVES] Central Intelligence Engine running on http://localhost:4000');
});
