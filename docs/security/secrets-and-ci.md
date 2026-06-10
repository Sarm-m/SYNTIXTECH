# Secrets and CI Configuration

DriveControl must not store real credentials in Git. Keep private values in GitHub Actions secrets, repository variables, Docker runtime environment, or local untracked `.env` files.

## Tracked Environment Files

Only example files should be committed:

- `.env.example`
- `backend/.env.example`
- `apps/web/.env.example`
- `apps/web/.env.local.example`

Do not commit these private files:

- `.env`
- `.env.*`
- `backend/.env`
- `backend/.env.*`
- `apps/**/.env`
- `apps/**/.env.*`
- `ANEXO_CREDENCIALES_PRIVADO.md`

## Local Variables

Backend variables:

```env
MONGO_URI=mongodb://localhost:27017/logistica_db
PORT=5000
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-oauth-client-id
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user@example.com
EMAIL_PASS=your-smtp-app-password
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+10000000000
WEBOTP_DOMAIN=localhost
OTP_EXPIRACION_MINUTOS=10
OTP_MAX_INTENTOS=5
OTP_COOLDOWN_SEGUNDOS=60
```

Frontend variables:

```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_ENABLE_LOCAL_AUTH_FALLBACK=false
```

Docker Compose uses the internal MongoDB service by default:

```env
MONGO_URI=mongodb://mongodb:27017/logistica_db
```

## GitHub Actions Secrets

Create these only when the integration is needed:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `SONAR_TOKEN`
- `DISCORD_WEBHOOK_URL`
- `BACKEND_DEPLOY_HOOK_URL`
- `FRONTEND_DEPLOY_HOOK_URL`

## GitHub Actions Variables

Create these repository variables for SonarCloud:

- `SONAR_ORGANIZATION`
- `SONAR_PROJECT_KEY`

The SonarCloud workflow skips analysis with a notice when the token or variables are missing. DockerHub publish and Discord notification behave the same way.

## Secret Rotation

If real credentials were ever pushed to GitHub, rotate them immediately. Do not reuse old values. Rotate credentials in:

- MongoDB Atlas
- Gmail or Google App Passwords
- Twilio
- Google OAuth
- DockerHub tokens
- Discord webhooks
- Any deploy hooks or third-party providers that received leaked values

## Pre-Commit Check

Run this before committing:

```sh
npm run secrets:check
```

Equivalent shell check:

```sh
git ls-files | grep -E '(^|/)\.env(\..*)?$|ANEXO_CREDENCIALES_PRIVADO\.md' | grep -v -E '(^|/)\.env\.example$|apps/web/\.env\.local\.example$'
```

The command should print nothing.
