# Codex Context for DriveControl

## What DriveControl does

DriveControl is a fleet document and compliance management web application. It centralizes vehicles, drivers, SOAT and RTM records, expiration alerts, validation history, and operational reporting. It includes JWT authentication, Google OAuth support, account recovery flows, ownership-scoped data access, Docker-based local operation, and automated quality checks.

RUNT validation is an academic mock/demo simulation backed by local sample data. It is not an official RUNT integration.

## Why it matters

Small and mid-sized fleet operators often track documents with spreadsheets, chat messages, or manual reminders. DriveControl explores a more auditable workflow for monitoring document status, identifying upcoming expirations, and keeping fleet records together.

## Current maturity

This repository is an **early-stage public OSS project with active personal maintenance and strong academic/Scrum history**. It has meaningful functionality, tests, Docker configuration, CI workflows, and extensive documentation, but it must not be represented as broadly adopted, production-proven, or widely used.

The current repository is a personal continuation/fork/copy. The original team activity lives in the university repository:

<https://github.com/puj-course/FIS_2610_3517_G4>

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Vitest |
| Backend | Node.js, Express, Mongoose, Node test runner |
| Database | MongoDB |
| Authentication | JWT, Google OAuth client support, OTP flows |
| Optional integrations | SMTP email, Twilio SMS, SonarCloud, DockerHub, Discord notifications |
| Delivery | Docker, Docker Compose, Nginx, Makefile, GitHub Actions |

## Main folders

| Path | Purpose |
|---|---|
| `apps/web` | React/Vite frontend, demo UI, hooks, contexts, services, and frontend tests |
| `backend` | Express API, MongoDB persistence, authentication, integrations, and backend tests |
| `docs` | Current and historical project documentation |
| `docs/Agile` | Historical Scrum milestone reports, metrics, evidence maps, and postmortems |
| `docs/Entrega-Final/anexos` | Historical academic exports and report inputs |
| `docs/Entrega-Final/evidencias` | Historical screenshots from the academic delivery |
| `docs/upstream-evidence` | Explicit exports from the university repository |
| `.github/workflows` | Current CI, Docker, quality, and optional integration workflows |

## How to run locally

### Docker workflow

```sh
make build
make up
make health
```

The default Docker stack starts MongoDB, the Express backend on port `5000`, and the frontend on port `3000`.

Stop the stack with:

```sh
make down
```

### npm development workflow

```sh
npm run setup
npm run dev
```

Use only placeholder example files in Git. Real local values belong in ignored `.env` files or the process environment.

## How to test

Run from the repository root:

```sh
git diff --check
npm run secrets:check
npm run lint
npm test
npm run build
docker compose config
```

Useful focused commands:

```sh
npm run backend:test
npm run frontend:test
npm run docker:check
```

On Windows PowerShell, `npm.cmd` can be used if execution policy blocks `npm.ps1`.

## Security constraints

- Never commit `.env`, `backend/.env`, frontend real env files, credential annexes, tokens, passwords, webhooks, or deploy hooks.
- Keep backend secrets out of `apps/web` because Vite-exposed variables are public browser data.
- Treat Google OAuth client IDs as public configuration, but never add a Google client secret to the frontend.
- Keep MongoDB Atlas credentials, JWT secrets, SMTP credentials, Twilio credentials, and deployment hooks in local environment configuration or secret stores.
- If a secret appeared in Git history, deletion is not enough. Rotate it.
- Keep secret examples placeholder-only and run `npm run secrets:check`.

## Known risks

- Real, ignored local `.env` and `backend/.env` files exist in this workspace. They must remain untracked.
- The university repository currently contains an `apps/web/.env` with actual-looking credentials. Treat those values as historically exposed and rotate them if still valid.
- The personal repository history previously contained a credential-named annex, even though it is absent from the current tree. Historical secret exposure must be treated cautiously.
- Current npm audits report five frontend dependency vulnerabilities and one backend dependency vulnerability. Remediate them through focused, tested dependency updates.
- Authentication, JWT behavior, role handling, and ownership checks are high-risk areas.
- `backend/server.js` is large and increases change-review risk.
- SMTP, Twilio, Google OAuth, DockerHub, SonarCloud, Discord, and deploy hooks are optional and environment-dependent.
- Mobile layouts, modal scrolling, and responsive fleet workflows are regression-prone.
- RUNT behavior is simulated and must stay labeled that way.

## How Codex should use the upstream repository

The `university` remote is a read-only historical source. Codex may use it to understand project origins, team Scrum work, old issues, pull requests, commits, contributors, milestones, CI/CD evidence, and academic decisions.

Codex should:

- Attribute upstream metrics explicitly to `puj-course/FIS_2610_3517_G4`.
- State the snapshot date or evidence source when citing counts.
- Use `docs/upstream-evidence`, `docs/Agile`, and `docs/Entrega-Final` as historical evidence.
- Explain discrepancies between exports as different dates or counting methods.
- Keep the current repository's maintenance history separate.

Codex should not:

- Merge `university/main` into the current repository.
- Import all upstream issues into the current repository.
- Copy upstream credentials or private configuration.
- Present upstream work as current adoption or current-repository activity.

## Allowed and forbidden claims

### Allowed claims

- DriveControl began as a Scrum-based academic project at Pontificia Universidad Javeriana.
- The original university repository has substantial historical issue, pull request, commit, contributor, milestone, CI/CD, and documentation evidence.
- This repository is a personal public OSS continuation/fork/copy.
- The current project is early-stage, actively maintained personally, and has tests, Docker support, and GitHub Actions.
- RUNT validation is a mock/demo simulation.

### Forbidden claims without new evidence

- DriveControl is widely used, production-proven, or adopted by real fleet operators.
- The project has a particular number of current users, downloads, installations, stars, active contributors, or deployments.
- Historical upstream issues or pull requests are current activity in this repository.
- Historical screenshots prove a currently live deployment or service.
- RUNT validation connects to official RUNT services.
