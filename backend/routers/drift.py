from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from backend.models import DriftAnalysis
from backend.agent import detect_knowledge_drift, detect_all_drift
from backend.config import get_settings

router = APIRouter()

_drift_cache: list[DriftAnalysis] | None = None


def clear_drift_cache():
    global _drift_cache
    _drift_cache = None


@router.get("/analyze", response_model=DriftAnalysis)
async def analyze(
    service: str = Query(...),
    error_pattern: str = Query(...),
):
    settings = get_settings()
    if not settings.hindsight_api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "Hindsight not configured", "detail": "Set HINDSIGHT_API_KEY in .env to enable drift detection."},
        )
    try:
        return await detect_knowledge_drift(service, error_pattern)
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Drift analysis temporarily unavailable — please retry"})


@router.get("/all", response_model=list[DriftAnalysis])
async def all_drift(refresh: bool = Query(False)):
    global _drift_cache
    settings = get_settings()
    if not settings.hindsight_api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "Hindsight not configured", "detail": "Set HINDSIGHT_API_KEY in .env to enable drift detection."},
        )
    if _drift_cache is not None and not refresh:
        return _drift_cache
    try:
        _drift_cache = await detect_all_drift()
        return _drift_cache
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Drift analysis temporarily unavailable — please retry"})
