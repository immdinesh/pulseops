# Step 1 — NestJS skeleton + local infrastructure

## Goal
Get a NestJS app running that loads validated config, connects to Postgres, and exposes health endpoints. Start all the infrastructure we'll need (Postgres, Redis, Kafka) with one Docker command.

No business features yet: this step builds the foundation the other steps sit on.

---

## Concepts

### 1. NestJS in four words: module, controller, provider, injection

**Module** (`@Module`): a box that groups related code. Our app is a tree of modules:
```
AppModule
├── ConfigModule     (env vars)
├── DatabaseModule   (Postgres connection)
└── HealthModule     (health endpoints)
```
Later, `IngestionModule`, `IncidentsModule` and others are added the same way.

**Controller** (`@Controller`): receives HTTP requests and returns responses. Keep it thin: read the request, call a service, return the result.

**Provider / Service** (`@Injectable`): where the real logic lives.

**Dependency injection (DI)**: you never write `new HealthCheckService()` yourself. You *ask* for it in the constructor and Nest *gives* it to you:
```ts
constructor(private readonly health: HealthCheckService) {}
```
Why it matters: in tests, you can hand in a fake version. It also means modules don't need to know how their dependencies are built.

### 2. Configuration that fails fast
Settings like the DB password come from **environment variables** (`.env` file locally, real env vars in production) and never from code.

We validate them with **Joi** when the app starts:
- `DB_HOST` missing? The app refuses to start and tells you exactly what's wrong.
- `DB_PORT=abc`? Same: rejected at startup.
- `DB_PORT="5432"` arrives as a *string* from `.env`, and Joi converts it to the *number* `5432`.

Without this, a typo would surface as a mysterious crash 20 minutes later. **Fail fast and fail loudly.**

### 3. Docker Compose: your infrastructure as one file
| Term | Meaning |
|---|---|
| **Image** | A packaged program (e.g. `redis:7-alpine`). Downloaded once. |
| **Container** | A running instance of an image. |
| **Port mapping** `"6379:6379"` | `your-machine:container`. Lets the app on your laptop reach the container. Our Postgres uses `"5433:5432"`: inside Docker it's the normal 5432, but on your laptop it's 5433, because another project's Postgres already uses 5432. Two programs can't listen on the same host port. |
| **Volume** `pg-data` | Storage that survives `docker compose down`, so your data isn't lost. `down -v` deletes it. |
| **Healthcheck** | A command Docker runs repeatedly to know if the service is truly ready, not just started. |

Our four services:
| Service | Why we need it | Used from |
|---|---|---|
| **Postgres** (with pgvector) | Store events, anomalies, incidents; similarity search over past incidents | Step 1 / Step 9 |
| **Redis** | Fast counters for sliding windows, locks so two workers don't handle the same incident | Step 3+ |
| **Redpanda** | Message broker that speaks the **Kafka protocol**. A single container, so it's lighter than real Kafka on a laptop. Our code uses normal Kafka clients, so it would work against real Kafka unchanged. | Step 3 |
| **Redpanda Console** | Web UI at http://localhost:8080 to *see* topics and messages. Very useful for learning. | Step 3 |

**Why Redpanda has two addresses:** a Kafka broker tells clients "connect to me at address X". Containers reach it as `redpanda:9092` (Docker's internal network), but your laptop must use `localhost:19092`. So we define two *listeners* and *advertise* the right address to each.

### 4. Liveness vs readiness
| | `/health/live` | `/health/ready` |
|---|---|---|
| Question | "Is the process alive?" | "Can it serve requests right now?" |
| Checks | Memory only | Database (later also Redis and Kafka) |
| If it fails, the platform will… | **Restart** the app | **Stop sending traffic** until it recovers |

The trap: if *liveness* checked the database, a DB outage would make Kubernetes restart your API over and over, which fixes nothing and adds noise. So liveness checks only the process itself.

### 5. API versioning
Business routes live under `/api/v1/...`. If we ever need breaking changes, we add `/api/v2` and old clients keep working.

---

## Code walkthrough (in the order the app starts)

1. **`api/src/main.ts`**: `NestFactory.create(AppModule)` builds the module tree, sets the `/api/v1` prefix, enables graceful shutdown, and starts listening on `PORT`.
2. **`api/src/app.module.ts`**: loads `ConfigModule` first (global and validated), then `DatabaseModule` and `HealthModule`.
3. **`api/src/config/env.validation.ts`**: the `Env` type plus the Joi rules. Startup stops here if `.env` is wrong.
4. **`api/src/database/database.module.ts`**: `forRootAsync` waits for config, then opens a Postgres connection pool. `synchronize: false` because auto-altering tables can destroy data, so we'll use migrations instead.
5. **`api/src/health/health.controller.ts`**: two endpoints built on `@nestjs/terminus`.

### Dependencies we added
| Package | Why |
|---|---|
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | The NestJS framework on top of Express |
| `@nestjs/config` + `joi` | Load `.env` and validate it |
| `@nestjs/typeorm` + `typeorm` + `pg` | ORM and the Postgres driver |
| `@nestjs/terminus` | Ready-made health check building blocks |
| `reflect-metadata`, `rxjs` | Required by Nest internally (decorators, async streams) |
| `@nestjs/cli` (dev) | `nest start --watch`, `nest build` |
| `typescript`, `@types/*`, `prettier` (dev) | Compiler, type definitions, formatter |

---

## Run it
See the step-by-step commands in the chat for this step. The short version:
```bash
docker compose up -d          # from repo root
cd api
cp .env.example .env
npm install
npm run start:dev
```
Then open:
- http://localhost:3000/health/live  → `{"status":"ok", ...}`
- http://localhost:3000/health/ready → `{"status":"ok","info":{"database":{"status":"up"}}, ...}`
- http://localhost:8080 → Redpanda Console (no topics yet)

---

## Exercises
1. Stop Postgres (`docker stop pulseops-postgres`) and call both health endpoints. Which one fails, and with what HTTP status? Start it again with `docker start pulseops-postgres`.
2. In `.env`, delete the `DB_USER` line and restart the app. Read the error message. Put the line back.
3. Change `PORT` to `4000` in `.env`. What changes, and what *didn't* you have to touch in the code? Why?
4. Why do you think `/health/*` is excluded from the `/api/v1` prefix?
