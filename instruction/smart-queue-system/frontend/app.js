const API_BASE = "http://localhost:3002/api";
let currentData = [];
let currentFilter = "all";
let currentSort = "wait";

// --- Data Fetching ---
async function fetchQueueData() {
    try {
        const response = await fetch(`${API_BASE}/queue-status`);
        currentData = await response.json();
        console.log("FRESH DATA:", currentData);
        renderDashboard();
        updateRecommendations();
    } catch (error) {
        console.error("Failed to fetch queue data:", error);
    }
}

// --- UI Rendering ---
function renderDashboard() {
    const grid = document.getElementById('queue-grid');
    
    // Filter
    let filtered = currentData.filter(f => currentFilter === "all" || f.type === currentFilter);
    
    // Sort
    if (currentSort === "wait") {
        filtered.sort((a, b) => a.avg_wait_time - b.avg_wait_time);
    } else {
        filtered.sort((a, b) => a.queue_length - b.queue_length);
    }

    grid.innerHTML = '';
    
    filtered.forEach(stall => {
        const status = stall.avg_wait_time < 5 ? "Low" : (stall.avg_wait_time < 15 ? "Medium" : "High");
        
        const card = document.createElement('div');
        card.className = 'stall-card';
        
        // Discount Badge
        const discountHtml = stall.discount > 0 ? `<div class="discount-badge">🔥 ${stall.discount}% OFF</div>` : '';
        
        // Prediction Trend
        const trendIcon = stall.predicted_wait_time > stall.avg_wait_time ? '↑' : (stall.predicted_wait_time < stall.avg_wait_time ? '↓' : '→');
        const trendClass = stall.predicted_wait_time > stall.avg_wait_time ? 'trend-up' : (stall.predicted_wait_time < stall.avg_wait_time ? 'trend-down' : '');
        const predictionHtml = `<span class="prediction-trend">Prediction: <strong class="${trendClass}">${stall.predicted_wait_time} min</strong> ${trendIcon} in 5 min</span>`;

        card.innerHTML = `
            ${discountHtml}
            <div class="stall-header">
                <div>
                    <span class="stall-type">${stall.type}</span>
                    <h2 class="stall-name">${stall.name}</h2>
                    <span class="stall-location">${stall.location}</span>
                </div>
                <span class="status-indicator status-${status}"></span>
            </div>
            <div class="wait-info">
                <div>
                    <span class="wait-time">${stall.avg_wait_time} min</span>
                    <br><span class="wait-label">Estimated Wait</span>
                    ${predictionHtml}
                </div>
                <div>
                    <span class="wait-time" style="font-size: 1.2rem; color: var(--text-dim)">${stall.queue_length}</span>
                    <br><span class="wait-label">In Queue</span>
                </div>
            </div>
            <button class="primary-btn" onclick="openOrderModal('${stall.stall_id}', '${stall.name}')">
                Pre-order & Skip
            </button>
        `;
        grid.appendChild(card);
    });
}

// --- Smart Recommendations ---
function updateRecommendations() {
    const suggestionEl = document.getElementById('suggestion-content');
    
    // Logic: Prioritize Load Balancing (Incentives + Prediction)
    const discounted = currentData.filter(f => f.discount > 0);
    const surging = currentData.filter(f => f.predicted_wait_time > f.avg_wait_time + 5);

    let loadBalanceTip = "";

    if (discounted.length > 0 && surging.length > 0) {
        const best = discounted[0];
        const worst = surging[0];
        loadBalanceTip = `📢 <strong>Load Balance Alert:</strong> ${worst.name} will spike to ${worst.predicted_wait_time} min soon! Shift to <strong>${best.name}</strong> now for <strong>${best.discount}% OFF</strong>.`;
    } else if (discounted.length > 0) {
        const best = discounted[0];
        loadBalanceTip = `✨ <strong>Incentive Found:</strong> Visit <strong>${best.name}</strong> now to get <strong>${best.discount}% OFF</strong> due to low traffic!`;
    } else if (surging.length > 0) {
        const worst = surging[0];
        loadBalanceTip = `⚠️ <strong>Wait Time Alert:</strong> ${worst.name} is predicted to reach ${worst.predicted_wait_time} min shortly. Consider alternatives.`;
    }

    if (loadBalanceTip) {
        suggestionEl.innerHTML = loadBalanceTip;
    } else {
        // Fallback to simple comparative logic
        const foodOptions = currentData.filter(f => f.type === "food");
        if (foodOptions.length > 1) {
            foodOptions.sort((a, b) => a.avg_wait_time - b.avg_wait_time);
            const best = foodOptions[0];
            const worst = foodOptions[foodOptions.length - 1];
            if (worst.avg_wait_time - best.avg_wait_time > 5) {
                suggestionEl.innerHTML = `<strong>${best.name}</strong> has a ${best.avg_wait_time} min wait, better than ${worst.name} (${worst.avg_wait_time} min).`;
            } else {
                suggestionEl.innerHTML = "Queues are currently flowing smoothly across all zones.";
            }
        }
    }
}

// --- Order Modal System ---
function openOrderModal(id, name) {
    const modal = document.getElementById('modal-overlay');
    document.getElementById('modal-stall-name').innerText = name;
    document.getElementById('confirm-order').dataset.stallId = id;
    
    // Reset view
    document.getElementById('modal-body').classList.remove('hidden');
    document.getElementById('order-result').classList.add('hidden');
    
    modal.classList.remove('hidden');
}

document.getElementById('close-modal').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
};

document.getElementById('confirm-order').onclick = async (e) => {
    const stallId = e.target.dataset.stallId;
    
    try {
        const response = await fetch(`${API_BASE}/pre-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stall_id: stallId, items: [] })
        });
        
        const result = await response.json();
        
        // Show result
        document.getElementById('modal-body').classList.add('hidden');
        document.getElementById('order-result').classList.remove('hidden');
        document.getElementById('token-code').innerText = result.token;
        document.getElementById('pickup-time').innerText = `Pickup in approx ${result.pickupIn}`;
        
    } catch (error) {
        alert("Ordering failed. Please try again.");
    }
};

document.getElementById('finish-order').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
};

// --- Controls ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderDashboard();
    };
});

document.getElementById('sort-select').onchange = (e) => {
    currentSort = e.target.value;
    renderDashboard();
};

// --- Lifecycle ---
fetchQueueData();
setInterval(fetchQueueData, 3000);
