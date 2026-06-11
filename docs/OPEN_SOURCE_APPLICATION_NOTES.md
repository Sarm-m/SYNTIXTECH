# Open Source Application Notes

## Honest positioning

DriveControl should be positioned as an **early-stage public OSS project with active personal maintenance and unusually strong academic/Scrum history**.

It is appropriate to highlight:

- A functioning React/Vite and Node/Express application
- MongoDB persistence and ownership-scoped records
- Tests, Docker, Docker Compose, Makefile, and GitHub Actions
- Extensive architecture, QA, Agile, and postmortem documentation
- A concrete maintenance and hardening roadmap
- Historical team development in the original university repository

It is not appropriate to imply broad adoption, production usage, or a large current contributor community.

## Suggested maintainer role answer

> I am the active personal maintainer of the current public DriveControl repository. I am continuing and hardening a project that originated as a Scrum-based university team project at Pontificia Universidad Javeriana. My current work focuses on repository safety, CI stability, documentation, testing, UI quality, and preparing the codebase for genuine outside contribution. I distinguish the original team's historical activity from my current maintenance work.

## Suggested "why this repository qualifies" answer

> DriveControl is a public MIT-licensed, early-stage OSS fleet compliance application with a real working codebase, tests, Docker support, GitHub Actions, and extensive engineering documentation. Its original university repository provides strong historical evidence of Scrum-based development through issues, pull requests, commits, milestones, CI/CD, QA artifacts, and postmortems. The current repository is a personal OSS continuation focused on making that work safer, clearer, more maintainable, and easier for future contributors to run and improve. I am not claiming broad adoption; the value is the depth of the existing engineering work and the concrete opportunity to mature it responsibly in public.

## Suggested API credits usage answer

> I would use API credits to accelerate maintainership work that is difficult to sustain alone: expand security-focused and ownership-isolation tests, improve authentication and optional-integration test coverage, modularize the large Express backend safely, investigate CI failures, improve contributor-facing documentation, and review changes for mobile regressions and secret exposure. Credits would support engineering and maintenance work, not artificial issue activity, generated adoption claims, or marketing metrics.

## Suggested "anything else we should know" answer

> The original university Scrum repository is `puj-course/FIS_2610_3517_G4`; the current repository is my personal public continuation/fork/copy. Historical upstream issues, pull requests, commits, contributors, milestones, and screenshots are used only as attributed project-history evidence. They are not presented as current activity or adoption in this repository. RUNT validation is a mock/demo simulation, not an official integration. I have also been cleaning historical secret-handling risks and keeping real credentials out of the current tracked tree.

## Evidence that can support an application

- `docs/PROJECT_HISTORY.md`
- `docs/UPSTREAM_EVIDENCE_SUMMARY.md`
- `docs/Agile/reporte_final_sprints.md`
- `docs/Agile/milestone-*/`
- `docs/Entrega-Final/anexos/`
- `docs/Entrega-Final/evidencias/`
- `.github/workflows/`
- Current tests under `apps/web` and `backend/test`

## Warnings against overclaiming

- Do not call historical upstream contributors current maintainers.
- Do not call historical upstream issues or pull requests current repository activity.
- Do not claim current users, downloads, stars, installations, deployments, or fleet customers without direct evidence.
- Do not use academic screenshots as proof of a currently live production service.
- Do not describe DockerHub, SonarCloud, Twilio, Discord, SMTP, Google OAuth, or deploy-hook integrations as currently configured unless verified.
- Do not describe the simulated RUNT workflow as an official RUNT integration.
- Do not hide security history. State that exposed or potentially exposed credentials must be rotated.

