import os
from typing import Dict, Any

from .flood_analyzer import analyze_flood

def run_flood_job(job_id: str, aoi: Dict[str, Any], results_store: Dict[str, Any]):
    """Run the flood analysis and store the result in results_store[job_id].
    This function is intended to be called as a FastAPI BackgroundTasks job.
    """
    try:
        # Try to find sample sentinel data in /app/data/sample_sentinel
        data_dir = os.path.join(os.getcwd(), 'data', 'sample_sentinel')
        result = analyze_flood(aoi, sample_data_dir=data_dir)
        results_store[job_id] = {"status": "finished", "result": result}
    except Exception as e:
        results_store[job_id] = {"status": "failed", "error": str(e)}
