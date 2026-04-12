const API_BASE = 'http://localhost:3001/api';

// --- State Management ---
let nodes = {};
let currentRoute = null;
let mapTransform = { x: 0, y: 0, k: 1 };
let isDragging = false;
let startPos = { x: 0, y: 0 };

const svg = document.getElementById('stadium-map');
const container = document.getElementById('map-container');

// --- Initialization ---
async function init() {
    try {
        // We'll calculate the node set from the backend dynamically to stay in sync
        const res = await fetch(`${API_BASE}/crowd-data`);
        const crowdData = await res.json();
        
        // For rendering, we need the full node info from a route call or hardcoded
        // Let's get a dummy route to bootstrap the node positions
        const bootstrapRes = await fetch(`${API_BASE}/get-route?source=Gate North&destination=Section 104`);
        const bootstrapData = await bootstrapRes.json();
        
        // Wait, the backend doesn't return ALL nodes in a single call. 
        // Let's hardcode the metadata for rendering consistent within this script.
        await fetchNodesAndRender();
        setupInteraction();
        startPolling();
        populateSelects();
    } catch (e) {
        console.error("Init failed", e);
    }
}

async function fetchNodesAndRender() {
    // In a real app, we'd have a /api/map endpoint. 
    // Since we're in the same context, I'll replicate the layout logic here.
    const pitchCenter = { x: 300, y: 300 };
    const gateNames = ["Gate North", "Gate East", "Gate South", "Gate West"];
    gateNames.forEach((name, i) => {
        const angle = (i * 90) * (Math.PI / 180);
        const radius = 320;
        nodes[name] = { x: pitchCenter.x + radius * Math.sin(angle), y: pitchCenter.y - radius * Math.cos(angle), type: 'gate' };
    });

    const sectionsPerTier = 8;
    const tiers = [{ prefix: "10", radius: 180 }, { prefix: "20", radius: 260 }];
    tiers.forEach(tier => {
        for (let i = 1; i <= sectionsPerTier; i++) {
            const name = `Section ${tier.prefix}${i}`;
            const angle = ((i - 1) * 45 + 22.5) * (Math.PI / 180);
            nodes[name] = { x: pitchCenter.x + tier.radius * Math.sin(angle), y: pitchCenter.y - tier.radius * Math.cos(angle), type: 'section' };
        }
    });

    const facilities = {
        "North Food Court": { x: 300, y: 100 }, "South Food Court": { x: 300, y: 500 },
        "East Washrooms": { x: 500, y: 300 }, "West Washrooms": { x: 100, y: 300 }
    };
    Object.assign(nodes, facilities);

    renderMap();
}

function renderMap() {
    const nodesLayer = document.getElementById('nodes-layer');
    const labelsLayer = document.getElementById('labels-layer');
    
    nodesLayer.innerHTML = '';
    labelsLayer.innerHTML = '';

    Object.keys(nodes).forEach(name => {
        const n = nodes[name];
        
        // Node
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", n.x);
        circle.setAttribute("cy", n.y);
        circle.setAttribute("r", n.type === 'gate' ? 12 : 8);
        circle.setAttribute("id", `node-${name.replace(/\s+/g, '-')}`);
        circle.setAttribute("class", `node ${n.type || 'facility'}`);
        nodesLayer.appendChild(circle);

        // Label
        if (n.type === 'gate' || n.type === 'facility' || name.endsWith('1') || name.endsWith('5')) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", n.x);
            text.setAttribute("y", n.y + 20);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("class", "node-label");
            text.textContent = name;
            labelsLayer.appendChild(text);
        }
    });
}

// --- Pan & Zoom Logic ---
function setupInteraction() {
    container.addEventListener('mousedown', e => {
        isDragging = true;
        startPos = { x: e.clientX - mapTransform.x, y: e.clientY - mapTransform.y };
    });

    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        mapTransform.x = e.clientX - startPos.x;
        mapTransform.y = e.clientY - startPos.y;
        updateTransform();
    });

    window.addEventListener('mouseup', () => isDragging = false);

    container.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        mapTransform.k *= delta;
        mapTransform.k = Math.max(0.5, Math.min(3, mapTransform.k));
        updateTransform();
    });

    document.getElementById('zoom-in').onclick = () => { mapTransform.k *= 1.2; updateTransform(); };
    document.getElementById('zoom-out').onclick = () => { mapTransform.k /= 1.2; updateTransform(); };
    document.getElementById('zoom-reset').onclick = () => { mapTransform = { x: 0, y: 0, k: 1 }; updateTransform(); };
}

