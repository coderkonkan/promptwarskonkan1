// Simulated Fixed Location: North End, London
const USER_LOCATION = "London (North End)";
const ALERTS_HUB_URL = 'ws://localhost:3003';

class AlertSystem {
    constructor() {
        this.socket = null;
        this.history = [];
        this.initUI();
        this.connect();
    }

    initUI() {
        // Create Banner
        this.banner = document.createElement('div');
        this.banner.className = 'alert-banner';
        this.banner.innerHTML = `
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
                <div class="alert-message">System Notification</div>
                <div class="alert-action"></div>
            </div>
            <button class="alert-close">×</button>
        `;
        document.body.appendChild(this.banner);
        this.banner.querySelector('.alert-close').onclick = () => this.hideBanner();

        // Create Feed Panel
        this.feed = document.createElement('div');
        this.feed.className = 'notification-feed';
        this.feed.innerHTML = `
            <div class="feed-header">
                <strong>Live Alerts Log</strong>
                <span style="font-size: 0.7rem; opacity: 0.7">${USER_LOCATION}</span>
            </div>
            <div class="feed-items" id="alert-feed-items"></div>
        `;
        document.body.appendChild(this.feed);

        // Create Beep Overlay
        this.beepOverlay = document.createElement('div');
        this.beepOverlay.className = 'beep-effect';
        this.beepOverlay.innerText = 'BEEP! 🔊';
        document.body.appendChild(this.beepOverlay);
    }

    connect() {
        this.socket = new WebSocket(ALERTS_HUB_URL);

        this.socket.onopen = () => {
            console.log('Connected to Alerts Hub');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'HISTORY') {
                this.history = data.data;
                this.renderFeed();
            } else {
                this.handleNewAlert(data);
            }
        };

        this.socket.onclose = () => {
            console.log('Disconnected from Alerts Hub. Retrying...');
            setTimeout(() => this.connect(), 5000);
        };
    }

    handleNewAlert(alert) {
        // Location-based filtering (Simulation)
        // If alert is location-specific and doesn't match current simulated area, hide from banner but keep in feed
        const isNearby = !alert.zone || alert.zone.includes("Gate") || alert.zone.includes("Seating");
        
        this.history.unshift({ ...alert, timestamp: new Date() });
        this.addFeedItem(alert);

        if (isNearby || alert.priority === 'Critical') {
            this.showBanner(alert);
            this.triggerBeep(alert.priority);
        }
    }

    showBanner(alert) {
        this.banner.className = `alert-banner active ${alert.priority.toLowerCase()}`;
        this.banner.querySelector('.alert-message').innerText = alert.message;
        this.banner.querySelector('.alert-action').innerText = alert.action || '';
        this.banner.querySelector('.alert-icon').innerText = alert.priority === 'Critical' ? '🚨' : '⚠️';

        // Auto-hide non-critical alerts after 8 seconds
        if (alert.priority !== 'Critical') {
            clearTimeout(this.bannerTimer);
            this.bannerTimer = setTimeout(() => this.hideBanner(), 8000);
        }
    }

    hideBanner() {
        this.banner.classList.remove('active');
    }

    addFeedItem(alert) {
        const itemsContainer = document.getElementById('alert-feed-items');
        const item = document.createElement('div');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        item.className = `feed-item ${alert.priority.toLowerCase()}`;
        item.innerHTML = `
            <div class="item-time">${timeStr}</div>
            <div class="item-text"><strong>${alert.type.replace('_', ' ')}</strong>: ${alert.message}</div>
        `;
        
        itemsContainer.prepend(item);
        if (itemsContainer.childNodes.length > 30) {
            itemsContainer.removeChild(itemsContainer.lastChild);
        }
    }

    renderFeed() {
        const itemsContainer = document.getElementById('alert-feed-items');
        itemsContainer.innerHTML = '';
        this.history.forEach(alert => this.addFeedItem(alert));
    }

    triggerBeep(priority) {
        this.beepOverlay.classList.remove('beep-active');
        void this.beepOverlay.offsetWidth; // Force reflow
        this.beepOverlay.classList.add('beep-active');
        
        // Simple Audio Context beep if possible
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.type = priority === 'Critical' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(priority === 'Critical' ? 440 : 880, context.currentTime);
            
            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
            
            osc.start();
            osc.stop(context.currentTime + 0.5);
        } catch(e) { /* Browser might block audio without interaction */ }
    }
}

// Auto-initialize when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AlertSystem());
} else {
    new AlertSystem();
}
