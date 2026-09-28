"""Seed data: 20 incidents + 4 runbooks for Memento demo."""
from __future__ import annotations
import asyncio
import logging

from backend.hindsight_client import get_hindsight, get_bank_id

logger = logging.getLogger(__name__)

# ---------- RUNBOOKS ----------

RUNBOOKS = [
    {
        "id": "runbook-payment-503",
        "service": "payment-service",
        "error_pattern": "503 errors",
        "title": "Payment Service 503 Errors Runbook",
        "last_updated": "2026-04-10",
        "content": """## Runbook: Payment Service 503 Errors

**Last updated:** 2026-04-10 (after INC-001)

### Step 1 — Check payment-service pod health and restart if unhealthy (5 min)
Run `kubectl get pods -n payments`. If any pod shows CrashLoopBackOff or high restart count, delete the pod to trigger a fresh restart. Expected: pods return to Running state and 503s stop.

### Step 2 — Check Stripe API status page (2 min)
Visit status.stripe.com. If Stripe reports degraded performance, the 503s are upstream — notify the team and wait.

### Step 3 — Check recent deployments and rollback if needed (10 min)
Run `kubectl rollout history deployment/payment-service`. If a deployment occurred in the last 2 hours, roll back with `kubectl rollout undo`. Expected: previous version restores service.

### Step 4 — Check database connection pool (5 min)
Query payment-service metrics for active DB connections. If pool is exhausted, increase max_connections and restart.

### Step 5 — Escalate to payment team lead
If none of the above resolves the issue, page the payment team lead.""",
    },
    {
        "id": "runbook-auth-jwt",
        "service": "auth-gateway",
        "error_pattern": "JWT validation failures",
        "title": "Auth Gateway JWT Validation Failures Runbook",
        "last_updated": "2026-04-15",
        "content": """## Runbook: Auth Gateway JWT Validation Failures

**Last updated:** 2026-04-15

### Step 1 — Check auth-gateway logs for JWT error details (3 min)
Run `kubectl logs -l app=auth-gateway --tail=200`. Look for "token expired", "invalid signature", or "key not found" messages.

### Step 2 — Verify JWT signing key rotation (5 min)
Check if a key rotation occurred recently. If the new public key hasn't propagated to all auth-gateway replicas, perform a rolling restart.

### Step 3 — Check cache-cluster for session store health (3 min)
Auth-gateway stores session data in Redis. If cache-cluster is down, JWT validation that relies on cached session state will fail.

### Step 4 — Restart auth-gateway pods (5 min)
Rolling restart to pick up any config changes: `kubectl rollout restart deployment/auth-gateway`.

### Step 5 — Escalate to security team
If JWT failures persist, escalate — possible key compromise.""",
    },
    {
        "id": "runbook-cache-pool",
        "service": "cache-cluster",
        "error_pattern": "connection pool exhaustion",
        "title": "Cache Cluster Connection Pool Exhaustion Runbook",
        "last_updated": "2026-05-20",
        "content": """## Runbook: Cache Cluster Connection Pool Exhaustion

**Last updated:** 2026-05-20 (after INC-004)

### Step 1 — Check current connection count (2 min)
Run `redis-cli -h cache-cluster info clients`. Compare connected_clients against maxclients.

### Step 2 — Identify top connection consumers (5 min)
Check which services hold the most connections. Usually auth-gateway and payment-service are the heaviest consumers.

### Step 3 — Increase maxclients temporarily (3 min)
If approaching limit: `redis-cli -h cache-cluster config set maxclients <new_value>`. This is a temporary fix.

### Step 4 — Restart offending service to release stale connections (5 min)
If a specific service is leaking connections, restart its pods.

### Step 5 — Review connection pool settings in application configs
Long-term fix: reduce max pool size per service, add connection timeouts.""",
    },
    {
        "id": "runbook-userapi-slow",
        "service": "user-api",
        "error_pattern": "slow query timeouts",
        "title": "User API Slow Query Timeouts Runbook",
        "last_updated": "2026-09-15",
        "content": """## Runbook: User API Slow Query Timeouts

**Last updated:** 2026-09-15 (updated after INC-003, INC-010, INC-017)

### Step 1 — Check PostgreSQL slow query log (5 min)
Query pg_stat_activity for long-running queries. Kill any that exceed 30 seconds. Check for "idle in transaction" connections which may indicate deadlocks (see INC-010).

### Step 2 — Check for missing indexes (5 min)
Run EXPLAIN ANALYZE on the slow queries. Add indexes if sequential scans are found on large tables. New columns used in WHERE clauses frequently lack indexes after migrations (see INC-003).

### Step 3 — Check for N+1 query patterns (5 min)
Check per-endpoint query counts in monitoring. If a single request generates hundreds of individual SELECT queries, the code is likely loading related data individually instead of with a batch JOIN. Rewrite to use batch loading (see INC-017).

### Step 4 — Check for table bloat (3 min)
If tables haven't been vacuumed recently, run VACUUM ANALYZE.

### Step 5 — Check connection pool saturation and deadlocks (5 min)
If all connections are busy, check for deadlocked transactions in pg_stat_activity. Kill deadlocked transactions first, then consider increasing pool size. Configure statement_timeout to prevent unbounded queries (see INC-010).

### Step 6 — Restart user-api pods if needed
Rolling restart to clear any connection pool state, only after addressing root cause above.""",
    },
]

