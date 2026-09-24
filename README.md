<div align="center">

# NexaFlow

**Portfolio case study:** [moeijiro.github.io/portfolio/projects/nexaflow](https://moeijiro.github.io/portfolio/projects/nexaflow/) · **Live demo:** not hosted — the app runs locally in a few commands (see below).

**Automate the work between your tools.**

Connect your services, build automated workflows and let NexaFlow handle repetitive tasks in
the background.

`FastAPI` · `Next.js 16` · `TypeScript` · `SQLAlchemy` · `PostgreSQL-ready`

</div>

---

NexaFlow is a full-stack automation platform: a marketing site, a developer dashboard, and a
Python backend that genuinely runs workflows. A workflow is one trigger, an optional JSON
transform, and one action — and every run is recorded with the payload at each stage.

It is deliberately not a Zapier clone. Three integrations exist and work; the rest of the
effort went into the parts that decide whether a tool like this can be trusted: credential
handling, retries, an SSRF guard, ownership boundaries, and an execution log you can read.

---

## Contents

- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Workflow execution lifecycle](#workflow-execution-lifecycle)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Backend API](#backend-api)
- [Demo mode](#demo-mode)
- [Security decisions](#security-decisions)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project structure](#project-structure)

---

## Screenshots

| | |
|---|---|
| ![Landing](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) |
| *Hero with the interactive pipeline* | *Dashboard — every figure from the database* |
| ![Builder](docs/screenshots/builder.png) | ![Execution](docs/screenshots/execution.png) |
| *Five-step workflow builder* | *Execution detail: payload in, action out* |

> Captured from the running stack after `make seed`. The executions are real runs of the real
> engine — the seed command triggers workflows rather than inserting rows.

---

## Architecture

```mermaid
flowchart TD
    subgraph Client["Browser"]
        SITE["Marketing site<br/>static, prerendered"]
        DASH["Dashboard<br/>React client components"]
    end

    EXT["External service<br/>shop · form · CI · monitoring"]

    subgraph API["FastAPI backend"]
        HOOK["POST /hooks/{token}"]
        MGMT["Management API<br/>/api/*"]
        ENGINE["Workflow engine<br/>background task · 3 attempts"]
        ADAPTERS["Action adapters"]
    end

    EXT -->|"JSON payload"| HOOK
    DASH -->|"session cookie"| MGMT
    SITE -.->|"links"| DASH

    HOOK --> ENGINE
    MGMT --> ENGINE
    ENGINE --> ADAPTERS
    ADAPTERS -->|"webhook"| DISCORD["Discord"]
    ADAPTERS -->|"Bot API"| TELEGRAM["Telegram"]
    ADAPTERS -->|"any method"| HTTP["HTTP API"]

    ENGINE --> DB[("Database<br/>users · workflows · executions · api_keys")]
    MGMT --> DB
```

Two credentials, two jobs:

| Surface | Credential | Used by |
|---|---|---|
| `/api/*` | HttpOnly session cookie, or `X-API-Key` | dashboard, scripts, CI |
| `/hooks/{token}` | the workflow token itself (optional HMAC) | whatever service triggers the workflow |

A workflow token can trigger its own workflow and nothing else. An API key can manage the
account but is never used by the browser.

---

## Workflow execution lifecycle

```mermaid
sequenceDiagram
    participant S as External service
    participant A as FastAPI
    participant E as Engine (background)
    participant D as Destination
    participant DB as Database

    S->>A: POST /hooks/{token} + JSON
    A->>A: size limit · JSON parse · token lookup · HMAC
    A->>DB: create execution (processing)
    A-->>S: 202 { execution_id }
    A->>E: queue the run
    E->>E: apply transform template (optional)
    E->>D: action attempt 1
    D-->>E: 5xx / timeout
    E->>E: backoff, retry (max 3)
    E->>D: action attempt 2
    D-->>E: 2xx
    E->>DB: status, attempts, duration, payloads, result
```

The caller is never held open while a third-party API is contacted, and the execution row
exists before the first attempt — so nothing is lost if the process dies mid-run.

---

## Features

**Marketing site** — hero with an interactive, keyboard-accessible pipeline diagram;
features, integrations, use cases, an API walk-through, pricing, FAQ; sitemap, robots and
OpenGraph metadata; reduced-motion support throughout.

**Workflow builder** — five steps (trigger → transform → action → review → activate) with a
live pipeline summary. Not a drag-and-drop canvas, because a workflow here is a straight
line and pretending otherwise would be decoration.

**Real execution engine** — background runs, up to three attempts with exponential backoff,
and only for failures where a retry could help (timeouts, 429, 5xx).

**JSON transforms** — reshape an incoming payload with `{{dotted.paths}}`. Templates
substitute values; nothing is evaluated, because a webhook payload is untrusted input.

**Execution history** — trigger payload, transformed payload, action result, attempts,
duration and error, per run, filterable by workflow and status.

**Test runs** — trigger a workflow from the dashboard with an editable payload that is
prefilled from the placeholders the workflow actually reads. It calls the real destination
and is recorded as a test, not simulated.

**API keys** — `nxf_live_…`, stored as a SHA-256 digest, shown once, revocable.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Web | Next.js 16 (App Router), React 19, TypeScript | static marketing pages, client dashboard, one codebase |
| Styling | Tailwind CSS v4 with design tokens | one surface ramp, one accent — no ad-hoc hex values |
| Motion | `motion` (Framer Motion) + SVG `animateMotion` | scroll reveals and flowing packets, both reduced-motion aware |
| API | FastAPI + Pydantic v2 | typed models, OpenAPI at `/docs` |
| ORM | SQLAlchemy 2.0 (typed) | SQLite by default, PostgreSQL by changing one URL |
| Security | scrypt, PyJWT, Fernet, HKDF | hashed passwords, signed sessions, encrypted credentials |
| Tests | pytest | 30 tests, none of which touch the network |

Eight backend dependencies, four web dependencies. No queue broker, no cache server, no
component library.

---

## Installation

Requirements: Python 3.11+, Node 20+.

```bash
git clone https://github.com/Moeijiro/nexaflow.git
cd nexaflow
cp .env.example backend/.env          # works as-is for local development
cp frontend/.env.example frontend/.env.local
make install                          # venv + pip install + npm install
```

Run the two processes (each in its own terminal):

```bash
make api    # http://localhost:8000  — OpenAPI docs at /docs
make web    # http://localhost:3000
```

Then either register an account, or create the demo one:

```bash
make seed   # demo@nexaflow.dev / nexaflow-demo-1234
```

**PostgreSQL** instead of SQLite — no code changes:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/nexaflow
```

---

## Environment variables

Backend (`backend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `ENVIRONMENT` | `development` | `production` enables the startup safety checks |
| `APP_URL` | `http://localhost:3000` | CORS origin for the web app |
| `PUBLIC_API_URL` | `http://localhost:8000` | used to build webhook URLs shown in the UI |
| `DATABASE_URL` | `sqlite:///./nexaflow.db` | any SQLAlchemy URL |
| `SECRET_KEY` | dev placeholder | signs sessions, derives the credential-encryption key |
| `ACCESS_TOKEN_TTL_MINUTES` | `720` | session lifetime |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | `false` / `lax` | must be `true` in production |
| `ALLOW_REGISTRATION` | `true` | close sign-ups once your account exists |
| `MAX_PAYLOAD_BYTES` | `65536` | largest accepted webhook body |
| `ACTION_TIMEOUT_SECONDS` | `10` | timeout for one outbound call |
| `MAX_ATTEMPTS` | `3` | attempts per execution, including the first |
| `ALLOW_PRIVATE_NETWORK_TARGETS` | `false` | the SSRF guard; refused in production |

Web (`frontend/.env.local`):

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | where the browser calls the API |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | canonical URL for metadata and the sitemap |

`.env` files are git-ignored; nothing secret is committed.

---

## Backend API

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | account and session |
| `GET` | `/api/auth/me` | current account |
| `GET` `POST` | `/api/workflows` | list / create (returns the webhook URL and curl example) |
| `GET` `PATCH` `DELETE` | `/api/workflows/{id}` | detail with secrets redacted, partial update, delete |
| `POST` | `/api/workflows/{id}/test` | run the real pipeline with a supplied payload |
| `GET` | `/api/workflows/{id}/executions` | history for one workflow |
| `GET` | `/api/executions` · `/api/executions/{id}` | history across workflows, one run in full |
| `GET` | `/api/integrations` | available and planned actions, from the registry |
| `GET` `POST` | `/api/keys` · `POST /api/keys/{id}/revoke` · `DELETE /api/keys/{id}` | API keys |
| `POST` | `/hooks/{token}` | trigger a workflow |
| `GET` | `/api/stats` · `/api/health` | dashboard figures, liveness |

Every error — including validation — uses one envelope:

```json
{ "error": { "code": "workflow_paused", "message": "This workflow is paused." } }
```

Status codes: `401` unauthenticated, `404` for objects the caller does not own (never `403`,
which would confirm they exist), `409` paused or conflicting, `413` payload too large,
`422` validation, `429` rate limited.

---

## Demo mode

`make seed` creates one account flagged `is_demo`, three workflows, and then **runs** them.
The runs go through the real engine; only the outbound HTTP transport is swapped for a local
sink, so no traffic reaches Discord or Telegram with placeholder tokens. One execution is
made to fail on purpose so the dashboard shows the retry ladder and a failed state.

No execution rows are fabricated, and the dashboard labels the account as a demo. Numbers on
screen are always counts over rows that exist.

---

## Security decisions

- **Passwords**: scrypt (N=2¹⁴, r=8, p=1) with a per-user salt; parameters stored with the
  digest so they can be raised later without invalidating accounts.
- **Sessions**: signed JWT in an HttpOnly cookie. The session key and the credential
  encryption key are derived from `SECRET_KEY` through HKDF with different info labels, so
  they never share material.
- **Integration credentials**: encrypted with Fernet before they are stored. The API returns
  a redaction marker and there is no endpoint that decrypts them back — a stolen session
  cannot exfiltrate a bot token.
- **API keys**: 256 bits of entropy stored as SHA-256. A slow KDF would buy nothing against
  that much randomness and would tax every request; the reasoning sits next to the code.
- **SSRF guard**: outbound URLs are resolved and refused when they point at private,
  loopback, link-local or reserved addresses, and redirects are not followed.
- **Webhook signatures**: verified over the exact bytes received, before parsing, with a
  constant-time comparison.
- **Ownership**: every workflow, execution and key route answers `404` for objects belonging
  to another account.
- **Templates**: substitute dotted paths only. A payload from the internet is data.
- **Production guard**: the app refuses to start with a weak `SECRET_KEY`, a non-secure
  cookie, or the SSRF guard disabled.

---

## Testing

```bash
make test        # or: cd backend && .venv/bin/python -m pytest
```

30 tests, with outbound HTTP replaced by a mock transport:

- authentication, session handling and the closed management API
- ownership: another account gets `404` for workflows, executions and keys
- webhook execution: template rendering, the execution record, paused workflows, unknown
  tokens, oversized payloads, non-JSON bodies, HMAC signatures
- transforms: reshaping before the action, and invalid templates refused at save time
- retries: a 502 attempted three times, a 400 attempted once
- API keys: shown once, stored hashed, usable instead of a session, revocable
- statistics that match the executions exactly

---

## Deployment

Cheap by design — two small processes and one database:

| Piece | Where | Notes |
|---|---|---|
| Web | Vercel, Netlify or Cloudflare Pages | static marketing pages, no server rendering needed for them |
| API | Fly.io, Railway or a small VPS | one `uvicorn` process; `Dockerfile`-free deploys work fine |
| Database | Neon, Supabase or Railway Postgres | set `DATABASE_URL`; the schema is created on boot |

In production set `ENVIRONMENT=production`, a strong `SECRET_KEY`, `COOKIE_SECURE=true`, and
`APP_URL` to the web app's real origin. Behind a shared domain (API at `/api`), keep
`COOKIE_SAMESITE=lax`; across domains use `none` with `COOKIE_SECURE=true`.

---

## Project structure

```
backend/
  app/
    actions/      base · discord · telegram · http · registry
    api/routes/   auth · workflows · executions · keys · hooks · misc
    core/         config · security · errors · net (SSRF) · rate_limit
    db/           engine, session, declarative base
    models/       User · APIKey · Workflow · Execution
    schemas/      Pydantic request/response models
    services/     engine · templating · transform · stats · http_client
    seed.py       demo account, created by running real workflows
  tests/          pytest suite
frontend/
  src/
    app/          marketing pages, auth, dashboard routes, sitemap & robots
    components/
      site/       navbar, hero, workflow diagram, sections
      dashboard/  shell, builder, execution table, usage chart
      ui/         button, card, badge, field, code block
    lib/          API client, types, helpers
docs/screenshots/ README images
.env.example      every backend variable, documented
Makefile          install / api / web / seed / test
```

---

## Project status

Complete portfolio project with three working integrations (Discord, Telegram, HTTP). CI runs the backend tests and the web build on every push. There is no hosted instance.

## Licence

MIT — see [LICENSE](LICENSE). NexaFlow is a portfolio project, not a commercial service.
