const socket = io('http://localhost:3000');

const alertsContainer = document.getElementById('ai-alerts-container');
const zonesContainer = document.getElementById('zone-list-container');

socket.on('prediction_update', (data) => {
    // 1. Update Personal Alerts
    renderAlerts(data.userAlerts);

    // 2. Update Zone List
    renderZones(data.state.density, data.state.predictions.crowd);
});

function renderAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
        alertsContainer.innerHTML = `<div style="color: #666; font-size: 0.9rem;">No active AI alerts. Enjoy the match!</div>`;
        return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="ai-alert ${alert.type}">
            <div class="ai-alert-title">✦ ${alert.title}</div>
            <div class="ai-alert-msg">${alert.message}</div>
        </div>
    `).join('');
}

function renderZones(currentDensity, predictions) {
    const sortedZones = Object.keys(currentDensity).sort((a,b) => currentDensity[b] - currentDensity[a]);
    
    zonesContainer.innerHTML = sortedZones.map(zone => {
        const val = currentDensity[zone];
        const pred10 = predictions[zone] ? predictions[zone]['10min'] : val;
        
        // Define color density
        let pillClass = 'density-low';
        if (pred10 > 75) pillClass = 'density-high';
        else if (pred10 > 40) pillClass = 'density-med';

        return `
        <div class="zone-item">
            <div class="zone-name">${zone}</div>
            <div style="text-align: right;">
                <div class="zone-density">${val}% Now</div>
                <div class="density-pill ${pillClass}">Pred: ${pred10}% in 10m</div>
            </div>
        </div>
        `;
    }).join('');
}