# ---------- 20 INCIDENTS ----------

INCIDENTS = [
    {
        "id": "INC-001",
        "timestamp": "2026-04-05T02:30:00Z",
        "content": """Incident Report — INC-001: Payment Service Timeout During Peak Hours
Service: payment-service | Severity: P2 | Category: resource-exhaustion
Started: 2026-04-05T02:30:00Z | Resolved: 2026-04-05T03:15:00Z
On-call: Sarah Chen

Symptoms: payment-service returning 504 Gateway Timeout errors during peak checkout hours. Error rate spiked from 0.1% to 12%. Customer complaints about failed payments.

Investigation:
1. [5 min] Checked payment-service pod health — all pods Running, no restarts. NOT USEFUL.
2. [3 min] Checked Stripe status — all green. NOT USEFUL.
3. [10 min] Checked recent deployments — deployment 2 hours ago increased connection pool size. USEFUL.
4. [8 min] Checked database connections — pool fully saturated at new higher limit, causing contention. USEFUL.
5. [7 min] Rolled back deployment — connection pool reverted to previous size. USEFUL.

Root cause: A deployment increased the database connection pool from 20 to 50 per pod. With 6 pods, this exceeded PostgreSQL's max_connections (200), causing connection contention and timeouts.

Resolution: Rolled back the deployment. Effective — resolved in 45 minutes total.

Contributing factors: No load testing of connection pool changes. Deployment during peak hours.
Affected services: payment-service, order-service (downstream)
Lessons learned: Connection pool changes must be load-tested. Deploy config changes during low-traffic windows.""",
        "tags": ["service:payment-service", "severity:P2", "category:resource-exhaustion"],
    },
    {
        "id": "INC-002",
        "timestamp": "2026-04-12T08:15:00Z",
        "content": """Incident Report — INC-002: Auth Gateway Session Invalidation Storm
Service: auth-gateway | Severity: P1 | Category: config-drift
Started: 2026-04-12T08:15:00Z | Resolved: 2026-04-12T09:00:00Z
On-call: Mike Rodriguez

Symptoms: Mass user logouts across all services. auth-gateway returning 401 Unauthorized for valid sessions. Login rate spiked 20x as users re-authenticated.

Investigation:
1. [3 min] Checked auth-gateway logs — "session not found" errors. USEFUL.
2. [5 min] Checked JWT signing keys — no rotation. NOT USEFUL.
3. [8 min] Checked cache-cluster — Redis node restarted 10 minutes before incident. USEFUL.
4. [5 min] Verified session data lost — cache-cluster had no persistence configured for session store. USEFUL.

Root cause: A cache-cluster Redis node restarted (OOM kill), and sessions were stored only in-memory with no persistence. All sessions on that shard were lost.

Resolution: Enabled Redis AOF persistence for the session keyspace. Effective — prevented recurrence. Recovery time: 45 minutes (users had to re-login).

Contributing factors: Redis configured without persistence for session data. No session replication across Redis nodes.
Affected services: auth-gateway, all downstream services requiring authentication
Lessons learned: Session stores MUST have persistence enabled. Redis cluster should replicate session data across nodes.""",
        "tags": ["service:auth-gateway", "severity:P1", "category:config-drift"],
    },
    {
        "id": "INC-003",
        "timestamp": "2026-04-20T14:00:00Z",
        "content": """Incident Report — INC-003: User API Slow Query Cascade
Service: user-api | Severity: P2 | Category: resource-exhaustion
Started: 2026-04-20T14:00:00Z | Resolved: 2026-04-20T14:45:00Z
On-call: Priya Patel

Symptoms: user-api response times increased from 50ms to 8 seconds. notification-service timing out on user lookups. Order creation failing.

Investigation:
1. [5 min] Checked PostgreSQL slow query log — found full table scan on users table. USEFUL.
2. [3 min] Checked recent schema migrations — new column added without index. USEFUL.
3. [10 min] Added missing index on users.email_verified column. USEFUL.
4. [2 min] Verified queries returned to normal speed. USEFUL.

Root cause: A migration added an email_verified boolean column to the users table (12M rows) without adding an index. A new feature querying WHERE email_verified = true caused full table scans.

Resolution: Added index on users.email_verified. Effective — resolved in 45 minutes.

Contributing factors: Migration review process didn't check for missing indexes. No query performance testing in staging.
Affected services: user-api, notification-service, order-service
Lessons learned: Every new column used in WHERE clauses needs an index review. Add query performance checks to CI.""",
        "tags": ["service:user-api", "severity:P2", "category:resource-exhaustion"],
    },
    {
        "id": "INC-004",
        "timestamp": "2026-05-03T03:00:00Z",
        "content": """Incident Report — INC-004: Payment Service 503 Cascade from Cache Cluster
Service: payment-service | Severity: P1 | Category: dependency-failure
Started: 2026-05-03T03:00:00Z | Resolved: 2026-05-03T03:40:00Z
On-call: Sarah Chen

Symptoms: payment-service returning 503 Service Unavailable. Checkout completely broken. Alert: "payment-service error rate > 50%".

Investigation:
1. [10 min] Checked payment-service pods and restarted them per runbook — pods restarted but 503s continued. NOT USEFUL — wasted time.
2. [5 min] Checked Stripe API — all green. NOT USEFUL.
3. [5 min] Checked recent deployments — none in 48 hours. NOT USEFUL.
4. [8 min] Noticed auth-gateway also returning errors — checked auth-gateway logs showing "connection refused" to cache-cluster. USEFUL.
5. [7 min] Checked cache-cluster — connection pool exhausted at 10,000 connections. maxclients limit reached. USEFUL.
6. [5 min] Increased cache-cluster maxclients from 10,000 to 15,000 and restarted leaking service. USEFUL.

Root cause: cache-cluster connection pool exhaustion. A background job in auth-gateway was leaking Redis connections (not closing them after use). When cache-cluster hit maxclients, auth-gateway couldn't validate sessions, causing auth failures that cascaded to payment-service as 503s.

Resolution: Increased maxclients temporarily, then fixed the connection leak in auth-gateway. Effective — resolved in 40 minutes.

CRITICAL LEARNING: The payment-service runbook says to restart payment-service first for 503 errors. This was WRONG for this incident — the root cause was upstream in cache-cluster, and restarting payment-service wasted 10 minutes. The correct first step should have been checking upstream dependencies (auth-gateway and cache-cluster).

Contributing factors: No connection pool monitoring alerts. Runbook doesn't cover upstream dependency failures.
Affected services: payment-service, auth-gateway, order-service, notification-service
Lessons learned: For payment-service 503s, check upstream dependencies (especially cache-cluster) BEFORE restarting payment-service. Add connection pool monitoring to cache-cluster.""",
        "tags": ["service:payment-service", "severity:P1", "category:dependency-failure"],
    },
    {
        "id": "INC-005",
        "timestamp": "2026-05-10T16:30:00Z",
        "content": """Incident Report — INC-005: Notification Service Email Delivery Failure
Service: notification-service | Severity: P3 | Category: config-drift
Started: 2026-05-10T16:30:00Z | Resolved: 2026-05-10T17:00:00Z
On-call: Alex Kim

Symptoms: Email notifications not being delivered. No errors in notification-service logs — emails appearing to send successfully but not arriving.

Investigation:
1. [5 min] Checked notification-service logs — all sends reported success. NOT USEFUL initially.
2. [8 min] Checked email provider dashboard — API key had been rotated but env var not updated. USEFUL.
3. [2 min] Updated email provider API key in secrets. USEFUL.

Root cause: Email provider API key was rotated as part of security policy, but the new key wasn't propagated to the notification-service environment. The provider returned 200 OK for sends with the old key but silently dropped them.

Resolution: Updated API key. Effective — resolved in 30 minutes. Resent failed notifications.

Contributing factors: No alerting on actual email delivery success (only API call success). Secret rotation process doesn't verify consumer services.
Affected services: notification-service
Lessons learned: Monitor end-to-end delivery, not just API response codes. Secret rotation process must include verification step.""",
        "tags": ["service:notification-service", "severity:P3", "category:config-drift"],
    },
    {
        "id": "INC-006",
        "timestamp": "2026-05-18T22:00:00Z",
        "content": """Incident Report — INC-006: Cache Cluster OOM Kill
Service: cache-cluster | Severity: P1 | Category: resource-exhaustion
Started: 2026-05-18T22:00:00Z | Resolved: 2026-05-18T22:30:00Z
On-call: Mike Rodriguez

Symptoms: Multiple services reporting connection errors to Redis. cache-cluster node killed by OOM killer. auth-gateway sessions lost again.

Investigation:
1. [3 min] Checked cache-cluster pods — one node OOMKilled. USEFUL.
2. [5 min] Checked memory usage — node was at 98% before kill. A large sorted set grew unbounded. USEFUL.
3. [5 min] Identified the sorted set — analytics-events key with 50M entries, no TTL. USEFUL.
4. [3 min] Deleted the oversized key and set maxmemory-policy to allkeys-lru. USEFUL.

Root cause: An analytics feature was writing events to a Redis sorted set without TTL or size limits. The key grew to consume 6GB of the 8GB Redis node, triggering OOM kill.

Resolution: Deleted the oversized key, configured maxmemory-policy, added TTL to analytics keys. Effective — resolved in 30 minutes.

Contributing factors: No memory usage alerts per key. No maxmemory-policy configured (default noeviction).
Affected services: cache-cluster, auth-gateway (sessions lost), payment-service, order-service
Lessons learned: All Redis keys MUST have TTL or be covered by eviction policy. Monitor per-key memory usage. Set maxmemory-policy to allkeys-lru.""",
        "tags": ["service:cache-cluster", "severity:P1", "category:resource-exhaustion"],
    },
    {
        "id": "INC-007",
        "timestamp": "2026-05-25T11:00:00Z",
        "content": """Incident Report — INC-007: Order Service Crash Loop After Deployment
Service: order-service | Severity: P2 | Category: config-drift
Started: 2026-05-25T11:00:00Z | Resolved: 2026-05-25T11:30:00Z
On-call: Priya Patel

Symptoms: order-service pods in CrashLoopBackOff after deployment. New orders failing. Existing orders stuck in processing.

Investigation:
1. [3 min] Checked pod logs — "FATAL: missing required env var ORDER_QUEUE_URL". USEFUL.
2. [5 min] Checked deployment manifest — new version requires ORDER_QUEUE_URL but it wasn't in the ConfigMap. USEFUL.
3. [3 min] Added missing env var to ConfigMap and redeployed. USEFUL.

Root cause: New order-service version added a required environment variable for a message queue, but the deployment manifest wasn't updated to include it. The app crashed on startup.

Resolution: Added missing env var. Effective — resolved in 30 minutes.

Contributing factors: No validation of required env vars before deployment. No staging environment test.
Affected services: order-service, payment-service (orders not completing)
Lessons learned: App should validate env vars on startup with clear error messages. Deployment pipeline should check for new required env vars.""",
        "tags": ["service:order-service", "severity:P2", "category:config-drift"],
    },
    {
        "id": "INC-008",
        "timestamp": "2026-06-07T01:00:00Z",
        "content": """Incident Report — INC-008: Payment Service 503 — Cache Cluster Cascade Again
Service: payment-service | Severity: P1 | Category: dependency-failure
Started: 2026-06-07T01:00:00Z | Resolved: 2026-06-07T01:12:00Z
On-call: Sarah Chen

Symptoms: payment-service returning 503 errors. Same alert pattern as INC-004.

Investigation:
1. [2 min] SKIPPED restarting payment-service — recalled INC-004 where restart wasted 10 minutes. Instead, immediately checked cache-cluster. USEFUL — saved significant time.
2. [3 min] Checked cache-cluster connections — at 9,800 / 10,000 maxclients. USEFUL.
3. [2 min] Identified source — auth-gateway background job connection leak was back (fix from INC-004 was reverted in a deployment). USEFUL.
4. [5 min] Re-applied the connection leak fix and restarted auth-gateway. USEFUL.

Root cause: Same as INC-004 — auth-gateway connection leak to cache-cluster causing cascade. The fix from INC-004 was accidentally reverted in a subsequent deployment.

Resolution: Re-applied connection leak fix, added regression test. Effective — resolved in 12 minutes (vs 40 minutes for INC-004).

CRITICAL LEARNING: By remembering INC-004, the on-call engineer skipped the useless "restart payment-service" step and went directly to cache-cluster. This cut resolution time from 40 minutes to 12 minutes. The runbook for payment-service 503s is still wrong — it still says restart payment-service first.

Contributing factors: Fix from INC-004 was reverted without tests catching it. Runbook not updated after INC-004.
Affected services: payment-service, auth-gateway, order-service
Lessons learned: Incident fixes need regression tests. Runbook must be updated: for payment-service 503s, check cache-cluster and auth-gateway FIRST.""",
        "tags": ["service:payment-service", "severity:P1", "category:dependency-failure"],
    },
    {
        "id": "INC-009",
        "timestamp": "2026-06-15T09:30:00Z",
        "content": """Incident Report — INC-009: Auth Gateway Memory Leak
Service: auth-gateway | Severity: P2 | Category: resource-exhaustion
Started: 2026-06-15T09:30:00Z | Resolved: 2026-06-15T10:15:00Z
On-call: Alex Kim

Symptoms: auth-gateway response times gradually increasing over 3 days. Memory usage climbing steadily. Pods not crashing yet but approaching limits.

Investigation:
1. [5 min] Checked auth-gateway metrics — memory increasing linearly, 80% of limit. USEFUL.
2. [10 min] Profiled memory — JWT verification caching not evicting expired entries. USEFUL.
3. [8 min] Added TTL-based eviction to JWT cache. USEFUL.
4. [5 min] Rolling restart to apply fix and free memory. USEFUL.

Root cause: JWT token verification results were being cached without TTL. As tokens were verified and expired, the cache grew unbounded.

Resolution: Added TTL eviction to JWT cache (match token expiry). Effective — resolved in 45 minutes.

Contributing factors: No memory trend alerting. Cache implementation lacked eviction.
Affected services: auth-gateway
Lessons learned: All in-memory caches MUST have TTL or size-based eviction. Add memory trend alerts.""",
        "tags": ["service:auth-gateway", "severity:P2", "category:resource-exhaustion"],
    },
    {
        "id": "INC-010",
        "timestamp": "2026-06-22T19:00:00Z",
        "content": """Incident Report — INC-010: User API Connection Pool Deadlock
Service: user-api | Severity: P1 | Category: resource-exhaustion
Started: 2026-06-22T19:00:00Z | Resolved: 2026-06-22T19:30:00Z
On-call: Priya Patel

Symptoms: user-api completely unresponsive. All requests timing out. Health checks failing. Pods showing Running but not serving traffic.

Investigation:
1. [5 min] Checked PostgreSQL — all connections in "idle in transaction" state. USEFUL.
2. [5 min] Thread dump of user-api — deadlock between two transactions. USEFUL.
3. [3 min] Killed the deadlocked transactions in PostgreSQL. USEFUL.
4. [5 min] Restarted user-api pods to clear connection pool state. USEFUL.

Root cause: A rare race condition in the user profile update code caused two transactions to deadlock. All connection pool slots were eventually consumed by requests waiting on the deadlocked transactions.

Resolution: Killed deadlocked transactions, restarted pods, added statement_timeout to PostgreSQL config. Effective — resolved in 30 minutes.

Contributing factors: No statement_timeout configured. Connection pool didn't have a max wait time.
Affected services: user-api, notification-service, order-service
Lessons learned: Configure statement_timeout in PostgreSQL. Set connection pool max wait times. Add deadlock detection monitoring.""",
        "tags": ["service:user-api", "severity:P1", "category:resource-exhaustion"],
    },
    {
        "id": "INC-011",
        "timestamp": "2026-07-05T15:00:00Z",
        "content": """Incident Report — INC-011: Payment Service 503 — Stripe API Outage
Service: payment-service | Severity: P1 | Category: dependency-failure
Started: 2026-07-05T15:00:00Z | Resolved: 2026-07-05T16:30:00Z
On-call: Mike Rodriguez

Symptoms: payment-service returning 503 errors. Same alert as INC-004 and INC-008.

Investigation:
1. [3 min] Checked cache-cluster first (learning from INC-004/INC-008) — connections normal, health green. NOT USEFUL — this time was different.
2. [2 min] Checked Stripe API status page — Stripe reporting major outage. USEFUL.
3. [5 min] Confirmed payment-service was correctly returning 503 because Stripe was down. USEFUL.
4. [60 min] Waited for Stripe recovery. Monitored.

Root cause: Stripe API experienced a major outage affecting all payment processing. This was NOT a cache-cluster cascade — it was a direct dependency failure.

Resolution: Waited for Stripe recovery. Added circuit breaker for Stripe calls to return friendly error messages instead of raw 503s. Resolved in 90 minutes (Stripe recovery time).

IMPORTANT: This incident shows that payment-service 503s are NOT always caused by cache-cluster cascade. In INC-004 and INC-008, the root cause was cache-cluster. In INC-011, it was a genuine Stripe outage. Engineers must check BOTH upstream dependencies AND direct dependencies.

Contributing factors: No circuit breaker for Stripe API calls. 503 error didn't distinguish between upstream and direct failures.
Affected services: payment-service, order-service
Lessons learned: Not all payment-service 503s are cache-cluster cascades. Check cache-cluster AND Stripe. Add circuit breakers for external API calls. Error messages should indicate which dependency failed.""",
        "tags": ["service:payment-service", "severity:P1", "category:dependency-failure"],
    },
    {
        "id": "INC-012",
        "timestamp": "2026-07-14T06:00:00Z",
        "content": """Incident Report — INC-012: Notification Service Queue Backup
Service: notification-service | Severity: P3 | Category: resource-exhaustion
Started: 2026-07-14T06:00:00Z | Resolved: 2026-07-14T07:00:00Z
On-call: Alex Kim

Symptoms: Notifications delayed by 2+ hours. Queue depth growing. No failures, just slow processing.

Investigation:
1. [5 min] Checked queue metrics — 500K messages queued, processing rate dropped to 10/sec (normally 500/sec). USEFUL.
2. [10 min] Checked notification-service logs — rate limited by email provider at 10 req/sec. USEFUL.
3. [5 min] Contacted email provider — account flagged for spam due to a burst of marketing emails. USEFUL.
4. [10 min] Got rate limit lifted, flushed queue. USEFUL.

Root cause: Marketing team triggered a bulk email campaign through the same notification pipeline. Email provider detected the spike as spam-like behavior and throttled the account to 10 req/sec.

Resolution: Got rate limit lifted, implemented separate marketing email pipeline. Effective — resolved in 1 hour.

Contributing factors: Marketing and transactional emails shared the same pipeline. No queue depth alerting.
Affected services: notification-service
Lessons learned: Separate marketing from transactional email pipelines. Add queue depth alerts. Pre-warm email provider before campaigns.""",
        "tags": ["service:notification-service", "severity:P3", "category:resource-exhaustion"],
    },
    {
        "id": "INC-013",
        "timestamp": "2026-07-28T13:00:00Z",
        "content": """Incident Report — INC-013: Auth Gateway Certificate Expiry
Service: auth-gateway | Severity: P1 | Category: config-drift
Started: 2026-07-28T13:00:00Z | Resolved: 2026-07-28T13:20:00Z
On-call: Sarah Chen

Symptoms: All HTTPS requests to auth-gateway failing with TLS errors. Browser showing "certificate expired". All services behind auth-gateway affected.

Investigation:
1. [2 min] Checked TLS certificate — expired 1 hour ago. USEFUL.
2. [8 min] Renewed certificate using cert-manager and reloaded ingress. USEFUL.
3. [3 min] Verified all services restored. USEFUL.

Root cause: TLS certificate for auth-gateway expired. cert-manager auto-renewal had been misconfigured (pointed to wrong DNS challenge endpoint) and silently failed.

Resolution: Manually renewed certificate, fixed cert-manager config. Effective — resolved in 20 minutes.

Contributing factors: cert-manager failure was silent. No certificate expiry alerting. No pre-expiry warning.
Affected services: All services behind auth-gateway
Lessons learned: Monitor certificate expiry with alerts at 30, 7, and 1 day before expiry. Verify cert-manager renewal actually works periodically.""",
        "tags": ["service:auth-gateway", "severity:P1", "category:config-drift"],
    },
    {
        "id": "INC-014",
        "timestamp": "2026-08-10T04:00:00Z",
        "content": """Incident Report — INC-014: Payment Service 503 — Cache Cluster Cascade Third Time
Service: payment-service | Severity: P2 | Category: dependency-failure
Started: 2026-08-10T04:00:00Z | Resolved: 2026-08-10T04:15:00Z
On-call: Priya Patel

Symptoms: payment-service returning 503 errors. Same pattern as INC-004 and INC-008.

Investigation:
1. [2 min] Immediately checked cache-cluster (known pattern from INC-004 and INC-008) — connections at 9,500 / 10,000. USEFUL.
2. [3 min] Identified source — a new microservice (inventory-checker) was opening connections to cache-cluster without connection pooling. USEFUL.
3. [5 min] Rate-limited inventory-checker's Redis access and restarted it with connection pooling enabled. USEFUL.

Root cause: Same cascade pattern as INC-004 and INC-008: cache-cluster connection pool exhaustion cascading through auth-gateway to payment-service. This time caused by a new inventory-checker microservice that was directly connecting to Redis without connection pooling.

Resolution: Added connection pooling to inventory-checker, set per-service connection limits on cache-cluster. Effective — resolved in 15 minutes.

PATTERN CONFIRMED: This is the THIRD time payment-service 503s were caused by cache-cluster connection pool exhaustion (INC-004, INC-008, INC-014). The runbook STILL says to restart payment-service first, which has been wrong in 3 out of 4 payment-service 503 incidents. Only INC-011 (Stripe outage) was a direct payment-service issue.

Contributing factors: No per-service connection limits on cache-cluster. New services can connect without review.
Affected services: payment-service, auth-gateway, order-service
Lessons learned: Enforce per-service connection limits on cache-cluster. All new services connecting to Redis need connection pooling review. The payment-service 503 runbook MUST be updated — check cache-cluster first.""",
        "tags": ["service:payment-service", "severity:P2", "category:dependency-failure"],
    },
    {
        "id": "INC-015",
        "timestamp": "2026-08-18T20:00:00Z",
        "content": """Incident Report — INC-015: Order Service Data Inconsistency
Service: order-service | Severity: P2 | Category: connectivity
Started: 2026-08-18T20:00:00Z | Resolved: 2026-08-18T21:00:00Z
On-call: Mike Rodriguez

Symptoms: Customers receiving "order confirmed" but payment not processed. order-service showing orders as complete, payment-service showing no record.

Investigation:
1. [5 min] Checked order-service logs — orders marked complete after sending to payment queue. USEFUL.
2. [10 min] Checked message queue — messages delivered but payment-service consumer lagging. USEFUL.
3. [8 min] Payment-service consumer was stuck on a poison message — malformed order caused deserialization error in a loop. USEFUL.
4. [5 min] Dead-lettered the poison message and restarted consumer. USEFUL.

Root cause: A malformed order (special characters in product name) caused a deserialization error in the payment-service consumer. The consumer retried the same message infinitely, blocking all subsequent orders.

Resolution: Dead-lettered the poison message, added error handling for malformed messages. Effective — resolved in 1 hour.

Contributing factors: No dead-letter queue configured. Consumer had no max retry limit. No input validation on order creation.
Affected services: order-service, payment-service
Lessons learned: Configure dead-letter queues with max retry limits. Add input validation at order creation. Consumer must handle deserialization failures gracefully.""",
        "tags": ["service:order-service", "severity:P2", "category:connectivity"],
    },
    {
        "id": "INC-016",
        "timestamp": "2026-08-25T10:00:00Z",
        "content": """Incident Report — INC-016: Cache Cluster Split Brain
Service: cache-cluster | Severity: P1 | Category: connectivity
Started: 2026-08-25T10:00:00Z | Resolved: 2026-08-25T10:45:00Z
On-call: Alex Kim

Symptoms: Intermittent auth failures — some requests succeed, others fail. Users randomly logged in and out. Data inconsistency across requests.

Investigation:
1. [5 min] Checked cache-cluster — two Redis nodes both claiming to be primary. Split brain. USEFUL.
2. [10 min] Checked network — brief network partition between AZ-1 and AZ-2 had resolved, but Redis Sentinel promoted a new primary during the partition. USEFUL.
3. [5 min] Manually failed over to the correct primary and synced data. USEFUL.
4. [10 min] Verified data consistency restored. USEFUL.

Root cause: A brief network partition between availability zones caused Redis Sentinel to promote a new primary. When the partition healed, both nodes accepted writes, creating split brain.

Resolution: Manual failover to correct primary, configured Sentinel with higher quorum requirement. Effective — resolved in 45 minutes.

Contributing factors: Redis Sentinel quorum too low (1 out of 3). No split brain detection alerting.
Affected services: cache-cluster, auth-gateway, payment-service
Lessons learned: Set Sentinel quorum to majority (2 out of 3). Add split brain detection. Consider Redis Cluster mode instead of Sentinel.""",
        "tags": ["service:cache-cluster", "severity:P1", "category:connectivity"],
    },
    {
        "id": "INC-017",
        "timestamp": "2026-09-02T07:00:00Z",
        "content": """Incident Report — INC-017: User API N+1 Query Regression
Service: user-api | Severity: P3 | Category: resource-exhaustion
Started: 2026-09-02T07:00:00Z | Resolved: 2026-09-02T08:00:00Z
On-call: Priya Patel

Symptoms: user-api response times for /users/list endpoint went from 200ms to 15 seconds after a deployment. No errors, just slow.

Investigation:
1. [5 min] Checked slow query log — hundreds of individual SELECT queries per request. USEFUL.
2. [5 min] Checked the deployment diff — new feature loading user preferences individually instead of batch. USEFUL.
3. [10 min] Rewrote query to use JOIN and batch loading. USEFUL.

Root cause: New feature introduced an N+1 query pattern — loading each user's preferences in a separate query instead of a batch JOIN. For a list of 100 users, this generated 101 queries per request.

Resolution: Rewrote to batch JOIN query. Effective — resolved in 1 hour.

Contributing factors: No query count monitoring per endpoint. Code review missed the N+1 pattern.
Affected services: user-api
Lessons learned: Add per-endpoint query count monitoring. Flag N+1 patterns in code review checklist.""",
        "tags": ["service:user-api", "severity:P3", "category:resource-exhaustion"],
    },
    {
        "id": "INC-018",
        "timestamp": "2026-09-10T16:00:00Z",
        "content": """Incident Report — INC-018: Auth Gateway Rate Limiter Misconfiguration
Service: auth-gateway | Severity: P2 | Category: config-drift
Started: 2026-09-10T16:00:00Z | Resolved: 2026-09-10T16:30:00Z
On-call: Sarah Chen

Symptoms: Legitimate users getting 429 Too Many Requests from auth-gateway. Login success rate dropped to 30%.

Investigation:
1. [3 min] Checked rate limiter config — limit set to 5 req/min per IP instead of 50 req/min. USEFUL.
2. [5 min] Checked config history — a security hardening PR changed the default from 50 to 5, meant for the admin API only but applied globally. USEFUL.
3. [3 min] Corrected rate limit to 50 req/min for user-facing endpoints, kept 5 for admin. USEFUL.

Root cause: A security hardening change reduced the rate limit from 50 to 5 requests per minute, but was applied to all endpoints instead of just the admin API.

Resolution: Restored correct rate limits per endpoint type. Effective — resolved in 30 minutes.

Contributing factors: Rate limit config was a single global value. No per-endpoint override. Change wasn't tested against normal traffic patterns.
Affected services: auth-gateway, all services requiring authentication
Lessons learned: Rate limit configuration should be per-endpoint or per-API-group. Load test security changes against production traffic patterns.""",
        "tags": ["service:auth-gateway", "severity:P2", "category:config-drift"],
    },
    {
        "id": "INC-019",
        "timestamp": "2026-09-18T12:00:00Z",
        "content": """Incident Report — INC-019: Notification Service Memory Leak from Template Rendering
Service: notification-service | Severity: P3 | Category: resource-exhaustion
Started: 2026-09-18T12:00:00Z | Resolved: 2026-09-18T13:00:00Z
On-call: Mike Rodriguez

Symptoms: notification-service memory usage climbing over 3 days. Approaching pod memory limit. No performance impact yet.

Investigation:
1. [5 min] Confirmed memory trend — linear increase, 85% of limit. USEFUL.
2. [10 min] Profiled memory — email template engine caching compiled templates without eviction. USEFUL.
3. [8 min] Added LRU eviction to template cache with max 500 entries. USEFUL.
4. [5 min] Restarted pods to reclaim memory. USEFUL.

Root cause: Email template rendering engine was caching compiled templates indefinitely. With personalization tokens creating unique template keys, the cache grew without bound.

Resolution: Added LRU eviction to template cache. Effective — resolved in 1 hour.

Contributing factors: Template cache had no size limit. Personalization created unique cache keys for each recipient.
Affected services: notification-service
Lessons learned: All caches must have eviction policies. Audit caches for unbounded growth patterns. Similar to INC-009 (auth-gateway JWT cache) — this is a recurring anti-pattern.""",
        "tags": ["service:notification-service", "severity:P3", "category:resource-exhaustion"],
    },
    {
        "id": "INC-020",
        "timestamp": "2026-09-25T02:00:00Z",
        "content": """Incident Report — INC-020: Order Service Cascading Timeout
Service: order-service | Severity: P2 | Category: dependency-failure
Started: 2026-09-25T02:00:00Z | Resolved: 2026-09-25T02:30:00Z
On-call: Alex Kim

Symptoms: Order creation timing out. order-service health checks passing but all create-order requests failing with 504.

Investigation:
1. [3 min] Checked order-service logs — timeout waiting for payment-service response. USEFUL.
2. [3 min] Checked payment-service — healthy, responding normally to direct calls. USEFUL.
3. [5 min] Checked network — intermittent DNS resolution failures for payment-service.internal. USEFUL.
4. [5 min] CoreDNS pod was in a degraded state — restarted it. USEFUL.
5. [3 min] Verified DNS resolution restored and orders flowing. USEFUL.

Root cause: CoreDNS pod was in a degraded state, causing intermittent DNS resolution failures. order-service couldn't reliably resolve payment-service.internal, causing timeouts on a subset of requests.

Resolution: Restarted CoreDNS, added DNS-level health checks. Effective — resolved in 30 minutes.

Contributing factors: No DNS resolution monitoring. order-service had no DNS caching or fallback.
Affected services: order-service, payment-service (indirectly — order-service couldn't reach it)
Lessons learned: Monitor DNS resolution health. Add local DNS caching in services. Configure client-side DNS retry with exponential backoff.""",
        "tags": ["service:order-service", "severity:P2", "category:dependency-failure"],
    },
]


