# PulseOps

An event-driven **incident intelligence platform**. PulseOps ingests logs, metrics and system events from distributed services, detects anomalies, groups related failures into incidents, and uses an LLM to explain each one: a summary, likely root causes and suggested fixes drawn from past incidents and runbooks.

> This is a learning project, built one step at a time. Each step is its own commit (or set of commits) and comes with a short note in [`docs/learning/`](docs/learning) explaining what was built and why.

## What it does

| Capability | Description |
|---|---|
| **Ingestion** | HTTP endpoints accept logs, metrics and events and publish them to a message broker |
| **Async processing** | Consumers validate, normalize and store events without blocking producers |
| **Anomaly detection** | Statistical detectors (z-score, EWMA, error-rate spikes) flag unusual behaviour |
| **Correlation** | Anomalies are grouped into incidents by time window, service dependencies and fingerprints |
| **Incident lifecycle** | `OPEN → ACKNOWLEDGED → INVESTIGATING → RESOLVED → CLOSED`, with a full timeline |
| **LLM analysis** | Claude writes a summary, probable root causes and remediation steps, using similar past incidents and runbooks (RAG) |
| **Real-time dashboard** | Live incident feed and service health over WebSockets |

## Architecture

```
 Services / Simulator
        │  HTTP (logs, metrics, events)
        ▼
 ┌──────────────┐   publish    ┌───────────────────────┐
 │ Ingestion API│ ───────────▶ │  Message broker       │
 └──────────────┘              │  (Kafka / Redpanda)   │
                               └──────────┬────────────┘
                                          │ consume
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
     ┌─────────────────┐       ┌────────────────────┐       ┌──────────────────┐
     │ Storage worker  │       │ Anomaly detector   │──────▶│ Correlation      │
     │ (Postgres)      │       │ (z-score / EWMA)   │       │ engine           │
     └─────────────────┘       └────────────────────┘       └────────┬─────────┘
                                                                     │ incident.created
                                                                     ▼
                         ┌──────────────────┐            ┌──────────────────────┐
                         │ LLM analyzer     │◀───────────│ Incident service     │
                         │ (Claude + RAG)   │            │ (lifecycle, timeline)│
                         └──────────────────┘            └──────────┬───────────┘
                                                                    │ WebSocket
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │ Dashboard (React)    │
                                                         └──────────────────────┘
```

## Tech stack

- **Backend:** NestJS + TypeScript
- **Broker:** Kafka API, run locally with Redpanda (a lighter single binary)
- **Database:** PostgreSQL via TypeORM, with pgvector for incident similarity search
- **Cache / locks:** Redis
- **LLM:** Claude API (Anthropic SDK)
- **Dashboard:** React + WebSockets (Socket.IO)
- **Infra:** Docker Compose

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
