import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateWeeklyReportDto } from './dto/create-report.dto';
import { ReviewWeeklyReportDto } from './dto/review-report.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildCollectionResponse,
  buildPaginatedResponse,
  PaginatedResponseDto,
} from '../../common/dto/paginated-response.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import {
  normalizePagination,
  normalizeSearchTerm,
  resolveSort,
  validateEnumFilter,
} from '../../common/utils/query.utils';
import { ReportStatus, Role, WeeklyReport } from '@prisma/client';

const REPORT_SORT_FIELDS = [
  'id',
  'weekNumber',
  'startDate',
  'endDate',
  'status',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class WeeklyReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    studentId: number,
    userId: number,
    dto: CreateWeeklyReportDto,
  ): Promise<WeeklyReport> {
    const internship = await this.prisma.internship.findFirst({
      where: { id: dto.internshipId, deletedAt: null },
      include: {
        professor: { include: { user: { select: SAFE_USER_SELECT } } },
        student: { include: { user: { select: SAFE_USER_SELECT } } },
      },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    if (internship.studentId !== studentId) {
      throw new ForbiddenException('You can only submit weekly reports for your own internship');
    }

    const existingReport = await this.prisma.weeklyReport.findUnique({
      where: {
        internshipId_weekNumber: {
          internshipId: dto.internshipId,
          weekNumber: dto.weekNumber,
        },
      },
    });

    if (existingReport) {
      throw new ConflictException(
        `گزارش هفتگی شماره ${dto.weekNumber} برای این دوره کارآموزی قبلاً ثبت شده است.`,
      );
    }

    const report = await this.prisma.weeklyReport.create({
      data: {
        internshipId: dto.internshipId,
        weekNumber: dto.weekNumber,
        startDate: dto.startDate,
        endDate: dto.endDate,
        activities: dto.activities,
        skillsLearned: dto.skillsLearned,
        challenges: dto.challenges,
        description: dto.description,
        status: ReportStatus.SUBMITTED,
      },
    });

    await this.notificationsService.create({
      userId: internship.professor.user.id,
      title: 'ارسال گزارش هفتگی جدید',
      message: `دانشجو ${internship.student.user.firstName} ${internship.student.user.lastName} گزارش هفتگی شماره ${dto.weekNumber} را ارسال نمود.`,
    });

    await this.activityLogsService.log({
      userId,
      action: `ثبت و ارسال گزارش هفتگی شماره ${dto.weekNumber} برای کارآموزی ${String(internship.id)}`,
    });

    return report;
  }

  async findAll(
    query: PaginationQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      REPORT_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = {
      internship: { deletedAt: null },
    };

    if (user.role === Role.PROFESSOR) {
      if (!user.professorId) {
        return buildPaginatedResponse([], 0, page, limit, {
          searchTerm,
          sortBy,
          sortOrder,
        });
      }
      where.internship.professorId = user.professorId;
    } else if (user.role === Role.STUDENT) {
      if (!user.studentId) {
        return buildPaginatedResponse([], 0, page, limit, {
          searchTerm,
          sortBy,
          sortOrder,
        });
      }
      where.internship.studentId = user.studentId;
    }

    const statusFilter = validateEnumFilter(query.status, ReportStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }

    if (searchTerm) {
      where.OR = [
        { activities: { contains: searchTerm, mode: 'insensitive' } },
        { skillsLearned: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        {
          internship: {
            student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
          },
        },
        {
          internship: {
            student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.weeklyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          internship: {
            include: {
              student: { include: { user: { select: SAFE_USER_SELECT } } },
              company: { select: { id: true, name: true } },
              professor: { include: { user: { select: SAFE_USER_SELECT } } },
            },
          },
        },
      }),
      this.prisma.weeklyReport.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findByInternship(
    internshipId: number,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<WeeklyReport>> {
    const internship = await this.prisma.internship.findFirst({
      where: { id: internshipId, deletedAt: null },
    });
    if (!internship) {
      throw new NotFoundException(`Internship with ID '${internshipId}' not found`);
    }

    if (user.role === Role.STUDENT && internship.studentId !== user.studentId) {
      throw new ForbiddenException('You can only view weekly reports for your own internship');
    }
    if (user.role === Role.PROFESSOR && internship.professorId !== user.professorId) {
      throw new ForbiddenException(
        'You can only view weekly reports for internships under your supervision',
      );
    }

    const items = await this.prisma.weeklyReport.findMany({
      where: { internshipId },
      orderBy: { weekNumber: 'asc' },
    });

    return buildCollectionResponse(items);
  }

  async findOne(id: number, user?: AuthenticatedUser): Promise<any> {
    const report = await this.prisma.weeklyReport.findUnique({
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

    if (!report || report.internship?.deletedAt) {
      throw new NotFoundException(`Weekly report with ID '${id}' not found`);
    }

    if (user?.role === Role.STUDENT && report.internship.studentId !== user.studentId) {
      throw new ForbiddenException('You can only view your own weekly reports');
    }
    if (user?.role === Role.PROFESSOR && report.internship.professorId !== user.professorId) {
      throw new ForbiddenException(
        'You can only view weekly reports of students under your supervision',
      );
    }

    return report;
  }

  async review(
    id: number,
    dto: ReviewWeeklyReportDto,
    professorId: number | null,
    userRole: Role,
    userId: number,
  ) {
    const report = await this.findOne(id);

    if (userRole === Role.PROFESSOR && report.internship.professorId !== professorId) {
      throw new ForbiddenException('You can only review reports for your assigned students');
    }

    const allowedReviewStatuses: ReportStatus[] = [
      ReportStatus.APPROVED,
      ReportStatus.REJECTED,
      ReportStatus.NEEDS_REVISION,
    ];
    if (!allowedReviewStatuses.includes(dto.status)) {
      throw new BadRequestException('Status must be APPROVED, REJECTED, or NEEDS_REVISION');
    }

    const updated = await this.prisma.weeklyReport.update({
      where: { id },
      data: {
        status: dto.status,
        professorComment: dto.professorComment,
      },
    });

    const studentUserId = report.internship.student.user.id;

    if (dto.status === ReportStatus.APPROVED) {
      await this.notificationsService.create({
        userId: studentUserId,
        title: `تأیید گزارش هفتگی شماره ${report.weekNumber}`,
        message: dto.professorComment
          ? `گزارش هفتگی شماره ${report.weekNumber} شما توسط استاد ناظر تأیید شد. نظر استاد: "${dto.professorComment}"`
          : `گزارش هفتگی شماره ${report.weekNumber} شما توسط استاد ناظر با موفقیت تأیید گردید.`,
      });

      const totalReports = await this.prisma.weeklyReport.count({
        where: { internshipId: report.internshipId, status: ReportStatus.APPROVED },
      });
      const progress = Math.min(100, totalReports * 10);
      await this.prisma.internship.update({
        where: { id: report.internshipId },
        data: { progressPercentage: progress },
      });

      await this.activityLogsService.log({
        userId,
        action: `تأیید گزارش هفتگی شماره ${report.weekNumber} برای دانشجو ${report.internship.student.user.firstName} ${report.internship.student.user.lastName}`,
      });
    } else if (dto.status === ReportStatus.NEEDS_REVISION) {
      await this.notificationsService.create({
        userId: studentUserId,
        title: `نیاز به اصلاح گزارش هفتگی شماره ${report.weekNumber}`,
        message: dto.professorComment
          ? `گزارش هفتگی شماره ${report.weekNumber} نیاز به اصلاح دارد. نظر استاد: "${dto.professorComment}"`
          : `گزارش هفتگی شماره ${report.weekNumber} برای اصلاح و بازنگری بازگشت داده شد.`,
      });

      await this.activityLogsService.log({
        userId,
        action: `درخواست اصلاح گزارش هفتگی شماره ${report.weekNumber}`,
      });
    } else {
      await this.notificationsService.create({
        userId: studentUserId,
        title: `عدم تأیید گزارش هفتگی شماره ${report.weekNumber}`,
        message: dto.professorComment
          ? `گزارش هفتگی شما نیاز به بازبینی دارد. دلیل: "${dto.professorComment}"`
          : `گزارش هفتگی شماره ${report.weekNumber} شما رد شد و نیاز به اصلاح دارد.`,
      });

      await this.activityLogsService.log({
        userId,
        action: `رد گزارش هفتگی شماره ${report.weekNumber} جهت بازنگری`,
      });
    }

    return updated;
  }
}
