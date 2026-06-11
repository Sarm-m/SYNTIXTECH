# Upstream Evidence Summary

## Scope and attribution

This document summarizes historical evidence from the original university repository:

<https://github.com/puj-course/FIS_2610_3517_G4>

The university repository is configured locally as the fetch-only `university` remote. Its evidence may be used to explain DriveControl's academic history, but it must not be presented as current activity, adoption, or usage in the current personal OSS repository.

## Evidence inspected

- `git remote -v`
- `git log university/main --oneline -n 30`
- `git shortlog -sn university/main`
- `docs/upstream-evidence/upstream_issues.json`
- `docs/upstream-evidence/upstream_pull_requests.json`
- `docs/upstream-evidence/upstream_contributors.json`
- `docs/upstream-evidence/upstream_commit_authors.txt`
- `docs/upstream-evidence/upstream_commits.tsv`
- `docs/Agile`
- `docs/Entrega-Final/anexos`
- `docs/Entrega-Final/evidencias`
- Historical workflows and QA documentation

## What was found

The university repository contains a substantial semester-scale project history. It includes application code, Git-based collaboration, Scrum documentation, issue and pull request records, test and CI/CD evidence, architecture documentation, QA reports, Docker evidence, and final academic-delivery artifacts.

The latest inspected upstream commit was `8e946dd` dated May 26, 2026. The earliest commit on `university/main` was `ff725b8` dated January 29, 2026.

## Commit history summary

- `university/main` contains **748 commits** in the exported/main-branch history.
- The exported commit range is **January 29, 2026 to May 26, 2026**.
- The export contains **137 commit subjects** beginning with `Merge pull request`.
- `git rev-list --count --merges university/main` reports **205 merge commits**.
- Recent commits include fixes for vehicles, UI, tests, CI, dependencies, security, data normalization, Google registration, and deployment configuration.

The difference between merge-subject counts and Git merge-commit counts reflects different counting methods. Neither should be silently substituted for the other.

## Contributor summary

`upstream_contributors.json` contains eight GitHub API contributor records:

| Contributor | API contributions |
|---|---:|
| `Sarm-m` | 285 |
| `samuelfl680` | 159 |
| `juanvargax` | 116 |
| `solonlosada2006` | 109 |
| `jSebastianRR` | 28 |
| `Juserora` | 23 |
| `Copilot` | 6 |
| `JuanParias29` | 2 |

`git shortlog -sn university/main` reports more identities because several people committed through aliases, different names, and different email identities. The largest shortlog identities include:

- `Sarm-m`: 183
- `samuelfl680`: 146
- `solonlosada2006`: 109
- `Sarm`: 102
- `juansebastianvd`: 71

These are historical upstream contribution records, not the current maintainer list for the personal repository.

## Issue and pull request evidence

The exported upstream evidence contains:

| Evidence | Result |
|---|---:|
| Issues | 471, all closed in the export |
| Issue creation range | February 11, 2026 to May 15, 2026 |
| Issue closure range | February 12, 2026 to May 26, 2026 |
| Pull requests | 173 |
| Merged pull requests | 145 |
| Open pull requests | 2 |
| Closed, unmerged pull requests | 26 |
| Pull request creation range | February 20, 2026 to May 23, 2026 |

Issue milestone distribution in the export:

| Milestone | Issues |
|---|---:|
| No milestone | 177 |
| Milestone 4: Dashboard, alerts, and closure | 132 |
| Milestone 1: Base functional system | 76 |
| Milestone 3: Document management and monitoring | 38 |
| Milestone 2: Basic fleet management | 37 |
| GitHub learning workshop | 11 |

At export time, upstream pull requests `#628` and `#636` were open. This is historical state in the university repository, not current work in the personal repository.

## Scrum and Agile documentation summary

`docs/Agile` contains a central semester report plus milestone-specific README files, metrics, evidence maps, LaTeX reports, and postmortems.

The historical academic report documents:

- 13 sprints
- Four functional milestones
- 283 closed issues within the four selected milestones
- 72 strictly identified closed user stories
- 630 commits in the academic cutoff window
- 161 pull requests at that report's cutoff
- 134 merged pull requests
- 8 detected reviews
- No verified releases/tags at the academic cutoff

These values differ from the newer exports because the academic report used an earlier cutoff and narrower filters. Safe use requires naming the source and method.

## CI/CD and QA evidence summary

Historical evidence includes:

- GitHub Actions workflows for project verification, Docker CI/CD, SonarCloud, quality checks, notifications, and academic automation
- Frontend lint, tests, coverage, and production build steps
- Backend tests, syntax checks, and authentication preflight checks
- Docker Compose validation, image builds, healthchecks, and deployment workflows
- Optional DockerHub publication, SonarCloud analysis, and Discord notifications
- QA documents and screenshots for tests, quality metrics, Docker, deployment, SonarCloud, SMS/Twilio, architecture, and final delivery

This evidence shows historical implementation and validation work. It does not prove that optional services or deployments are currently active.

## Security concerns found

### Current personal workspace

- Real `.env` and `backend/.env` files exist locally with non-placeholder MongoDB Atlas, SMTP, Google client ID, and Twilio configuration.
- Both files are ignored and untracked. They must remain untracked and must not be copied into documentation or issue exports.
- The current tracked tree contains placeholder-only environment examples.
- `npm run secrets:check` reports no tracked secret-like files.
- The frontend npm audit reports five dependency vulnerabilities: two moderate, one high, and two critical.
- The backend npm audit reports one high-severity dependency vulnerability.
- The affected audit packages include direct dependencies and transitive dependencies. Apply focused upgrades and rerun tests before merging remediation.

### Current personal repository history

- A credential-named annex existed in the personal repository's initial history and was later removed.
- Current history also contains explicit secret-cleanup commits.
- Deleting a sensitive file from the latest tree does not remove it from Git history. Any value that was real should be rotated.

### University repository

- `university/main` currently tracks `apps/web/.env`.
- That file contains actual-looking, non-placeholder MongoDB, SMTP, Google client ID, and Twilio values, including a Twilio Account SID/token-shaped configuration.
- Backend secrets in a frontend env file are especially risky because frontend configuration can be exposed to users or bundled assets.
- `university/main` also contains `ANEXO_CREDENCIALES_PRIVADO.md`.
- Treat affected upstream credentials as exposed and rotate them if they are still valid. Do not copy them into this repository.

### Patterns not found in the focused scan

The focused current-tree scan did not find canonical GitHub personal access tokens, Google OAuth client secrets, Discord webhook URLs, private keys, or private deployment URLs. This does not replace a dedicated history-wide secret scanner.

## What can be safely claimed

- DriveControl originated as a Scrum-based academic project at Pontificia Universidad Javeriana.
- The original university repository contains substantial historical issue, pull request, commit, contributor, milestone, CI/CD, QA, and documentation evidence.
- The university history includes hundreds of issues and commits and more than one hundred pull requests, when explicitly attributed to the upstream export.
- The current repository is a personal public OSS continuation/fork/copy.
- The current repository is early-stage and actively maintained personally.
- The project has React/Vite, Node/Express, MongoDB, Docker, tests, and GitHub Actions.
- RUNT validation is a mock/demo simulation.

## What must not be claimed

- That upstream historical activity is current activity in this repository.
- That historical contributors are all current maintainers.
- That DriveControl has broad adoption, active users, downloads, installations, fleet customers, or production usage.
- That historical CI/CD screenshots prove a currently live deployment.
- That optional integrations are currently configured without verification.
- That the project has an official RUNT integration.
- That historical metrics from different cutoffs are directly interchangeable.
