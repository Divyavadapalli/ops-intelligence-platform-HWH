# Hindsight Hackathon Research & Project Selection

**HackwithHyderabad 3.0 — AI Agents That Learn Using Hindsight**
Research Date: September 28, 2026
Submission Deadline: September 29, 2026 | Finale: October 3 @ Microsoft Hyderabad

---

## 1. Executive Summary

This report synthesizes research from Hindsight's official documentation and GitHub (38.3k stars), 25+ academic papers on agent memory (2025-2026), analysis of 8 professional domains, competitive mapping of 30+ existing products, study of previous hackathon winners (including 3 known Hindsight hackathon projects), and community-sourced hackathon strategy.

**Key finding**: All previous Hindsight hackathon projects (StratifyAI, CodeCoach AI, Nexus) targeted developer or student workflows. The problem statement explicitly discourages student-centric projects and rewards professional business applications. This creates a clear differentiation opportunity.

**Judging weights**: Innovation (30%), Hindsight Memory (25%), Technical Implementation (20%), User Experience (15%), Real-world Impact (10%).

The three shortlisted projects are:
1. **Meridian** — Incident Response Intelligence for SREs
2. **Closeloop** — Deal Intelligence Agent for B2B Sales
3. **Precursor** — Customer Success Intelligence for CS Teams

Each targets a genuine professional pain point, makes Hindsight central and visible, has a clear before/after demo story, and is buildable within the available timeline.

---

## 2. Official Problem Analysis

### What Must Be Built
An AI-powered application using Hindsight that demonstrates **persistent memory and learning from past interactions**. The project must go beyond a stateless chatbot — it should remember, recall, and improve over time.

### What Role Must Hindsight Play
Hindsight memory accounts for **25% of the judging criteria**. The problem statement explicitly states: "Make Memory the Star, Not a Feature." Memory must be central to the value proposition, not an optional add-on. The best projects show a clear before/after: without memory the agent is generic; with memory it becomes dramatically better.

### Judging Rubric

| Criteria | Weight | What Judges Want |
|----------|--------|------------------|
| Innovation | 30% | Fresh take on a real problem. Beyond obvious chatbot territory. |
| Hindsight Memory | 25% | Memory central to value. Agent clearly improves over time. |
| Technical Implementation | 20% | Clean, well-architected, functional. Handles edge cases. |
| User Experience | 15% | Intuitive interaction. Compelling demo flow. |
| Real-world Impact | 10% | Genuine problem for real users. Path to adoption. |

### Submission Requirements
- GitHub repository with clean, documented code
- Demo video showing the agent in action
- Live project demo to judges (at finale)
- Content deliverables: each member writes an Article (800-1,500 words) + LinkedIn post + 1 team video (2-5 min)
- Explanation of how Hindsight memory is used

### Content Restrictions
- Articles and social posts must NOT mention "hackathon" anywhere (title, body, hashtags) — **disqualification if violated**
- Must include links to Hindsight GitHub, documentation, and Vectorize agent memory page
- Article must include code snippets, before/after example, screenshots, honest lessons
- Video: 2-5 minutes, 1080p minimum, screen recording with voiceover

### What the Organizers Explicitly Recommend
1. **Solve a real business problem** — "Would someone pay $50/month for this?"
2. **Keep scope tight** — "A polished agent that does one thing brilliantly beats a sprawling prototype that does five things poorly"
3. **Use realistic data** — "The #1 thing that will make your project look real is the data"
4. **Show the learning curve** — Interaction 1: generic → Interaction 5: personalized → Interaction 20: feels like it knows you
5. **Think like a demo** — Value obvious within 60 seconds

### What the Organizers Discourage
- **Student-centric projects**: "Avoid student-centric projects like AI tutors, AI group project managers, AI quiz generators, etc. Think about the professional world instead."
- Projects where memory is an afterthought
- Generic "AI that remembers your favorite color" approaches
- Projects that cannot be clearly demonstrated

### What Makes a Project Stand Out (per organizers)
- Tell a story with the demo ("Imagine you are a sales rep on your fifth call...")
- Show progressive learning
- Build something you'd put on LinkedIn tomorrow
- Use realistic data (Kaggle, HuggingFace, or LLM-generated synthetic data)

---

## 3. Judging Criteria Analysis

### Innovation (30%) — The Highest Weight
This is the differentiator. Given that all previous Hindsight hackathon projects were developer/student-focused (StratifyAI, CodeCoach, Nexus), a professional/enterprise-focused project immediately scores higher on innovation. The key question: "Is this a fresh take on a real problem? Does it go beyond obvious chatbot territory?"

**Strategy**: Target a professional domain where persistent memory creates value that is non-obvious but immediately understandable. Avoid the domains most likely to be crowded (generic customer support chatbot, coding assistant).

### Hindsight Memory (25%) — Must Be Central
The project must demonstrate that removing Hindsight would fundamentally break the product. Ways to maximize this score:
- Show the agent improving across 3+ interactions
- Recall context from simulated "days or weeks ago"
- Learn user preferences and adapt behavior
- Build domain expertise from past conversations
- Use multiple Hindsight capabilities: retain, recall, AND reflect
- Leverage Hindsight-specific features: temporal queries, entity relationships, observations, mental models

### Technical Implementation (20%)
Clean architecture, proper error handling, edge cases addressed. The code should look like it was written by someone who ships production software. Use proper project structure, environment variables, error boundaries, and loading states.

### User Experience (15%)
The agent must be intuitive to interact with. The demo must tell a compelling story. UI should look like a polished SaaS product, not a hackathon prototype. Use a component library (shadcn/ui, Tailwind) for professional appearance.

### Real-world Impact (10%)
Could this solve a genuine problem for real users? Is there a path to actual adoption? Target a problem with quantifiable pain and identifiable users.

---

## 4. Hindsight Capability Analysis

### Architecture Overview
Hindsight by Vectorize is an agent memory system built around three core operations against isolated **memory banks**:

**RETAIN** — Ingests raw content (conversations, documents, files). An LLM extracts structured facts, entities, temporal metadata, and relationships into a knowledge graph (PostgreSQL + pgvector). NOT verbatim storage — intelligent extraction.

**RECALL** — Multi-strategy retrieval using TEMPR (four parallel search arms):
- Temporal: Date parsing and range filtering ("last spring" → Mar-May)
- Embedding: Vector cosine similarity
- Matching: Keyword/BM25 exact terms
- Path: Entity relationship graph traversal
Results fused via Reciprocal Rank Fusion, then cross-encoder reranked.

**REFLECT** — Agentic reasoning loop that autonomously searches memory using multiple tools, applies disposition traits (skepticism, literalism, empathy on 1-5 scales), enforces directives, and synthesizes a grounded answer. Unlike recall which returns raw facts, reflect returns synthesized responses.

