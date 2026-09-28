# Memento — Demo Script (3 minutes)

## Setup Before Demo

1. Ensure `.env` has valid Hindsight and Groq API keys
2. Start backend: `.venv\Scripts\activate && py -3.12 -m uvicorn backend.main:app --port 8000`
3. Start frontend: `cd frontend && npm run dev`
4. Seed data: Click "Seed Data" on the Drift page, or `curl -X POST http://localhost:8000/api/seed`
5. Wait 60 seconds for Hindsight observation consolidation
6. Verify: Navigate to Memory Explorer — should see observations and incidents

## Script

### 0:00–0:20 — The Problem

"Production systems have monitoring, alerting, and runbooks. But they don't remember. When the same type of incident hits again three months later, the on-call engineer starts from scratch — or worse, follows a runbook that's now wrong."

"Memento fixes that."

### 0:20–0:55 — Show the Gap

- Open the Knowledge Drift page
- Point to the payment-service 503 runbook analysis
- "This runbook says: restart payment-service first. Written six months ago, after the first incident. Sounds reasonable."
- "But look at what actually happened since then."

### 0:55–1:30 — Live Investigation

- Navigate to Live Incident page
- Enter: Service=`payment-service`, Symptoms=`503 errors, checkout failing, error rate > 50%`, Severity=P1
- Click "Investigate"
- Show the results:
  - **Recalled Evidence**: 3 similar past incidents with relevance scores
  - **Observation**: "payment-service 503s are caused by upstream cache-cluster issues in 75% of cases"
  - **Recommendation**: Check cache-cluster FIRST, not restart payment-service
  - **Drift Warning**: Runbook contradicts evidence

"Memento recalls that in 3 of the last 4 similar incidents, restarting payment-service was wrong. The actual root cause was upstream — cache-cluster connection pool exhaustion. It recommends checking cache-cluster first."

### 1:30–2:10 — Knowledge Drift

- Navigate back to Knowledge Drift page
- Show the drift card for payment-service
  - Left: "Runbook Says" — restart payment-service
  - Right: "Evidence Shows" — cache-cluster cascade in 75% of cases
  - Status: **Contradicts** (red)
  - Supporting incidents: INC-004, INC-008, INC-014
  - Recommended update: Check cache-cluster first
- Show an aligned runbook for contrast (green "Aligned" badge)

"This isn't a chatbot guessing. This is accumulated evidence from 6 months of incidents, surfaced by Hindsight's memory system."

### 2:10–2:40 — Close the Loop

- Go back to Live Incident page
- Scroll to "Record Outcome"
- Enter: "Increased cache-cluster maxclients and restarted leaking service"
- Check "Resolution was effective"
- Click "Record & Retain Outcome"
- Show the green confirmation: "Outcome retained into Memento's memory"

"The organization just learned something new. Next time this happens, Memento will be even more confident."

### 2:40–3:00 — Value

"Memento turns every incident into institutional memory. It doesn't just store what happened — it tracks what worked, what failed, and where your documentation has drifted from reality. With evidence."

## Key Points to Emphasize

- **Memory is the star**: Every recommendation comes from Hindsight's memory (retain/recall/reflect)
- **Not a chatbot**: Recommendations are evidence-backed, not generated from generic knowledge
- **Knowledge Drift is the differentiator**: Detecting when runbooks conflict with reality
- **Observations are automatic**: Hindsight consolidates patterns without manual curation
- **The loop closes**: Recording outcomes improves future recommendations
