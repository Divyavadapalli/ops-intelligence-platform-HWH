from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from openai import OpenAI

from backend.config import get_settings
from backend.hindsight_client import get_hindsight, get_bank_id
from backend.models import (
    RecalledIncident,
    DriftWarning,
    DriftAnalysis,
    InvestigateResponse,
    MemoryOverview,
    TimelineEntry,
)

logger = logging.getLogger(__name__)

DRIFT_SCHEMA = {
    "type": "object",
    "properties": {
        "runbook_says": {"type": "string"},
        "evidence_says": {"type": "string"},
        "agreement_level": {
            "type": "string",
            "enum": ["aligned", "partial-conflict", "contradicts"],
        },
        "drift_detected": {"type": "boolean"},
        "supporting_incidents": {
            "type": "array",
            "items": {"type": "string"},
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
        },
        "recommended_update": {"type": "string"},
    },
    "required": [
        "runbook_says",
        "evidence_says",
        "agreement_level",
        "drift_detected",
        "supporting_incidents",
        "confidence",
        "recommended_update",
    ],
}

INVESTIGATION_SCHEMA = {
    "type": "object",
    "properties": {
        "recommended_steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "order": {"type": "integer"},
                    "action": {"type": "string"},
                    "rationale": {"type": "string"},
                    "based_on": {"type": "string"},
                },
                "required": ["order", "action", "rationale"],
            },
        },
        "confidence_level": {
            "type": "string",
            "enum": ["high", "medium", "low", "insufficient"],
        },
        "key_observation": {"type": "string"},
        "drift_warning": {"type": "string"},
    },
    "required": ["recommended_steps", "confidence_level"],
}


def _get_groq() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        api_key=settings.groq_api_key,
        base_url="https://api.groq.com/openai/v1",
    )


