from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import uuid

from services.jobs import run_flood_job

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
def analyze(payload: AnalyzePayload, background_tasks: BackgroundTasks):
    # Create a job id and schedule background analysis
    job_id = str(uuid.uuid4())
    RESULTS[job_id] = {"status": "running", "result": None}
    # Kick off background job; pass RESULTS so the job can store its result
    background_tasks.add_task(run_flood_job, job_id, payload.aoi, RESULTS)
    return {"job_id": job_id, "status": "running"}

@app.get("/api/analysis/{job_id}")
def get_analysis(job_id: str):
    if job_id not in RESULTS:
        raise HTTPException(status_code=404, detail="job not found")
    return RESULTS[job_id]
