# Module 3: Smart Queue Management System

## Objective
The Smart Queue Management System is designed to optimize the fan experience by providing real-time visibility into wait times at stadium facilities. By simulating crowd flows and suggesting less crowded alternatives, the system reduces congestion and improves efficiency.

## Key Features
- **Real-Time Wait Estimates**: Calculates wait times based on queue length and service rates.
- **Intelligent Load Balancing**:
    - **Wait Time Predictions**: Forecasts future congestion based on match phases (e.g., predicting half-time surges).
    - **Incentive System**: Automatically applies discounts (15% OFF) to low-traffic stalls to redistribute the crowd.
    - **Proactive Suggestions**: Recommends shifting from surging stalls to incentivized ones.
- **Digital Token System**: Allows fans to pre-order food and receive a pickup time, bypassing traditional queues.

## Architecture
- **Backend**: Node.js & Express server facilitating real-time data updates and API endpoints.
- **Frontend**: A mobile-first, responsive dashboard built with modern CSS and vanilla Javascript.

## Project Structure
The source code for this module is located in `instruction/smart-queue-system/`:
- `backend/server.js`: API and Simulation logic.
- `frontend/index.html`: Dashboard structure.
- `frontend/style.css`: Dashboard styling.
- `frontend/app.js`: Frontend interactivity and real-time polling.

## How to Run
1. Navigate to `instruction/smart-queue-system/backend`.
2. Start the server: `node server.js`.
3. Open `instruction/smart-queue-system/frontend/index.html` in your browser.
