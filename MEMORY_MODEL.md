# Memento — Memory Model

## Overview

Memento uses a single Hindsight memory bank (`memento-incidents`) that stores all incident-related knowledge: reports, outcomes, runbooks, and deployment changes. Hindsight automatically consolidates patterns across these memories into **observations** — evidence-backed beliefs about how systems behave.

## Bank Configuration

```python
bank_id = "memento-incidents"
retain_extraction_mode = "verbose"    # Maximum detail extraction
disposition = {
    "skepticism": 4,    # Question contradictions (enables drift detection)
    "literalism": 4,    # Stick to facts from incidents
    "empathy": 1        # Factual, not emotional
}
```

**Why skepticism=4**: This is the key to Knowledge Drift. With high skepticism, when Reflect encounters runbook guidance that says "restart payment-service" alongside observation evidence that says "restart was ineffective in 3 of 4 cases," it flags the contradiction rather than reconciling them.

## What Gets Retained

| Memory Type | Context | Tags | Document ID |
|------------|---------|------|-------------|
| Incident Report | `incident-report` | `service:X`, `severity:P1-P4`, `category:Y` | `incident-INC-XXX` |
| Incident Outcome | `incident-outcome` | `service:X`, `resolution:effective/ineffective` | `outcome-INC-XXX` |
| Runbook | `runbook` | `runbook:true`, `service:X` | `runbook-X-pattern` |

## Retrieval Strategy

### For New Incidents
```python
recall(
    query="<service> <symptoms>",
    types=["world", "experience", "observation"],
    tags=[f"service:{service}"],
    tags_match="any",         # Include untagged too
    budget="high",
    min_scores={"reranker": 0.2}
)
```

### For Drift Detection
```python
reflect(
    query="Compare runbook for X against historical outcomes...",
    response_schema=DriftAnalysisSchema,
    tags=[f"service:{service}"],
    budget="high",
    include_facts=True        # Returns supporting evidence
)
```

## How Observations Enable Knowledge Drift

After retaining ~20 incidents, Hindsight auto-consolidates facts into observations:

> "payment-service 503 errors are caused by upstream cache-cluster connection pool exhaustion in most historical cases"

> "Restarting payment-service was ineffective for 503 errors — investigation of upstream dependencies resolved the issue"

When Reflect runs the drift query, it finds BOTH the runbook ("restart payment-service first") AND these observations. With skepticism=4, it produces:

```json
{
    "runbook_says": "Check payment-service pod health and restart if unhealthy",
    "evidence_says": "In 3 of 4 incidents, root cause was cache-cluster cascade. Restart was ineffective.",
    "agreement_level": "contradicts",
    "drift_detected": true,
    "supporting_incidents": ["INC-004", "INC-008", "INC-014"],
    "recommended_update": "Check cache-cluster connection pool first, then auth-gateway, before restarting payment-service"
}
```

## Temporal Awareness

Hindsight's TEMPR retrieval uses temporal scoring alongside semantic, keyword, and graph search. More recent incidents naturally score higher, but all historical evidence contributes to observations. This means:

- A 6-month-old pattern with 3 confirming incidents outweighs a single recent one
- Recent deployments are surfaced for "what changed?" investigations
- Observations accumulate evidence over time, becoming stronger

## Evidence Chain

Every recommendation Memento makes is traceable:

1. **Recalled memories** have relevance scores from TEMPR retrieval
2. **Observations** cite the facts they consolidated from
3. **Reflect output** includes `based_on` linking to specific source memories
4. **Drift analysis** names supporting incidents by ID
