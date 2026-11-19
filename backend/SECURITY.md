# Security Policy & Architecture

## Security Controls Implemented

### 1. Authentication & Session Integrity
- **No hardcoded secrets**: `JWT_SECRET` and `JWT_REFRESH_SECRET` are strictly validated at startup via Zod (minimum 32 characters, distinct values, banned defaults and production placeholders rejected).
- **Rotating hashed refresh tokens**: Refresh tokens are stored in the `RefreshToken` table exclusively as SHA-256 hashes. Every call to `POST /api/auth/refresh` rotates the token and revokes its predecessor. Presenting a revoked refresh token triggers **reuse detection**, revoking the entire token family and logging a `REFRESH_REUSE_DETECTED` security audit event.
- **Password hashing & policy**: Passwords are hashed with bcrypt (10 rounds). Registration and password resets require 8–72 characters containing uppercase, lowercase, numeric, and special characters. Login inputs are length-capped (`identifier <= 128`, `password <= 72`).
- **Role escalation prevention**: Public registration (`POST /api/auth/register`) unconditionally assigns `Role.STUDENT`. Self-profile update endpoints use strict whitelisted DTOs with `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- **Password reset safety**: `POST /api/auth/forgot-password` returns an identical `202 Accepted` response regardless of account existence (anti-enumeration), invalidates prior unused tokens, stores only SHA-256 hashes with a 1-hour TTL, and never logs raw reset tokens in production. `POST /api/auth/reset-password` revokes all active refresh tokens upon success.

### 2. Document Storage & Download Security
- **No public static upload directory**: Express static serving for `/api/uploads/` is completely removed.
- **Authenticated, role-scoped downloads**: Files are served solely through `GET /api/documents/download/:id`, verifying JWT authentication and student/professor/admin ownership.
- **Magic-byte verification**: Uploads are validated against an extension allowlist, MIME allowlist, file-size limit, and binary magic-byte signatures (`%PDF-`, PNG, JPEG, OLE2 DOC, ZIP/DOCX).
- **Safe download headers**: Responses sanitize `Content-Disposition` filenames (RFC 5987 UTF-8 + ASCII fallback) and set `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`.
- **Path traversal protection**: `DiskStorageDriver` resolves and validates that every target storage key remains strictly inside the configured `UPLOAD_DESTINATION` root.

### 3. Transport, Headers & Rate Limiting
- **HTTP security headers**: Enabled globally via `helmet` with an explicit Content Security Policy and `Cross-Origin-Resource-Policy: same-site`.
- **Explicit CORS allowlist**: Configured via `CORS_ORIGINS` with `credentials: true`; wildcard origins are rejected in production.
- **Rate limiting**: Global `@nestjs/throttler` guard with stricter per-route limits on authentication endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`).

### 4. Auditability & Data Retention
- **Security Audit Log (`AuditLog`)**: Records `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `USER_REGISTERED`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS`, `REFRESH_REUSE_DETECTED`, `ROLE_CHANGED`, `REQUEST_APPROVED`, `REQUEST_REJECTED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DOWNLOADED`, and `DOCUMENT_DELETED` along with `actorId`, `ip`, `requestId`, and timestamp.
- **Soft Deletes**: `User`, `InternshipRequest`, `Internship`, and `Document` use `deletedAt` timestamps to preserve audit history while hiding archived records from standard queries.

---

## Reporting a Vulnerability

Please do **not** open public GitHub issues for security vulnerabilities. Report suspected security issues privately to the university IT security team (`internship_office@semnan.ac.ir`) with reproduction steps and affected endpoints.