function updateTransform() {
    const layers = ['nodes-layer', 'labels-layer', 'edges-layer', 'route-path', 'stadium-outline', 'stadium-pitch', 'pitch-center-circle'];
    const transformStr = `translate(${mapTransform.x}, ${mapTransform.y}) scale(${mapTransform.k})`;
    
    // Applying to a group for performance
    const g = svg.querySelector('g:first-of-type') || wrapInGroup();
    g.setAttribute('transform', transformStr);
}

function wrapInGroup() {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    return g;
}

// --- Search Logic ---
const searchInput = document.getElementById('seat-search');
const resultsBox = document.getElementById('search-results');

searchInput.addEventListener('input', e => {
    const query = e.target.value.toLowerCase();
    if (!query) { resultsBox.style.display = 'none'; return; }

    const matches = Object.keys(nodes).filter(n => n.toLowerCase().includes(query));
    
    resultsBox.innerHTML = matches.map(m => `<div class="search-item" data-name="${m}">${m}</div>`).join('');
    resultsBox.style.display = matches.length ? 'block' : 'none';
});

resultsBox.addEventListener('click', e => {
    const item = e.target.closest('.search-item');
    if (!item) return;
    
    const name = item.dataset.name;
    searchInput.value = name;
    resultsBox.style.display = 'none';
    
    document.getElementById('dest-select').value = name;
    triggerNavigation();
});

// --- Navigation ---
async function triggerNavigation(isEmergency = false) {
    const source = document.getElementById('source-select').value;
    const dest = document.getElementById('dest-select').value;
    
    try {
        const res = await fetch(`${API_BASE}/get-route?source=${source}&destination=${dest}&emergency=${isEmergency}`);
        const data = await res.json();
        
        drawRoute(data.path);
        document.getElementById('eta-val').textContent = data.eta;
        
        const congVal = document.getElementById('congestion-val');
        congVal.innerHTML = `<span class="indicator" style="background: ${getCongestionColor(data.congestionLevel)}"></span> ${data.congestionLevel}`;
        
        currentRoute = { source, dest, isEmergency };
        
        // Visual focus on destination
        const destNode = nodes[dest];
        mapTransform.x = 300 - destNode.x * mapTransform.k;
        mapTransform.y = 300 - destNode.y * mapTransform.k;
        updateTransform();
        
    } catch (e) {
        console.error("Navigation failed", e);
    }
}

function drawRoute(path) {
    const route = document.getElementById('route-path');
    if (!path.length) { route.setAttribute('d', ''); return; }
    
    const d = `M ${path[0].x} ${path[0].y} ` + path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    route.setAttribute('d', d);
    
    document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
    path.forEach(p => {
        const el = document.getElementById(`node-${p.name.replace(/\s+/g, '-')}`);
        if (el) el.classList.add('active');
    });
}

function getCongestionColor(status) {
    if (status === 'High') return 'var(--accent-red)';
    if (status === 'Medium') return '#f59e0b';
    return 'var(--accent-green)';
}

function populateSelects() {
    const src = document.getElementById('source-select');
    const dst = document.getElementById('dest-select');
    
    const options = Object.keys(nodes).sort().map(n => `<option value="${n}">${n}</option>`).join('');
    src.innerHTML = options;
    dst.innerHTML = options;
    
    src.value = "Gate North";
    dst.value = "Section 104";
}

function startPolling() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/crowd-data`);
            const data = await res.json();
            
            Object.keys(data).forEach(name => {
                const el = document.getElementById(`node-${name.replace(/\s+/g, '-')}`);
                if (el) {
                    const d = data[name].density;
                    el.classList.toggle('crowded', d > 70);
                    el.style.fillOpacity = 0.3 + (d / 100) * 0.7;
                }
            });

            if (currentRoute && !isDragging) {
                // Re-calculate live ETA
                triggerNavigation(currentRoute.isEmergency);
            }
        } catch (e) {}
    }, 4000);
}

document.getElementById('find-route-btn').onclick = () => triggerNavigation();
document.getElementById('emergency-btn').onclick = () => {
    document.getElementById('dest-select').value = "Gate North";
    triggerNavigation(true);
};

init();
