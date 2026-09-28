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
    return {"status": "ok", "service": "memento"}


@app.post("/api/seed")
async def seed_data():
    from backend.seed import run_seed
    result = await run_seed()
    return result
