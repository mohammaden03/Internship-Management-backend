import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { InMemoryPrismaService } from './in-memory-prisma.service';

function assertNoSecrets(payload: unknown) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain('"password"');
  expect(serialized).not.toContain('"refreshToken"');
}

describe('University Internship Backend API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prof1Token: string;
  let prof2Token: string;
  let stu1Token: string;
  let stu2Token: string;
  let stu1RefreshToken: string;

  let createdRequestId: number;
  let createdInternshipId: number;
  let createdReportId: number;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health & Auth Flows', () => {
    it('GET /api/health returns 200 { status: ok }', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ status: 'ok' });
    });

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

    it('POST /api/auth/refresh renews tokens and POST /api/auth/forgot-password returns 202 without enumeration', async () => {
      const refreshRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: stu1RefreshToken })
        .expect(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      stu1Token = refreshRes.body.data.accessToken;

      const forgotExisting = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ identifier: 'm.ahmadi@semnan.ac.ir' })
        .expect(202);

      const forgotUnknown = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ identifier: 'nobody@semnan.ac.ir' })
        .expect(202);

      expect(forgotExisting.body.data.message).toBe(forgotUnknown.body.data.message);
    });

    it('POST /api/auth/register with role=ADMIN forces STUDENT role and never creates an ADMIN', async () => {
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

      // Verify token cannot access admin dashboard
      await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`)
        .expect(403);
    });
  });

  describe('Pagination, Filtering, Validation & Path Params', () => {
    it('GET /api/students and GET /api/internships return 200 without createdAt 500 error', async () => {
      const studentsRes = await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(studentsRes.body.data.items)).toBe(true);
      expect(studentsRes.body.data.items.length).toBeGreaterThan(0);
      assertNoSecrets(studentsRes.body.data);

      const internshipsRes = await request(app.getHttpServer())
        .get('/api/internships')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(internshipsRes.body.data.items)).toBe(true);
      expect(internshipsRes.body.data.items.length).toBeGreaterThan(0);
      assertNoSecrets(internshipsRes.body.data);
    });

    it('GET /api/users?role=STUDENT works, unknown sortBy falls back safely, invalid status returns 400', async () => {
      const usersRes = await request(app.getHttpServer())
        .get('/api/users?role=STUDENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(usersRes.body.data.items.every((u: any) => u.role === 'STUDENT')).toBe(true);
      assertNoSecrets(usersRes.body.data);

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

    it('GET /api/professors/me returns 200 with professor profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/professors/me')
        .set('Authorization', `Bearer ${prof1Token}`)
        .expect(200);
      expect(typeof res.body.data.id).toBe('number');
      expect(res.body.data.department).toBe('مهندسی کامپیوتر');
      assertNoSecrets(res.body.data);
    });
  });

  describe('Dashboard Stats & Settings', () => {
    it('GET /api/dashboard/stats returns real counts for ADMIN and 403 for STUDENT', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(403);

      const res = await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          totalStudents: expect.any(Number),
          totalProfessors: expect.any(Number),
          totalCompanies: expect.any(Number),
          activeInternships: expect.any(Number),
          pendingRequests: expect.any(Number),
          completedInternships: expect.any(Number),
        }),
      );
    });

    it('GET /api/settings works for authenticated users and PATCH /api/settings is ADMIN-only', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/api/settings')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      expect(getRes.body.data.minHours).toBe(240);

      await request(app.getHttpServer())
        .patch('/api/settings')
        .set('Authorization', `Bearer ${stu1Token}`)
        .send({ minHours: 300 })
        .expect(403);

      const patchRes = await request(app.getHttpServer())
        .patch('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ minHours: 260, insuranceEnabled: false })
        .expect(200);
      expect(patchRes.body.data.minHours).toBe(260);
      expect(patchRes.body.data.insuranceEnabled).toBe(false);
    });
  });

  describe('End-to-End Internship Workflow & Role Scoping', () => {
    it('Student creates request -> Admin approves with integer professorId -> Internship created', async () => {
      const reqRes = await request(app.getHttpServer())
        .post('/api/internship-requests')
        .set('Authorization', `Bearer ${stu2Token}`)
        .send({
          companyId: 1,
          title: 'کارآموزی یادگیری ماشین',
          description: 'توسعه مدل‌های یادگیری ماشین در محیط واقعی',
          startDate: '2026-07-01T00:00:00.000Z',
          endDate: '2026-09-30T00:00:00.000Z',
          totalHours: 240,
        })
        .expect(201);

      expect(typeof reqRes.body.data.id).toBe('number');
      expect(reqRes.body.data.status).toBe('PENDING');
      assertNoSecrets(reqRes.body.data);
      createdRequestId = reqRes.body.data.id;

      const approveRes = await request(app.getHttpServer())
        .patch(`/api/internship-requests/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED', professorId: 1 })
        .expect(200);

      expect(approveRes.body.data.request.status).toBe('APPROVED');
      expect(approveRes.body.data.request.professorId).toBe(1);
      expect(typeof approveRes.body.data.internship.id).toBe('number');
      expect(approveRes.body.data.internship.status).toBe('ACTIVE');
      assertNoSecrets(approveRes.body.data);
      createdInternshipId = approveRes.body.data.internship.id;
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

      expect(typeof reportRes.body.data.id).toBe('number');
      expect(reportRes.body.data.status).toBe('SUBMITTED');
      createdReportId = reportRes.body.data.id;

      // Duplicate week -> 409 Conflict with Persian message
      const dupRes = await request(app.getHttpServer())
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
      expect(String(dupRes.body.message)).toContain('قبلاً ثبت شده است');

      // Professor 2 MUST NOT see Professor 1's reports in GET /api/weekly-reports
      const prof2ReportsRes = await request(app.getHttpServer())
        .get('/api/weekly-reports')
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(200);
      expect(
        prof2ReportsRes.body.data.items.every(
          (r: any) => r.internship.professorId === 2,
        ),
      ).toBe(true);
      expect(
        prof2ReportsRes.body.data.items.some((r: any) => r.id === createdReportId),
      ).toBe(false);

      // Professor 2 MUST receive 403 when reading or reviewing Professor 1's report
      await request(app.getHttpServer())
        .get(`/api/weekly-reports/${createdReportId}`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/weekly-reports/${createdReportId}/review`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .send({ status: 'APPROVED', professorComment: 'غیرمجاز' })
        .expect(403);

      // Professor 1 reviews as NEEDS_REVISION then APPROVED
      const revisionRes = await request(app.getHttpServer())
        .patch(`/api/weekly-reports/${createdReportId}/review`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ status: 'NEEDS_REVISION', professorComment: 'لطفاً جزئیات بیشتری اضافه کنید.' })
        .expect(200);
      expect(revisionRes.body.data.status).toBe('NEEDS_REVISION');

      const approvedRes = await request(app.getHttpServer())
        .patch(`/api/weekly-reports/${createdReportId}/review`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ status: 'APPROVED', professorComment: 'بسیار عالی و دقیق است.' })
        .expect(200);
      expect(approvedRes.body.data.status).toBe('APPROVED');
    });

    it('Evaluations are professor-only, enforce ownership, compute weighted score, and prevent duplicates', async () => {
      const payload = {
        internshipId: createdInternshipId,
        technicalSkill: 19,
        responsibility: 18,
        discipline: 20,
        teamwork: 18,
        attendance: 20,
        description: 'ارزیابی نهایی با عملکرد ممتاز',
      };

      // Admin cannot create evaluation (professor-only)
      await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(403);

      // Unassigned Professor 2 cannot evaluate Professor 1's internship
      await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${prof2Token}`)
        .send(payload)
        .expect(403);

      // Assigned Professor 1 succeeds
      const evalRes = await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send(payload)
        .expect(201);
      expect(evalRes.body.data.finalScore).toBe(19);

      // Duplicate evaluation -> 409
      await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send(payload)
        .expect(409);
    });

    it('Notifications read and read-all work cleanly with numeric IDs', async () => {
      const myNotifs = await request(app.getHttpServer())
        .get('/api/notifications/my')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      const firstId = myNotifs.body.data.items[0].id;
      expect(typeof firstId).toBe('number');

      const readOneRes = await request(app.getHttpServer())
        .patch(`/api/notifications/${firstId}/read`)
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      expect(readOneRes.body.data.isRead).toBe(true);

      const readAllRes = await request(app.getHttpServer())
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${stu1Token}`)
        .expect(200);
      expect(typeof readAllRes.body.data.count).toBe('number');
    });

    it('Documents upload validates MIME type, returns consistent fileUrl/downloadUrl, and enforces role scoping', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${stu2Token}`)
        .field('internshipId', String(createdInternshipId))
        .field('documentType', 'INTRODUCTION_LETTER')
        .attach('file', Buffer.from('%PDF-1.4\nTest PDF\n%%EOF'), {
          filename: 'letter.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(typeof uploadRes.body.data.id).toBe('number');
      expect(uploadRes.body.data.fileUrl).toMatch(/^\/api\/uploads\/documents\//);
      expect(uploadRes.body.data.downloadUrl).toBe(
        `/api/documents/download/${uploadRes.body.data.id}`,
      );

      // Disallowed MIME type -> 400
      await request(app.getHttpServer())
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${stu2Token}`)
        .field('internshipId', String(createdInternshipId))
        .field('documentType', 'OTHER')
        .attach('file', Buffer.from('echo hi'), {
          filename: 'script.sh',
          contentType: 'application/x-sh',
        })
        .expect(400);

      // Unassigned professor cannot view student's documents
      await request(app.getHttpServer())
        .get(`/api/documents/internship/${createdInternshipId}`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(403);
    });
  });
});
