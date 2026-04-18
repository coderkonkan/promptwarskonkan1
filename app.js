// Navigation Logic (SPA View Switching)
function switchView(viewId, btnElement) {
    // Hide all views
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active-view');
    });
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show target view & set active tab
    document.getElementById(`view-${viewId}`).classList.add('active-view');
    btnElement.classList.add('active');
}

// Accessibility Features
let isLargeText = false;
function toggleAccessibility() {
    isLargeText = !isLargeText;
    if (isLargeText) {
        document.body.classList.add('large-text-mode');
    } else {
        document.body.classList.remove('large-text-mode');
    }
}

// Gamification Overlay
let currentPoints = 450;
let routeCount = 0;
function showCelebration(points) {
    const overlay = document.getElementById('celebration');
    overlay.classList.remove('hidden');
    
    currentPoints += points;
    document.getElementById('gamification-score').innerText = `⭐ ${currentPoints} pts`;

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 2500);
}

// Navigation & Rerouting Mock
function startRoute(type) {
    const etaPill = document.getElementById('route-eta');
    
    if (type === 'exit') {
        etaPill.innerHTML = "Calculating fastest exit...";
        etaPill.style.color = "var(--warning-color)";
        setTimeout(() => {
            etaPill.innerHTML = "ETA: 6 mins • Low Crowd (Exit B)";
            etaPill.style.color = "var(--success-color)";
        }, 800);
        
        // Mock routing points
        if (routeCount === 0) {
            setTimeout(() => {
                showCelebration(50); // Give points for using smart routing
            }, 1500);
        }
        routeCount++;
    } else if (type === 'food') {
        etaPill.innerHTML = "Rerouting to nearest Food Court...";
        setTimeout(() => {
            etaPill.innerHTML = "ETA: 2 mins • Burger Stall";
            etaPill.style.color = "var(--secondary-accent)";
        }, 800);
    }
}

// Real-Time Alert System
function showAlert(message, isUrgent = false) {
    const alertBox = document.getElementById('urgent-alert');
    const alertText = document.getElementById('urgent-alert-text');
    
    alertText.innerText = message;
    alertBox.classList.remove('hidden');
    
    if (isUrgent) {
        alertBox.style.background = 'rgba(255, 75, 75, 0.15)';
        alertBox.style.borderColor = 'rgba(255, 75, 75, 0.4)';
    } else {
        alertBox.style.background = 'rgba(102, 252, 241, 0.1)';
        alertBox.style.borderColor = 'var(--glass-border)';
    }
}
function closeAlert() {
    document.getElementById('urgent-alert').classList.add('hidden');
}

// AI Assistant Sim
function sendMockAiMsg(text) {
    const chatContainer = document.querySelector('.chat-container');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `<div class="msg-bubble">${text}</div>`;
    chatContainer.appendChild(userMsg);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Simulate AI response
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        
        let reply = "I can definitely help with that! Let me check the real-time sensors.";
        if (text.includes('washroom')) reply = "The Washroom North is currently closest to you and has a 0 minute wait time. I've highlighted the route on your map.";
        if (text.includes('exit')) reply = "Exit B is currently the fastest route avoiding the main concourse crowd. ETA 5 minutes.";
        
        botMsg.innerHTML = `<div class="msg-bubble hint">${reply}</div>`;
        chatContainer.appendChild(botMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1000);
}

// User Journey Flow (Phase Simulation)
function simulateJourneyPhase(phase) {
    const feed = document.getElementById('suggestion-feed');
    const crowdLevel = document.getElementById('crowd-level');
    
    // Reset cards
    feed.innerHTML = '';
    
    if (phase === 'entry') {
        crowdLevel.innerText = 'Low (Arriving)';
        crowdLevel.style.color = 'var(--success-color)';
        
        feed.innerHTML = `
            <div class="suggest-card">
                <div class="suggest-icon">🚪</div>
                <div class="suggest-content">
                    <h4>Best Entry Gate: Gate C</h4>
                    <p>Gate A is experiencing a queue. Use Gate C for immediate entry.</p>
                    <button class="btn-sm" onclick="startRoute('exit')">Navigate</button>
                </div>
            </div>
        `;
        closeAlert();
        
    } else if (phase === 'match') {
        crowdLevel.innerText = 'High (Seated)';
        crowdLevel.style.color = 'var(--primary-accent)';
        
        feed.innerHTML = `
            <div class="suggest-card">
                <div class="suggest-icon">🍔</div>
                <div class="suggest-content">
                    <h4>Pre-Order Food Now</h4>
                    <p>Beat the halftime rush! Order now and gain +20 Gamification Points.</p>
                    <button class="btn-sm">Order Food</button>
                </div>
            </div>
        `;
        setTimeout(() => showAlert("Micro-surge near Washroom East. Proceed to Washroom North if needed.", false), 1500);
        
    } else if (phase === 'halftime') {
        crowdLevel.innerText = 'Critical (Moving)';
        crowdLevel.style.color = 'var(--danger-color)';
        
        feed.innerHTML = `
            <div class="suggest-card">
                <div class="suggest-icon">⚠️</div>
                <div class="suggest-content">
                    <h4 style="color:var(--danger-color)">Crowd Surge Predicted</h4>
                    <p>Concourse A will be jammed in 2 mins. Remain seated or use Back Route 3.</p>
                    <button class="btn-sm">View Safe Route</button>
                </div>
            </div>
        `;
        showAlert("Avoid Concourse A. Heavy crowd forming.", true);
        
    } else if (phase === 'exit') {
        crowdLevel.innerText = 'High (Exiting)';
        crowdLevel.style.color = 'var(--warning-color)';
        
        feed.innerHTML = `
            <div class="suggest-card">
                <div class="suggest-icon">🚗</div>
                <div class="suggest-content">
                    <h4>Smart Exit Strategy</h4>
                    <p>Wait 10 minutes for crowd to pass and earn a 50% discount on Merch!</p>
                    <button class="btn-sm">Claim Discount</button>
                </div>
            </div>
        `;
        closeAlert();
    }
}

// Initial render
simulateJourneyPhase('entry');
