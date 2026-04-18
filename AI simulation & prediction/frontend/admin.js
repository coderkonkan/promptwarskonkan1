const socket = io('http://localhost:3000');

// DOM Elements
const confVal = document.getElementById('confidence-val');
const phaseVal = document.getElementById('phase-val');
const decisionFeed = document.getElementById('decision-feed');

// Chart Setup
Chart.defaults.color = '#c5c6c7';
Chart.defaults.font.family = 'Outfit';

// 1. Digital Twin vs Predicted Chart
const ctxTwin = document.getElementById('twinChart').getContext('2d');
const twinChart = new Chart(ctxTwin, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Actual Live Density (%)',
                backgroundColor: 'rgba(102, 252, 241, 0.7)',
                data: []
            },
            {
                label: 'AI Forecast (10min Ahead)',
                backgroundColor: 'rgba(252, 163, 17, 0.7)',
                data: []
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});

// 2. Queue Wait Prediction Chart
const ctxQueue = document.getElementById('queueChart').getContext('2d');
const queueChart = new Chart(ctxQueue, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Live Wait Time (min)',
                borderColor: '#45a29e',
                backgroundColor: 'rgba(69, 162, 158, 0.2)',
                fill: true,
                data: []
            },
            {
                label: 'Predicted Wait (10min Ahead)',
                borderColor: '#ff4b4b',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                data: []
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Helper for HTTP Post
async function triggerEvent(eventType) {
    try {
        await fetch('http://localhost:3000/api/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType })
        });
        console.log(`Event ${eventType} fired.`);
    } catch(e) {
        console.error(e);
    }
}

// Listen to Socket
socket.on('prediction_update', (payload) => {
    // 1. Update Header
    confVal.innerText = payload.state.confidenceScore + '%';
    phaseVal.innerText = payload.state.timePhase.replace('-', ' ');

    // 2. Update Charts
    updateTwinChart(payload.state.density, payload.state.predictions.crowd);
    updateQueueChart(payload.state.queues, payload.state.predictions.queues);

    // 3. Update AI Decision Feed
    updateDecisions(payload.decisions);
});

function updateTwinChart(densities, predictions) {
    const labels = Object.keys(densities);
    const actual = Object.values(densities);
    const predicted = labels.map(l => predictions[l] ? predictions[l]['10min'] : 0);

    twinChart.data.labels = labels;
    twinChart.data.datasets[0].data = actual;
    twinChart.data.datasets[1].data = predicted;
    twinChart.update();
}

function updateQueueChart(queues, predictions) {
    const labels = Object.keys(queues);
    const actual = Object.values(queues);
    const predicted = labels.map(l => predictions[l] ? predictions[l]['10min_wait'] : 0);

    queueChart.data.labels = labels;
    queueChart.data.datasets[0].data = actual;
    queueChart.data.datasets[1].data = predicted;
    queueChart.update();
}

function updateDecisions(decisions) {
    if (!decisions || decisions.length === 0) {
        decisionFeed.innerHTML = `<div style="color: #666; font-size: 0.9rem;">No active decisions recommended. System stable.</div>`;
        return;
    }

    decisionFeed.innerHTML = decisions.map(d => {
        let badgeClass = d.priority.toLowerCase();
        return `
            <div class="decision-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <div style="font-weight: 600; font-size: 0.95rem;">${d.type.replace(/_/g, ' ')}</div>
                    <span class="badge ${badgeClass}">${badgeClass.toUpperCase()} PRIORITY</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
                    ${d.message}
                </div>
                <div class="decision-action">
                    <span>⚡ Automatically Triggered:</span> <strong>${d.action}</strong>
                </div>
            </div>
        `;
    }).join('');
}
