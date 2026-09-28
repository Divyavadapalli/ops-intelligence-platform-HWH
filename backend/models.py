from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class InvestigationStep(BaseModel):
    order: int
    action: str
    finding: str
    duration_minutes: int
    was_useful: bool


class Resolution(BaseModel):
    action: str
    effective: bool
    time_to_resolve_minutes: int
    notes: str


class Incident(BaseModel):
    id: str
    title: str
    service: str
    severity: str
    category: str
    started_at: datetime
    resolved_at: datetime
    symptoms: list[str]
    investigation_steps: list[InvestigationStep]
    root_cause: str
    resolution: Resolution
    contributing_factors: list[str]
    affected_services: list[str]
    on_call_engineer: str
    lessons_learned: list[str]


class RunbookStep(BaseModel):
    order: int
    instruction: str
    expected_outcome: str


class Runbook(BaseModel):
    id: str
    service: str
    error_pattern: str
    title: str
    last_updated: datetime
    steps: list[RunbookStep]


# --- API Request/Response Models ---

class InvestigateRequest(BaseModel):
    service: str
    symptoms: list[str]
    severity: str

class RecalledIncident(BaseModel):
    text: str
    type: str
    score: float
    occurred_at: str | None = None

class DriftWarning(BaseModel):
    service: str
    error_pattern: str
    runbook_says: str
    evidence_says: str
    agreement_level: str
    drift_detected: bool
    confidence: str
    recommended_update: str
    supporting_incidents: list[str]

class InvestigateResponse(BaseModel):
    recommendations: str
    recalled_incidents: list[RecalledIncident]
    observations: list[str]
    drift_warnings: list[DriftWarning]
    confidence: str
    memory_used: bool

class OutcomeRequest(BaseModel):
    incident_id: str
    service: str
    resolution_action: str
    effective: bool
    notes: str

class MemoryOverview(BaseModel):
    observations: list[str]
    incident_count: int
    services: list[str]

class TimelineEntry(BaseModel):
    text: str
    type: str
    occurred_at: str | None = None
    score: float

class DriftAnalysis(BaseModel):
    service: str
    error_pattern: str
    runbook_says: str
    evidence_says: str
    supporting_incidents: list[str]
    agreement_level: str
    drift_detected: bool
    confidence: str
    recommended_update: str
    based_on: list[str] = []
