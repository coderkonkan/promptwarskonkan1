const simpleLinearRegression = require('simple-statistics').linearRegression;
const predict = require('simple-statistics').linearRegressionLine;

class AIEngine {
    constructor() {
        // Base zones
        this.zones = [
            'Gate A', 'Gate B', 'Gate C', 
            'Food Court A', 'Washroom North', 
            'Seating Section 1', 'Seating Section 2'
        ];

        this.stalls = ['Burger Stall', 'Drinks Stand', 'Merch Store'];

        // Real-time state
        this.currentState = {
            timePhase: 'pre-match', // pre-match, live, halftime, post-match
            density: {}, // current density % per zone
            queues: {}, // queue length in mins per stall
            confidenceScore: 72, // starts at 72%
            history: {} // array of historical density values per zone for Time Series prediction
        };

        // Initialize state
        this.zones.forEach(z => {
            this.currentState.density[z] = Math.floor(Math.random() * 20) + 10;
            this.currentState.history[z] = [[0, this.currentState.density[z]]];
        });
        this.stalls.forEach(s => {
            this.currentState.queues[s] = Math.floor(Math.random() * 5);
        });

        this.tickCount = 0;
    }

    // 1. EVENT-AWARE INTELLIGENCE
    triggerEvent(eventType) {
        // MATCH_START, GOAL_SCORED, HALFTIME, MATCH_END
        console.log(`[AI Engine] Event Triggered: ${eventType}`);
        
        switch (eventType) {
            case 'MATCH_START':
                this.currentState.timePhase = 'live';
                this.zones.forEach(z => {
                    if (z.includes('Seating')) this.currentState.density[z] += 30;
                    if (z.includes('Gate')) this.currentState.density[z] = Math.max(5, this.currentState.density[z] - 20);
                });
                break;
            case 'GOAL_SCORED':
                // Micro-surge in food/washroom shortly after
                this.currentState.density['Washroom North'] += 15;
                this.currentState.density['Food Court A'] += 10;
                break;
            case 'HALFTIME':
                this.currentState.timePhase = 'halftime';
                this.zones.forEach(z => {
                    if (z.includes('Seating')) this.currentState.density[z] = Math.max(10, this.currentState.density[z] - 40);
                    if (z.includes('Food') || z.includes('Washroom')) this.currentState.density[z] += 50;
                });
                this.stalls.forEach(s => this.currentState.queues[s] += 15);
                break;
            case 'MATCH_END':
                this.currentState.timePhase = 'post-match';
                this.zones.forEach(z => {
                    if (z.includes('Seating')) this.currentState.density[z] = 5;
                    if (z.includes('Gate')) this.currentState.density[z] += 60;
                });
                break;
        }

        // Add some noise to realism
        this.normalizeDensity();
    }

    normalizeDensity() {
        this.zones.forEach(z => {
            if (this.currentState.density[z] > 100) this.currentState.density[z] = 100;
            if (this.currentState.density[z] < 0) this.currentState.density[z] = 0;
            
            // Record history
            this.currentState.history[z].push([this.tickCount, this.currentState.density[z]]);
            if (this.currentState.history[z].length > 10) {
                this.currentState.history[z].shift(); // keep last 10 ticks
            }
        });
    }

    // SIMULATION LOOP
    tick() {
        this.tickCount++;

        // Add some random flux
        this.zones.forEach(z => {
            const flux = Math.floor(Math.random() * 5) - 2; // -2 to +2
            this.currentState.density[z] += flux;
        });

        this.stalls.forEach(s => {
            const queueFlux = Math.floor(Math.random() * 3) - 1; // -1 to +1
            this.currentState.queues[s] = Math.max(0, this.currentState.queues[s] + queueFlux);
        });

        this.normalizeDensity();

        // 8. REAL-TIME LEARNING (Simulate ML accuracy improvement over time)
        if (this.tickCount % 5 === 0 && this.currentState.confidenceScore < 96) {
            this.currentState.confidenceScore += (Math.random() * 1.5);
        }

        return this.getSnapshot();
    }

    getSnapshot() {
        return {
            timePhase: this.currentState.timePhase,
            density: { ...this.currentState.density },
            queues: { ...this.currentState.queues },
            confidenceScore: parseFloat(this.currentState.confidenceScore.toFixed(1)),
            predictions: this.runPredictions()
        };
    }

    // 1, 2, 3. PREDICTION ENGINES
    runPredictions() {
        let predictions = {
            crowd: {}, // zone: { 5min: % , 10min: % }
            queues: {},
            trends: [] // Behavioral movement arrows
        };

        // Crowd Prediction (Time-series simulate)
        this.zones.forEach(z => {
            const historyData = this.currentState.history[z];
            
            let future5 = this.currentState.density[z];
            let future10 = this.currentState.density[z];

            if (historyData.length > 2) {
                // Use Simple Linear Regression
                const l = simpleLinearRegression(historyData);
                const model = predict(l);
                future5 = Math.floor(model(this.tickCount + 5));
                future10 = Math.floor(model(this.tickCount + 10));
            }

            // Adjust by event heuristics
            if (this.currentState.timePhase === 'halftime' && z.includes('Seating')) {
                future10 += 30; // predict returning to seats
            }
            if (this.currentState.timePhase === 'live' && this.tickCount > 10 && z.includes('Food')) {
                // Predict halftime rush
                future10 += 40;
            }

            predictions.crowd[z] = {
                '5min': Math.min(100, Math.max(0, future5)),
                '10min': Math.min(100, Math.max(0, future10))
            };
        });

        // Queue Prediction
        this.stalls.forEach(s => {
            let base = this.currentState.queues[s];
            let foodPrediction = predictions.crowd['Food Court A']['10min'];
            let futureQ = base;
            
            if (foodPrediction > 70) {
                futureQ += 15; // Queue spike
            }
            predictions.queues[s] = {
                '10min_wait': Math.floor(futureQ)
            };
        });

        // Movement trends
        predictions.trends.push({
            from: 'Seating Section 1',
            to: 'Washroom North',
            volume: (this.currentState.timePhase === 'halftime' ? 'High' : 'Low')
        });

        return predictions;
    }
}

module.exports = AIEngine;