### Memory Hierarchy (retrieval priority)
1. **Mental Models** — User-curated, pre-computed summaries
2. **Observations** — Auto-consolidated beliefs with evidence tracking
3. **Raw Facts** — World facts (objective claims) + Experience facts (agent's own actions)

### Key Technical Details

**SDKs**: Python (`pip install hindsight-client`), TypeScript (`npm install @vectorize-io/hindsight-client`), Go, CLI, REST API

**2-line LLM integration**:
```python
from hindsight_litellm import wrap_openai
client = wrap_openai(OpenAI(), bank_id="user-123", hindsight_api_url="http://localhost:8888")
```

**File ingestion**: PDF, DOCX, PPTX, XLSX, images (OCR), audio (transcription), HTML, MD, CSV, JSON, YAML

**Deployment**: Docker (recommended for hackathon), Cloud (free credits with MEMHACK99), self-hosted

**Integrations**: LangChain/LangGraph, Vercel AI SDK, CrewAI, Pydantic AI, OpenAI Agents SDK, OpenClaw, n8n, 16+ coding agents

### What Hindsight Is Best At
- Multi-session continuity across weeks/months
- Temporal queries ("what changed since Q2?")
- Entity relationship traversal (multi-hop: Alice → Project Atlas → Kubernetes → outage)
- Observation consolidation (automatic deduplication, evidence tracking)
- Contradiction resolution (preserving history when facts change)
- Structured output from memory via reflect (JSON schema validation)
- File ingestion (unique capability vs simple memory systems)

### What Hindsight Should NOT Be Used For
- Single-session stateless Q&A (use standard RAG)
- Static document search without temporal/relationship needs
- Real-time streaming data without reflection needs
- Same-turn retain-then-recall (async processing; memories not instantly available)

### Critical Anti-Patterns to Avoid
- Pre-summarizing before retaining (destroys extraction value)
- Random document_ids (creates duplicates)
- Omitting context field (significantly reduces extraction quality)
- Missing timestamps (disables temporal retrieval)
- `tags_match="any"` in multi-tenant setups (leaks memories across users)

---

## 5. Current AI Agent Landscape

### Memory Architecture Taxonomy (2025-2026)
The field has converged on three memory types mirroring cognitive science:

**Episodic Memory**: Raw records of past interactions/trajectories. Hard problem: on ICLR 2025 benchmarks, no model tracked latest entity state more than 36% of the time across multi-event questions.

**Semantic Memory**: Extracted, structured facts. Most production systems (Mem0, Zep/Graphiti, Cognee) operate primarily here.

**Procedural Memory**: Agents that rewrite their own instructions based on experience. LangMem is architecturally unique in supporting this.

### Leading Frameworks (2026)

| Framework | Approach | Key Strength |
|-----------|----------|-------------|
| **Mem0** (~55k stars) | Vector + entity extraction, fused retrieval | Drop-in API, speed |
| **Zep/Graphiti** | Bi-temporal knowledge graph | Temporal reasoning; 71.2% on LongMemEval vs Mem0's 49% |
| **Letta (MemGPT)** | OS-metaphor: RAM + disk | Self-editing memory, sleep-time compute |
| **Cognee** (~12k stars) | Knowledge-graph-first RAG | 70+ production deployments |
| **LangMem** | Three-type memory | Only framework supporting procedural memory |
| **Hindsight** (38.3k stars) | TEMPR multi-strategy + observations | Temporal queries, entity graph, observation auto-consolidation |

### What Makes Memory Central vs. Decorative
Memory is **central** when:
- Cross-session continuity is required for the task
- Temporal reasoning matters (what was true then vs. now)
- The agent must improve over time
- Removing the memory layer measurably degrades task completion

Memory is **decorative** when:
- It's a vector store bolted on without affecting the reasoning loop
- It stores facts but never prunes, versions, or governs them
- There's no mechanism for the agent to act differently based on retrieved memory

### Key Evaluation Benchmarks
- **LongMemEval** (ICLR 2025): 500 questions, five memory abilities, multi-session
- **MemoryArena** (ICML 2026): Critical finding — agents near-saturated on LoCoMo perform poorly on realistic multi-session tasks
- **LongMemEval-V2** (2026): Raises bar toward "experienced colleague" performance

### Common Failure Modes
1. Memory poisoning (malicious/incorrect facts)
2. Stale context / temporal drift
3. Semantic drift during consolidation
4. Access control violations in multi-tenant systems
5. Multi-agent memory conflict
6. Hallucination from retrieval (fabricated facts that look normal)

Sources: Atlan agent memory architectures, Mem0 state of agent memory 2026, arXiv:2606.24535, arXiv:2603.11768, MemoryArena benchmark

---

## 6. Real-World Problem Landscape

### Research Across 8 Professional Domains

| Domain | Problem Severity | Who Suffers | What Gets Lost |
|--------|-----------------|-------------|----------------|
| **Incident Response** | Very High | SREs, on-call engineers | Resolution patterns, runbook effectiveness, cross-incident patterns |
| **Sales Intelligence** | High | B2B sales reps | Deal context across calls, objection patterns, competitor mentions |
| **Customer Support** | Very High (83% repeat info) | Support agents, customers | Customer history, past resolutions, environment details |
| **Customer Success** | High | CS managers | Relationship health trends, churn signals, long-term context |
| **Code Review** | Medium-High | Engineering teams | Team conventions, decision rationale, past review patterns |
| **Meeting Intelligence** | High | Knowledge workers | Cross-meeting synthesis, commitments, follow-up tracking |
| **Compliance/Audit** | High | Compliance officers | Audit reasoning, exception rationale, control test history |
| **Procurement** | High | Procurement teams | Negotiation patterns, vendor reliability, price concessions |

---

## 7. Existing Solutions & Competitive Gaps

### Incident Response
- **PagerDuty AIOps**: Alert grouping, no persistent cross-incident learning
- **Rootly**: Best incident workflow automation, but no deep knowledge retrieval
- **incident.io AI SRE**: Closest to memory-powered (searches GitHub, Slack, historical incidents), but primarily retrieval, not accumulated learning
- **GAP**: No tool does cross-incident experiential learning — remembering which resolution steps actually worked vs. were skipped

### Sales Intelligence
- **Gong**: Excellent post-call analysis, but does NOT auto-populate MEDDIC/BANT fields. No deal memory across calls.
- **Clari**: Strong forecasting, no engagement execution
- **Salesforce Einstein**: Deep CRM integration but limited conversational analysis
- **GAP**: No tool auto-maintains qualification frameworks from conversations or synthesizes cross-call deal context

### Customer Success
- **Gainsight**: CS platform leader, but reactive health scoring, not memory-powered
- **Decagon**: Launched "User Memory" in Spring 2026 for persistent cross-session context — the closest competitor
- **GAP**: No tool synthesizes long-term relationship patterns, tracks sentiment trends over months, or provides proactive churn intelligence based on accumulated interactions

---

## 8. Hackathon/Judge Research

### Previous HackwithHyderabad History
- **1.0** (Sept 2025): 29,443 participants, 8-hour format, Microsoft Hyderabad
- **2.0** (2026): Second edition at Microsoft Hyderabad
- **3.0** (Oct 3, 2026): Upcoming. Prizes up to $2,000. Top 60 teams from initial submission.

### Previous Hindsight Hackathon Projects (Known)
1. **Nexus**: Streamlit app for "Project Amnesia" — developer-focused
2. **StratifyAI**: AI Group Project Manager — student/team-focused
3. **CodeCoach AI**: Personalized coding mentor — developer-focused

All three targeted developer/student workflows. **None targeted professional business operations.** This is the differentiation opportunity.

### Winning Patterns from Recent AI Hackathons
- **RiskWise** (Microsoft AI Agents Hackathon 2025, Best Overall, $20K): Supply chain risk analysis — won because it solved a real, complex, domain-specific problem
- Winners always had a crisp one-sentence value proposition
- Before/after is the most compelling demo pattern
- "Hardcode the demo path — mock external services, cache API responses, prepare screenshot fallbacks"
- "Teams that code until the final hour almost always lose to teams that stop coding early and rehearse"

### What Judges Actually Penalize
1. Over-scoping (the #1 killer)
2. Building something that doesn't align with the hackathon theme
3. Not preparing the demo (all time on code, no rehearsal)
4. AI as decoration ("Score appropriateness, not quantity of AI")
5. Claiming accuracy with no test set
6. Generic GPT wrapper

Sources: Microsoft AI Agents Hackathon winners, GitLab AI Hackathon 2026, DEV Community judging guides, Devnovate event pages

---

## 9. Opportunity Map

| # | Problem Area | User | Pain | Memory Value | Competition | Differentiation | Tech Risk | Demo Potential |
|---|-------------|------|------|-------------|-------------|-----------------|-----------|---------------|
| 1 | Incident Response | SRE | Past resolution knowledge lost | Very High | Medium (incident.io closest) | Very High — nobody accumulates experiential knowledge | Low-Med | High |
| 2 | Deal Intelligence | Sales Rep | Deal context scattered across calls | Very High | Fragmented (no end-to-end) | High — no tool auto-maintains qualification | Low | High |
| 3 | Customer Success | CS Manager | Relationship patterns invisible | High | Decagon approaching | High — proactive vs reactive | Low | Very High |
| 4 | Customer Support | Support Agent | Customers repeat themselves | Very High | Strong (Decagon leading) | Medium — Decagon close | Low | Very High |
| 5 | Meeting Intelligence | Knowledge Worker | Cross-meeting synthesis absent | High | Fragmented (Otter, Fireflies) | Medium-High | Low | High |
| 6 | Code Review | Engineering Team | Team conventions not codified | Medium-High | Active (Qodo, Greptile) | Medium — gap closing | Low | Medium-High |
| 7 | RFP/Proposal | Sales/Presales | Institutional proposal knowledge lost | High | Light | High | Medium | Medium |
| 8 | Compliance/Audit | Compliance Officer | Audit reasoning ephemeral | High | Active but shallow AI | High | Medium | Medium |
| 9 | Procurement | Procurement Officer | Negotiation patterns lost | High | Enterprise-heavy | High | Medium | Medium |
| 10 | Content Strategy | Marketing | Content performance patterns forgotten | Medium | Many tools exist | Low | Low | Medium |
| 11 | Competitive Intel | Strategy Team | Competitor tracking fragmented | Medium | Some tools exist | Medium | Medium | Medium |
| 12 | Hiring/Recruiting | Recruiter | Interview feedback lost | Medium | Growing | Medium | Medium | Medium |

---

## 10. Rejected Ideas

### Content Strategy Agent
**Rejected**: Low differentiation. Multiple existing tools (Buffer, Hootsuite, HubSpot) already do content performance tracking. Memory adds modest value. Many hackathon teams likely to pick this from the problem statement list.

### SEO & Citation Agent
**Rejected**: Requires access to ranking APIs (Ahrefs, SEMrush) that are expensive and slow. Hard to generate realistic data. Not compelling in a 3-minute demo.

### Social Media Engagement Agent
**Rejected**: Requires live social media API access. Privacy concerns. Low memory differentiation — most value comes from analytics, not accumulated memory.

### Code Review Agent
**Rejected**: Active competition closing the gap (Qodo's self-learning rules, Greptile's code graph). Previous Hindsight projects (CodeCoach) already in this space. Lower differentiation score.

### Compliance & Audit Agent
**Rejected**: Hard to demo in 3 minutes (requires understanding of compliance frameworks). High liability risk. Moderate data availability. Judges unlikely to find it immediately compelling unless they're in compliance.

### Procurement/Vendor Management Agent
**Rejected**: Enterprise-heavy workflow not intuitive to general audience. Moderate demo potential. Requires procurement domain knowledge that most teams lack.

### Hiring/Recruiting Agent
**Rejected**: HIGH bias risk. NYC Local Law 144 requires audits of automated employment tools. Stanford HAI documented racial bias in AI hiring. Regulatory scrutiny makes this a liability for a hackathon demo, not an asset.

### Meeting Prep Agent
**Rejected** (as standalone): Overlaps significantly with Deal Intelligence for sales meetings. As a general-purpose meeting agent, it lacks the specificity that scores high on Innovation. Better as a feature within a deal intelligence agent.

### Student-Centric Projects (AI Tutor, Group Project Manager, Quiz Generator)
**Rejected**: Explicitly discouraged by the problem statement. Previous Hindsight projects already in this space. Would score poorly on Innovation and Real-world Impact.

### Generic Customer Support Chatbot
**Rejected**: Crowded category. Decagon already launched "User Memory" specifically for this. Many teams will build this. Low Innovation score despite strong problem validation.

---

## 11. Top 3 Project Approaches

---

### PROJECT A: Meridian — Incident Response Intelligence

#### A. Project Name
**Meridian** (navigation metaphor: guiding engineers through incidents using accumulated knowledge)

#### B. One-Sentence Product Definition
Meridian is an AI agent that remembers every production incident your team has resolved — the root causes, the resolution steps that actually worked, and the patterns that predict similar failures — so your next 2 AM outage gets fixed in minutes, not hours.

#### C. Real User
**Site Reliability Engineer (SRE)** or on-call DevOps engineer responsible for production incident response at a mid-to-large engineering organization.

#### D. Real Problem
When production goes down at 2 AM, the on-call engineer faces a critical knowledge gap:

**What happens today:**
1. Alert fires (PagerDuty, OpsGenie)
2. Engineer opens monitoring dashboards (Datadog, Grafana)
3. Engineer searches Slack history, Confluence, past incident reports for similar issues
4. If lucky, finds a relevant post-mortem from 6 months ago
5. Tries multiple resolution paths, some of which were already tried and failed in past incidents
6. Eventually resolves the issue, writes a post-mortem that nobody will find next time

**Where information gets lost:**
- Resolution steps that actually worked vs. were tried and abandoned
- Which runbook steps are outdated or environment-specific
- Institutional knowledge about service dependencies ("last time Service A had this error, it was actually caused by Service B's connection pool")
- The fact that this exact pattern happened 4 months ago with a different service
- Why a particular fix was chosen over alternatives

**Why this matters:** Mean Time to Resolution (MTTR) directly impacts revenue, customer trust, and engineering team health. Every minute of downtime costs real money.

#### E. Why Memory Is Essential

**What gets stored (via Hindsight retain):**
- Incident timelines: alert trigger → investigation steps → root cause → resolution
- Which resolution steps worked vs. failed for each incident
- Service dependency relationships discovered during investigation
- Environment-specific context (config values, deployment versions)
- Post-mortem insights and action items
- Which engineer resolved which type of incident

**When it's stored:**
- After each incident is resolved (retain the full incident report)
- After post-mortems are written (retain the document)
- When runbooks are updated (retain the changes with context)
- When deployment changes occur (retain the changelog)

**What should NOT be stored:**
- Raw metric data (belongs in monitoring tools)
- PII from customer reports
- Secrets, credentials, API keys
- Ephemeral alert noise that didn't lead to incidents

**How it's retrieved (via Hindsight recall + reflect):**
- Temporal: "What incidents affected this service in the last 3 months?"
- Entity graph: "Service A → depends on → Service B → last incident → root cause"
- Semantic: "Redis OOM errors with connection pool exhaustion"
- Observation: "This service has a pattern of failing after deployments that change config X"

**How memory changes behavior:**
- Interaction 1: Agent provides generic troubleshooting steps
- Interaction 5: Agent recognizes the error pattern and suggests the specific fix that worked before
- Interaction 20: Agent proactively warns "This looks like the cascading failure pattern from March — check Service B's connection pool before investigating Service A"

**Memory correction:** Engineers can flag incorrect memories ("that resolution didn't actually work, we had to do X instead"), and Hindsight's observation consolidation updates the evidence tracking.

#### F. Before vs After

**WITHOUT HINDSIGHT — New incident: Service A returning 500 errors**

```
Engineer: Service A is returning 500s. What should I check?
Agent: Here are general troubleshooting steps for 500 errors:
  1. Check application logs
  2. Check resource utilization
  3. Check recent deployments
  4. Check database connectivity
  5. Check external dependencies
[Generic, unhelpful. Engineer spends 45 minutes investigating.]
```

**WITH HINDSIGHT — Same incident, after 15 past incidents retained**

```
Engineer: Service A is returning 500s. What should I check?
Agent: I found 3 relevant incidents for Service A:

  ⚡ HIGH MATCH: Incident #47 (March 15) — Service A 500s caused by
  Service B's Redis connection pool exhaustion after config deployment.
  Resolution: Increased max_connections from 50 to 200 in Service B.
  Time to resolve: 23 min. Engineer: Sarah K.

  📋 RELATED: Incident #31 (January 8) — Similar 500 pattern but root
  cause was database migration timeout. Resolution: Rolled back migration,
  applied with higher timeout. Time to resolve: 1h 12min.

  ⚠️  NOTE: Service B had a deployment 2 hours ago (changelog retained).
  Based on past patterns, check Service B's connection pool first.

  Recommended investigation order:
  1. Service B Redis connection pool (matched pattern from Incident #47)
  2. Recent Service B deployment impact
  3. Database health (if #1 and #2 clear)
```

The difference is stark and immediately understandable to any engineer.

#### G. Learning Curve

**Interaction 1 (Day 1):** Agent has no memory. Provides generic troubleshooting steps. Engineer resolves incident manually. Incident report retained.

**Interaction 3 (Week 2):** Agent recognizes that the current error matches a retained pattern. Suggests the specific resolution path. Engineer confirms it worked. Resolution effectiveness retained.

**Interaction 7 (Month 2):** Agent has built observations: "Service A incidents are 70% caused by upstream dependency failures, not Service A itself." Proactively suggests checking dependencies before the service itself.

**Interaction 12 (Month 3):** Agent connects a new incident to a deployment change from 3 days ago using temporal queries and entity graph traversal. Surfaces a non-obvious causal chain.

**Interaction 20 (Month 5):** Agent has built mental models about the organization's incident patterns. Can predict which services are at risk after certain types of changes. Provides pre-incident warnings.

#### H. Architecture

```
Engineer (On-Call)
       ↓
  React/Next.js UI
  ├── Incident Dashboard
  ├── Chat Interface
  ├── Memory Explorer
  └── Incident Timeline
       ↓
  FastAPI Backend
       ↓
  Agent Orchestrator
  ├── LLM (Groq: Qwen3-32b)
  │   ├── Incident Classification
  │   ├── Pattern Matching
  │   └── Resolution Generation
  ├── Hindsight Memory
  │   ├── Retain: Incident reports, post-mortems, runbooks
  │   ├── Recall: Similar incidents, resolution patterns
  │   ├── Reflect: Synthesized investigation guidance
  │   └── Observations: Accumulated incident patterns
  └── Tools
      ├── Search Past Incidents
      ├── Check Service Dependencies
      └── Generate Timeline
       ↓
  Hindsight Memory Bank
  ├── Bank: "incidents" (all incidents)
  ├── Tags: service name, severity, team
  ├── Entities: services, engineers, root causes
  └── Observations: Patterns across incidents
```

#### I. Tech Stack

**Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- Real-time chat interface
- Incident timeline visualization
- Memory explorer showing what the agent remembers

**Backend:** Python (FastAPI)
- Agent orchestration
- Hindsight client integration
- Incident data pipeline

**LLM:** Groq (free tier) with Qwen3-32b or openai/gpt-oss-120b
- Fast inference for real-time incident response
- Function calling for tool use

**Memory:** Hindsight Cloud (free credits with MEMHACK99)
- One bank for all incident data
- Tags for service name, severity, team
- Observations enabled for pattern detection

**Database:** None required — Hindsight handles all persistence

**External APIs:**
- Groq API (essential, free tier)
- Hindsight Cloud API (essential, free credits)
- No other external dependencies

**Deployment:** Vercel (frontend) + Railway or Render (backend) or local Docker

#### J. UI/UX Design

**Screen 1: Incident Dashboard**
- Active incident card at top (red border, pulsing)
- Recent incidents timeline (cards with severity, service, status)
- Pattern alerts sidebar ("3 similar incidents in last 30 days")
- Quick stats: MTTR trend, top affected services

**Screen 2: Incident Chat Interface**
- Split view: Chat on left, Memory Panel on right
- Chat shows agent responses with inline memory citations
- Memory Panel shows: recalled incidents, confidence scores, matched patterns
- "What the agent remembers" expandable section with source facts

**Screen 3: Memory Explorer**
- Searchable timeline of all retained incidents
- Entity relationship graph (services → incidents → resolutions)
- Observation cards showing accumulated patterns
- Filter by service, severity, time range

**Visual Direction:**
- Dark theme (appropriate for ops/SRE tools)
- Status colors: red (critical), orange (warning), green (resolved), blue (info)
- Monospace font for technical details
- Clean cards with subtle borders
- Minimal animation (speed is the priority for ops tools)

#### K. 3-Minute Demo Script

**0:00-0:20 — Problem**
"Every SRE has been there: it's 2 AM, production is down, and you know your team has seen this exact error before — but the resolution is buried in a Slack thread from 3 months ago. Meridian fixes this."

**0:20-0:45 — Show the problem (without memory)**
Show the agent receiving a new incident alert. Ask "Service A is returning 500 errors." Agent gives generic troubleshooting steps. Highlight: "This is useless at 2 AM."

**0:45-1:15 — Seed memories**
"Let me show what happens after Meridian has been running for a few months." Click "Load Incident History" — show 15 past incidents being retained into Hindsight. Show the memory explorer populating with entities and observations.

**1:15-2:15 — The magic moment**
Same question: "Service A is returning 500 errors." Now the agent:
1. Recalls 3 similar past incidents with confidence scores
2. Identifies that Service B had a deployment 2 hours ago
3. Connects this to a pattern from Incident #47 (Service B → Service A cascading failure)
4. Recommends specific investigation order based on what worked before

Show the Memory Panel highlighting which memories were used and why.

**2:15-2:40 — Show the learning**
Click on an observation card: "Service A 500s are 70% caused by upstream dependency failures." Show the evidence count: "Based on 8 incidents over 4 months." This is accumulated intelligence no individual engineer has.

**2:40-3:00 — Impact**
"With Meridian, your team's institutional knowledge never walks out the door. Every incident makes the next one faster to resolve. Our test scenarios show resolution time dropping from 45 minutes to 12 minutes with accumulated memory."

#### L. Realistic Data

**Synthetic incident data needed:**
- 15-20 past incidents across 5-6 microservices
- Each incident: alert payload, investigation timeline, root cause, resolution steps, post-mortem summary
- Realistic service names (payment-service, auth-gateway, user-api, notification-service, cache-cluster)
- Realistic error patterns (Redis OOM, connection pool exhaustion, database timeout, memory leak, config drift)
- Temporal spread: incidents over 4-6 simulated months
- Cross-incident patterns: 2-3 recurring patterns that the agent should detect

**Generation approach:** Use an LLM to generate realistic incident reports based on real post-mortem databases (github.com/danluu/post-mortems). Format as structured JSON for retention.

#### M. Evaluation

**Baseline (without memory):** Agent uses only the current incident description and generic troubleshooting knowledge. Measure: response relevance, investigation steps quality, resolution accuracy.

**Memory-enabled version:** Agent has 15+ retained incidents. Same test scenarios. Measure:
- **Resolution accuracy**: Does the agent suggest the correct root cause? (Target: 70%+ match)
- **Investigation efficiency**: Does the recommended investigation order match the optimal path? (Compare to human-determined optimal)
- **Pattern detection**: Does the agent identify cross-incident patterns? (Binary: yes/no for each known pattern)
- **Memory precision**: Of the recalled memories, what percentage was relevant? (Target: >80%)
- **Temporal relevance**: Does the agent correctly prioritize recent incidents over old ones?

**Test scenarios (5 minimum):**
1. Exact repeat of a past incident → should match immediately
2. Similar but different service → should surface analogous pattern
3. Novel incident type → should acknowledge no matching pattern
4. Incident with misleading similarity → should not over-match
5. Cascading failure → should trace entity relationships

#### N. Failure Modes and Mitigations

| # | Failure Mode | Mitigation |
|---|-------------|-----------|
| 1 | Wrong incident matched (false positive) | Show confidence scores; require >0.7 reranker score; allow engineer to dismiss |
| 2 | Outdated resolution recommended | Include timestamp with all memories; flag resolutions >6 months old as "verify current" |
| 3 | Missing incident (never retained) | Clear "no matching incidents found" state; fallback to generic troubleshooting |
| 4 | Conflicting resolutions from different incidents | Surface both with context; let engineer choose; Hindsight's observation consolidation handles this |
| 5 | Hallucinated memory | Cite source incidents; include "based_on" evidence from reflect |
| 6 | LLM function call failure | Retry with backoff; cache Hindsight responses; fallback to cached results |
| 7 | Hindsight API timeout | 5s timeout with fallback to cached last-known-good results |
| 8 | Too many results | Use max_tokens budget; prefer observations over raw facts |
| 9 | PII in incident reports | Strip PII before retention; use Hindsight's memory defense (PII scanning) |
| 10 | Stale observations | Hindsight auto-tracks freshness; flag stale observations in UI |

#### O. Security and Privacy
- No real production data — all synthetic
- Hindsight memory defense enabled (PII/secrets scanning)
- No credentials stored in memory
- API keys via environment variables only
- Hindsight bank isolated per organization
- Incident details should use realistic but fake service/team names

#### P. Implementation Plan

| Phase | Focus | Components | Time Est. | Risk |
|-------|-------|-----------|-----------|------|
| 1 | Core backend | FastAPI server, Hindsight client setup, memory bank config | 2h | Low |
| 2 | Data seeding | Generate 15 synthetic incidents, retain into Hindsight | 1h | Low |
| 3 | Agent logic | LLM integration, recall/reflect flow, tool definitions | 2h | Medium (function calling) |
| 4 | Frontend | Next.js chat UI, incident dashboard, memory panel | 3h | Medium (polish) |
| 5 | Evaluation | 5 test scenarios, before/after comparison | 1h | Low |
| 6 | Polish | Loading states, error handling, responsive design | 1h | Low |
| 7 | Demo prep | Hardcode demo path, rehearse 3-minute script, record backup video | 1h | Low |

Total: ~11 hours (tight but feasible with focus)

---

### PROJECT B: Closeloop — Deal Intelligence Agent

#### A. Project Name
**Closeloop** (close the deal + close the feedback loop on what works)

#### B. One-Sentence Product Definition
Closeloop is an AI agent that remembers every interaction across your B2B sales deals — objections raised, competitors mentioned, commitments made, stakeholder dynamics — and prepares you for every call with a brief that a human executive assistant would take hours to compile.

#### C. Real User
**B2B Account Executive** managing 20-40 active deals at a SaaS company, each involving 3-8 stakeholders across 3-6 month sales cycles.

#### D. Real Problem
**What happens today:**
1. Rep has a discovery call with a prospect. Takes notes in CRM (if they remember).
2. Two weeks later, has a second call. Skims CRM notes (3 bullet points). Misses that the CFO mentioned a budget freeze.
3. Month later, demo call. Doesn't remember which competitor was mentioned or which feature the prospect cared about.
4. Sends a follow-up email that ignores everything from previous calls.
5. When the deal stalls, manager asks "what happened?" — rep reconstructs from memory.

**Where information gets lost:**
- Objections raised and how they were handled
- Competitor mentions and positioning
- Stakeholder roles and preferences ("the VP prefers email, the Director wants Slack")
- Commitments made by both sides
- Buying signals and concerns expressed casually
- Why previous deals with similar profiles were won or lost

**Why this matters:** 57% of B2B deals end in "no decision" — often because the seller failed to address concerns raised earlier in the cycle. Institutional deal knowledge walks out when reps leave.

#### E. Why Memory Is Essential

**What gets stored:**
- Call summaries with structured extraction: objections, competitors, commitments, stakeholders, next steps
- Deal stage transitions and reasons
- Email/message summaries with key commitments
- Win/loss outcomes with root causes
- MEDDIC qualification updates from each interaction

**When stored:** After every customer touchpoint (call summary, email, meeting note)

**What should NOT be stored:** Raw call recordings (too large), personal opinions about people, compensation/pricing details in raw form

**How retrieved:**
- Temporal: "What did the CFO say in our last call?" "What changed since Q2?"
- Entity: "All interactions with [stakeholder name]" → their concerns, preferences, communication style
- Semantic: "What objections have been raised about pricing?"
- Reflect: "Generate a pre-meeting brief for tomorrow's call with Acme Corp"

**Behavior change:**
- Without memory: Generic follow-up, missed context, repeated questions
- With memory: Personalized follow-up referencing specific concerns, auto-populated qualification framework, proactive alerts ("the champion mentioned a board meeting in June — follow up now")

#### F. Before vs After

**WITHOUT HINDSIGHT:**
```
Rep: Prepare me for tomorrow's call with Acme Corp.
Agent: Here's a template for a sales follow-up call:
  1. Open with rapport building
  2. Recap previous discussions
  3. Address any concerns
  4. Present next steps
[Useless. The rep knows how to run a call.]
```

**WITH HINDSIGHT (after 5 touchpoints retained):**
```
Rep: Prepare me for tomorrow's call with Acme Corp.
Agent: Pre-Meeting Brief — Acme Corp (Deal #127)

  📊 DEAL STATUS: Stage 3/5 | $85K ARR | Close target: Nov 15
  
  👥 ATTENDEES EXPECTED:
  • Sarah Chen (VP Eng) — Decision maker. Prefers data-driven arguments.
    Concern from May 3: "We tried a similar tool 2 years ago and it failed."
  • Mike Rodriguez (Director) — Champion. Asked for ROI calculator on Jun 1.
    ⚠️ OPEN COMMITMENT: You promised the ROI deck by Jun 15. Status: unsent.

  ⚡ KEY RISKS:
  • Competitor: DataStack was mentioned in the May 3 call. Sarah asked
    about their pricing model.
  • Budget: CFO mentioned Q3 freeze in the April call. Sarah said to
    "re-engage after the board meeting in June." Board meeting was June 20.
  • Open objection: Integration timeline — Mike needs <4 week deployment.

  📋 MEDDIC STATUS:
  • Metrics: Defined (40% reduction in deployment time)
  • Economic Buyer: Unknown — Sarah may not have budget authority
  • Decision Criteria: Speed + cost (confirmed May 3)
  • Decision Process: Board approval needed (confirmed April 15)
  • Identify Pain: Yes — manual deployments taking 3 days
  • Champion: Mike Rodriguez (engaged, responsive)

  🎯 RECOMMENDED APPROACH:
  1. Address the unsent ROI deck immediately — credibility risk
  2. Ask Sarah about the board meeting outcome
  3. Directly address DataStack comparison (you have a 4x faster deployment)
  4. Probe for economic buyer identity
```

#### G. Learning Curve

**Interaction 1:** First call with new prospect. Agent captures structured notes. Generic follow-up template.

**Interaction 3:** Agent recognizes objection patterns ("pricing concern similar to 4 other deals"). Suggests the response that worked in Deal #89.

**Interaction 7:** Agent has built observations about this prospect ("Acme Corp stakeholders respond best to data-driven arguments with specific ROI numbers").

**Interaction 12:** Agent connects dots across deals: "Deals where the economic buyer was identified before Stage 3 closed 3x more often." Prompts rep to identify economic buyer earlier.

**Interaction 20:** Agent serves as institutional deal intelligence: knows win/loss patterns, optimal objection handling, which deal characteristics predict success.

#### H. Architecture

```
Sales Rep
    ↓
Next.js Dashboard
├── Deal Pipeline View
├── Pre-Meeting Brief Generator
├── Call Debrief Input
├── Memory Explorer
└── Deal Health Alerts
    ↓
FastAPI Backend
    ↓
Agent Orchestrator
├── LLM (Groq: Qwen3-32b)
│   ├── Call Summary Extraction
│   ├── MEDDIC Auto-Population
│   ├── Objection Pattern Matching
│   └── Brief Generation
├── Hindsight Memory
│   ├── Bank per deal (retain call summaries, emails)
│   ├── Bank for rep patterns (cross-deal learnings)
│   ├── Recall: stakeholder history, objections, commitments
│   ├── Reflect: Pre-meeting briefs, deal analysis
│   └── Observations: Deal patterns, win/loss signals
└── Tools
    ├── Generate Brief
    ├── Update MEDDIC
    ├── Surface Stale Commitments
    └── Compare to Past Deals
```

#### I. Tech Stack

**Frontend:** Next.js 14 + Tailwind + shadcn/ui
**Backend:** Python (FastAPI)
**LLM:** Groq (free tier) — Qwen3-32b
**Memory:** Hindsight Cloud (MEMHACK99)
**Database:** None required
**External APIs:** Groq API, Hindsight Cloud API only

#### J. UI/UX Design

**Screen 1: Deal Pipeline**
- Kanban board with deal cards (stage, value, health score)
- Health indicators: green (on track), yellow (at risk), red (stale/blocked)
- Quick actions: Generate Brief, Log Interaction, View History

**Screen 2: Deal Detail / Pre-Meeting Brief**
- Split view: Brief on left, Memory Timeline on right
- MEDDIC scorecard at top
- Stakeholder map with interaction history
- Risk alerts and open commitments

**Screen 3: Call Debrief**
- Text input for call notes/transcript
- Auto-extracted structured data: objections, commitments, next steps, competitors
- "Save to Memory" button showing what will be retained

**Visual Direction:**
- Light theme (appropriate for sales tools)
- Blue/green accent colors (trust, growth)
- Card-based layout with clear hierarchy
- Compact information density (sales reps scan quickly)

#### K. 3-Minute Demo Script

**0:00-0:20 — Problem**
"Sales reps manage 30+ active deals. Before every call, they spend 15 minutes scrambling through CRM notes trying to remember what was said. Closeloop remembers everything."

**0:20-0:45 — Without memory**
Ask agent to prep for a call. Get a generic template. "This is what reps deal with today."

**0:45-1:30 — Build the memory**
Click "Seed Deal History" — show 5 call summaries being retained. Show the memory panel populating with stakeholders, objections, commitments. Show MEDDIC fields auto-filling.

**1:30-2:15 — The magic brief**
"Generate pre-meeting brief for tomorrow's call." Agent produces a detailed brief with:
- Attendee context from 3 past calls
- Open commitment flagged (unsent ROI deck)
- Competitor intelligence from a casual mention 2 months ago
- MEDDIC gaps identified

Show the Memory Panel: which past interactions were recalled and their relevance scores.

**2:15-2:40 — Cross-deal learning**
Show an observation: "Deals where pricing objection is addressed in the 2nd call close 2.5x more often (based on 8 deals)." This is pattern intelligence no individual rep has.

**2:40-3:00 — Impact**
"Closeloop turns every rep into your best rep by giving them institutional deal intelligence. No more lost context. No more missed commitments. No more deals dying because someone forgot what the CFO said three months ago."

#### L. Realistic Data
- 3-4 simulated deals with 4-6 touchpoints each
- Realistic company names, stakeholder names, deal values
- Varied deal stages and outcomes (won, lost, stalled)
- Realistic objections, competitor mentions, commitments
- Generated via LLM from real-world B2B sales patterns

#### M. Evaluation
- **Brief quality**: Does the generated brief contain all relevant context? (Checklist evaluation)
- **MEDDIC accuracy**: Do auto-populated fields match ground truth from call summaries?
- **Commitment tracking**: Are all open commitments surfaced? (Precision/recall)
- **Pattern detection**: Does the agent identify valid cross-deal patterns?
- **Temporal accuracy**: Does "what did Sarah say last time?" return the correct interaction?

#### N. Failure Modes

| # | Failure Mode | Mitigation |
|---|-------------|-----------|
| 1 | Wrong stakeholder attributed | Show source interaction with timestamp; allow correction |
| 2 | Stale commitment flagged (already addressed) | Allow "mark resolved"; observation consolidation updates |
| 3 | Competitor info outdated | Timestamp all competitive intelligence; flag if >3 months old |
| 4 | Over-confident MEDDIC assessment | Show evidence count per field; mark low-confidence items |
| 5 | Hallucinated commitments | Cite exact source interaction; include confidence score |
| 6 | Too many memories recalled | Token budget limits; prefer observations; filter by recency |
| 7 | LLM extraction error | Show extracted fields for review before retention |
| 8 | Cross-deal pattern is coincidence | Require minimum 3 deals for pattern observations |
| 9 | API failures | Cache last brief; show stale indicator |
| 10 | Rep enters inaccurate call notes | Allow memory editing/deletion; flag low-quality inputs |

#### O. Security
- No real customer data — all synthetic
- Deal information isolated per bank
- No financial PII stored
- API keys via environment variables

#### P. Implementation Plan

| Phase | Focus | Time Est. | Risk |
|-------|-------|-----------|------|
| 1 | Backend + Hindsight setup | 2h | Low |
| 2 | Synthetic deal data generation | 1h | Low |
| 3 | Agent logic (brief generation, MEDDIC extraction) | 2.5h | Medium |
| 4 | Frontend (pipeline, brief view, debrief input) | 3h | Medium |
| 5 | Cross-deal observations | 1h | Low |
| 6 | Polish + demo prep | 1.5h | Low |

Total: ~11 hours

---

### PROJECT C: Precursor — Customer Success Intelligence

#### A. Project Name
**Precursor** (as in: precursors to churn — the signals that predict it)

#### B. One-Sentence Product Definition
Precursor is an AI agent that builds a living memory of every customer relationship — tracking sentiment trends, feature requests, support patterns, and engagement signals over months — to predict churn risk before it becomes visible and prepare CS teams with the full relationship context for every interaction.

#### C. Real User
**Customer Success Manager (CSM)** responsible for a portfolio of 30-80 accounts at a B2B SaaS company, each worth $20K-$500K ARR.

#### D. Real Problem
**What happens today:**
1. CSM manages 50 accounts. Each has support tickets, meeting notes, email threads, NPS responses, and usage patterns.
2. Customer submits a support ticket. CSM doesn't know about 3 previous tickets this month (handled by different support agents).
3. Customer mentions a competitor in a QBR. CSM notes it mentally but doesn't track it.
4. Customer's champion (the internal advocate) leaves the company. CSM finds out weeks later.
5. Contract renewal is in 60 days. CSM scrambles to piece together the relationship health story from scattered sources.
6. Customer churns. In the post-churn analysis, everyone can see the warning signs that were invisible in real-time.

**The statistics:**
- 83% of customers say they repeat information after being transferred (CRMBuyer)
- 74% get frustrated repeating themselves (AnswerConnect)
- 54% give up entirely when forced to repeat multiple times
- 29% stop buying altogether

**Where information gets lost:**
- Sentiment trends over months (gradual decline invisible in any single interaction)
- Feature requests across channels (support ticket vs. email vs. QBR mention)
- Stakeholder changes (champion departures, new decision makers)
- Promise tracking ("we said we'd ship X by Q3")
- Usage pattern changes correlated with engagement

#### E. Why Memory Is Essential

**What gets stored:**
- All customer interactions: support tickets, meeting notes, QBR summaries, email highlights
- Sentiment signals: satisfaction scores, frustration indicators, enthusiasm markers
- Feature requests with frequency and priority
- Stakeholder map updates (role changes, departures, new contacts)
- Usage/engagement signals ("they stopped using Feature X in April")
- Promises made by both sides
- Win-back signals from churned accounts

**When stored:** After every customer touchpoint (automated from support system, manually from meetings)

**What should NOT be stored:** Raw usage telemetry, payment/billing details, internal pricing discussions

**Retrieval patterns:**
- Temporal: "How has Acme Corp's sentiment trended since Q2?" "When did they first mention competitor X?"
- Entity graph: "Acme Corp → stakeholders → interactions → sentiment" chain
- Semantic: "Which customers have requested real-time analytics?"
- Reflect: "Generate a relationship health summary for Acme Corp's renewal review"
- Observations: "Customers who submit 5+ support tickets in a month without resolution have 3x churn risk"

**Behavior change with memory:**
- Without: CSM sees a renewal date and a current NPS score. Surface-level.
- With: CSM sees a 6-month sentiment trajectory, knows the champion changed in April, knows 3 unresolved feature requests, knows the customer mentioned competitor Y twice, and knows that the pattern matches customers who churned in Q1.

#### F. Before vs After

**WITHOUT HINDSIGHT:**
```
CSM: What should I know before my QBR with Acme Corp?
Agent: Acme Corp is a $120K ARR account. Their contract renews
in 90 days. They have 2 open support tickets.
[Surface-level. The CSM knows this already from the CRM.]
```

**WITH HINDSIGHT (6 months of interactions retained):**
```
CSM: What should I know before my QBR with Acme Corp?
Agent: ⚠️ RELATIONSHIP HEALTH: DECLINING

  📉 SENTIMENT TREND:
  • Jan-Mar: Very positive (NPS 9, enthusiastic about Q1 features)
  • Apr: Neutral shift — primary champion (Lisa Park) left the company
  • May-Jun: Negative signals — 7 support tickets in 8 weeks (up 3x)
  • Jul: Competitor mention — CTO asked about "how DataPlatform handles
    this" during a support interaction

  👥 STAKEHOLDER CHANGES:
  • Lisa Park (Champion, VP Product) — LEFT April 15
  • New contact: James Wu (Director Product) — 2 interactions, lukewarm
  • CTO involvement increasing — 3 direct interactions since May (was 0)

  🔴 RISK SIGNALS:
  • Champion departure without replacement identified
  • Support ticket volume 3x baseline (similar pattern preceded 4 churns)
  • Competitor mention in non-sales context (strongest leading indicator)
  • Feature request #12 (real-time analytics) — first raised March,
    re-raised May and July. Status: not on roadmap.

  ✅ STRENGTHS:
  • High usage of core features (no decline)
  • Finance team expanded seats in March (+5 licenses)
  • Integration with their data warehouse completed successfully

  🎯 QBR STRATEGY:
  1. Acknowledge champion transition — invest in James Wu relationship
  2. Address the real-time analytics request directly (escalate or set expectations)
  3. Resolve the 3 open support tickets BEFORE the QBR
  4. Prepare competitive differentiation talking points vs DataPlatform
  5. Do NOT raise renewal yet — reduce risk signals first

  📊 CHURN PROBABILITY: HIGH (matches 4 of 6 patterns from past churns)
```

#### G. Learning Curve

**Interaction 1:** First customer interaction logged. Agent provides basic account summary.

**Interaction 5:** Agent begins tracking sentiment trends. Notes stakeholder communication preferences.

**Interaction 10:** Agent identifies a pattern: "Support ticket volume has increased 3x — this matched a pre-churn pattern in 2 other accounts."

**Interaction 15:** Agent builds a comprehensive relationship model: sentiment trajectory, stakeholder dynamics, unresolved concerns, competitive threats.

**Interaction 25:** Agent proactively alerts: "Based on patterns from 15 accounts, Acme Corp's current trajectory has a 70% correlation with pre-churn behavior. Recommend immediate executive engagement."

#### H. Architecture

```
Customer Success Manager
         ↓
   Next.js Dashboard
   ├── Portfolio Overview (health scores, alerts)
   ├── Account Deep Dive (relationship timeline)
   ├── QBR Brief Generator
   ├── Risk Radar (churn predictions)
   └── Memory Explorer
         ↓
   FastAPI Backend
         ↓
   Agent Orchestrator
   ├── LLM (Groq: Qwen3-32b)
   │   ├── Interaction Classification
   │   ├── Sentiment Analysis
   │   ├── Risk Scoring
   │   └── Brief Generation
   ├── Hindsight Memory
   │   ├── Bank per account (interactions, stakeholders)
   │   ├── Cross-account bank (churn patterns, success patterns)
   │   ├── Recall: relationship history, risk signals
   │   ├── Reflect: health assessment, QBR briefs
   │   └── Observations: churn predictors, success patterns
   └── Tools
       ├── Generate Health Report
       ├── Detect Risk Signals
       ├── Compare to Churn Patterns
       └── Stakeholder Analysis
```

#### I. Tech Stack

**Frontend:** Next.js 14 + Tailwind + shadcn/ui + Recharts (for trend charts)
**Backend:** Python (FastAPI)
**LLM:** Groq (free tier) — Qwen3-32b
**Memory:** Hindsight Cloud (MEMHACK99)
**Database:** None required
**Charting:** Recharts for sentiment trend visualization

#### J. UI/UX Design

**Screen 1: Portfolio Overview**
- Grid of account cards with health indicators (green/yellow/red)
- Sortable by: risk level, renewal date, ARR, last interaction
- Alert banner for high-risk accounts
- Trend sparklines on each card

**Screen 2: Account Deep Dive**
- Header: Account name, ARR, renewal date, health score, health trend chart
- Timeline: Chronological interaction feed with sentiment indicators
- Stakeholder panel: Contact cards with relationship status
- Risk/opportunity sidebar: Flagged signals with evidence
- Chat interface for ad-hoc questions about the account

**Screen 3: QBR Brief Generator**
- One-click brief generation
- Structured output: sentiment trend, stakeholder changes, risks, strengths, strategy
- Memory citations: which interactions informed each insight
- Export-ready format

**Screen 4: Risk Radar**
- Portfolio-wide view of risk signals
- Pattern matching: "These 5 accounts match pre-churn patterns"
- Observation cards: "Accounts with 5+ tickets/month churn at 3x rate"

**Visual Direction:**
- Clean, light theme with strategic color use
- Green/yellow/red for health status (universally understood)
- Trend charts showing directional change over time
- Card-based layout with clear information hierarchy
- Sparklines for compact trend display

#### K. 3-Minute Demo Script

**0:00-0:20 — Problem**
"Customer Success teams manage 50+ accounts, but they see a snapshot — this quarter's NPS, today's ticket count. Precursor sees the full movie: 6 months of relationship history that predicts what happens next."

**0:20-0:40 — Portfolio overview**
Show the dashboard with 8 accounts. Three are green, three yellow, two red. "Let's look at why Acme Corp just turned red."

**0:40-1:10 — The timeline without memory**
Show a "before" view: "Acme Corp, $120K ARR, 2 open tickets, NPS 7." — "That's what a CRM tells you. Here's what Precursor sees."

**1:10-2:00 — The full picture with memory**
Click "Generate Relationship Brief." Show the agent producing the comprehensive analysis: sentiment decline since April, champion departure, support ticket spike, competitor mention, feature request pattern. Highlight: "This is from 6 months of accumulated interactions — things no single touchpoint reveals."

**2:00-2:30 — Pattern intelligence**
Show the observation: "Accounts matching this pattern (champion departure + ticket spike + competitor mention) churned 70% of the time." Show that this pattern was learned from 15 past account histories. "No human CSM tracks patterns across 50 accounts over 6 months."

**2:30-3:00 — Impact**
"Precursor turns reactive customer success into predictive customer success. Instead of finding out about churn when the customer doesn't renew, you see the warning signs months early — and you see exactly what to do about it."

#### L. Realistic Data
- 8-10 simulated accounts with realistic company names and ARR values
- 6 months of interaction history per account (5-15 interactions each)
- Mix of outcomes: 2 churned, 2 at-risk, 4 healthy, 2 expanding
- Realistic support tickets, meeting notes, NPS scores, feature requests
- Stakeholder changes in 2-3 accounts
- Competitor mentions in 2 accounts
- Generated via LLM to ensure realistic patterns

#### M. Evaluation
- **Risk prediction accuracy**: Of accounts flagged as high-risk, how many match known churn patterns?
- **Signal detection recall**: Are all planted risk signals (champion departure, ticket spike, competitor mention) detected?
- **Temporal accuracy**: Does the sentiment trend correctly reflect the interaction timeline?
- **Brief completeness**: Does the QBR brief include all relevant context? (Checklist evaluation)
- **Pattern validity**: Do cross-account observations reflect genuinely correlated signals?

#### N. Failure Modes

| # | Failure Mode | Mitigation |
|---|-------------|-----------|
| 1 | False churn prediction | Show confidence scores and evidence; never say "will churn," say "matches pattern" |
| 2 | Missed sentiment shift | Require explicit sentiment signals in retained interactions |
| 3 | Wrong stakeholder association | Show source interaction; allow correction |
| 4 | Stale health score | Show "last updated" timestamp; auto-flag stale accounts |
| 5 | Over-indexing on one signal | Require multiple independent signals for high-risk classification |
| 6 | Hallucinated interaction | Cite source with timestamp; include confidence score |
| 7 | Cross-account privacy leak | Strict bank-per-account isolation; tag-based access control |
| 8 | LLM sentiment misclassification | Human review step; adjustable sentiment thresholds |
| 9 | API latency for large accounts | Paginate recall; cache recent briefs |
| 10 | Pattern matches false positive | Minimum 3 accounts for pattern observation; show counter-examples |

#### O. Security
- No real customer data — all synthetic
- Bank-per-account isolation prevents data leakage
- No financial details in memory
- Tags enforce per-CSM visibility
- API keys via environment variables

#### P. Implementation Plan

| Phase | Focus | Time Est. | Risk |
|-------|-------|-----------|------|
| 1 | Backend + Hindsight setup | 2h | Low |
| 2 | Synthetic account data (8-10 accounts, 6 months each) | 1.5h | Medium (data quality) |
| 3 | Agent logic (health scoring, risk detection, brief generation) | 2.5h | Medium |
| 4 | Frontend (portfolio view, account detail, brief, risk radar) | 3h | Medium |
| 5 | Cross-account pattern observations | 1h | Low |
| 6 | Polish + demo prep | 1.5h | Low |

Total: ~11.5 hours

---

## 12. Architecture Comparison

| Component | Meridian (Incident) | Closeloop (Sales) | Precursor (CS) |
|-----------|-------------------|-------------------|----------------|
| Memory banks | 1 (all incidents) | 1 per deal + 1 cross-deal | 1 per account + 1 cross-account |
| Primary operation | Recall + Reflect | Reflect (briefs) | Reflect (health assessment) |
| Key entity types | Services, engineers, root causes | Stakeholders, competitors, commitments | Stakeholders, feature requests, competitors |
| Temporal usage | "When did this last happen?" | "What was said in the May call?" | "How has sentiment trended since Q2?" |
| Observation value | Incident patterns across services | Deal win/loss patterns | Churn predictor patterns |
| Graph traversal | Service → dependency → incident → resolution | Stakeholder → objection → resolution | Account → stakeholder → interaction → sentiment |

---

## 13. Tech Stack Comparison

| Component | All Three Projects |
|-----------|--------------------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Python 3.11+ (FastAPI) |
| LLM | Groq (free tier) — Qwen3-32b or openai/gpt-oss-120b |
| Memory | Hindsight Cloud (MEMHACK99 for $50 credits) |
| Database | None (Hindsight handles persistence) |
| Charting | Recharts (Precursor only) |
| Deployment | Vercel (frontend) + Railway (backend) |
| External APIs | Groq API + Hindsight Cloud API only |

**Why this stack:**
- **Groq**: Free tier, fast inference, recommended by problem statement
- **Hindsight Cloud**: No infrastructure setup, free credits
- **Next.js + shadcn**: Professional-looking UI with minimal effort
- **FastAPI**: Fast development, good LLM ecosystem support
- **No database**: Hindsight IS the database — this is a feature, not a limitation

---

## 14. UI/UX Comparison

| Aspect | Meridian | Closeloop | Precursor |
|--------|---------|-----------|-----------|
| Primary layout | Dashboard + Chat | Pipeline + Brief | Portfolio + Timeline |
| Theme | Dark (ops aesthetic) | Light (sales tool) | Light (CS platform) |
| Key visualization | Incident timeline, entity graph | MEDDIC scorecard, stakeholder map | Sentiment trend chart, risk radar |
| Unique UI element | Memory explorer with confidence scores | Auto-populated qualification fields | Health sparklines on account cards |
| Complexity | Medium (3 screens) | Medium (3 screens) | High (4 screens) |
| Visual impact | Strong (dark theme, status colors) | Strong (data-rich brief) | Very strong (trend charts, color coding) |

---

## 15. Demo Comparison

| Aspect | Meridian | Closeloop | Precursor |
|--------|---------|-----------|-----------|
| Problem universality | Engineers understand instantly | Business people understand instantly | Everyone understands (customer relationship) |
| Before/after impact | Very high (generic vs. specific fix) | Very high (template vs. rich brief) | Very high (snapshot vs. full trajectory) |
| "Wow" moment | Agent connects non-obvious service dependency | Agent surfaces forgotten commitment from 3 months ago | Agent predicts churn from pattern matching |
| Demo risk | Low (well-defined inputs/outputs) | Low (structured data) | Medium (more complex visualization) |
| Time to understand | 30 seconds | 45 seconds | 45 seconds |
| Emotional resonance | "2 AM on-call" stress (engineers) | "Lost deal" frustration (salespeople) | "Customer churn" pain (universal) |

---

## 16. Evaluation Strategy Comparison

| Metric | Meridian | Closeloop | Precursor |
|--------|---------|-----------|-----------|
| Primary metric | Resolution path accuracy | Brief completeness & accuracy | Risk prediction accuracy |
| Memory precision | % relevant incidents in top-k recall | % relevant interactions in brief | % valid signals in health assessment |
| Temporal accuracy | Correct incident ordering | Correct stakeholder attribution | Correct sentiment trend direction |
| Pattern detection | Cross-service incident patterns | Cross-deal win/loss patterns | Cross-account churn patterns |
| Baseline comparison | Generic troubleshooting vs. memory-guided | Template brief vs. memory brief | CRM snapshot vs. memory analysis |
| Test scenarios | 5 incident types | 3-4 deal scenarios | 8-10 account profiles |

---

## 17. Risk Analysis

| Risk | Meridian | Closeloop | Precursor |
|------|---------|-----------|-----------|
| **Over-scoping** | Medium — keep to recall/reflect, no real infra integration | Low — clear scope (brief generation) | Medium — many screens, trend analysis |
| **Data realism** | High — incidents are well-understood by devs | High — sales workflows well-known | Medium — need realistic sentiment data |
| **LLM reliability** | Medium — function calling for tools | Medium — structured extraction | Medium — sentiment analysis accuracy |
| **Demo failure** | Low — can pre-cache Hindsight responses | Low — well-defined happy path | Medium — charts add complexity |
| **Differentiation risk** | Low — nobody does this with memory | Medium — problem statement example, others may pick it | Low — CS intelligence is uncommon |
| **Judge resonance** | High at Microsoft (engineers as judges) | Medium (depends on judge background) | High (everyone loses customers) |
| **Build time risk** | Low — straightforward architecture | Low — clear components | Medium — more UI work needed |

---

## 18. Red-Team Analysis

### As a Skeptical Hackathon Judge:

**Meridian**: "Is this just retrieval-augmented generation with incident reports? Show me why Hindsight matters more than a vector search over post-mortems."
→ **Defense**: The observation consolidation automatically detects patterns across incidents (e.g., "Service A failures are 70% caused by upstream dependencies"). This is not possible with simple RAG. The temporal queries ("what changed since the last time this happened?") leverage Hindsight's TEMPR retrieval uniquely.

**Closeloop**: "This is just a CRM with memory. What's new?"
→ **Defense**: CRMs store data you manually enter. Closeloop automatically extracts structured intelligence (MEDDIC fields, competitor mentions, commitment tracking) and synthesizes cross-deal patterns. No CRM does this. The brief generation is powered by reflect, which reasons across memory — not template filling.

**Precursor**: "Can you really predict churn from 8 synthetic accounts?"
→ **Defense**: We're demonstrating the pattern, not claiming production accuracy. The value is showing how accumulated relationship memory reveals trends invisible in any single interaction. The cross-account observations are the unique value — even with synthetic data, the pattern is real and well-documented.

### As a Senior AI Engineer:

**All three**: "What happens when Hindsight returns irrelevant memories?"
→ **Defense**: All three show confidence scores from Hindsight's reranker (0-1 scale). We set a minimum threshold (0.5) and show the score in the UI. Low-confidence matches are flagged, not hidden.

### As a Microsoft Engineer Reviewing GitHub:

**All three**: "Is the code clean? Is there error handling?"
→ **Defense**: FastAPI with proper error boundaries, environment variables for secrets, typed Pydantic models, loading/error/empty states in the UI, README with setup instructions.

### As a Competitor:

**Meridian**: Could be replicated with Mem0 + custom incident schema.
→ **Our advantage**: Hindsight's temporal queries and observation consolidation are built-in. With Mem0, you'd have to build temporal filtering and pattern detection yourself.

**Closeloop**: Could be built as a Gong plugin.
→ **Our advantage**: Gong is locked to its ecosystem. Closeloop works with any conversation source and builds cross-deal intelligence that Gong doesn't offer.

### Post Red-Team Revisions:

1. **All projects**: Ensure the Memory Explorer screen explicitly shows Hindsight's unique capabilities (temporal retrieval, entity graph, observations) — make the technology visible
2. **All projects**: Include confidence scores in every agent response
3. **All projects**: Prepare a "what if memory is wrong?" scenario and show the correction flow
4. **Closeloop**: Differentiate more aggressively from CRM — emphasize the AUTO-extraction and cross-deal pattern aspects
5. **Precursor**: Focus on the temporal sentiment trend as the unique visual — this is the one thing no other tool shows

---

## 19. Final Decision Framework

### Competitive Analysis Table

| Criterion | Meridian (Incident) | Closeloop (Sales) | Precursor (CS) |
|-----------|:-------------------:|:-----------------:|:--------------:|
| Real-world problem | High | High | Very High |
| Hindsight centrality | Very High | High | Very High |
| Innovation | High | Medium-High | High |
| Differentiation | Very High | Medium (from problem statement) | High |
| Technical depth | High | Medium-High | High |
| Feasibility | High | High | Medium-High |
| Demo potential | High | High | Very High |
| UI potential | High | High | Very High |
| Data availability | Very High | High | High |
| Reliability | High | High | Medium-High |
| Content potential | High | Very High | Very High |
| Portfolio value | Very High | High | Very High |
| Implementation risk | Low | Low | Medium |

### Decision Framework

**If your priority is impressing Microsoft engineers at the finale:**
→ Choose **Meridian** (Incident Response). Microsoft judges are likely engineers who personally understand the 2 AM on-call pain. Incident response is a universal engineering problem. The technical depth of memory-powered pattern matching across incidents will resonate with engineering evaluators. Highest differentiation since no previous Hindsight project targets this domain.

**If your priority is the strongest, most universally compelling demo:**
→ Choose **Precursor** (Customer Success). Everyone understands losing customers. The visual story (sentiment trend declining over months, invisible in any single interaction) is the most emotionally compelling. The portfolio dashboard with health indicators is the most visually polished option. Best "wow" moment when the agent predicts churn from pattern matching.

**If your priority is the safest, most reliable path to a working submission by September 29:**
→ Choose **Closeloop** (Deal Intelligence). Most straightforward architecture. Clearest scope. Problem statement explicitly uses a sales assistant as the "good example." Lowest implementation risk. However, slightly lower Innovation score because other teams may also pick sales from the problem statement examples.

**If your priority is maximum Innovation score (30% of judging):**
→ Choose **Meridian** or **Precursor**. Both target domains not listed as primary examples in the problem statement, and neither has been done in previous Hindsight hackathons. Meridian has a slight edge because SRE tooling is a hot space (incident.io raised $60M+ in 2025) and memory-powered incident response is genuinely novel.

**My strongest recommendation** is **Meridian** if you have engineering confidence, or **Precursor** if you want the most visually compelling demo. Closeloop is the safest choice but has the highest risk of other teams converging on the same idea.

---

## 20. Recommended Next Step

1. **Choose one project** based on the decision framework above
2. **Tell me your choice** — I will then build the complete project from architecture to deployment
3. **Before building**, we will:
   - Finalize the tech stack
   - Generate the synthetic dataset
   - Define the exact demo scenario
   - Set up the project structure

**Critical timeline reminders:**
- September 29 is the initial submission deadline (tomorrow)
- Top 60 teams are shortlisted
- October 3 is the Grand Finale at Microsoft Hyderabad (8:30 AM - 5:00 PM)
- Content deliverables (article + LinkedIn + video) are also required

The project must be submittable by September 29 with a working prototype. Polish can happen between shortlist announcement (October 1) and the finale (October 3).

**Do NOT start building until you have chosen.** Tell me which project you want and I will execute immediately.

---

*Research compiled from: Hindsight documentation (hindsight.vectorize.io), Hindsight GitHub (38.3k stars), Vectorize agent memory resources, 25+ academic papers on agent memory (2025-2026), analysis of 8 professional domains, competitive mapping of 30+ products, study of 3 previous Hindsight hackathon projects, Microsoft AI Agents Hackathon 2025 winners, GitLab AI Hackathon 2026, community-sourced hackathon strategy from Reddit/DEV/HackerNews, and HackwithHyderabad event history (Devnovate).*
