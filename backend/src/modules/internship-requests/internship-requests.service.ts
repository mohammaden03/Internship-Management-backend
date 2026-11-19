import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SettingsService } from '../settings/settings.service';
import { AuditLogsService } from '../../common/audit/audit-logs.service';
import { CreateInternshipRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  PaginatedResponseDto,
} from '../../common/dto/paginated-response.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import {
  normalizePagination,
  normalizeSearchTerm,
  resolveSort,
  validateEnumFilter,
} from '../../common/utils/query.utils';
import { assertValidRequestTransition } from '../internships/internship-transitions';
import { RequestStatus, InternshipStatus } from '@prisma/client';

const REQUEST_SORT_FIELDS = [
  'id',
  'title',
  'academicTerm',
  'startDate',
  'endDate',
  'totalHours',
  'status',
  'createdAt',
  'updatedAt',
] as const;

interface RequestAuditMeta {
  ip?: string;
  requestId?: string;
}

@Injectable()
export class InternshipRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
    private settingsService: SettingsService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(studentId: number, userId: number, dto: CreateInternshipRequestDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.companyId}' not found`);
    }

    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const academicTerm =
      dto.academicTerm?.trim() || (await this.settingsService.getCurrentAcademicTerm());

    // [A4] Prevent duplicate non-rejected request for the same (student, company, term)
    const duplicateRequest = await this.prisma.internshipRequest.findFirst({
      where: {
        studentId,
        companyId: dto.companyId,
        academicTerm,
        deletedAt: null,
        status: { not: RequestStatus.REJECTED },
      },
    });
    if (duplicateRequest) {
      throw new ConflictException(
        `A non-rejected internship request for this company in term '${academicTerm}' already exists`,
      );
    }

    // [A4] Prevent creating a new request if student already has an ACTIVE internship in this term
    const activeInternship = await this.prisma.internship.findFirst({
      where: {
        studentId,
        academicTerm,
        status: InternshipStatus.ACTIVE,
        deletedAt: null,
      },
    });
    if (activeInternship) {
      throw new ConflictException(
        `Student already has an ACTIVE internship in academic term '${academicTerm}'`,
      );
    }

    const request = await this.prisma.internshipRequest.create({
      data: {
        studentId,
        companyId: dto.companyId,
        title: dto.title,
        description: dto.description,
        academicTerm,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalHours: dto.totalHours || 240,
        status: RequestStatus.PENDING,
      },
      include: {
        company: true,
        professor: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
        student: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      action: `ثبت درخواست کارآموزی جدید توسط دانشجو در شرکت ${company.name} برای عنوان "${dto.title}"`,
    });

    await this.notificationsService.create({
      userId,
      title: 'درخواست کارآموزی با موفقیت ثبت شد',
      message: `درخواست شما برای شرکت ${company.name} با وضعیت در انتظار بررسی (PENDING) ثبت گردید.`,
    });

    return request;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      REQUEST_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = { deletedAt: null };
    const statusFilter = validateEnumFilter(query.status, RequestStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { academicTerm: { contains: searchTerm, mode: 'insensitive' } },
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.internshipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          student: {
            include: {
              user: { select: SAFE_USER_SELECT },
            },
          },
          company: true,
          professor: {
            include: {
              user: { select: SAFE_USER_SELECT },
            },
          },
          internship: {
            select: { id: true, status: true, progressPercentage: true, deletedAt: true },
          },
        },
      }),
      this.prisma.internshipRequest.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findMyRequests(
    studentId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      REQUEST_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = { studentId, deletedAt: null };
    const statusFilter = validateEnumFilter(query.status, RequestStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.internshipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          company: true,
          professor: {
            include: { user: { select: SAFE_USER_SELECT } },
          },
          internship: {
            include: {
              professor: {
                include: { user: { select: SAFE_USER_SELECT } },
              },
            },
          },
        },
      }),
      this.prisma.internshipRequest.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: number) {
    const request = await this.prisma.internshipRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
        company: true,
        professor: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
        internship: {
          include: {
            professor: {
              include: { user: { select: SAFE_USER_SELECT } },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Internship Request with ID '${id}' not found`);
    }

    return request;
  }

  async updateStatus(
    id: number,
    dto: UpdateRequestStatusDto,
    adminUserId: number,
    meta: RequestAuditMeta = {},
  ) {
    const request = await this.findOne(id);

    // [A4] Enforce valid transition (PENDING -> APPROVED | REJECTED only; 409 on illegal transition)
    assertValidRequestTransition(request.status, dto.status);

    const studentUserId = request.student.user.id;
    const academicTerm =
      request.academicTerm || (await this.settingsService.getCurrentAcademicTerm());

    if (dto.status === RequestStatus.APPROVED) {
      if (!dto.professorId) {
        throw new BadRequestException(
          'A supervising professor (professorId) must be assigned when approving an internship request',
        );
      }

      const professor = await this.prisma.professor.findUnique({
        where: { id: dto.professorId },
        include: { user: { select: SAFE_USER_SELECT } },
      });
      if (!professor) {
        throw new NotFoundException(`Professor with ID '${dto.professorId}' not found`);
      }

      const existingInternship = await this.prisma.internship.findUnique({
        where: { requestId: request.id },
      });
      if (existingInternship && !existingInternship.deletedAt) {
        throw new ConflictException('An internship has already been created for this request');
      }

      // [A4] Only one ACTIVE internship per student per academic term
      const existingActiveInTerm = await this.prisma.internship.findFirst({
        where: {
          studentId: request.studentId,
          academicTerm,
          status: InternshipStatus.ACTIVE,
          deletedAt: null,
        },
      });
      if (existingActiveInTerm) {
        throw new ConflictException(
          `Student already has an ACTIVE internship in academic term '${academicTerm}'`,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedReq = await tx.internshipRequest.update({
          where: { id },
          data: {
            status: RequestStatus.APPROVED,
            professorId: dto.professorId!,
            rejectionReason: null,
          },
          include: {
            student: { include: { user: { select: SAFE_USER_SELECT } } },
            professor: { include: { user: { select: SAFE_USER_SELECT } } },
            company: true,
          },
        });

        const newInternship = await tx.internship.create({
          data: {
            studentId: request.studentId,
            professorId: dto.professorId!,
            companyId: request.companyId,
            requestId: request.id,
            academicTerm,
            startDate: request.startDate,
            endDate: request.endDate,
            progressPercentage: 0,
            status: InternshipStatus.ACTIVE,
          },
          include: {
            student: { include: { user: { select: SAFE_USER_SELECT } } },
            professor: { include: { user: { select: SAFE_USER_SELECT } } },
            company: true,
          },
        });

        return { request: updatedReq, internship: newInternship };
      });

      await this.notificationsService.create({
        userId: studentUserId,
        title: 'تأیید درخواست کارآموزی',
        message: `درخواست کارآموزی شما در شرکت ${request.company.name} تأیید شد و استاد ناظر (${professor.user.firstName} ${professor.user.lastName}) تعیین گردید.`,
      });

      await this.notificationsService.create({
        userId: professor.user.id,
        title: 'تخصیص دانشجو جدید برای نظارت کارآموزی',
        message: `دانشجو ${request.student.user.firstName} ${request.student.user.lastName} در شرکت ${request.company.name} به عنوان کارآموز تحت نظارت شما تعیین گردید.`,
      });

      await this.activityLogsService.log({
        userId: adminUserId,
        action: `تأیید درخواست کارآموزی شماره ${String(request.id)} و انتصاب استاد ناظر`,
      });

      await this.auditLogsService.record({
        actorId: adminUserId,
        event: 'REQUEST_APPROVED',
        entityType: 'InternshipRequest',
        entityId: request.id,
        ip: meta.ip,
        requestId: meta.requestId,
        metadata: {
          internshipId: result.internship.id,
          professorId: dto.professorId,
          academicTerm,
        },
      });

      return result;
    }

    const updatedReq = await this.prisma.internshipRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: dto.rejectionReason ?? null,
      },
      include: {
        student: { include: { user: { select: SAFE_USER_SELECT } } },
        professor: { include: { user: { select: SAFE_USER_SELECT } } },
        company: true,
      },
    });

    await this.notificationsService.create({
      userId: studentUserId,
      title: 'عدم تأیید درخواست کارآموزی',
      message: dto.rejectionReason
        ? `درخواست کارآموزی شما برای شرکت ${request.company.name} رد شد. دلیل: ${dto.rejectionReason}`
        : `درخواست کارآموزی شما برای شرکت ${request.company.name} مورد تأیید قرار نگرفت.`,
    });

    await this.activityLogsService.log({
      userId: adminUserId,
      action: `رد درخواست کارآموزی شماره ${String(request.id)}`,
    });

    await this.auditLogsService.record({
      actorId: adminUserId,
      event: 'REQUEST_REJECTED',
      entityType: 'InternshipRequest',
      entityId: request.id,
      ip: meta.ip,
      requestId: meta.requestId,
      metadata: { rejectionReason: dto.rejectionReason ?? null },
    });

    return updatedReq;
  }

  async remove(id: number, adminUserId: number, meta: RequestAuditMeta = {}) {
    await this.findOne(id);
    await this.prisma.internshipRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditLogsService.record({
      actorId: adminUserId,
      event: 'REQUEST_SOFT_DELETED',
      entityType: 'InternshipRequest',
      entityId: id,
      ip: meta.ip,
      requestId: meta.requestId,
    });
    return { message: `Internship Request with ID '${id}' archived` };
  }
}
