from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import incidents, memory, drift

app = FastAPI(title="Memento", description="Incident Response Intelligence")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(drift.router, prefix="/api/drift", tags=["drift"])


@app.get("/api/health")
async def health():
    s = get_settings()
    return {
        "status": "ok",
        "service": "memento",
        "hindsight_configured": bool(s.hindsight_api_key and s.hindsight_api_key != "your-hindsight-api-key-here"),
        "groq_configured": bool(s.groq_api_key and s.groq_api_key != "your-groq-api-key-here"),
        "hindsight_base_url": s.hindsight_base_url,
        "bank_id": s.hindsight_bank_id,
        "groq_model": s.groq_model,
    }


@app.post("/api/seed")
async def seed_data():
    from backend.seed import run_seed
    from backend.routers.drift import clear_drift_cache
    result = await run_seed()
    clear_drift_cache()
    return result
