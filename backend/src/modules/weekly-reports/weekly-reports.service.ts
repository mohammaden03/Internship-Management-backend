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
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { ReportStatus, Role, WeeklyReport } from '@prisma/client';

@Injectable()
export class WeeklyReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(studentId: string, userId: string, dto: CreateWeeklyReportDto): Promise<WeeklyReport> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
      include: {
        professor: { include: { user: true } },
        student: { include: { user: true } },
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
      throw new ConflictException(`Weekly report for week ${dto.weekNumber} already exists`);
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

    // Notify supervising professor
    await this.notificationsService.create({
      userId: internship.professor.user.id,
      title: 'ارسال گزارش هفتگی جدید',
      message: `دانشجو ${internship.student.user.firstName} ${internship.student.user.lastName} گزارش هفتگی شماره ${dto.weekNumber} را ارسال نمود.`,
    });

    // Automated Activity Log
    await this.activityLogsService.log({
      userId,
      action: `ثبت و ارسال گزارش هفتگی شماره ${dto.weekNumber} برای کارآموزی ${internship.id.slice(0, 8)}`,
    });

    return report;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status as ReportStatus;
    }
    if (query.search) {
      where.OR = [
        { activities: { contains: query.search, mode: 'insensitive' } },
        { skillsLearned: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { internship: { student: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } } },
        { internship: { student: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.weeklyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { weekNumber: 'asc' },
        include: {
          internship: {
            include: {
              student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
              company: { select: { id: true, name: true } },
              professor: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      }),
      this.prisma.weeklyReport.count({ where }),
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

  async findByInternship(internshipId: string): Promise<WeeklyReport[]> {
    return this.prisma.weeklyReport.findMany({
      where: { internshipId },
      orderBy: { weekNumber: 'asc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const report = await this.prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            student: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            professor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            company: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Weekly report with ID '${id}' not found`);
    }

    return report;
  }

  async review(
    id: string,
    dto: ReviewWeeklyReportDto,
    professorId: string | null,
    userRole: Role,
    userId: string,
  ) {
    const report = await this.findOne(id);

    if (userRole === Role.PROFESSOR && report.internship.professorId !== professorId) {
      throw new ForbiddenException('You can only review reports for your assigned students');
    }

    if (dto.status !== ReportStatus.APPROVED && dto.status !== ReportStatus.REJECTED) {
      throw new BadRequestException('Status must be either APPROVED or REJECTED');
    }

    const updated = await this.prisma.weeklyReport.update({
      where: { id },
      data: {
        status: dto.status,
        professorComment: dto.professorComment,
      },
    });

    const studentUserId = report.internship.student.user.id;

    // Automated Notifications
    if (dto.status === ReportStatus.APPROVED) {
      await this.notificationsService.create({
        userId: studentUserId,
        title: `تأیید گزارش هفتگی شماره ${report.weekNumber}`,
        message: dto.professorComment
          ? `گزارش هفتگی شماره ${report.weekNumber} شما توسط استاد ناظر تأیید شد. نظر استاد: "${dto.professorComment}"`
          : `گزارش هفتگی شماره ${report.weekNumber} شما توسط استاد ناظر با موفقیت تأیید گردید.`,
      });

      // Update internship progress percentage
      const totalReports = await this.prisma.weeklyReport.count({
        where: { internshipId: report.internshipId, status: ReportStatus.APPROVED },
      });
      // Assuming 10 weeks full internship
      const progress = Math.min(100, totalReports * 10);
      await this.prisma.internship.update({
        where: { id: report.internshipId },
        data: { progressPercentage: progress },
      });

      // Automated Activity Log
      await this.activityLogsService.log({
        userId,
        action: `تأیید گزارش هفتگی شماره ${report.weekNumber} برای دانشجو ${report.internship.student.user.firstName} ${report.internship.student.user.lastName}`,
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
