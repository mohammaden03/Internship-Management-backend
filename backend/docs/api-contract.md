# API Contract — University Internship Management Backend

- **Base URL**: `http://localhost:3010/api`
- **Swagger UI**: `http://localhost:3010/api/docs`
- **Machine-readable OpenAPI 3.0 spec**: `backend/docs/openapi.json` (regenerated on every `npm run build`)

---

## 1. Response Envelopes

### Success Envelope
Every non-binary JSON endpoint is wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {},
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

### Error Envelope
Every error is formatted by `AllExceptionsFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-07-01T12:00:00.000Z",
  "path": "/api/internships/abc",
  "method": "GET",
  "requestId": "9a7f3f3a-...",
  "error": "Bad Request",
  "message": "Validation failed (numeric string is expected)"
}
```

Every response also includes the `X-Request-Id` header (echoing a valid client-supplied `X-Request-Id` or generating a UUID v4).

---

## 2. Uniform Collection Contract (`{ items, meta }`)

**Every** collection endpoint returns `{ items: T[], meta: PaginationMeta | null }`. Bare arrays are never returned.

### Paginated Collection (`meta` is an object)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "items": [],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "searchTerm": null,
      "sortBy": "id",
      "sortOrder": "desc"
    }
  },
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

Query parameters supported on paginated routes:
- `page`: integer `>= 1` (default `1`)
- `limit`: integer `1..100` (default `10`; values `> 100` are capped to `100`)
- `search`: optional string (trimmed, max 100 chars)
- `sortBy`: allow-listed field per resource (unknown fields fall back safely to resource default)
- `sortOrder`: `'asc' | 'desc'` (default `'desc'`)
- `status` / `role`: validated enum filter (`400` on invalid enum value)

### Non-Paginated Collection (`meta` is `null`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "items": [],
    "meta": null
  },
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

### Complete Collection Endpoint Inventory

| Endpoint | Roles | `meta` |
| --- | --- | --- |
| `GET /api/users` | ADMIN | `PaginationMeta` |
| `GET /api/students` | ADMIN, PROFESSOR | `PaginationMeta` |
| `GET /api/professors` | ADMIN, PROFESSOR, STUDENT | `PaginationMeta` |
| `GET /api/professors/assigned-students` | PROFESSOR | `PaginationMeta` |
| `GET /api/companies` | Authenticated | `PaginationMeta` |
| `GET /api/internships` | ADMIN, PROFESSOR | `PaginationMeta` |
| `GET /api/internships/supervised` | PROFESSOR | `PaginationMeta` |
| `GET /api/internships/my` | STUDENT | `null` |
| `GET /api/internship-requests` | ADMIN, PROFESSOR | `PaginationMeta` |
| `GET /api/internship-requests/my` | STUDENT | `PaginationMeta` |
| `GET /api/weekly-reports` | ADMIN, PROFESSOR, STUDENT | `PaginationMeta` |
| `GET /api/weekly-reports/internship/:internshipId` | Role-scoped | `null` |
| `GET /api/documents/internship/:internshipId` | Role-scoped | `null` |
| `GET /api/evaluations` | ADMIN, PROFESSOR, STUDENT | `PaginationMeta` |
| `GET /api/notifications/my` | Authenticated | `PaginationMeta` |
| `GET /api/activity-logs` | ADMIN | `PaginationMeta` |
| `GET /api/activity-logs/my` | Authenticated | `PaginationMeta` |
| `GET /api/audit-logs` | ADMIN | `PaginationMeta` |

---

## 3. Authentication, Refresh Rotation & Password Reset

### Headers
Send `Authorization: Bearer <accessToken>` on all protected routes.

### Login (`POST /api/auth/login`)
- Body: `{ "identifier": "0021345678", "password": "Password123@" }`
  - `identifier` max 128 chars (national code, student number, or email)
  - `password` max 72 chars
- Returns `{ accessToken, refreshToken, tokenType: "Bearer", role, user }`.

### Public Registration (`POST /api/auth/register`)
- Always creates a `STUDENT` account (ignores any `role` elevation attempt).
- Password policy: 8–72 chars with uppercase, lowercase, digit, and symbol.

