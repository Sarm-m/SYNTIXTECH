# DriveControl / SYNTIXTECH Agent Guide

## Project identity

- Project: **DriveControl / SYNTIXTECH**
- Current repository purpose: a public, early-stage OSS continuation/fork/copy maintained personally after the academic project.
- Original university Scrum repository: <https://github.com/puj-course/FIS_2610_3517_G4>
- The original repository is historical evidence. Do not describe its issues, pull requests, contributors, or metrics as current activity or adoption in this repository.

## Tech stack

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Runtime and delivery: Docker, Docker Compose, Makefile, and GitHub Actions
- Quality: ESLint, Vitest, Node test runner, secret checks, and optional SonarCloud

## Main paths

- `apps/web`: React/Vite frontend, UI, hooks, services, and frontend tests
- `backend`: Express API, MongoDB models, integrations, scripts, and backend tests
- `docs`: project, architecture, QA, security, and historical documentation
- `docs/Agile`: historical Scrum milestones, metrics, and postmortems
- `docs/Entrega-Final/anexos`: historical exports and academic report inputs
- `docs/upstream-evidence`: exported evidence from the university repository

## Hard rules

- Never commit secrets or real `.env` files.
- Never claim broad adoption, users, downloads, stars, production usage, or active deployments without current evidence.
- Never describe upstream historical issues, pull requests, commits, contributors, milestones, or CI runs as current activity in this repository.
- Keep RUNT validation marked as mock, demo, simulation, or academic validation unless official integration proof exists.
- Preserve Docker, the Makefile, CI workflows, and tests unless an intentional change is documented and validated.
- Prefer small, safe, reviewable changes.
- Document failed checks honestly. Do not imply a check passed when it was skipped, blocked, or failed.
- Do not merge `university/main`, copy secrets, or bulk-import old upstream issues.

## Working approach

1. Inspect the affected code and nearby documentation before editing.
2. Keep current OSS work separate from historical university evidence.
3. Treat optional integrations such as Google OAuth, SMTP, Twilio, DockerHub, Discord, deploy hooks, and SonarCloud as optional unless configured and verified.
4. Keep `.env.example` files placeholder-only and consistent with runtime configuration.
5. Add or update focused tests when behavior changes.

## Validation commands

Run relevant checks from the repository root and report failures:

```sh
git diff --check
npm run secrets:check
npm run lint
npm test
npm run build
docker compose config
```

On Windows PowerShell systems where `npm.ps1` is blocked by execution policy, use `npm.cmd` for the same npm commands.

## Review focus

- Authentication, JWT generation/verification, and recovery flows
- Role checks and ownership-scoped access controls
- `.env.example` consistency and accidental secret exposure
- Mobile and responsive UI regressions
- Optional integrations and their safe fallback behavior
- Docker, Makefile, test, and GitHub Actions stability

