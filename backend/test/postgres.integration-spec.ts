/**
 * Real PostgreSQL Integration Test Suite
 *
 * Runs against a real PostgreSQL instance configured via DATABASE_URL
 * (with migrations applied and prisma:seed executed).
 * Walks the complete lifecycle:
 *   login -> create request -> approve -> submit weekly report -> review -> evaluate
 * and asserts exact envelope & collection response shapes against Postgres.
 */
import './setup-test-env';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Real PostgreSQL Integration Flow (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let professorToken: string;
  let studentToken: string;

  let companyId: number;
  let professorId: number;
  let requestId: number;
  let internshipId: number;
  let reportId: number;

  const uniqueTerm = `PG-INT-${Date.now()}`;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set to run PostgreSQL integration tests');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up only records created by this integration run
    if (prisma && internshipId) {
      await prisma.evaluation.deleteMany({ where: { internshipId } }).catch(() => undefined);
      await prisma.weeklyReport.deleteMany({ where: { internshipId } }).catch(() => undefined);
      await prisma.document.deleteMany({ where: { internshipId } }).catch(() => undefined);
      await prisma.internship.deleteMany({ where: { id: internshipId } }).catch(() => undefined);
    }
    if (prisma && requestId) {
      await prisma.internshipRequest.deleteMany({ where: { id: requestId } }).catch(() => undefined);
    }
    if (app) {
      await app.close();
    }
  });

  it('GET /api/health/ready verifies live PostgreSQL connectivity via SELECT 1', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/ready').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ status: 'ready', database: 'up' });
  });

  it('Authenticates seeded ADMIN, PROFESSOR, and STUDENT accounts against PostgreSQL', async () => {
    const password = process.env.SEED_DEFAULT_PASSWORD || 'Password123@';

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: '0098765432', password })
      .expect(200);
    adminToken = adminRes.body.data.accessToken;
    expect(adminRes.body.data.role).toBe('ADMIN');

    const profRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: '0011223344', password })
      .expect(200);
    professorToken = profRes.body.data.accessToken;
    professorId = profRes.body.data.user.professorId;
    expect(typeof professorId).toBe('number');

    const stuRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: '0021345678', password })
      .expect(200);
    studentToken = stuRes.body.data.accessToken;
    expect(stuRes.body.data.role).toBe('STUDENT');

    const companiesRes = await request(app.getHttpServer())
      .get('/api/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(companiesRes.body.data.items)).toBe(true);
    expect(companiesRes.body.data.meta).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
      }),
    );
    companyId = companiesRes.body.data.items[0].id;
  });

  it('Walks login -> create request -> approve -> weekly report -> evaluation in PostgreSQL', async () => {
    // 1. Create request
    const createReqRes = await request(app.getHttpServer())
      .post('/api/internship-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        companyId,
        title: 'PostgreSQL Integration Internship',
        description: 'End-to-end integration test against real PostgreSQL',
        academicTerm: uniqueTerm,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-09-30T00:00:00.000Z',
        totalHours: 240,
      })
      .expect(201);
    requestId = createReqRes.body.data.id;
    expect(createReqRes.body.data.status).toBe('PENDING');

    // 2. Approve request -> auto-creates ACTIVE internship
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/internship-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED', professorId })
      .expect(200);
    internshipId = approveRes.body.data.internship.id;
    expect(approveRes.body.data.internship.status).toBe('ACTIVE');

    // 3. Submit weekly report
    const reportRes = await request(app.getHttpServer())
      .post('/api/weekly-reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        internshipId,
        weekNumber: 1,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-07T00:00:00.000Z',
        activities: 'Integration workflow testing',
        skillsLearned: 'PostgreSQL, Prisma, NestJS',
        description: 'Week 1 report',
      })
      .expect(201);
    reportId = reportRes.body.data.id;

    // Verify uniform { items, meta: null } shape on /weekly-reports/internship/:id
    const reportsByIntern = await request(app.getHttpServer())
      .get(`/api/weekly-reports/internship/${internshipId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(Array.isArray(reportsByIntern.body.data.items)).toBe(true);
    expect(reportsByIntern.body.data.meta).toBeNull();

    // 4. Professor reviews report
    await request(app.getHttpServer())
      .patch(`/api/weekly-reports/${reportId}/review`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ status: 'APPROVED', professorComment: 'Verified in Postgres integration suite' })
      .expect(200);

    // 5. Professor submits evaluation -> completes internship
    const evalRes = await request(app.getHttpServer())
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        internshipId,
        technicalSkill: 19,
        responsibility: 18,
        discipline: 20,
        teamwork: 18,
        attendance: 20,
        description: 'Completed PostgreSQL integration lifecycle',
      })
      .expect(201);
    expect(evalRes.body.data.finalScore).toBe(19);
  });
});
