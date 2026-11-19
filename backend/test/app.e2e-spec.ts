import './setup-test-env';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { rmSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { MailService } from '../src/common/mail/mail.service';
import { InMemoryPrismaService } from './in-memory-prisma.service';

function assertNoSecrets(payload: unknown) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain('"password"');
  expect(serialized).not.toContain('"refreshToken"');
  expect(serialized).not.toContain('"tokenHash"');
}

function assertPaginatedEnvelope(body: any) {
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data.items)).toBe(true);
  expect(body.data.meta).toEqual(
    expect.objectContaining({
      total: expect.any(Number),
      page: expect.any(Number),
      limit: expect.any(Number),
      totalPages: expect.any(Number),
    }),
  );
}

function assertUnpaginatedEnvelope(body: any) {
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data.items)).toBe(true);
  expect(body.data.meta).toBeNull();
}

describe('University Internship Backend API (e2e)', () => {
  let app: INestApplication;
  let mailService: MailService;
  let inMemoryPrisma: InMemoryPrismaService;

  let adminToken: string;
  let prof1Token: string;
  let prof2Token: string;
  let stu1Token: string;
  let stu2Token: string;
  let stu1RefreshToken: string;

  let createdRequestId: number;
  let createdInternshipId: number;
  let createdReportId: number;
  let uploadedDocId: number;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    if (process.env.USE_REAL_DB !== 'true') {
      moduleBuilder.overrideProvider(PrismaService).useClass(InMemoryPrismaService);
    }

    const moduleFixture: TestingModule = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    mailService = app.get(MailService);
    inMemoryPrisma = app.get(PrismaService) as unknown as InMemoryPrismaService;
  });

  afterAll(async () => {
    await app.close();
    rmSync(resolve(process.cwd(), 'uploads', 'test-documents'), {
      recursive: true,
      force: true,
    });
  });

  describe('Health, Readiness, Request-ID & Metrics', () => {
    it('GET /api/health and GET /api/health/ready return 200 and echo X-Request-Id', async () => {
      const liveRes = await request(app.getHttpServer())
        .get('/api/health')
        .set('X-Request-Id', 'req-trace-12345')
        .expect(200);
      expect(liveRes.headers['x-request-id']).toBe('req-trace-12345');
      expect(liveRes.body.success).toBe(true);
      expect(liveRes.body.data).toEqual({ status: 'ok' });

      const readyRes = await request(app.getHttpServer()).get('/api/health/ready').expect(200);
      expect(readyRes.headers['x-request-id']).toBeTruthy();
      expect(readyRes.body.data).toEqual({ status: 'ready', database: 'up' });
    });
  });

  describe('Auth, Refresh Rotation, Reuse Detection & Password Reset Lifecycle', () => {
    it('POST /api/auth/login authenticates ADMIN, PROFESSOR, and STUDENT with integer IDs', async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '0098765432', password: 'Password123@' })
        .expect(200);
      expect(adminRes.body.data.role).toBe('ADMIN');
      expect(typeof adminRes.body.data.user.id).toBe('number');
      adminToken = adminRes.body.data.accessToken;

      const prof1Res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '0011223344', password: 'Password123@' })
        .expect(200);
      expect(prof1Res.body.data.role).toBe('PROFESSOR');
      expect(typeof prof1Res.body.data.user.professorId).toBe('number');
      prof1Token = prof1Res.body.data.accessToken;

      const prof2Res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '0022334455', password: 'Password123@' })
        .expect(200);
      expect(prof2Res.body.data.role).toBe('PROFESSOR');
      prof2Token = prof2Res.body.data.accessToken;

      const stu1Res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '400105432', password: 'Password123@' })
        .expect(200);
      expect(stu1Res.body.data.role).toBe('STUDENT');
      expect(typeof stu1Res.body.data.user.studentId).toBe('number');
      stu1Token = stu1Res.body.data.accessToken;
      stu1RefreshToken = stu1Res.body.data.refreshToken;

      const stu2Res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '0019876543', password: 'Password123@' })
        .expect(200);
      expect(stu2Res.body.data.role).toBe('STUDENT');
      stu2Token = stu2Res.body.data.accessToken;
    });

    it('POST /api/auth/login enforces input length caps (identifier <= 128, password <= 72)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: 'a'.repeat(129), password: 'Password123@' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '0098765432', password: 'P'.repeat(73) })
        .expect(400);
    });

    it('GET /api/auth/me and GET /api/users/profile/me match and omit secrets', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      const profileRes = await request(app.getHttpServer())
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);

      expect(meRes.body.data.id).toBe(profileRes.body.data.id);
      expect(typeof meRes.body.data.studentId).toBe('number');
      expect(meRes.body.data.professorId).toBeNull();
      assertNoSecrets(meRes.body.data);
      assertNoSecrets(profileRes.body.data);
    });

    it('POST /api/auth/refresh rotates tokens and revokes entire family on reuse detection', async () => {
      const firstRefresh = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: stu1RefreshToken })
        .expect(200);

      const rotatedRefreshToken = firstRefresh.body.data.refreshToken;
      expect(rotatedRefreshToken).toBeDefined();
      expect(rotatedRefreshToken).not.toBe(stu1RefreshToken);
      stu1Token = firstRefresh.body.data.accessToken;

      // Replaying the already-rotated old token must return 401 AND revoke the new token too
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: stu1RefreshToken })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(401);
    });

    it('POST /api/auth/register enforces strong password policy and forces STUDENT role', async () => {
      // Weak password rejected with 400
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          firstName: 'تست',
          lastName: 'رمز',
          email: 'weak.pass@semnan.ac.ir',
          nationalCode: '0099112233',
          password: 'password',
          studentNumber: '402991122',
        })
        .expect(400);

      // Strong password succeeds and forces STUDENT even if role=ADMIN is supplied
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          firstName: 'تست',
          lastName: 'امنیتی',
          email: 'security.test@semnan.ac.ir',
          nationalCode: '0099887766',
          password: 'Password123@',
          role: 'ADMIN',
          studentNumber: '402999888',
        })
        .expect(201);

      expect(res.body.data.role).toBe('STUDENT');
      expect(res.body.data.user.role).toBe('STUDENT');

      await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`)
        .expect(403);
    });

    it('Complete password reset lifecycle: forgot -> reset -> old password fails -> new password logs in -> token reuse fails', async () => {
      const forgotUnknown = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ identifier: 'nobody@semnan.ac.ir' })
        .expect(202);

      const forgotExisting = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ identifier: 'security.test@semnan.ac.ir' })
        .expect(202);

      // Identical generic message prevents account enumeration
      expect(forgotExisting.body.data.message).toBe(forgotUnknown.body.data.message);
      const sentPayload = mailService.lastSentResetPayload;
      expect(sentPayload).not.toBeNull();
      expect(sentPayload?.to).toBe('security.test@semnan.ac.ir');
      const rawToken = sentPayload!.rawToken;

      // Weak new password rejected
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: rawToken, newPassword: 'weak' })
        .expect(400);

      // Valid reset succeeds
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: rawToken, newPassword: 'NewStrongPass456!' })
        .expect(200);

      // Old password fails
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: 'security.test@semnan.ac.ir', password: 'Password123@' })
        .expect(401);

      // New password succeeds
      const loginNewRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: 'security.test@semnan.ac.ir', password: 'NewStrongPass456!' })
        .expect(200);
      expect(loginNewRes.body.data.accessToken).toBeDefined();

      // Reusing the reset token fails with 400
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: rawToken, newPassword: 'AnotherPass789!' })
        .expect(400);
    });
  });

  describe('[B1] Uniform Collection Response Shape Across EVERY List Endpoint', () => {
    it('Every paginated collection endpoint returns { items: T[], meta: { total, page, limit, totalPages } }', async () => {
      const paginatedRoutes: Array<{ path: string; token: string }> = [
        { path: '/api/users', token: adminToken },
        { path: '/api/students', token: adminToken },
        { path: '/api/professors', token: adminToken },
        { path: '/api/professors/assigned-students', token: prof1Token },
        { path: '/api/companies', token: adminToken },
        { path: '/api/internships', token: adminToken },
        { path: '/api/internships/supervised', token: prof1Token },
        { path: '/api/internship-requests', token: adminToken },
        { path: '/api/internship-requests/my', token: stu1Token },
        { path: '/api/weekly-reports', token: adminToken },
        { path: '/api/notifications/my', token: stu1Token },
        { path: '/api/evaluations', token: adminToken },
        { path: '/api/activity-logs', token: adminToken },
        { path: '/api/activity-logs/my', token: stu1Token },
        { path: '/api/audit-logs', token: adminToken },
      ];

      for (const route of paginatedRoutes) {
        const res = await request(app.getHttpServer())
          .get(route.path)
          .set('Authorization', `Bearer ${route.token}`)
          .expect(200);
        assertPaginatedEnvelope(res.body);
        assertNoSecrets(res.body.data);
      }
    });

    it('Every non-paginated collection endpoint returns { items: T[], meta: null } (never a bare array)', async () => {
      const myInternshipsRes = await request(app.getHttpServer())
        .get('/api/internships/my')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      assertUnpaginatedEnvelope(myInternshipsRes.body);
      expect(myInternshipsRes.body.data.items.length).toBeGreaterThan(0);

      const reportsByInternRes = await request(app.getHttpServer())
        .get('/api/weekly-reports/internship/1')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      assertUnpaginatedEnvelope(reportsByInternRes.body);

      const docsByInternRes = await request(app.getHttpServer())
        .get('/api/documents/internship/1')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      assertUnpaginatedEnvelope(docsByInternRes.body);
    });

    it('Pagination caps limit > 100 to 100, validates status enums, and wires searchTerm/sortBy into meta', async () => {
      const cappedRes = await request(app.getHttpServer())
        .get('/api/companies?page=1&limit=500&search=فناور&sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assertPaginatedEnvelope(cappedRes.body);
      expect(cappedRes.body.data.meta.limit).toBe(100);
      expect(cappedRes.body.data.meta.searchTerm).toBe('فناور');
      expect(cappedRes.body.data.meta.sortBy).toBe('name');
      expect(cappedRes.body.data.meta.sortOrder).toBe('asc');

      await request(app.getHttpServer())
        .get('/api/companies?sortBy=nonExistentColumn')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/weekly-reports?status=INVALID')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('Invalid non-numeric IDs return 400 instead of 500 across endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/companies/not-a-number')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/students/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/internships/xyz')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .patch('/api/notifications/bad-id/read')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(400);
    });
  });

  describe('[A3] Dashboard, Settings & [A9] Metrics / [A5] Profile Update DTO Parity', () => {
    it('GET /api/settings/public works without auth and GET/PATCH /api/settings persists universityName & academicTerm', async () => {
      const publicRes = await request(app.getHttpServer())
        .get('/api/settings/public')
        .expect(200);
      expect(publicRes.body.data.universityName).toBeDefined();
      expect(publicRes.body.data.academicTerm).toBe('تابستان ۱۴۰۳');

      await request(app.getHttpServer())
        .patch('/api/settings')
        .set('Authorization', `Bearer ${stu1Token}`)
        .send({ minHours: 300 })
        .expect(403);

      const patchRes = await request(app.getHttpServer())
        .patch('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ minHours: 260, insuranceEnabled: false, universityName: 'دانشگاه سمنان - دانشکده کامپیوتر' })
        .expect(200);
      expect(patchRes.body.data.minHours).toBe(260);
      expect(patchRes.body.data.insuranceEnabled).toBe(false);
    });

    it('GET /api/dashboard/stats and GET /api/metrics are ADMIN-only', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(403);

      const statsRes = await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(statsRes.body.data).toEqual(
        expect.objectContaining({
          totalStudents: expect.any(Number),
          totalProfessors: expect.any(Number),
          totalCompanies: expect.any(Number),
          activeInternships: expect.any(Number),
          pendingRequests: expect.any(Number),
          completedInternships: expect.any(Number),
          currentTerm: 'تابستان ۱۴۰۳',
        }),
      );

      await request(app.getHttpServer())
        .get('/api/metrics')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(403);

      const metricsRes = await request(app.getHttpServer())
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(metricsRes.body.data.totalRequests).toBeGreaterThan(0);
      expect(metricsRes.body.data.statusBuckets).toEqual(
        expect.objectContaining({
          '2xx': expect.any(Number),
          '4xx': expect.any(Number),
        }),
      );
    });

    it('Self-profile update endpoints allow editable fields and reject privileged/immutable fields with 400', async () => {
      const stuPatch = await request(app.getHttpServer())
        .patch('/api/students/me')
        .set('Authorization', `Bearer ${stu1Token}`)
        .send({ major: 'مهندسی نرم‌افزار پیشرفته' })
        .expect(200);
      expect(stuPatch.body.data.major).toBe('مهندسی نرم‌افزار پیشرفته');

      // Non-whitelisted fields rejected by forbidNonWhitelisted
      await request(app.getHttpServer())
        .patch('/api/students/me')
        .set('Authorization', `Bearer ${stu1Token}`)
        .send({ studentNumber: '999999999' })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/api/users/profile/me')
        .set('Authorization', `Bearer ${stu1Token}`)
        .send({ role: 'ADMIN' })
        .expect(400);

      const profPatch = await request(app.getHttpServer())
        .patch('/api/professors/me')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ academicRank: 'استاد تمام' })
        .expect(200);
      expect(profPatch.body.data.academicRank).toBe('استاد تمام');
    });
  });

  describe('[A4] Workflow Integrity, Role Scoping, Documents [B4/A8] & Soft Delete [A7]', () => {
    it('Student creates request -> duplicate (student, company, term) returns 409 -> Admin approves -> Internship created', async () => {
      const reqPayload = {
        companyId: 1,
        title: 'کارآموزی یادگیری ماشین',
        description: 'توسعه مدل‌های یادگیری ماشین در محیط واقعی',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-09-30T00:00:00.000Z',
        totalHours: 240,
      };

      const reqRes = await request(app.getHttpServer())
        .post('/api/internship-requests')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send(reqPayload)
        .expect(201);

      expect(typeof reqRes.body.data.id).toBe('number');
      expect(reqRes.body.data.status).toBe('PENDING');
      expect(reqRes.body.data.academicTerm).toBe('تابستان ۱۴۰۳');
      createdRequestId = reqRes.body.data.id;

      // [A4] Duplicate non-rejected request for same (student, company, term) -> 409
      await request(app.getHttpServer())
        .post('/api/internship-requests')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send(reqPayload)
        .expect(409);

      const approveRes = await request(app.getHttpServer())
        .patch(`/api/internship-requests/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED', professorId: 1 })
        .expect(200);

      expect(approveRes.body.data.request.status).toBe('APPROVED');
      expect(approveRes.body.data.internship.status).toBe('ACTIVE');
      createdInternshipId = approveRes.body.data.internship.id;

      // [A4] Transitioning an already APPROVED request -> 409 Conflict
      await request(app.getHttpServer())
        .patch(`/api/internship-requests/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'REJECTED', rejectionReason: 'Too late' })
        .expect(409);

      // [A4] Student with an ACTIVE internship in same term cannot create another request in that term -> 409
      await request(app.getHttpServer())
        .post('/api/internship-requests')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send({
          ...reqPayload,
          companyId: 2,
          title: 'دومین درخواست همزمان در همان ترم',
        })
        .expect(409);
    });

    it('Student submits weekly report, duplicate week returns 409, professor reviews & scoping enforced', async () => {
      const reportRes = await request(app.getHttpServer())
        .post('/api/weekly-reports')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send({
          internshipId: createdInternshipId,
          weekNumber: 1,
          startDate: '2026-07-01T00:00:00.000Z',
          endDate: '2026-07-07T00:00:00.000Z',
          activities: 'آماده‌سازی دیتاست و پیش‌پردازش داده‌ها',
          skillsLearned: 'Python, Pandas, Scikit-learn',
          challenges: 'داده‌های گمشده',
          description: 'گزارش هفته اول کارآموزی یادگیری ماشین',
        })
        .expect(201);
      createdReportId = reportRes.body.data.id;

      await request(app.getHttpServer())
        .post('/api/weekly-reports')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send({
          internshipId: createdInternshipId,
          weekNumber: 1,
          startDate: '2026-07-01T00:00:00.000Z',
          endDate: '2026-07-07T00:00:00.000Z',
          activities: 'تکراری',
          skillsLearned: 'Python',
          description: 'تکراری',
        })
        .expect(409);

      // Unassigned professor receives 403
      await request(app.getHttpServer())
        .patch(`/api/weekly-reports/${createdReportId}/review`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .send({ status: 'APPROVED', professorComment: 'غیرمجاز' })
        .expect(403);

      // Assigned professor approves
      const approvedRes = await request(app.getHttpServer())
        .patch(`/api/weekly-reports/${createdReportId}/review`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ status: 'APPROVED', professorComment: 'بسیار عالی و دقیق است.' })
        .expect(200);
      expect(approvedRes.body.data.status).toBe('APPROVED');
    });

    it('Documents: magic-byte validation, SHA-256 dedup, NO public static URL, authenticated download, 404 on missing binary', async () => {
      const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');

      const uploadRes = await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${stu2Token}`)
        .field('internshipId', String(createdInternshipId))
        .field('documentType', 'INTRODUCTION_LETTER')
        .attach('file', pdfBytes, {
          filename: 'letter.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      uploadedDocId = uploadRes.body.data.id;
      expect(typeof uploadedDocId).toBe('number');
      // [B4] Must NOT return public fileUrl
      expect(uploadRes.body.data.fileUrl).toBeUndefined();
      expect(uploadRes.body.data.downloadUrl).toBe(`/api/documents/download/${uploadedDocId}`);
      expect(uploadRes.body.data.sha256).toHaveLength(64);
      expect(uploadRes.body.data.deduplicated).toBe(false);

      // [A8] Duplicate upload for same internship deduplicates cleanly
      const dupUploadRes = await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${stu2Token}`)
        .field('internshipId', String(createdInternshipId))
        .field('documentType', 'INTRODUCTION_LETTER')
        .attach('file', pdfBytes, {
          filename: 'letter-copy.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      expect(dupUploadRes.body.data.id).toBe(uploadedDocId);
      expect(dupUploadRes.body.data.deduplicated).toBe(true);

      // [B4] Spoofed PDF extension with non-PDF magic bytes rejected with 400
      await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${stu2Token}`)
        .field('internshipId', String(createdInternshipId))
        .field('documentType', 'OTHER')
        .attach('file', Buffer.from('<script>alert(1)</script>'), {
          filename: 'evil.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      // [B4] Public /api/uploads/ static path MUST NOT be mounted (404)
      await request(app.getHttpServer()).get('/api/uploads/documents/letter.pdf').expect(404);

      // [B4] Unauthenticated download rejected with 401
      await request(app.getHttpServer())
        .get(`/api/documents/download/${uploadedDocId}`)
        .expect(401);

      // [B4] Unassigned professor rejected with 403
      await request(app.getHttpServer())
        .get(`/api/documents/download/${uploadedDocId}`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(403);

      // [B4] Authorized student downloads real PDF bytes
      const downloadRes = await request(app.getHttpServer())
        .get(`/api/documents/download/${uploadedDocId}`)
        .set('Authorization', `Bearer ${stu2Token}`)
        .expect(200);
      expect(downloadRes.headers['content-type']).toContain('application/pdf');
      expect(downloadRes.headers['x-content-type-options']).toBe('nosniff');
      expect(downloadRes.headers['content-disposition']).toContain('attachment');

      // [B4] Seeded doc #1 has no backing file on disk -> MUST return 404 (not fake PDF!)
      await request(app.getHttpServer())
        .get('/api/documents/download/1')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(404);
    });

    it('Evaluations compute weighted score, complete internship, and invalid transition COMPLETED -> ACTIVE returns 409', async () => {
      const payload = {
        internshipId: createdInternshipId,
        technicalSkill: 19,
        responsibility: 18,
        discipline: 20,
        teamwork: 18,
        attendance: 20,
        description: 'ارزیابی نهایی با عملکرد ممتاز',
      };

      const evalRes = await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send(payload)
        .expect(201);
      expect(evalRes.body.data.finalScore).toBe(19);

      // [A4] COMPLETED is terminal; transitioning back to ACTIVE must return 409
      await request(app.getHttpServer())
        .patch(`/api/internships/${createdInternshipId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(409);
    });

    it('[A7] Soft delete hides internship from API (404) while preserving row with deletedAt in DB', async () => {
      await request(app.getHttpServer())
        .delete(`/api/internships/${createdInternshipId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/internships/${createdInternshipId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      if (process.env.USE_REAL_DB !== 'true') {
        const rawRow = inMemoryPrisma
          .getRawTable('internship')
          .find((r) => r.id === createdInternshipId);
        expect(rawRow).toBeDefined();
        expect(rawRow?.deletedAt).toBeInstanceOf(Date);
      }
    });
  });
});