def _llm_synthesize(
    recalled_text: str,
    reflect_text: str,
    service: str,
    symptoms: list[str],
    severity: str,
) -> str:
    settings = get_settings()
    groq = _get_groq()

    prompt = f"""You are Memento, an incident response intelligence system. An engineer is investigating a live incident.

Service: {service}
Severity: {severity}
Symptoms: {', '.join(symptoms)}

Here is what Memento's memory recalls from past incidents:
{recalled_text}

Here is Memento's synthesized analysis:
{reflect_text}

Based on this evidence, provide a clear, actionable investigation recommendation. Structure your response as:

1. **Recommended Investigation Order** — numbered steps, most likely root cause first
2. **Key Observation** — the most important pattern from past incidents
3. **Drift Warning** — if the current runbook contradicts historical evidence, say so explicitly
4. **Confidence** — how confident you are based on the number and relevance of past incidents

Be specific. Reference past incident IDs when possible. Do NOT give generic advice — everything must be grounded in the recalled evidence."""

    try:
        response = groq.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning("Primary model failed, trying fallback: %s", e)
        try:
            response = groq.chat.completions.create(
                model=settings.groq_fallback_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e2:
            logger.error("Fallback model also failed: %s", e2)
            return f"LLM temporarily unavailable. Raw evidence from memory:\n\n{reflect_text}"


async def investigate_incident(
    service: str, symptoms: list[str], severity: str
) -> InvestigateResponse:
    hs = get_hindsight()
    bank = get_bank_id()
    now = datetime.now(timezone.utc).isoformat()
    symptom_query = f"{service} {' '.join(symptoms)}"

    recall_result = await hs.arecall(
        bank_id=bank,
        query=symptom_query,
        types=["world", "experience", "observation"],
        max_tokens=4096,
        budget="high",
        tags=[f"service:{service}"],
        tags_match="any",
        min_scores={"reranker": 0.2},
        query_timestamp=now,
    )

    recalled_incidents: list[RecalledIncident] = []
    observations_list: list[str] = []
    recalled_text_parts: list[str] = []

    if recall_result and hasattr(recall_result, "results"):
        for r in recall_result.results:
            text = r.text if hasattr(r, "text") else str(r)
            rtype = r.type if hasattr(r, "type") else "unknown"
            score = r.scores.final if hasattr(r, "scores") and hasattr(r.scores, "final") else 0.0
            occurred = None
            if hasattr(r, "occurred_start") and r.occurred_start:
                occurred = str(r.occurred_start)

            recalled_incidents.append(
                RecalledIncident(text=text, type=rtype, score=score, occurred_at=occurred)
            )
            recalled_text_parts.append(f"[{rtype}, score={score:.2f}] {text}")

            if rtype == "observation":
                observations_list.append(text)

    recalled_text = "\n\n".join(recalled_text_parts) if recalled_text_parts else "No relevant past incidents found."

    reflect_text = ""
    drift_warnings: list[DriftWarning] = []

    try:
        reflect_result = await hs.areflect(
            bank_id=bank,
            query=f"""Analyze this new incident and compare against historical evidence:

Service: {service}
Severity: {severity}
Symptoms: {', '.join(symptoms)}

1. What do past incidents tell us about the likely root cause?
2. What investigation steps worked vs failed in similar situations?
3. Does the current runbook for {service} align with historical outcomes?
4. If there is a conflict between documented procedures and observed evidence, flag it explicitly.""",
            budget="high",
            response_schema=INVESTIGATION_SCHEMA,
            tags=[f"service:{service}"],
            tags_match="any",
            include_facts=True,
        )
        reflect_text = reflect_result.text if hasattr(reflect_result, "text") else ""

        if hasattr(reflect_result, "structured_output") and reflect_result.structured_output:
            so = reflect_result.structured_output
            if so.get("drift_warning"):
                drift_warnings.append(
                    DriftWarning(
                        service=service,
                        error_pattern=", ".join(symptoms),
                        runbook_says=so.get("drift_warning", ""),
                        evidence_says=so.get("key_observation", ""),
                        agreement_level="partial-conflict",
                        drift_detected=True,
                        confidence=so.get("confidence_level", "medium"),
                        recommended_update=so.get("key_observation", ""),
                        supporting_incidents=[],
                    )
                )
    except Exception as e:
        logger.error("Reflect failed: %s", e)
        reflect_text = "Analysis unavailable — showing raw recalled evidence."

    recommendations = _llm_synthesize(
        recalled_text, reflect_text, service, symptoms, severity
    )

    confidence = "insufficient"
    if len(recalled_incidents) >= 3:
        confidence = "high"
    elif len(recalled_incidents) >= 1:
        confidence = "medium"

    return InvestigateResponse(
        recommendations=recommendations,
        recalled_incidents=recalled_incidents,
        observations=observations_list,
        drift_warnings=drift_warnings,
        confidence=confidence,
        memory_used=len(recalled_incidents) > 0,
    )


async def detect_knowledge_drift(
    service: str, error_pattern: str
) -> DriftAnalysis:
    hs = get_hindsight()
    bank = get_bank_id()

    reflect_result = await hs.areflect(
        bank_id=bank,
        query=f"""Compare the documented runbook guidance for {service} regarding "{error_pattern}" against the actual historical outcomes from past incidents.

Specifically:
1. What does the runbook say to do?
2. What actually happened when engineers followed (or deviated from) the runbook?
3. Is the runbook guidance still valid, or does historical evidence contradict it?
4. If contradicted, what should the updated guidance be?

Be precise. Cite specific incidents and outcomes.""",
        budget="high",
        response_schema=DRIFT_SCHEMA,
        tags=[f"service:{service}"],
        tags_match="any",
        include_facts=True,
    )

    based_on_list: list[str] = []
    if hasattr(reflect_result, "based_on") and reflect_result.based_on:
        for fact in reflect_result.based_on:
            based_on_list.append(str(fact))

    if hasattr(reflect_result, "structured_output") and reflect_result.structured_output:
        so = reflect_result.structured_output
        return DriftAnalysis(
            service=service,
            error_pattern=error_pattern,
            runbook_says=so.get("runbook_says", "Unknown"),
            evidence_says=so.get("evidence_says", "Unknown"),
            supporting_incidents=so.get("supporting_incidents", []),
            agreement_level=so.get("agreement_level", "aligned"),
            drift_detected=so.get("drift_detected", False),
            confidence=so.get("confidence", "low"),
            recommended_update=so.get("recommended_update", ""),
            based_on=based_on_list,
        )

    return DriftAnalysis(
        service=service,
        error_pattern=error_pattern,
        runbook_says="Could not extract structured analysis",
        evidence_says=reflect_result.text if hasattr(reflect_result, "text") else "Analysis unavailable",
        supporting_incidents=[],
        agreement_level="aligned",
        drift_detected=False,
        confidence="low",
        recommended_update="",
        based_on=based_on_list,
    )


async def detect_all_drift() -> list[DriftAnalysis]:
    runbook_pairs = [
        ("payment-service", "503 errors"),
        ("auth-gateway", "JWT validation failures"),
        ("cache-cluster", "connection pool exhaustion"),
        ("user-api", "slow query timeouts"),
    ]
    results = []
    for service, pattern in runbook_pairs:
        try:
            result = await detect_knowledge_drift(service, pattern)
            results.append(result)
        except Exception as e:
            logger.error("Drift detection failed for %s/%s: %s", service, pattern, e)
            results.append(
                DriftAnalysis(
                    service=service,
                    error_pattern=pattern,
                    runbook_says="Analysis failed",
                    evidence_says=str(e),
                    supporting_incidents=[],
                    agreement_level="aligned",
                    drift_detected=False,
                    confidence="low",
                    recommended_update="",
                )
            )
    return results


async def get_memory_overview(service: str | None = None) -> MemoryOverview:
    hs = get_hindsight()
    bank = get_bank_id()

    tags = [f"service:{service}"] if service else []
    tags_match = "any" if tags else "any"

    obs_result = await hs.arecall(
        bank_id=bank,
        query=f"patterns and observations{f' for {service}' if service else ''}",
        types=["observation"],
        max_tokens=4096,
        budget="high",
        tags=tags if tags else None,
        tags_match=tags_match if tags else None,
    )

    observations = []
    if obs_result and hasattr(obs_result, "results"):
        for r in obs_result.results:
            observations.append(r.text if hasattr(r, "text") else str(r))

    inc_result = await hs.arecall(
        bank_id=bank,
        query=f"incidents{f' {service}' if service else ''}",
        types=["experience", "world"],
        max_tokens=2048,
        budget="mid",
        tags=tags if tags else None,
        tags_match=tags_match if tags else None,
    )

    incident_count = 0
    services_seen: set[str] = set()
    if inc_result and hasattr(inc_result, "results"):
        incident_count = len(inc_result.results)
        for r in inc_result.results:
            text = r.text if hasattr(r, "text") else str(r)
            for svc in ["payment-service", "auth-gateway", "user-api", "notification-service", "cache-cluster", "order-service"]:
                if svc in text.lower():
                    services_seen.add(svc)

    return MemoryOverview(
        observations=observations,
        incident_count=incident_count,
        services=sorted(services_seen) if services_seen else ["payment-service", "auth-gateway", "user-api", "notification-service", "cache-cluster", "order-service"],
    )


async def get_memory_timeline(service: str | None = None) -> list[TimelineEntry]:
    hs = get_hindsight()
    bank = get_bank_id()

    tags = [f"service:{service}"] if service else []

    result = await hs.arecall(
        bank_id=bank,
        query=f"incident timeline{f' {service}' if service else ''}",
        types=["experience", "world"],
        max_tokens=8192,
        budget="high",
        tags=tags if tags else None,
        tags_match="any" if tags else None,
    )

    entries = []
    if result and hasattr(result, "results"):
        for r in result.results:
            text = r.text if hasattr(r, "text") else str(r)
            rtype = r.type if hasattr(r, "type") else "unknown"
            score = r.scores.final if hasattr(r, "scores") and hasattr(r.scores, "final") else 0.0
            occurred = None
            if hasattr(r, "occurred_start") and r.occurred_start:
                occurred = str(r.occurred_start)
            entries.append(TimelineEntry(text=text, type=rtype, occurred_at=occurred, score=score))

    return entries


async def record_outcome(
    incident_id: str,
    service: str,
    resolution_action: str,
    effective: bool,
    notes: str,
) -> dict:
    hs = get_hindsight()
    bank = get_bank_id()
    now = datetime.now(timezone.utc).isoformat()

    content = f"""Incident Outcome Report — {incident_id}
Service: {service}
Resolution: {resolution_action}
Effective: {"Yes" if effective else "No"}
Notes: {notes}
Recorded: {now}"""

    await hs.aretain(
        bank_id=bank,
        content=content,
        context="incident-outcome",
        timestamp=now,
        document_id=f"outcome-{incident_id}",
        tags=[f"service:{service}", f"resolution:{'effective' if effective else 'ineffective'}"],
        metadata={"source": "engineer-feedback", "incident_id": incident_id},
        retain_async=False,
    )

    return {"status": "retained", "incident_id": incident_id, "timestamp": now}