def _format_runbook_for_retention(runbook: dict) -> dict:
    return {
        "content": runbook["content"],
        "context": "runbook",
        "document_id": runbook["id"],
        "tags": ["runbook:true", f"service:{runbook['service']}"],
        "metadata": {"source": "runbook", "service": runbook["service"], "error_pattern": runbook["error_pattern"]},
        "timestamp": f"{runbook['last_updated']}T00:00:00Z",
    }


def _format_incident_for_retention(incident: dict) -> dict:
    return {
        "content": incident["content"],
        "context": "incident-report",
        "document_id": f"incident-{incident['id']}",
        "tags": incident["tags"],
        "metadata": {"source": "incident-report", "incident_id": incident["id"]},
        "timestamp": incident["timestamp"],
    }


async def run_seed() -> dict:
    hs = get_hindsight()
    bank = get_bank_id()

    try:
        await hs.acreate_bank(
            bank_id=bank,
            name="Memento Incident Intelligence",
            mission=(
                "Extract production incident details: services affected, error symptoms, "
                "investigation steps taken and whether each step was useful or wasted time, "
                "root causes discovered, resolution actions and their effectiveness, "
                "deployment changes that caused or contributed to incidents, "
                "service dependency chains and cascade patterns, "
                "and lessons learned from each incident. "
                "Pay special attention to cases where runbook guidance was followed but proved wrong, "
                "and cases where engineers deviated from the runbook successfully. "
                "Track which investigation steps were useful vs wasteful. "
                "Ignore conversational filler and generic advice not backed by specific incident experience."
            ),
            disposition={"skepticism": 4, "literalism": 4, "empathy": 1},
        )
        logger.info("Bank %s created", bank)
    except Exception as e:
        logger.info("Bank may already exist: %s", e)

    retained = 0
    errors = 0

    for rb in RUNBOOKS:
        try:
            data = _format_runbook_for_retention(rb)
            await hs.aretain(bank_id=bank, retain_async=False, **data)
            retained += 1
            logger.info("Retained runbook: %s", rb["id"])
            await asyncio.sleep(2)
        except Exception as e:
            logger.error("Failed to retain runbook %s: %s", rb["id"], e)
            errors += 1

    for inc in INCIDENTS:
        try:
            data = _format_incident_for_retention(inc)
            await hs.aretain(bank_id=bank, retain_async=False, **data)
            retained += 1
            logger.info("Retained incident: %s", inc["id"])
            await asyncio.sleep(2)
        except Exception as e:
            logger.error("Failed to retain incident %s: %s", inc["id"], e)
            errors += 1

    return {
        "status": "complete",
        "retained": retained,
        "errors": errors,
        "total": len(RUNBOOKS) + len(INCIDENTS),
        "message": f"Seeded {retained} memories ({len(RUNBOOKS)} runbooks + {len(INCIDENTS)} incidents). Waiting for observation consolidation...",
    }


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO)
    result = asyncio.run(run_seed())
    print(result)
