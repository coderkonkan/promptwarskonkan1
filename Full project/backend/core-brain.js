const simpleLinearRegression = require('simple-statistics').linearRegression;
const predict = require('simple-statistics').linearRegressionLine;

class CoreBrain {
    constructor() {
        this.zones = ['Gate A', 'Gate B', 'Gate C', 'Food Court', 'Washrooms', 'Section 1', 'Section 2', 'Parking Lot'];
        this.stalls = ['Burger Stall', 'Drinks Stand'];
        
        // Universal State
        this.state = {
            matchPhase: 'PRE_MATCH', // PRE_MATCH, LIVE, HALFTIME, END
            systemMode: 'NORMAL',    // NORMAL, EMERGENCY
            crowdDensity: {},
            queueWaits: {},
            droneTelemetry: {},
            parkingCapacity: 45, // % full
            networkLoad: 25, // % load
            digitalTwin: { accuracy: 92 },
            recentAlerts: [] // cross module alerts
        };

        this.history = {};
        this.tickCount = 0;

        // Initialize state
        this.zones.forEach(z => {
            this.state.crowdDensity[z] = z.includes('Parking') ? 80 : Math.floor(Math.random() * 15) + 5;
            this.history[z] = [[0, this.state.crowdDensity[z]]];
            this.state.droneTelemetry[z] = { blindSpot: false, marked: false };
        });
        this.stalls.forEach(s => {
            this.state.queueWaits[s] = Math.floor(Math.random() * 3);
        });
    }

    // --- Core Master Tick ---
    tick() {
        this.tickCount++;
        
        // 1. Organic Crowd Simulation & Drone Overrides
        this.zones.forEach(z => {
            let flux = Math.floor(Math.random() * 5) - 2;
            
            if (this.state.matchPhase === 'HALFTIME' && (z.includes('Food') || z.includes('Washrooms'))) {
                flux += 4; // Natural pull during half time
            }
            if (this.state.systemMode === 'EMERGENCY' && z.includes('Gate')) {
                flux += 20; // Panic rush to gates
            }
            
            this.state.crowdDensity[z] = Math.max(0, Math.min(100, this.state.crowdDensity[z] + flux));

            // Record for ML time-series
            this.history[z].push([this.tickCount, this.state.crowdDensity[z]]);
            if (this.history[z].length > 10) this.history[z].shift();
        });

        // 2. Queue Sync (Tied to Food Court Density)
        const foodDensity = this.state.crowdDensity['Food Court'];
        this.stalls.forEach(s => {
            let base = this.state.queueWaits[s];
            if (foodDensity > 70) base += Math.random() * 2;
            else if (foodDensity < 40) base -= Math.random();
            this.state.queueWaits[s] = Math.max(0, parseFloat((base).toFixed(1)));
        });

        // 3. Dynamic Parking & Pricing overrides
        if (this.state.matchPhase === 'END') {
            this.state.parkingCapacity = Math.max(0, this.state.parkingCapacity - 5);
        }

        // Return unified snapshot
        return this.getUnifiedSnapshot();
    }

    // --- Event Driven Architecture ---
    triggerEvent(eventType) {
        console.log(`[SVES] Master Event Triggered: ${eventType}`);
        
        // EMERGENCY overrides all protocols
        if (eventType === 'EMERGENCY_TRIGGER') {
            this.state.systemMode = 'EMERGENCY';
            this.pushAlert('CRITICAL: EVACUATION ORDERED. Proceed to nearest Gate.', 'urgent');
            return;
        }

        this.state.matchPhase = eventType;
        
        // Cross-module shockwaves
        switch(eventType) {
            case 'MATCH_START':
                // Shift crowd to sections
                this.zones.forEach(z => {
                    if (z.includes('Section')) this.state.crowdDensity[z] = Math.min(100, this.state.crowdDensity[z] + 40);
                    if (z.includes('Gate') || z.includes('Food')) this.state.crowdDensity[z] = Math.max(5, this.state.crowdDensity[z] - 30);
                });
                break;
            case 'HALFTIME':
                // Rush to food
                this.pushAlert('Halftime initiated. Queue system engaged dynamic pricing.', 'warning');
                this.zones.forEach(z => {
                    if (z.includes('Section')) this.state.crowdDensity[z] = Math.max(10, this.state.crowdDensity[z] - 40);
                    if (z.includes('Food') || z.includes('Washrooms')) this.state.crowdDensity[z] = Math.min(100, this.state.crowdDensity[z] + 60);
                });
                break;
            case 'MATCH_END':
                this.pushAlert('Match concluded. Outbound transit optimization active.', 'info');
                this.zones.forEach(z => {
                    if (z.includes('Section')) this.state.crowdDensity[z] = 5;
                    if (z.includes('Gate')) this.state.crowdDensity[z] = 85; 
                });
                break;
        }
    }

    pushAlert(msg, level) {
        this.state.recentAlerts.unshift({ id: Date.now(), msg, level });
        if (this.state.recentAlerts.length > 5) this.state.recentAlerts.pop();
    }

    // --- AI Prediction & Decision Logic ---
    getUnifiedSnapshot() {
        const predictions = { crowd: {}, queues: {}, aiActions: [] };
        
        // Predict Crowd
        this.zones.forEach(z => {
            const hist = this.history[z];
            let future10 = this.state.crowdDensity[z];
            if (hist.length > 2) {
                const l = simpleLinearRegression(hist);
                const model = predict(l);
                future10 = Math.min(100, Math.max(0, Math.floor(model(this.tickCount + 10))));
            }
            predictions.crowd[z] = { '10m': future10 };
            
            // AI Action Generation
            if (future10 > 85) {
                predictions.aiActions.push(`Rerouting away from ${z} (Predicted Surge: ${future10}%)`);
            }
        });

        // Predict Queues
        this.stalls.forEach(s => {
            let futureWait = this.state.queueWaits[s];
            if (predictions.crowd['Food Court']['10m'] > 80) futureWait += 15;
            predictions.queues[s] = futureWait.toFixed(1);
        });

        return {
            state: this.state,
            predictions: predictions
        };
    }
}

module.exports = CoreBrain;
