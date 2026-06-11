# DriveControl Project History

## Academic origin

DriveControl was created by the SYNTIX TECH student team at **Pontificia Universidad Javeriana** for the course **Fundamentos de Ingenieria de Software**. The original project was also documented as DriveControl / AutoMinder Enterprise.

Original university repository:

<https://github.com/puj-course/FIS_2610_3517_G4>

The university repository was developed as a Scrum-based academic project. Its history includes backlog work, user stories, milestones, sprint ceremonies, feature branches, pull requests, reviews, CI/CD work, QA evidence, and milestone postmortems.

## Scrum-based development

The historical documentation under `docs/Agile` describes:

- 13 academic sprints
- Four functional milestones
- User stories and issue-level traceability
- Pull request and commit evidence
- Team-role and contribution analysis
- Milestone and semester postmortems
- Root-cause analysis and corrective actions

The four documented functional milestones are:

1. Base functional system
2. Basic fleet management
3. Document management and monitoring
4. Dashboard, alerts, and project closure

Older academic reports use a defined semester cutoff and filtered milestone criteria. For example, `docs/Agile/reporte_final_sprints.md` reports 283 closed issues in the four functional milestones, 72 strictly identified user stories, 630 commits in the academic cutoff, 161 pull requests, 134 merged pull requests, and 8 detected reviews. These are historical academic metrics, not current repository metrics.

## Historical GitHub evidence

The exported snapshot in `docs/upstream-evidence` provides a newer and broader view of the university repository:

| Evidence | Snapshot result |
|---|---:|
| Closed issues | 471 |
| Pull requests | 173 |
| Merged pull requests | 145 |
| Open pull requests at export | 2 |
| Closed, unmerged pull requests | 26 |
| Commits on `university/main` | 748 |
| API contributor records | 8 |

The commit export spans January 29, 2026 through May 26, 2026. `git shortlog -sn university/main` shows many author identities and aliases, led by `Sarm-m`, `samuelfl680`, `solonlosada2006`, `Sarm`, and `juansebastianvd`.

The issue and pull request counts differ from older academic reports because they were exported later and use broader repository-wide criteria. Both sets can be cited when their source, date, and filtering method are stated.

## CI/CD and documentation evidence

Historical evidence includes:

- GitHub Actions workflows for verification, Docker CI/CD, SonarCloud, quality standards, notifications, and academic automation
- Dockerfiles, Docker Compose, Nginx, and Makefile workflows
- Frontend and backend test evidence
- SonarCloud and quality-metric screenshots
- Docker build, network, healthcheck, and deployment screenshots
- SMS/Twilio evidence
- Architecture, database, design-pattern, QA, and final-delivery documentation

These artifacts show what the university team built and documented during the academic project. They do not prove that the current public repository has a live deployment or current users.

## Current public OSS continuation

This current repository is a **personal public OSS continuation/fork/copy** of the academic work. It preserves useful history and documentation while continuing maintenance outside the original university organization.

The current repository has its own post-academic maintenance history, including repository cleanup, safer environment examples, CI adjustments, documentation improvements, tests, and UI work. That activity should be described as current personal maintenance, not as continued activity by the full original team.

## Interpretation boundary

Historical evidence is valuable proof of development depth, Scrum practice, team collaboration, and prior technical work. It is **not** evidence of:

- Current adoption
- Current active users
- Current downloads or installations
- Current production usage
- Current activity by all historical contributors
- A currently active university project

Historical evidence is not the same as current adoption.

Any public description or application should clearly separate:

1. The original university Scrum history.
2. The current personal OSS maintenance.
3. Any future independently verified adoption or usage.
