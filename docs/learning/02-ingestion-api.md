# Step 2: Ingestion API

## Goal
Give services a way to send us telemetry over HTTP:

| Endpoint | Accepts |
|---|---|
| `POST /api/v1/ingest/logs` | `{ "logs": [ ... ] }` |
| `POST /api/v1/ingest/metrics` | `{ "metrics": [ ... ] }` |
| `POST /api/v1/ingest/events` | `{ "events": [ ... ] }` |

Each request is **validated**, **normalized** into one standard shape (an *envelope*), and handed to a **publisher**. In this step the publisher only prints to the console. In Step 3 it sends to Kafka.

```
HTTP request
   │
   ▼
ValidationPipe ──❌──▶ 400 Bad Request (handler never runs)
   │ ✅
   ▼
IngestionController   (HTTP only: route, status code)
   │
   ▼
IngestionService      (DTO ➜ TelemetryEnvelope)
   │
   ▼
TelemetryPublisher    (today: print to console · Step 3: Kafka)
   │
   ▼
202 Accepted  { "accepted": 2, "ids": ["…", "…"] }
```

---

## Concepts

### 1. Designing the data: logs, metrics, events
Each kind has its own shape because each answers a different question:

| Kind | Answers | Key fields |
|---|---|---|
| **Log** | "What did the code say?" | `level`, `message`, `traceId` |
| **Metric** | "How much / how fast?" | `name`, `value` (a number), `tags` |
| **Event** | "What changed?" | `type` (deploy, restart, …), `title` |

**`service` is required on everything.** Correlation (Step 6) is mostly about *which services* are failing together, so every signal must say where it came from.

**`traceId`** links the logs from different services that belong to the *same user request*. If `orders-service` and `payments-service` both log `trace-abc-123`, we know they're part of one chain.

### 2. The envelope: one shape for everything
After validation, every item becomes a `TelemetryEnvelope` ([common/telemetry.types.ts](../../api/src/common/telemetry.types.ts)):
```json
{
  "id": "6f1c…",                          // our UUID
  "kind": "log",                          // log | metric | event
  "service": "payments-service",
  "occurredAt": "2026-11-09T10:15:00.000Z",
  "receivedAt": "2026-11-09T10:15:01.234Z",
  "payload": { "level": "error", "message": "…" }   // depends on kind
}
```
Why bother?
- Downstream code (storage, anomaly detection) reads **one** format with a common header.
- **`id`**: we assign it, so later we can detect duplicates if a message is processed twice.
- **Two timestamps.** `occurredAt` uses the *sender's* clock, and `receivedAt` uses *ours*. Clocks on different servers drift, and a big gap between the two can mean a delayed or buffered sender. Both are normalized to UTC (`...Z`). A timestamp like `+05:30` becomes UTC, so all times can be compared.

**Discriminated union:** `TelemetryEnvelope` is `LogEnvelope | MetricEnvelope | SystemEventEnvelope`. When code checks `if (env.kind === 'metric')`, TypeScript *knows* `env.payload.value` exists. That's type safety for free.

### 3. DTOs + ValidationPipe: never trust input
A **DTO** (Data Transfer Object) is a class that describes what a request body must look like, using decorators from `class-validator`:
```ts
@IsEnum(LogLevel)  level!: LogLevel;      // must be debug|info|warn|error|fatal
@MaxLength(10_000) message!: string;      // no 50 MB log lines
```
The global `ValidationPipe` (in `main.ts`) checks every request **before** your handler runs:

| Option | What it does | Why |
|---|---|---|
| `whitelist: true` | Strips fields not declared in the DTO | Clients can't sneak in fields you didn't plan for |
| `forbidNonWhitelisted: true` | …and rejects the request instead of silently stripping | Senders learn about their mistakes immediately |
| `transform: true` | Turns plain JSON into real DTO class instances | Needed for nested validation |

**Nested arrays** need two decorators working together:
```ts
@ValidateNested({ each: true })  // validate each item…
@Type(() => LogDto)              // …as a LogDto (class-transformer creates LogDto objects)
logs!: LogDto[];
```
Without `@Type`, the items stay plain objects and their rules are silently **skipped**. This is a common bug.

**DTO inheritance:** `LogDto extends TelemetryBaseDto`, so the `service` and `timestamp` rules are written once and apply to all three.