### Refresh Token Rotation (`POST /api/auth/refresh`)
- Body: `{ "refreshToken": "<jwt>" }`
- Every refresh issues a **new** `accessToken` + **new** `refreshToken` and immediately revokes the previous refresh token.
- Refresh tokens are stored in PostgreSQL as SHA-256 hashes only (`RefreshToken` table).
- **Reuse detection**: Presenting an already-rotated/revoked refresh token revokes the entire token family, logs `REFRESH_REUSE_DETECTED` to `AuditLog`, and returns `401 Unauthorized`.

### Password Reset Lifecycle
1. `POST /api/auth/forgot-password` with `{ "identifier": "..." }` -> always returns `202 Accepted` with identical generic message (no user enumeration). Invalidates prior unused tokens for that user, stores a SHA-256 hashed 1-hour token, and sends a reset link via SMTP.
2. `POST /api/auth/reset-password` with `{ "token": "<raw>", "newPassword": "<strong-password>" }` -> validates token + expiry + strong password policy, hashes new password with bcrypt, marks token used, revokes **all** active refresh tokens for that user, and returns `200 OK` (or generic `400 Bad Request` on invalid/expired/reused token).

---

## 4. Document Upload & Protected Downloads

- Public `/api/uploads/...` static serving is **removed**.
- `POST /api/documents/upload` (`multipart/form-data`: `file`, `internshipId`, `documentType`):
  - Validates extension whitelist (`.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`), MIME type, binary magic bytes, and `MAX_FILE_SIZE_MB`.
  - Deduplicates identical files per internship using SHA-256 (`deduplicated: true`).
  - Returns `{ id, internshipId, fileName, originalName, mimeType, size, sha256, documentType, uploadedAt, downloadUrl, deduplicated }`. Does **not** return a public `fileUrl`.
- `GET /api/documents/download/:id`:
  - Requires JWT auth and role/ownership authorization.
  - Streams actual stored bytes with `Content-Type`, sanitized `Content-Disposition`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`.
  - Returns `404 Not Found` if the document or backing binary is missing (never synthesizes placeholder files).

---

## 5. Workflow State Transitions & Uniqueness Guards

- **Internship Requests**:
  - Only one non-rejected, non-deleted request per `(studentId, companyId, academicTerm)` (`409 Conflict`).
  - Cannot create a new request if the student already has an `ACTIVE` internship in the same `academicTerm` (`409 Conflict`).
  - Transitions: `PENDING -> APPROVED | REJECTED`. Any other transition returns `409 Conflict`.
- **Internships**:
  - Only one `ACTIVE` non-deleted internship per `(studentId, academicTerm)` (`409 Conflict`).
  - Transitions: `PENDING -> ACTIVE | REJECTED | CANCELLED`; `ACTIVE -> COMPLETED | CANCELLED`. Terminal states (`COMPLETED`, `REJECTED`, `CANCELLED`) reject transitions with `409 Conflict`.

---

## 6. Profile Self-Update, Settings, Health & Observability

- **Self-Profile Updates** (strict whitelists; non-editable fields return `400`):
  - `PATCH /api/users/profile/me`: `firstName`, `lastName`, `phoneNumber`
  - `PATCH /api/students/me`: `firstName`, `lastName`, `phoneNumber`, `faculty`, `major`, `degreeLevel`
  - `PATCH /api/professors/me`: `firstName`, `lastName`, `phoneNumber`, `department`, `academicRank`
- **Settings**:
  - `GET /api/settings/public` (public): `universityName`, `academicTerm`, `letterDeadline`, `registrationStart`, `registrationEnd`, `gradingDeadline`, `minHours`, `maxWeeklyHours`, `autoIssueLetter`, `insuranceEnabled`
  - `GET /api/settings` (authenticated) & `PATCH /api/settings` (ADMIN)
- **Health & Metrics**:
  - `GET /api/health` (public): liveness probe `{ status: "ok" }`
  - `GET /api/health/ready` (public): readiness probe running `SELECT 1` -> `200 { status: "ready", database: "up" }` or `503`
  - `GET /api/metrics` (ADMIN): total requests, average/max latency, 2xx/3xx/4xx/5xx buckets
  - `GET /api/audit-logs` (ADMIN): paginated security & governance audit events
