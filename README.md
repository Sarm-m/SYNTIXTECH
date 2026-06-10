<div align="center">
<div align="center">

<img src="docs/Entrega-Final/evidencias/logo_syntix_drivecontrol.png" alt="DriveControl - Fleet Compliance Platform" width="520"/>

<h1>DriveControl</h1>

<h3>Fleet compliance made simple — centralized document tracking, alerts and operational visibility for vehicle fleets.</h3>

</div>

---
## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Common Commands](#common-commands)
- [Testing & Quality](#testing--quality)
- [Security Notes](#security-notes)
- [Deployment (Docker)](#deployment-docker)
- [Screenshots / Demo](#screenshots--demo)
- [Credits & License](#credits--license)

---
## Overview

DriveControl is a web platform that helps fleet operators centralize document compliance and operational visibility. Manage vehicles, drivers, SOAT and RTM records, run validations, receive expiration alerts, and keep an auditable validation history — all from a single dashboard.

Designed for small and mid-sized fleets, DriveControl reduces manual tracking, prevents missed renewals, and provides role-based controls and audit trails for compliance-sensitive operations.
## Problem

Many fleet operations still rely on spreadsheets, chats, or informal reminders to track critical documents. This manual approach increases the risk of:

- Missed SOAT/RTM expirations and regulatory exposure
- Lost or inconsistent driver/vehicle assignment records
- Poor auditability for compliance checks
- Operational downtime from expired documentation

DriveControl addresses these pain points by centralizing records, alerts and validation history.
## Solution

DriveControl provides:

- A centralized dashboard for vehicle and driver records
- SOAT and RTM lifecycle tracking with automated expiration alerts
- Authentication (JWT), Google OAuth, and account recovery with OTP flows
- Role-aware access and ownership-scoped data isolation (implemented at API level)
- Validation history and audit logs for traceability
- Docker Compose for local orchestration and reproducible CI pipelines

The stack is built with a React/Vite frontend, a Node.js/Express API and MongoDB persistence. CI pipelines and quality checks are provided via GitHub Actions.
## Key Features

- Vehicle management (CRUD, assignment)
- Driver management (CRUD, license tracking)
- SOAT & RTM lifecycle tracking with status computation
- Expiration alerts and consolidated alerts center
- Authentication: JWT, Google OAuth integration, account recovery and OTP flows
- Ownership-scoped data isolation via `ownerEmail` and API checks
- Validation history and audit notes
- Operational dashboard and reports/metrics
- Responsive, mobile-friendly UI
- Docker Compose for local development and CI validation

Note: RUNT validation is an academic simulation included for demo/testing only.
## Architecture

The project uses a standard three-layer architecture:

```mermaid
flowchart LR
    User --> Frontend[apps/web: React + Vite]
    Frontend --> API[backend: Node.js + Express]
    API --> Mongo[(MongoDB)]

    subgraph Docker
        Frontend
        API
        Mongo
    end

    CI[GitHub Actions] --> Checks[Lint & Tests]
    CI --> DockerValidation[Compose build & healthchecks]
```

By default the frontend proxies `/api` requests to the backend. Docker Compose starts the frontend, backend and an embedded MongoDB for local workflows.
## Tech Stack

Frontend

- React 18, Vite
- Tailwind CSS, Lucide icons
- Vitest for unit tests

Backend

- Node.js, Express
- Mongoose (MongoDB ODM)
- JWT-based auth, Nodemailer for email flows

DevOps / Quality

- Docker & Docker Compose
- Makefile orchestration
- ESLint, Vitest, backend tests
- GitHub Actions pipelines (CI), optional SonarCloud integration
## Getting Started

Requirements

- Git
- Node.js (>=18 recommended) and npm
- Docker & Docker Compose (for containerized flows)

Clone repository

```bash
git clone https://github.com/Sarm-m/SYNTIXTECH.git
cd SYNTIXTECH
```

Run with Docker (recommended)

```bash
make build
make up
```

Stop

```bash
make down
```

Run local development (npm)

```bash
make dev
```

Health check (waits for services)

```bash
make health
```
## Local Development

Install dependencies:

```sh
npm --prefix apps/web ci
npm --prefix backend ci
```

Run local npm development mode:

```sh
make dev
```

This starts both backend and frontend through npm on `http://localhost:3000` after shutting down Docker containers for this project. It is an alternative development flow; the normal execution flow is `make build` followed by `make up`.

Run backend checks:

```sh
npm --prefix backend test
node --check backend/server.js
```

For non-Docker backend development, copy the example environment file and keep real values untracked:

```sh
cp backend/.env.example backend/.env
```

Do not commit real `.env` files.
## Environment Variables

Backend variables belong in the process environment, `backend/.env`, or a local root `.env`.

The backend must not depend on `apps/web/.env` for secrets.

Frontend variables must use the `VITE_*` prefix because Vite exposes them to browser code.

Common frontend variables:

```txt
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_ENABLE_LOCAL_AUTH_FALLBACK=
```

Common backend variables:

```txt
NODE_ENV=
PORT=
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
GOOGLE_CLIENT_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Use placeholders in example files only. Real values must be configured locally or through GitHub Actions secrets.

See:

- [docs/security/secrets-and-ci.md](docs/security/secrets-and-ci.md)
- [docs/environment.md](docs/environment.md)
## Data Persistence

All fleet entities (vehicles, drivers, SOAT, RTM, validations) are persisted in MongoDB and scoped by ownership. The primary ownership field enforced by the API is `ownerEmail`.

The backend enforces access control using the authenticated JWT; the frontend should never be considered a trust boundary for business data.

## Testing & Quality

Available validation commands (examples executed from repository root):

```bash
npm run secrets:check            # scans for accidentally tracked secrets
npm run lint                     # runs ESLint for frontend
npm test                         # runs backend and frontend tests
npm run build                    # builds frontend production assets
```

Notes from local validation run performed in this workspace:

- `npm run secrets:check`: no tracked secret-like files found.
- `npm run lint`: ran ESLint (no immediate fatal errors reported).
- `npm test`: backend tests reported missing SMTP environment variables (`EMAIL_USER`, `EMAIL_PASS`) in this environment.

If running tests locally, ensure backend `.env` contains valid SMTP values or mock them for CI.
## Security Notes

- Never commit real `.env` files. Use the example files as templates and store secrets in CI provider secrets.
- Rotate credentials immediately if they are exposed.
- The API scopes data by `ownerEmail` and requires JWT authentication for protected routes.
- The backend includes rate-limiting and basic sanitization middleware where applicable — review `backend` code for details.
- Use `npm run secrets:check` before publishing changes.
## Deployment (Docker)

The repository includes `docker-compose.yml` and a `Makefile` for local orchestration. Typical flow:

```bash
make build   # build images
make up      # run stack in background
make health  # check service health
make down    # stop and cleanup
```

Docker Compose wires frontend, backend and a local MongoDB instance for development and CI validation.
## Screenshots / Demo

Screenshots and evidences used during academic development are stored in `docs/Entrega-Final/evidencias/` and are referenced throughout this README. Add or update captures as UI evolves.

Example visual assets used in this README:

![Landing page](docs/Entrega-Final/evidencias/37_landing_publica_home.png)
![Operational dashboard](docs/Entrega-Final/evidencias/38_dashboard_operativo.png)

## Credits & License

This project and repository contain work produced during an academic project and later refinements. See `docs/Entrega-Final/` for evidence captured during deliveries.

License: The repository includes an MIT license. See [LICENSE](LICENSE) for details.

---

If you want, I can also:

- run tests again with mocked SMTP settings
- add a small CONTRIBUTING guide for local development
<div align="center">
<div align="center">

<img src="docs/Entrega-Final/evidencias/logo_syntix_drivecontrol.png" alt="DriveControl - Fleet Compliance Platform" width="520"/>

# DriveControl

### Fleet compliance, document tracking, and operational visibility in one platform.

**DriveControl helps fleet teams manage vehicles, drivers, SOAT, RTM, alerts, validation history, and compliance workflows before documents expire.**

</div>

---

## Table of Contents

- [Value Proposition](#value-proposition)
- [Problem](#problem)
- [Solution](#solution)
- [Target Users](#target-users)
- [Key Features](#key-features)
- [Current Scope](#current-scope)
- [Document Status Model](#document-status-model)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start With Docker](#quick-start-with-docker)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Data Persistence](#data-persistence)
- [Testing And Quality](#testing-and-quality)
- [CI/CD](#cicd)
- [SonarCloud Setup](#sonarcloud-setup)
- [Security Notes](#security-notes)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Visual Evidence](#visual-evidence)
- [Roadmap](#roadmap)
- [Team And Academic Origin](#team-and-academic-origin)

---

## Value Proposition

> DriveControl turns scattered fleet compliance work into a centralized, traceable, and actionable workflow.

Fleet teams often manage vehicle documents through spreadsheets, chats, folders, screenshots, and manual reminders. DriveControl helps reduce that operational friction by centralizing fleet records, document status, alerts, validation history, and account workflows in a single web platform.

The goal is simple: **fewer missed deadlines, better visibility, and faster decisions before compliance risks become operational problems.**

---

## Problem

Small and mid-sized fleet operations can lose visibility over critical information such as:

- Upcoming SOAT and RTM expiration dates.
- Driver and vehicle assignment records.
- License and document status.
- Evidence for internal audits or operational reviews.
- Manual reminders distributed across different tools.
- Authentication, recovery, and notification workflows.
- Repeatable deployment and quality verification.

When this information is not centralized, teams face a higher risk of expired documents, immobilizations, sanctions, duplicated work, and human error.

---

## Solution

DriveControl combines a **React/Vite frontend**, a **Node.js/Express API**, and **MongoDB persistence** to provide a fleet compliance platform focused on:

- Vehicle and driver management.
- SOAT and RTM document tracking.
- Preventive alerts.
- Operational dashboard.
- Simulated RUNT validation.
- Validation history.
- Reports and metrics.
- Secure authentication flows.
- Docker-based local execution.
- CI/CD quality checks.

Docker Compose starts the full stack locally with an internal MongoDB service. GitHub Actions validates frontend quality, backend tests, Docker health checks, optional DockerHub publishing, optional SonarCloud analysis, and optional Discord notifications.

---

## Target Users

DriveControl is designed for teams that need quick visibility and reliable document control:

- **Fleet managers** who need a general view of vehicle compliance.
- **Transport coordinators** responsible for daily operational follow-up.
- **Administrative staff** who manage SOAT, RTM, licenses, and supporting documents.
- **Operations teams** that need alerts before critical dates.
- **Small and mid-sized companies** that want to move away from manual spreadsheet-based tracking.

---

## Key Features

| Area | Feature | Status |
|---|---|---|
| Authentication | Register, login, JWT protected routes, recovery flows, OTP-oriented workflows. | Implemented |
| Google Authentication | Frontend and backend Google authentication configuration. | Implemented |
| User Profile | Profile management and email change workflow. | Implemented |
| Dashboard | Operational indicators, quick actions, recent vehicles, and recent alerts. | Implemented |
| Vehicles | Create, list, edit, delete, and assign drivers to vehicles. | Implemented |
| Drivers | Create, list, edit, and delete drivers with license status. | Implemented |
| Documents | Unified management for SOAT and RTM records. | Implemented |
| SOAT | Register, edit, delete, and calculate document status. | Implemented |
| RTM | Register, edit, delete, and calculate expiration status. | Implemented |
| Alerts | Consolidated alerts for documents, vehicles, and drivers. | Implemented |
| RUNT Validation | Simulated academic validation by plate or VIN. | Implemented |
| Validation History | Store, review, update notes, and delete validations. | Implemented |
| Reports | Operational metrics and document status analytics. | Implemented |
| Docker | Local stack with MongoDB, backend, and frontend. | Configured |
| CI/CD | GitHub Actions for validation, Docker, SonarCloud, and notifications. | Configured |
| Mobile UI | Responsive cards, scrollable modals, and mobile-friendly forms. | Improved |

> The RUNT validation is implemented as an academic simulation. This repository does not claim a real production integration with official RUNT services.

---

## Current Scope

The current verifiable scope includes:

- JWT authentication.
- Registration and login.
- Account recovery flows.
- OTP-oriented verification flows.
- Google authentication setup.
- User profile management.
- Vehicle CRUD.
- Driver CRUD.
- SOAT management.
- RTM management.
- Document status tracking.
- Alerts center.
- Operational dashboard.
- Reports and metrics.
- Simulated RUNT validation.
- Validation history.
- Theme and settings support.
- MongoDB persistence through backend API.
- Docker Compose stack.
- Frontend tests.
- Backend tests.
- Secret scanning helper.
- GitHub Actions pipelines.

---

## Document Status Model

DriveControl uses a simple traffic-light model to help teams prioritize action:

| Status | Meaning | Recommended Action |
|---|---|---|
| Green | The document is valid. | Continue normal monitoring. |
| Yellow | The document is close to expiring. | Schedule renewal before the deadline. |
| Red | The document is expired or critical. | Prioritize immediate action. |

This model helps users understand compliance risk without manually reviewing every expiration date.

---

## Architecture

DriveControl separates the user interface, API, and database layers.

```mermaid
flowchart LR
    User[User] --> Frontend[React / Vite Frontend]
    Frontend --> Proxy[Nginx or Vite API Proxy]
    Proxy --> API[Node.js / Express API]
    API --> Mongo[(MongoDB)]

    API --> Auth[Auth, JWT, OTP, Google]
    API --> Fleet[Vehicles and Drivers]
    API --> Docs[SOAT, RTM, Validations]
    API --> Alerts[Alerts and Reports]

    Docker[Docker Compose] --> Frontend
    Docker --> API
    Docker --> Mongo

    CI[GitHub Actions] --> Checks[Lint, Tests, Build]
    CI --> DockerValidation[Docker Validation]
    CI --> Sonar[Optional SonarCloud]
    CI --> Notify[Optional Discord Notification]
```

The Docker frontend serves the Vite production build through Nginx on port `3000`. API requests under `/api` are proxied to the backend on port `5000`. In local Docker and CI, the backend uses the internal MongoDB service by default:

```txt
mongodb://mongodb:27017/logistica_db
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Vitest |
| Backend | Node.js 20, Express, Mongoose, Node test runner |
| Database | MongoDB 7 |
| Runtime | Docker, Docker Compose, Nginx |
| Quality | ESLint, Vitest coverage, backend tests, secret check script |
| CI/CD | GitHub Actions |
| Optional Quality Platform | SonarCloud |

---

## Quick Start With Docker

### Requirements

- Git.
- Docker Desktop or Docker Engine.
- Docker Compose.

### Clone

```sh
git clone https://github.com/Sarm-m/SYNTIXTECH.git
cd SYNTIXTECH
```

### Start the stack

Recommended Make flow:

```sh
make build
make up
```

Equivalent Docker Compose commands:

```sh
docker compose config
docker compose build
docker compose up -d
```

### Validate services

```sh
curl --fail http://localhost:5000/api/health/db
curl --fail http://localhost:3000/
curl --fail http://localhost:3000/api/health/db
curl --fail http://localhost:3000/api/health/auth
```

### Stop the stack

```sh
make down
```

Expected local endpoints:

| Service | URL | Description |
|---|---|---|
| Frontend | http://localhost:3000/ | Web application served by the frontend container. |
| Backend DB Health | http://localhost:5000/api/health/db | Direct backend/database health check. |
| Frontend API Proxy | http://localhost:3000/api/health/db | Health check through the frontend proxy. |

Use one runtime mode at a time. `make up` stops local npm/Vite processes before starting Docker, and `make dev` stops Docker before starting the local development servers.

```sh
make build
make up
make health
make ps
make logs
make down
make dev
```

---

## Local Development

Install dependencies:

```sh
npm --prefix apps/web ci
npm --prefix backend ci
```

Run local npm development mode:

```sh
make dev
```

This starts both backend and frontend through npm on `http://localhost:3000` after shutting down Docker containers for this project. It is an alternative development flow; the normal execution flow is `make build` followed by `make up`.

Run backend checks:

```sh
npm --prefix backend test
node --check backend/server.js
```

For non-Docker backend development, copy the example environment file and keep real values untracked:

```sh
cp backend/.env.example backend/.env
```

Do not commit real `.env` files.

---

## Environment Variables

Backend variables belong in the process environment, `backend/.env`, or a local root `.env`.

The backend must not depend on `apps/web/.env` for secrets.

Frontend variables must use the `VITE_*` prefix because Vite exposes them to browser code.

Common frontend variables:

```txt
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_ENABLE_LOCAL_AUTH_FALLBACK=
```

Common backend variables:

```txt
NODE_ENV=
PORT=
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
GOOGLE_CLIENT_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Use placeholders in example files only. Real values must be configured locally or through GitHub Actions secrets.

See:

- [docs/security/secrets-and-ci.md](docs/security/secrets-and-ci.md)
- [docs/environment.md](docs/environment.md)

---

## Data Persistence

Fleet entities are stored through the backend API in MongoDB and scoped by the authenticated user.

The main ownership field is:

```txt
ownerEmail
```

The backend uses the authenticated JWT to decide which records a user can access. Vehicles, drivers, SOAT records, RTM records, and validation history are loaded from API endpoints after login.

Browser storage is reserved for session data, theme, preferences, or an explicit development-only fallback. It must not be the main source of truth for fleet business data.

Manual persistence validation guide:

- [docs/testing/persistence-check.md](docs/testing/persistence-check.md)

---

## Testing And Quality

Run the main local validation commands:

```sh
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix backend test
node --check backend/server.js
npm run secrets:check
git diff --check
```

The frontend test command writes coverage to:

```txt
apps/web/coverage/lcov.info
```

This file can be consumed by SonarCloud when SonarCloud is configured.

---

## CI/CD

Workflows live in:

```txt
.github/workflows/
```

Main workflows:

| Workflow | Purpose |
|---|---|
| `docker_ci_cd.yml` | Frontend/backend validation, Docker Compose validation, stack startup, and health checks. |
| `sonarcloud.yml` | Frontend quality checks and optional SonarCloud analysis. |
| `cd_entrega.yml` | Frontend artifact generation. |
| `notify_discord.yml` | Optional reusable Discord notification workflow. |
| `pipeline_hu454_auth_ci_cd.yml` | Authentication-focused validation and optional deploy hooks. |
| `quality_standards.yml` | Issue quality helper. |
| `kanban_flow_assignment.yml` | Issue workflow helper. |

Optional integrations skip with a GitHub notice when credentials are not configured. They should not fail the main validation path.

Optional GitHub Actions secrets:

```txt
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
SONAR_TOKEN
DISCORD_WEBHOOK_URL
BACKEND_DEPLOY_HOOK_URL
FRONTEND_DEPLOY_HOOK_URL
```

Optional GitHub Actions variables:

```txt
SONAR_ORGANIZATION
SONAR_PROJECT_KEY
```

---

## SonarCloud Setup

To enable SonarCloud in a personal repository:

1. Create or import the repository project in SonarCloud.
2. Configure this GitHub secret:

```txt
SONAR_TOKEN
```

3. Configure these GitHub repository variables:

```txt
SONAR_ORGANIZATION
SONAR_PROJECT_KEY
```

The repository should not be tied to the previous academic organization. SonarCloud organization and project key are provided through the workflow configuration.

---

## Security Notes

Real credentials must not be committed.

The repository ignores real environment files and private credential documents. Only example files with placeholders should be tracked.

Before pushing, run:

```sh
npm run secrets:check
git ls-files | grep -E '(^|/)\.env(\..*)?$|ANEXO_CREDENCIALES_PRIVADO.md'
```

If real credentials were ever pushed to GitHub history, rotate them in the original provider before continuing development. This includes:

- MongoDB Atlas credentials.
- Twilio tokens.
- Gmail or app passwords.
- Google OAuth secrets.
- DockerHub tokens.
- Discord webhooks.
- Deployment hooks.

After rotation, GitHub secret scanning alerts can be closed as revoked.

For history cleanup guidance, see:

- [docs/security/secrets-and-ci.md](docs/security/secrets-and-ci.md)

---

## Project Structure

```txt
.
├── apps/
│   └── web/
├── backend/
├── docs/
├── scripts/
├── .github/
│   └── workflows/
├── Dockerfile
├── Makefile
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── sonar-project.properties
└── README.md
```

| Path | Description |
|---|---|
| `apps/web/` | React/Vite frontend, components, pages, hooks, contexts, services, tests, and frontend Dockerfile. |
| `backend/` | Node.js/Express API, services, scripts, and backend tests. |
| `docs/` | Architecture, QA, security, testing, agile evidence, and academic documentation. |
| `scripts/` | Repository utility scripts, including secret checks. |
| `.github/workflows/` | CI, CD, Docker, SonarCloud, and workflow automation. |
| `Dockerfile` | Backend image definition. |
| `apps/web/Dockerfile` | Frontend image definition using Vite build and Nginx. |
| `apps/web/nginx.conf` | Nginx configuration and `/api` proxy. |
| `docker-compose.yml` | Local stack with MongoDB, backend, and frontend. |
| `Makefile` | Helper commands for Docker build, startup, logs, status, and shutdown. |
| `sonar-project.properties` | SonarCloud source, test, coverage, and exclusion configuration. |

---

## Documentation

| Document | Description |
|---|---|
| [Secrets and CI configuration](docs/security/secrets-and-ci.md) | Safe secret handling, CI variables, and rotation guidance. |
| [Environment guide](docs/environment.md) | Local and Docker environment configuration. |
| [Persistence check](docs/testing/persistence-check.md) | Manual validation guide for MongoDB persistence. |
| [Architecture index](docs/Arquitectura/README.md) | Architecture documentation entry point. |
| [Design patterns matrix](docs/Arquitectura/patrones/matriz_patrones_gof.md) | Applied GoF patterns in the frontend. |
| [Database description](docs/DiagramaDB/syntix_tech_db_descripcion.md) | Database model description. |
| [Final QA evidence index](docs/QA/evidencias_finales/00_indice_sustentacion_5.md) | Final QA and validation evidence. |
| [Docker and CI/CD evidence](docs/QA/evidencias_finales/docker/04_despliegue_docker_ci_cd.md) | Docker and pipeline validation evidence. |
| [SonarCloud evidence](docs/QA/evidencias_finales/sonar/02_sonarcloud.md) | Quality metrics evidence. |
| [Data management](docs/data-management.md) | Data export, import, and operational validation documentation. |

---

## Visual Evidence

### Public Landing Page

![DriveControl public landing page](docs/Entrega-Final/evidencias/37_landing_publica_home.png)

### Operational Dashboard

![DriveControl operational dashboard](docs/Entrega-Final/evidencias/38_dashboard_operativo.png)

### Vehicle Management

![DriveControl vehicle management](docs/Entrega-Final/evidencias/39_gestion_vehiculos_estado_documental.png)

### Reports And Analytics

![DriveControl reports and analytics](docs/Entrega-Final/evidencias/40_reportes_analitica_metricas.png)

### Quality Metrics

![DriveControl quality metrics](docs/Entrega-Final/evidencias/07_metricas_calidad_app.png)

### Authentication And Verification

![DriveControl account verification](docs/Entrega-Final/evidencias/31_sms_app_verificacion.png)

### Docker Execution

![Docker build evidence](docs/Entrega-Final/evidencias/18_make_build.png)

![Docker up evidence](docs/Entrega-Final/evidencias/19_make_up.png)

![Docker Compose containers](docs/Entrega-Final/evidencias/21_docker_compose_ps.png)

![Backend database healthcheck](docs/Entrega-Final/evidencias/23_backend_health_db.png)

![Frontend proxy API healthcheck](docs/Entrega-Final/evidencias/25_frontend_proxy_api_health.png)

![Docker CI/CD workflow](docs/Entrega-Final/evidencias/28_github_actions_docker_validate.png)

### Tests And Quality

![Frontend tests](docs/Entrega-Final/evidencias/14_frontend_tests_ok.png)

![Frontend build](docs/Entrega-Final/evidencias/15_frontend_build_ok.png)

![Backend tests](docs/Entrega-Final/evidencias/16_backend_tests_ok.png)

![SonarCloud coverage](docs/Entrega-Final/evidencias/11_sonarcloud_coverage_main.png)

### Architecture And Data

![Database diagram](docs/Entrega-Final/evidencias/36_diagrama_base_datos.png)

---

## Roadmap

Planned improvements for continued product-oriented development:

- Add real MongoDB integration tests with local or in-memory MongoDB.
- Add Playwright tests for critical user flows and mobile layouts.
- Improve frontend code splitting to reduce large production chunks.
- Extract backend routes, controllers, services, and models from large files.
- Add company-level multi-tenant support.
- Add organization/admin roles.
- Add automated expiration notifications.
- Add PDF reporting workflows.
- Add backup and restore procedures.
- Add production observability and audit logs.
- Evaluate real external integrations only after security, contracts, and credentials are properly defined.

---

## Team And Academic Origin

DriveControl was created by **SYNTIX TECH** as an academic software engineering project at **Pontificia Universidad Javeriana**.

| Member | GitHub | Role |
|---|---|---|
| Sebastian Ramirez Maldonado | [@Sarm-m](https://github.com/Sarm-m) | Scrum Master |
| Samuel Freile | [@samuelfl680](https://github.com/samuelfl680) | Configuration Manager |
| Sebastian Rodriguez Ramirez | [@Juserora](https://github.com/Juserora) | Quality Assurance Lead |
| Solon Losada | [@solonlosada2006](https://github.com/solonlosada2006) | DevOps Engineer |
| Sebastian Vargas | [@juanvargax](https://github.com/juanvargax) | Product Owner and Sprint Planner |

Academic context:

| Field | Information |
|---|---|
| University | Pontificia Universidad Javeriana |
| Faculty | Engineering |
| Course | Fundamentos de Ingeniería de Software |
| Team | SYNTIX TECH |
| Original Project Name | DriveControl / AutoMinder Enterprise |
| Current Direction | Personal fork prepared for continued product-oriented development |

The repository keeps academic documentation and evidence under `docs/`, while the current personal fork is prepared for continued development as a more product-oriented SaaS platform.
