class DecisionMaker {
    constructor() {}

    // 4. DECISION RECOMMENDATION ENGINE
    // 5. PERSONALIZED AI ASSISTANT
    analyze(snapshot) {
        const decisions = [];
        const personalAlerts = [];

        // Check Crowd predictions
        const crowdPred = snapshot.predictions.crowd;
        for (const [zone, pred] of Object.entries(crowdPred)) {
            if (pred['10min'] > 85) {
                decisions.push({
                    type: 'CROWD_SPIKE_WARNING',
                    zone: zone,
                    message: `Predicted surge: ${zone} reaching ${pred['10min']}% capacity in 10 mins.`,
                    action: 'Suggest Alternate Routes, Update Signage',
                    priority: 'High'
                });

                if (zone.includes('Food') || zone.includes('Washroom')) {
                    personalAlerts.push({
                        title: 'Pro Tip',
                        message: `Avoid ${zone} in 10 mins, it will be very crowded. Go now!`,
                        type: 'warning'
                    });
                }
            } else if (pred['5min'] < 40) {
                if (zone.includes('Washroom')) {
                    personalAlerts.push({
                        title: 'Less Crowded',
                        message: `Nearest washroom (${zone}) is less crowded now.`,
                        type: 'info'
                    });
                }
            }
        }

        // Check Queue predictions
        const queuePred = snapshot.predictions.queues;
        for (const [stall, pred] of Object.entries(queuePred)) {
            if (pred['10min_wait'] > 15) {
                let current = snapshot.queues[stall];
                decisions.push({
                    type: 'QUEUE_OVERLOAD',
                    stall: stall,
                    message: `${stall} queue will increase from ${current} min -> ${pred['10min_wait']} min in 10 minutes.`,
                    action: 'Recommend Other Stalls, Trigger Dynamic Pricing',
                    priority: 'Medium'
                });

                personalAlerts.push({
                    title: 'Queue Alert',
                    message: `Order food from elsewhere, ${stall} will have a ${pred['10min_wait']} min wait shortly.`,
                    type: 'warning'
                });
            }
        }

        // Reduce spam in personal alerts by grabbing top 2
        const topPersonalAlerts = personalAlerts.sort((a,b) => a.type === 'warning' ? -1 : 1).slice(0, 2);

        return {
            adminDecisions: decisions,
            userAlerts: topPersonalAlerts
        };
    }
}

module.exports = DecisionMaker;
