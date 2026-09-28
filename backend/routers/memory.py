from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from backend.models import MemoryOverview, TimelineEntry
from backend.agent import get_memory_overview, get_memory_timeline
from backend.config import get_settings

router = APIRouter()


def _check_configured() -> JSONResponse | None:
    settings = get_settings()
    if not settings.hindsight_api_key:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Hindsight not configured",
                "detail": "Set HINDSIGHT_API_KEY in .env to enable memory features.",
            },
        )
    return None


@router.get("/overview", response_model=MemoryOverview)
async def overview(service: str | None = Query(None)):
    err = _check_configured()
    if err:
        return err
    try:
        return await get_memory_overview(service)
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": "Hindsight unavailable", "detail": str(e)})


@router.get("/timeline", response_model=list[TimelineEntry])
async def timeline(service: str | None = Query(None)):
    err = _check_configured()
    if err:
        return err
    try:
        return await get_memory_timeline(service)
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": "Hindsight unavailable", "detail": str(e)})


@router.get("/services")
async def services():
    return {
        "services": [
            {"name": "payment-service", "role": "Payment processing"},
            {"name": "auth-gateway", "role": "Authentication/authorization"},
            {"name": "user-api", "role": "User profile management"},
            {"name": "notification-service", "role": "Email/SMS/push notifications"},
            {"name": "cache-cluster", "role": "Redis cluster (sessions + cache)"},
            {"name": "order-service", "role": "Order pipeline"},
        ]
    }