### 4. Batching and limits
Sending one HTTP request per log line would be slow (each request has overhead). So clients send **batches**. But unlimited batches are dangerous, so we set two limits:
- **500 items per batch** (`@ArrayMaxSize`), rejected with 400
- **1 MB per request body** (`useBodyParser` in `main.ts`), rejected with **413 Payload Too Large**

Every production ingestion API has limits like these. Without them, one bad client can take the API down.

### 5. 202 Accepted vs 201 Created
- **201 Created:** "Done. The thing exists now."
- **202 Accepted:** "Got it, I'll process it **later**."

Our API only *queues* the data; storage and analysis happen asynchronously. So 202 is the honest answer. That's the core idea of an event-driven system: **accept fast, process later.**

### 6. Depending on an abstraction (`TelemetryPublisher`)
`IngestionService` asks for a `TelemetryPublisher`, an **abstract class** describing *what* (`publish(envelopes)`), not *how*. The module decides which real class to give it:
```ts
{ provide: TelemetryPublisher, useClass: LoggingTelemetryPublisher }  // Step 2
{ provide: TelemetryPublisher, useClass: KafkaTelemetryPublisher }    // Step 3
```
Swapping the implementation changes **one line**; the service and controller stay untouched. In tests you can plug in a fake publisher too.

*Why an abstract class and not an `interface`?* TypeScript interfaces vanish when compiled to JavaScript, so Nest would have nothing to use as the lookup key. An abstract class exists at runtime.

### 7. Layers and their jobs
| Layer | Knows about | Doesn't know about |
|---|---|---|
| Controller | HTTP: routes, status codes, body | Envelopes, Kafka |
| Service | Business rules: DTO ➜ envelope | HTTP, Kafka |
| Publisher | Where envelopes go | HTTP, DTOs |

Each layer can change without breaking the others.

---

## Code walkthrough
| File | What it does |
|---|---|
| `api/src/common/telemetry.types.ts` | Enums (`LogLevel`, `SystemEventType`) + envelope types, shared by future modules |
| `api/src/ingestion/ingestion.constants.ts` | Batch limit, service name and metric name patterns |
| `api/src/ingestion/dto/telemetry-base.dto.ts` | `service` + `timestamp` rules, shared by all DTOs |
| `api/src/ingestion/dto/{log,metric,system-event}.dto.ts` | Item DTOs + batch DTOs |
| `api/src/ingestion/publisher/telemetry-publisher.ts` | The abstract "publisher" contract |
| `api/src/ingestion/publisher/logging-telemetry.publisher.ts` | Temporary implementation: prints to console |
| `api/src/ingestion/ingestion.service.ts` | Builds envelopes (UUID, UTC timestamps, defaults) and publishes |
| `api/src/ingestion/ingestion.controller.ts` | The 3 POST routes, returning 202 |
| `api/src/ingestion/ingestion.module.ts` | Wires it together; picks the publisher implementation |
| `api/src/main.ts` | **Changed:** global `ValidationPipe` + 1 MB body limit |
| `api/http/ingestion.http` | Ready-made valid and invalid requests to try |

### New dependencies
| Package | Why |
|---|---|
| `class-validator` | Decorators like `@IsEnum`, `@MaxLength` that validate DTOs |
| `class-transformer` | Turns plain JSON into DTO class instances (`@Type`), needed for nested validation |

---

## Run it
1. Install the new packages: `npm install` (in `api/`)
2. Start the app: `npm run start:dev`
3. Install the VS Code extension **REST Client** (by Huachao Mao), open `api/http/ingestion.http`, and click **Send Request** above each request.
4. Watch the API terminal for lines like:
   ```
   [LoggingTelemetryPublisher] [dry-run] 2 log(s) from: payments-service, orders-service
   [LoggingTelemetryPublisher] First envelope: { "id": "…", "kind": "log", … }
   ```

---

## Exercises
1. Send request #3 (the deploy event with `+05:30`). What is `occurredAt` in the printed envelope, and why is it different from what you sent?
2. Remove `@Type(() => LogDto)` from `LogBatchDto`, restart, and send request #4 (the invalid one). What happens? Put it back. Why is this bug dangerous?
3. Add a new optional field `host` (string, max 255) to **logs only**. Which files do you need to touch? (Hint: the DTO, the payload type, and the service.)
4. A sender's clock is wrong and sends `timestamp` **one year in the future**. We currently accept it. Why could that hurt anomaly detection later? How might you reject timestamps more than 5 minutes ahead?
