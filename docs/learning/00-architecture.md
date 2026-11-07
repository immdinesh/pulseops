# Step 0 — Thinking before coding

## The problem

In a microservice system, a single fault (say, the database slowing down) causes many symptoms at once:

- `orders-service` latency goes up
- `payments-service` starts timing out
- `api-gateway` returns 5xx errors
- 3,000 error log lines arrive in two minutes

An on-call engineer gets dozens of alerts and has to work out by hand that they all share **one cause**. PulseOps automates that work.

## Key concepts

### 1. Three kinds of telemetry
| Type | Example | Shape |
|------|---------|-------|
| **Log** | `ERROR payment timeout orderId=42` | Text + level + service + timestamp |
| **Metric** | `http_latency_ms = 870` | Number + name + tags + timestamp |
| **Event** | `deploy finished: orders v1.4.2` | Something that *happened* (deploy, restart, config change) |

Events matter more than they look: "what changed just before it broke?" is often the fastest way to the root cause.

### 2. Why event-driven?
If the ingestion API did everything itself (store → detect → correlate → call the LLM), each request would be slow, and a spike in traffic would take the API down.

Instead:
1. The API only **validates and publishes** to a broker (fast).
2. Separate **consumers** do the heavy work at their own pace.
3. If a consumer crashes, messages wait in the broker; nothing is lost.

This is **decoupling** (producers don't know who consumes) and **backpressure** (the broker absorbs bursts).

### 3. Anomaly vs incident
- **Anomaly**: one signal looks wrong ("orders latency is 4σ above normal").
- **Incident**: a group of related anomalies that share a cause, and what humans actually act on.

Correlation turns many anomalies into a few incidents.

### 4. Where the LLM fits (and where it doesn't)
The LLM does **not** detect problems; statistics do that more cheaply and reliably. The LLM is used *after* an incident is formed, to:
- summarize what is going on in plain English
- rank likely root causes using the correlated evidence
- suggest fixes, grounded in **runbooks** and **similar past incidents** (retrieval-augmented generation, or RAG)

## Exercise
Before Step 1, try to answer these. We'll come back to them.
1. If `payments` depends on `db`, and both show anomalies at the same time, which one is more likely the root cause? Why?
2. What could go wrong if the same Kafka message is processed twice?
3. Why might a fixed "latency > 500ms" alert be worse than a statistical one?
