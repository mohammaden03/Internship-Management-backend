import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InternshipStatus, Role } from '@prisma/client';
import {
  calculateWeightedEvaluationScore,
  EvaluationsService,
} from './evaluations.service';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let prisma: any;
  let notificationsService: any;
  let activityLogsService: any;

  beforeEach(() => {
    prisma = {
      internship: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      evaluation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    notificationsService = { create: jest.fn().mockResolvedValue(undefined) };
    activityLogsService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new EvaluationsService(prisma, notificationsService, activityLogsService);
  });

  it('computes weighted score accurately (30% tech, 20% resp, 15% disc, 15% team, 20% att)', () => {
    expect(
      calculateWeightedEvaluationScore({
        technicalSkill: 20,
        responsibility: 20,
        discipline: 20,
        teamwork: 20,
        attendance: 20,
      }),
    ).toBe(20);

    expect(
      calculateWeightedEvaluationScore({
        technicalSkill: 18.5,
        responsibility: 17,
        discipline: 19,
        teamwork: 16.5,
        attendance: 20,
      }),
    ).toBe(18.28);

    expect(
      calculateWeightedEvaluationScore({
        technicalSkill: 19,
        responsibility: 18,
        discipline: 20,
        teamwork: 18,
        attendance: 20,
      }),
    ).toBe(19);
  });

  it('creates evaluation, marks internship COMPLETED with 100% progress, and notifies student', async () => {
    prisma.internship.findFirst.mockResolvedValue({
      id: 5,
      professorId: 2,
      studentId: 3,
      deletedAt: null,
      student: { user: { id: 30, firstName: 'Ali', lastName: 'Rezaei' } },
      professor: { user: { id: 20, firstName: 'Dr', lastName: 'Prof' } },
      company: { id: 1, name: 'TechCorp' },
    });
    prisma.evaluation.findUnique.mockResolvedValue(null);
    prisma.evaluation.create.mockImplementation(async ({ data }: any) => ({ id: 99, ...data }));
    prisma.internship.update.mockResolvedValue({});

    const created = await service.create(
      {
        internshipId: 5,
        technicalSkill: 19,
        responsibility: 18,
        discipline: 20,
        teamwork: 18,
        attendance: 20,
        description: 'Excellent performance',
      },
      2,
      20,
    );

    expect(created.finalScore).toBe(19);
    expect(prisma.internship.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: InternshipStatus.COMPLETED, progressPercentage: 100 },
    });
    expect(notificationsService.create).toHaveBeenCalledTimes(1);
    expect(activityLogsService.log).toHaveBeenCalledTimes(1);
  });

  it('rejects missing internship (404), non-supervising professor (403), and duplicate evaluation (409)', async () => {
    const dto = {
      internshipId: 5,
      technicalSkill: 18,
      responsibility: 18,
      discipline: 18,
      teamwork: 18,
      attendance: 18,
      description: 'Test',
    };

    prisma.internship.findFirst.mockResolvedValueOnce(null);
    await expect(service.create(dto, 2, 20)).rejects.toThrow(NotFoundException);

    prisma.internship.findFirst.mockResolvedValueOnce({ id: 5, professorId: 99 });
    await expect(service.create(dto, 2, 20)).rejects.toThrow(ForbiddenException);

    prisma.internship.findFirst.mockResolvedValueOnce({ id: 5, professorId: 2 });
    prisma.evaluation.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(service.create(dto, 2, 20)).rejects.toThrow(ConflictException);
  });

  it('returns uniform paginated response scoped by role', async () => {
    prisma.evaluation.findMany.mockResolvedValue([{ id: 1, finalScore: 19 }]);
    prisma.evaluation.count.mockResolvedValue(1);

    const res = await service.findAll(
      { page: 1, limit: 10 },
      { userId: 1, email: 'a@b.c', role: Role.ADMIN, studentId: null, professorId: null },
    );

    expect(res.items).toHaveLength(1);
    expect(res.meta).toEqual(
      expect.objectContaining({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    );
  });
});
