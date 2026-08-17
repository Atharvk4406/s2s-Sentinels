from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="S2S Sentinel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for demo results
RESULTS: Dict[str, Any] = {}

class AnalyzePayload(BaseModel):
    disasterType: str
    aoi: Dict[str, Any]

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/analyze")
def analyze(payload: AnalyzePayload):
    # Very small demo analyzer: store the AOI as the affectedGeometry
    job_id = "demo-1"
    result = {
        "disasterType": payload.disasterType,
        "affectedGeometry": payload.aoi,
        "affectedArea_km2": 1.23,
        "severity": 0.6,
        "confidence": 0.8,
        "affectedRoads": [],
        "affectedFacilities": [],
        "populationExposure": 1200,
        "timestamps": {"observation": None, "analysis": None}
    }
    RESULTS[job_id] = {"status": "finished", "result": result}
    return {"job_id": job_id, "status": "finished"}

@app.get("/api/analysis/{job_id}")
def get_analysis(job_id: str):
    if job_id not in RESULTS:
        raise HTTPException(status_code=404, detail="job not found")
    return RESULTS[job_id]
