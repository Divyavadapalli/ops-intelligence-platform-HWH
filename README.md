# Memento — Incident Response Intelligence

Memento turns production incidents into institutional memory. It learns from every incident — what engineers tried, what worked, what failed — and uses that accumulated experience to guide future investigations. When current runbook guidance conflicts with historical evidence, Memento detects the **Knowledge Drift** and surfaces it with supporting evidence.

## Core Capabilities

- **Live Incident Investigation** — Submit a new incident and receive investigation recommendations grounded in past experience, not generic playbooks
- **Memory-Backed Evidence** — Every recommendation cites specific past incidents with confidence scores from Hindsight's TEMPR retrieval (temporal + semantic + keyword + graph)
- **Knowledge Drift Detection** — Automatically detects when runbook guidance contradicts accumulated evidence from incident outcomes
- **Observation Consolidation** — Hindsight auto-consolidates patterns across incidents into evidence-backed beliefs
- **Outcome Learning** — Record what actually resolved an incident; future investigations benefit from that experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Memory | [Hindsight by Vectorize](https://hindsight.vectorize.io) (Cloud) |
| Backend | Python 3.12, FastAPI |
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| LLM | Groq (openai/gpt-oss-120b) |

## Quick Start

### Prerequisites

- Python 3.12+ (`py -3.12 --version`)
- Node.js 18+ (`node --version`)
- [Hindsight Cloud](https://ui.hindsight.vectorize.io) API key (use promo code `MEMHACK99` for $50 credits)
- [Groq](https://console.groq.com) API key (free tier)

### Setup

```bash
# Clone and enter directory
git clone <repo-url>
cd memento

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Backend
py -3.12 -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### Run

```bash
# Terminal 1: Backend
.venv\Scripts\activate
py -3.12 -m uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Demo Data

Click the "Seed Data" button on the Knowledge Drift page, or:

```bash
curl -X POST http://localhost:8000/api/seed
```

This retains 20 incidents + 4 runbooks into Hindsight. Wait ~60 seconds for observation consolidation before testing drift detection.

## Demo Walkthrough (3 minutes)

### The Story

A payment-service 503 error runbook says to "restart payment-service first." But historical evidence from 3 separate incidents (INC-004, INC-008, INC-014) shows that 75% of the time, the actual root cause is cache-cluster connection pool exhaustion cascading through auth-gateway. Restarting payment-service wastes time.

### Steps

1. **Open the app** → Live Incident page
2. **Submit incident**: Service=payment-service, Symptoms="503 errors, checkout failing", Severity=P1
3. **See the magic**: Memento recalls past incidents, recommends checking cache-cluster FIRST (not restarting payment-service), and shows supporting evidence
4. **Navigate to Knowledge Drift** → See the conflict: Runbook says X, Evidence says Y, with incident citations
5. **Record outcome**: After "fixing" the incident, record that cache-cluster fix worked → Memento learns

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

See [MEMORY_MODEL.md](MEMORY_MODEL.md) for how Memento uses Hindsight's memory system.

## How Hindsight Powers Memento

Memento uses all three Hindsight operations:

- **Retain**: Every incident report, outcome, and runbook is retained as structured narrative. Hindsight's LLM extraction pulls out services, symptoms, investigation steps, root causes, and resolution effectiveness.
- **Recall**: TEMPR retrieval combines temporal, semantic, keyword, and graph search to find the most relevant past incidents. Observations (auto-consolidated patterns) surface cross-incident insights.
- **Reflect**: Agentic reasoning with structured output compares runbook guidance against historical outcomes. With `skepticism=4` disposition, the agent actively questions contradictions — this is what enables drift detection.

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Environment config
│   ├── hindsight_client.py  # Hindsight client singleton
│   ├── models.py            # Pydantic models
│   ├── agent.py             # Core agent logic
│   ├── seed.py              # Demo data (20 incidents + 4 runbooks)
│   └── routers/
│       ├── incidents.py     # Investigation endpoints
│       ├── memory.py        # Memory explorer endpoints
│       └── drift.py         # Drift detection endpoints
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Live Incident screen
│   │   ├── memory/page.tsx  # Memory Explorer screen
│   │   └── drift/page.tsx   # Knowledge Drift screen
│   ├── components/
│   └── lib/
│       ├── api.ts           # API client
│       └── types.ts         # TypeScript interfaces
├── .env.example
├── requirements.txt
└── README.md
```

## License

MIT
