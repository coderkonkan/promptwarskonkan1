document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/crowd-data';
    const feedContainer = document.getElementById('feed-container');

    // Helper to format zone ID matching the HTML structure
    function getZoneId(zoneName) {
        return 'zone-' + zoneName.toLowerCase().replace(/\s+/g, '-');
    }

    // Helper to get status class based on status string
    function getStatusClass(status) {
        if (status === 'Low') return 'status-low';
        if (status === 'Medium') return 'status-medium';
        if (status === 'High') return 'status-high';
        return '';
    }

    async function fetchCrowdData() {
        try {
            const response = await fetch(API_URL + "?t=" + new Date().getTime(), {
                cache: 'no-store'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            updateDashboard(data);
        } catch (error) {
            console.error('Failed to fetch crowd data:', error);
        }
    }

    function updateDashboard(data) {
        // Clear existing feed mapping or reuse elements for performance
        // For simplicity, we just rebuild the feed list but animate correctly.
        feedContainer.innerHTML = '';

        data.forEach(item => {
            const statusClass = getStatusClass(item.status);

            // 1. Update Left Panel (Feed List)
            const feedItem = document.createElement('div');
            feedItem.className = `feed-item ${statusClass}`;
            feedItem.innerHTML = `
                <div class="feed-info">
                    <span class="feed-zone-name">${item.zone}</span>
                    <span class="feed-status">${item.status}</span>
                </div>
                <div class="feed-density">${item.density}%</div>
            `;
            feedContainer.appendChild(feedItem);

            // 2. Update Map Elements
            const zoneId = getZoneId(item.zone);
            const zoneElement = document.getElementById(zoneId);
            
            if (zoneElement) {
                // Remove old status classes
                zoneElement.classList.remove('status-low', 'status-medium', 'status-high');
                
                // Add new status class
                zoneElement.classList.add(statusClass);

                // Update text value
                const densityValueEl = zoneElement.querySelector('.density-value');
                if (densityValueEl) {
                    densityValueEl.textContent = `${item.density}%`;
                }

                // Update visual progress bar width
                const fillEl = zoneElement.querySelector('.fill');
                if (fillEl) {
                    fillEl.style.width = `${item.density}%`;
                }
            }
        });
    }

    // Initial fetch
    fetchCrowdData();

    // Setup auto-refresh every 3 seconds
    setInterval(fetchCrowdData, 3000);
});
