import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, Role } from '@prisma/client';
import { WeeklyReportsService } from './weekly-reports.service';

describe('WeeklyReportsService', () => {
  let service: WeeklyReportsService;
  let prisma: any;
  let notificationsService: any;
  let activityLogsService: any;

  beforeEach(() => {
    prisma = {
      internship: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      weeklyReport: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    notificationsService = { create: jest.fn().mockResolvedValue(undefined) };
    activityLogsService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new WeeklyReportsService(prisma, notificationsService, activityLogsService);
  });

  it('creates a weekly report, notifies professor, and rejects duplicates with 409', async () => {
    const dto = {
      internshipId: 10,
      weekNumber: 2,
      startDate: new Date('2026-07-08'),
      endDate: new Date('2026-07-14'),
      activities: 'Implemented API endpoints',
      skillsLearned: 'NestJS',
      description: 'Week 2',
    };

    prisma.internship.findFirst.mockResolvedValue({
      id: 10,
      studentId: 7,
      professorId: 3,
      deletedAt: null,
      professor: { user: { id: 30 } },
      student: { user: { id: 70, firstName: 'Sara', lastName: 'M' } },
    });
    prisma.weeklyReport.findUnique.mockResolvedValueOnce(null);
    prisma.weeklyReport.create.mockResolvedValue({ id: 101, ...dto, status: ReportStatus.SUBMITTED });

    const created = await service.create(7, 70, dto);
    expect(created.status).toBe(ReportStatus.SUBMITTED);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 30 }),
    );

    prisma.weeklyReport.findUnique.mockResolvedValueOnce({ id: 101 });
    await expect(service.create(7, 70, dto)).rejects.toThrow(ConflictException);
  });

  it('enforces student ownership on create and returns { items, meta: null } on findByInternship', async () => {
    prisma.internship.findFirst.mockResolvedValue({
      id: 10,
      studentId: 99,
      professorId: 3,
      deletedAt: null,
    });

    await expect(
      service.create(7, 70, {
        internshipId: 10,
        weekNumber: 1,
        startDate: new Date(),
        endDate: new Date(),
        activities: 'x',
        skillsLearned: 'y',
        description: 'z',
      }),
    ).rejects.toThrow(ForbiddenException);

    prisma.weeklyReport.findMany.mockResolvedValue([{ id: 1, weekNumber: 1 }]);
    const listRes = await service.findByInternship(10, {
      userId: 1,
      email: 'admin@u.ir',
      role: Role.ADMIN,
      studentId: null,
      professorId: null,
    });
    expect(listRes).toEqual({ items: [{ id: 1, weekNumber: 1 }], meta: null });
  });

  it('reviews report, updates progress on APPROVED, and rejects non-assigned professors or invalid statuses', async () => {
    prisma.weeklyReport.findUnique.mockResolvedValue({
      id: 50,
      internshipId: 10,
      weekNumber: 3,
      internship: {
        professorId: 3,
        studentId: 7,
        deletedAt: null,
        student: { user: { id: 70, firstName: 'Sara', lastName: 'M' } },
      },
    });

    await expect(
      service.review(50, { status: ReportStatus.APPROVED }, 999, Role.PROFESSOR, 99),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.review(50, { status: ReportStatus.DRAFT }, 3, Role.PROFESSOR, 30),
    ).rejects.toThrow(BadRequestException);

    prisma.weeklyReport.update.mockResolvedValue({ id: 50, status: ReportStatus.APPROVED });
    prisma.weeklyReport.count.mockResolvedValue(4);
    prisma.internship.update.mockResolvedValue({});

    const reviewed = await service.review(
      50,
      { status: ReportStatus.APPROVED, professorComment: 'Great' },
      3,
      Role.PROFESSOR,
      30,
    );
    expect(reviewed.status).toBe(ReportStatus.APPROVED);
    expect(prisma.internship.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { progressPercentage: 40 },
    });

    prisma.weeklyReport.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
