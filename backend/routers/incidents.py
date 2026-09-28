from fastapi import APIRouter
from fastapi.responses import JSONResponse
from backend.models import InvestigateRequest, InvestigateResponse, OutcomeRequest
from backend.agent import investigate_incident, record_outcome
from backend.config import get_settings

router = APIRouter()


@router.post("/investigate", response_model=InvestigateResponse)
async def investigate(req: InvestigateRequest):
    settings = get_settings()
    if not settings.hindsight_api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "Hindsight not configured", "detail": "Set HINDSIGHT_API_KEY in .env to enable investigation."},
        )
    try:
        return await investigate_incident(req.service, req.symptoms, req.severity)
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Investigation temporarily unavailable — please retry"})


@router.post("/outcome")
async def submit_outcome(req: OutcomeRequest):
    settings = get_settings()
    if not settings.hindsight_api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "Hindsight not configured", "detail": "Set HINDSIGHT_API_KEY in .env to enable outcome recording."},
        )
    try:
        return await record_outcome(
            incident_id=req.incident_id,
            service=req.service,
            resolution_action=req.resolution_action,
            effective=req.effective,
            notes=req.notes,
        )
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Outcome recording temporarily unavailable — please retry"})
