# s2s-Sentinels

S2S Sentinel — Multi-Disaster Satellite-to-Street Intelligence & Response (MVP scaffold)

This repository is the starting scaffold for the S2S Sentinel project. It contains a minimal backend (FastAPI) and frontend (React + Vite) skeleton plus a PostGIS service in docker-compose to get the project running locally.

Easy run instructions (quick start)

Option A — With Docker (recommended, easy)
1. Install Docker and Docker Compose on your machine.
2. Open a terminal, clone the repo and switch to the feature branch (already done for you):
   - git clone https://github.com/Atharvk4406/s2s-Sentinels.git
   - cd s2s-Sentinels
   - git checkout feature/frontend-map
3. Start everything with one command:
   - docker-compose up --build
4. Open the frontend in your browser:
   - http://localhost:5173
   - The backend API runs at http://localhost:8000

Notes about Docker run:
- The backend image installs geospatial libraries (GDAL, PROJ). The first build may take several minutes.
- If you don't have sample satellite data, the analyzer will return a demo result. To run the real NDWI flood analyzer, add two files to data/sample_sentinel named B03.tif and B08.tif (green and NIR bands). See below for data sources.

Option B — Run locally (without Docker)
1. Backend (Python):
   - Make sure Python 3.11 is installed.
   - cd backend
   - python -m venv .venv
   - source .venv/bin/activate   # on Windows: .venv\Scripts\activate
   - pip install -r requirements.txt
   - uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
2. Frontend (Node):
   - cd frontend
   - npm ci
   - npm run dev
   - Open http://localhost:5173

Using the app (easy demo)
1. Open the app in your browser.
2. Click 'Load Sample AOI' on the left to load a small polygon.
3. Click 'Analyze' to start the flood analysis. The app will call the backend and show a flood polygon (if sample data exists) or a demo result.
4. The left sidebar shows:
   - Live clocks for multiple timezones. You can add or remove timezones; they are saved in your browser.
   - Current weather for the AOI centroid (fetched from Open‑Meteo).

Data sources and notes
- Satellite: Sentinel‑2 bands (B03 = Green, B08 = NIR). You can download small tiles from Copernicus or cloud storage and place them in data/sample_sentinel/ as B03.tif and B08.tif.
- Weather: Open‑Meteo API (no key required) is used for demo weather.
- OSM: osmnx library can be used by the analyzer to fetch road data when available.

If anything fails or you want me to run parts for you, tell me which environment you use (Windows/macOS/Linux) and I can give step-by-step commands.
