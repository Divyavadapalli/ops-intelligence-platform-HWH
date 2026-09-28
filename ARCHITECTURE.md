# Memento — Architecture

## System Overview

```
Engineer (Browser)
    │
    ▼
Next.js Frontend (3 screens)
    │  HTTP REST
    ▼
FastAPI Backend (Python 3.12)
    │
    ├──► Agent Orchestrator (agent.py)
    │       │
    │       ├──► Groq LLM (openai/gpt-oss-120b)
    │       │     Synthesize investigation recommendations
    │       │     Narrate knowledge drift findings
    │       │
    │       └──► Hindsight Cloud
    │             │
    │             ├──► RETAIN: incident reports, outcomes, runbooks
    │             ├──► RECALL: similar incidents, temporal, observations
    │             ├──► REFLECT: drift detection (structured output)
    │             └──► Observations: auto-consolidated patterns
    │
    ▼
Response to Engineer (with evidence citations)
```

## Design Decisions

**Single-agent, single-bank architecture.** Memento uses one Hindsight bank (`memento-incidents`) that stores incidents, runbooks, and outcomes together. This allows Reflect to reason across all evidence types in a single pass — essential for drift detection.

**No database beyond Hindsight.** All persistent state lives in Hindsight's memory bank. The backend is stateless (except for an optional drift result cache).

**Groq for synthesis, Hindsight for reasoning.** The LLM (Groq) only synthesizes final human-readable recommendations from already-retrieved evidence. All memory search, pattern detection, and drift analysis is done by Hindsight's Reflect operation.

**Disposition tuning for drift detection.** The bank's `skepticism=4` (out of 5) makes the Reflect agent actively question contradictions between runbook content and incident outcomes. This is the key enabler for Knowledge Drift.

## Request Flows

### Live Incident Investigation

1. Engineer submits: service, symptoms, severity
2. `agent.investigate_incident()` calls `recall()` with service tags + semantic query
3. Calls `reflect()` with structured output schema for investigation recommendations
4. Calls Groq LLM to merge recall + reflect into coherent narrative with citations
5. Returns: recommendations, recalled incidents, observations, drift warnings

### Knowledge Drift Detection

1. `agent.detect_knowledge_drift()` calls `reflect()` per service/runbook pair
2. Reflect's agentic reasoning loop (up to 10 iterations) searches both runbook content and incident outcomes
3. Structured output extracts: what runbook says, what evidence shows, agreement level, drift flag
4. `based_on` field provides the specific memories that support the conclusion

### Memory Explorer

1. `agent.get_memory_overview()` calls `recall()` with `types=["observation"]` for patterns
2. Calls `recall()` with `types=["experience"]` for incident timeline
3. Returns stats, observations, and timeline entries

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/incidents/investigate` | Main demo endpoint — investigate an incident |
| POST | `/api/incidents/outcome` | Record resolution outcome into memory |
| GET | `/api/memory/overview` | Observations + stats |
| GET | `/api/memory/timeline` | Chronological incident memories |
| GET | `/api/memory/services` | Service list |
| GET | `/api/drift/analyze` | Single service drift analysis |
| GET | `/api/drift/all` | All drift analyses (cached) |
| POST | `/api/seed` | Seed demo data |
| GET | `/api/health` | Health check |
