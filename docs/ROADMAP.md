# Roadmap

Each step ends with working code, a learning note in `docs/learning/`, and a git push.

| # | Step | What you learn | Status |
|---|------|----------------|--------|
| 0 | Project setup: README, architecture, roadmap, git | How to plan a system before writing code | ✅ |
| 1 | NestJS scaffold, config module, `/health` endpoint, Docker Compose (Postgres, Redis, Redpanda) | NestJS modules, environment config, running infra locally | ✅ |
| 2 | Ingestion API for logs, metrics and events, with DTO validation | Designing event schemas, class-validator, API versioning | ✅ |
| 3 | Publish to Kafka; consumers store events in Postgres | Producers and consumers, topics, partitions, consumer groups, idempotency | ⬜ |
| 4 | Load simulator that fakes several services and injects failures | Building test traffic; chaos-style fault injection | ⬜ |
| 5 | Anomaly detection: error-rate spikes, latency z-score, EWMA | Time windows, rolling statistics, false-positive trade-offs | ⬜ |
| 6 | Incident correlation: time window + service dependency graph + fingerprinting | Grouping signals; dependency graphs; finding the upstream root service | ⬜ |
| 7 | Incident lifecycle: state machine, timeline, assignment | State machines, audit trails, domain events | ⬜ |
| 8 | LLM analysis with Claude: summary, root cause, remediation | Prompt design, structured output, cost and latency control | ⬜ |
| 9 | RAG: runbooks + past incidents in pgvector | Embeddings, similarity search, grounding LLM answers | ⬜ |
| 10 | Real-time dashboard: React + WebSockets | Pushing live updates, building the UI | ⬜ |
| 11 | Hardening: retries, dead-letter queue, tests, CI (GitHub Actions) | Reliability patterns, testing an async system | ⬜ |
| 12 | Go live: Dockerize the API, deploy API + dashboard + managed Postgres/Redis/Kafka, CD from GitHub | Dockerfiles, cloud deployment, secrets, domains/HTTPS | ⬜ |
