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
import { Evaluation, InternshipStatus, Role } from '@prisma/client';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    dto: CreateEvaluationDto,
    professorId: string | null,
    userRole: Role,
    userId: string,
  ): Promise<Evaluation> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
      include: {
        student: { include: { user: true } },
        professor: { include: { user: true } },
        company: true,
      },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    if (userRole === Role.PROFESSOR && internship.professorId !== professorId) {
      throw new ForbiddenException('You can only evaluate students assigned under your supervision');
    }

    const existingEval = await this.prisma.evaluation.findUnique({
      where: { internshipId: dto.internshipId },
    });
    if (existingEval) {
      throw new ConflictException('An evaluation for this internship has already been submitted');
    }

    // Calculate final score as weighted average (out of 20)
    const finalScore = parseFloat(
      (
        (dto.technicalSkill * 0.3 +
          dto.responsibility * 0.2 +
          dto.discipline * 0.15 +
          dto.teamwork * 0.15 +
          dto.attendance * 0.2)
      ).toFixed(2),
    );

    // Save evaluation and update internship to COMPLETED
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

    // Automated Notification to student
    await this.notificationsService.create({
      userId: internship.student.user.id,
      title: 'ثبت ارزیابی نهایی دوره کارآموزی',
      message: `ارزیابی نهایی و نمره کارآموزی شما در شرکت ${internship.company.name} با نمره نهایی ${finalScore} از ۲۰ توسط استاد ناظر ثبت شد.`,
    });

    // Automated Activity Log
    await this.activityLogsService.log({
      userId,
      action: `ثبت ارزیابی نهایی برای دانشجو ${internship.student.user.firstName} ${internship.student.user.lastName} با نمره ${finalScore}/20`,
    });

    return evaluation;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { internship: { student: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } } },
        { internship: { student: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } } },
        { internship: { company: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.evaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          internship: {
            include: {
              student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
              professor: { include: { user: { select: { firstName: true, lastName: true } } } },
              company: { select: { name: true } },
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

  async findOne(id: string): Promise<any> {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            professor: { include: { user: { select: { firstName: true, lastName: true } } } },
            company: true,
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID '${id}' not found`);
    }

    return evaluation;
  }

  async findByInternship(internshipId: string): Promise<Evaluation | null> {
    return this.prisma.evaluation.findUnique({
      where: { internshipId },
    });
  }
}
