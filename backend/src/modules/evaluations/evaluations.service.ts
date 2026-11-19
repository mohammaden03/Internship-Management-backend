import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy } from '../../common/utils/query.utils';
import { Evaluation, InternshipStatus, Role } from '@prisma/client';

const EVALUATION_SORT_FIELDS = ['id', 'finalScore', 'createdAt'] as const;

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    dto: CreateEvaluationDto,
    professorId: number,
    userId: number,
  ): Promise<Evaluation> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
      include: {
        student: { include: { user: { select: SAFE_USER_SELECT } } },
        professor: { include: { user: { select: SAFE_USER_SELECT } } },
        company: true,
      },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    if (internship.professorId !== professorId) {
      throw new ForbiddenException('You can only evaluate students assigned under your supervision');
    }

    const existingEval = await this.prisma.evaluation.findUnique({
      where: { internshipId: dto.internshipId },
    });
    if (existingEval) {
      throw new ConflictException('An evaluation for this internship has already been submitted');
    }

    // Weighted average out of 20
    const finalScore = parseFloat(
      (
        dto.technicalSkill * 0.3 +
        dto.responsibility * 0.2 +
        dto.discipline * 0.15 +
        dto.teamwork * 0.15 +
        dto.attendance * 0.2
      ).toFixed(2),
    );

    const evaluation = await this.prisma.$transaction(async (tx) => {
      const createdEval = await tx.evaluation.create({
        data: {
          internshipId: dto.internshipId,
          technicalSkill: dto.technicalSkill,
          responsibility: dto.responsibility,
          discipline: dto.discipline,
          teamwork: dto.teamwork,
          attendance: dto.attendance,
          description: dto.description,
          finalScore,
        },
      });

      await tx.internship.update({
        where: { id: dto.internshipId },
        data: {
          status: InternshipStatus.COMPLETED,
          progressPercentage: 100,
        },
      });

      return createdEval;
    });

    await this.notificationsService.create({
      userId: internship.student.user.id,
      title: 'ثبت ارزیابی نهایی دوره کارآموزی',
      message: `ارزیابی نهایی و نمره کارآموزی شما در شرکت ${internship.company.name} با نمره نهایی ${finalScore} از ۲۰ توسط استاد ناظر ثبت شد.`,
    });

    await this.activityLogsService.log({
      userId,
      action: `ثبت ارزیابی نهایی برای دانشجو ${internship.student.user.firstName} ${internship.student.user.lastName} با نمره ${finalScore}/20`,
    });

    return evaluation;
  }

  async findAll(
    query: PaginationQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (user.role === Role.PROFESSOR) {
      if (!user.professorId) {
        return {
          items: [],
          meta: { totalItems: 0, itemCount: 0, itemsPerPage: limit, totalPages: 0, currentPage: page },
        };
      }
      where.internship = { professorId: user.professorId };
    } else if (user.role === Role.STUDENT) {
      if (!user.studentId) {
        return {
          items: [],
          meta: { totalItems: 0, itemCount: 0, itemsPerPage: limit, totalPages: 0, currentPage: page },
        };
      }
      where.internship = { studentId: user.studentId };
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { internship: { student: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } } },
        { internship: { student: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } } },
        { internship: { company: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, EVALUATION_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
      this.prisma.evaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          internship: {
            include: {
              student: { include: { user: { select: SAFE_USER_SELECT } } },
              professor: { include: { user: { select: SAFE_USER_SELECT } } },
              company: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.evaluation.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<any> {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            student: { include: { user: { select: SAFE_USER_SELECT } } },
            professor: { include: { user: { select: SAFE_USER_SELECT } } },
            company: true,
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID '${id}' not found`);
    }

    if (user.role === Role.STUDENT && evaluation.internship.studentId !== user.studentId) {
      throw new ForbiddenException('You can only view your own evaluation');
    }
    if (user.role === Role.PROFESSOR && evaluation.internship.professorId !== user.professorId) {
      throw new ForbiddenException('You can only view evaluations of students under your supervision');
    }

    return evaluation;
  }

  async findByInternship(
    internshipId: number,
    user: AuthenticatedUser,
  ): Promise<Evaluation | null> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${internshipId}' not found`);
    }

    if (user.role === Role.STUDENT && internship.studentId !== user.studentId) {
      throw new ForbiddenException('You can only view your own internship evaluation');
    }
    if (user.role === Role.PROFESSOR && internship.professorId !== user.professorId) {
      throw new ForbiddenException('You can only view evaluations of internships under your supervision');
    }

    return this.prisma.evaluation.findUnique({
      where: { internshipId },
    });
  }
}
