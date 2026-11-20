# University Internship Management System — Backend

Production-hardened NestJS 10 + Prisma 6 + PostgreSQL 16 backend for managing university internships, requests, weekly reports, documents, evaluations, notifications, settings, and security audit logs.

- **Default Port**: `3010`
- **API Base URL**: `http://localhost:3010/api`
- **Swagger UI**: `http://localhost:3010/api/docs`
- **Machine-Readable OpenAPI**: `backend/docs/openapi.json` (generated automatically on `npm run build`)
- **API Contract Guide**: `backend/docs/api-contract.md`
- **Security Architecture**: `backend/SECURITY.md`

---

## Run in 5 Minutes (Windows PowerShell, macOS & Linux)

### Prerequisites
- Node.js `>= 20` and npm `>= 10`
- PostgreSQL 16 (local installation or Docker)

### 1. Configure Environment
In the `backend` directory, copy `.env.example` to `.env`:

**PowerShell (Windows):**
```powershell
cd backend
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
- `DATABASE_URL` pointing to your PostgreSQL 16 database
- `JWT_SECRET` (at least 32 characters, distinct from `JWT_REFRESH_SECRET`)
- `JWT_REFRESH_SECRET` (at least 32 characters, distinct from `JWT_SECRET`)
- `CORS_ORIGINS` (comma-separated frontend URLs, e.g. `http://localhost:5173,http://localhost:3000`)

Generate secure random secrets on any OS:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Install, Migrate & Seed
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Start the Server
```bash
npm run start:dev
```

Verify health:
- Liveness: `http://localhost:3010/api/health`
- Readiness (`SELECT 1` DB check): `http://localhost:3010/api/health/ready`
- Swagger UI: `http://localhost:3010/api/docs`

### Running with Docker Compose
`docker-compose.yml` at the repository root starts the whole app: PostgreSQL, the API and the
nginx-served React UI.
```bash
cp docker.env.example .env   # once, then set real secrets
docker compose up -d --build
```
`JWT_SECRET` and `JWT_REFRESH_SECRET` (>= 32 chars each, distinct) are required in that `.env`.

- UI: http://localhost:3000
- API: http://localhost:3010/api (Swagger at `/api/docs`)

Stop with `docker compose down` (`-v` also deletes the database and uploads).

---

## Seeded Development Accounts

In development, `npm run prisma:seed` uses `SEED_DEFAULT_PASSWORD` (defaults to `Password123@` in non-production environments; required explicitly in `NODE_ENV=production`).

| Role | Name | Identifier (National Code) | Student Number | Email |
| --- | --- | --- | --- | --- |
| `ADMIN` | علیرضا حسینی | `0098765432` | — | `internship_office@semnan.ac.ir` |
| `PROFESSOR` | دکتر محمد رضایی | `0011223344` | — | `rezaei@semnan.ac.ir` |
| `PROFESSOR` | دکتر سارا احمدی | `0022334455` | — | `ahmadi_s@semnan.ac.ir` |
| `STUDENT` | محمد احمدی | `0021345678` | `400105432` | `m.ahmadi@semnan.ac.ir` |
| `STUDENT` | علی رضایی | `0019876543` | `400108921` | `a.rezaei@semnan.ac.ir` |
| `STUDENT` | سارا محمدی | `0032145698` | `400201456` | `s.mohammadi@semnan.ac.ir` |

---

## Available npm Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Start API in watch mode on `PORT` (default `3010`) |
| `npm run build` | Compile NestJS (`dist/main.js`) and regenerate `docs/openapi.json` |
| `npm run build:seed` | Compile `prisma/seed.ts` to `dist-seed/seed.js` |
| `npm run lint` | Run strict TypeScript type-checking (`tsc --noEmit`) |
| `npm run test` | Run unit tests (`src/**/*.spec.ts`) |
| `npm run test:cov` | Run unit tests with Jest coverage threshold enforcement |
| `npm run test:e2e` | Run full HTTP E2E suite (in-memory Prisma service) |
| `npm run test:integration` | Run real PostgreSQL integration suite (`DATABASE_URL` required) |
| `npm run openapi:generate` | Regenerate `docs/openapi.json` without a live DB |

---

## Troubleshooting

### 1. Startup Fails with `Invalid environment configuration`
All required env vars are validated at startup via Zod (`src/common/config/env.validation.ts`).
- `PORT` must be an integer `1..65535` (never `0` or empty text).
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters and different from one another.
- In `NODE_ENV=production`, wildcard `CORS_ORIGINS=*` and placeholder secrets starting with `change_me` are rejected.

### 2. CORS Blocked in Browser (`Origin ... is not allowed by CORS policy`)
Add your exact frontend origin (scheme + host + port, no trailing slash) to `CORS_ORIGINS` in `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3010
```
Restart the backend after editing `.env`.

### 3. Document Upload Rejected (400) or Download Returns 404
- Uploads are validated by extension, MIME type, **and** binary magic bytes (e.g. a renamed `.txt` file with a `.pdf` extension is rejected).
- Allowed formats: PDF, DOC, DOCX, JPG/JPEG, PNG up to `MAX_FILE_SIZE_MB` (default `10`).
- Direct `/api/uploads/...` static URLs are disabled by design. Always download files through authenticated `GET /api/documents/download/:id` with a `Bearer` token.
- If `GET /api/documents/download/:id` returns `404` for a seeded demo document, that is expected because seeded metadata records do not have physical binaries on disk until a real file is uploaded.

### 4. Password Reset Emails Not Sending Locally
If `SMTP_URL` is empty in development, the backend logs a startup warning and skips SMTP delivery (in production, configure `SMTP_URL` and `SMTP_FROM` so reset emails are delivered).
