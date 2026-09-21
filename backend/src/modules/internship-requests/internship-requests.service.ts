import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateInternshipRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { RequestStatus, InternshipStatus, Role } from '@prisma/client';

@Injectable()
export class InternshipRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(studentId: string, userId: string, dto: CreateInternshipRequestDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.companyId}' not found`);
    }

    const request = await this.prisma.internshipRequest.create({
      data: {
        studentId,
        companyId: dto.companyId,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalHours: dto.totalHours || 240,
        status: RequestStatus.PENDING,
      },
      include: {
        company: true,
        student: {
          include: { user: true },
        },
      },
    });

    // Automated Activity Log
    await this.activityLogsService.log({
      userId,
      action: `ثبت درخواست کارآموزی جدید توسط دانشجو در شرکت ${company.name} برای عنوان "${dto.title}"`,
    });

    // Automated Notification to Student
    await this.notificationsService.create({
      userId,
      title: 'درخواست کارآموزی با موفقیت ثبت شد',
      message: `درخواست شما برای شرکت ${company.name} با وضعیت در انتظار بررسی (PENDING) ثبت گردید.`,
    });

    return request;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status as RequestStatus;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.internshipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          company: true,
          internship: {
            select: { id: true, status: true, progressPercentage: true },
          },
        },
      }),
      this.prisma.internshipRequest.count({ where }),
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

  async findMyRequests(studentId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { studentId };
    if (query.status) {
      where.status = query.status as RequestStatus;
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.internshipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: true,
          internship: {
            include: {
              professor: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } },
              },
            },
          },
        },
      }),
      this.prisma.internshipRequest.count({ where }),
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

  async findOne(id: string) {
    const request = await this.prisma.internshipRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
          },
        },
        company: true,
        internship: {
          include: {
            professor: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
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

  async updateStatus(id: string, dto: UpdateRequestStatusDto, adminUserId: string) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Internship request has already been finalized with status '${request.status}'`,
      );
    }

    const studentUserId = request.student.user.id;

    if (dto.status === RequestStatus.APPROVED) {
      if (!dto.professorId) {
        throw new BadRequestException(
          'A supervising professor (professorId) must be assigned when approving an internship request',
        );
      }

      const professor = await this.prisma.professor.findUnique({
        where: { id: dto.professorId },
        include: { user: true },
      });
      if (!professor) {
        throw new NotFoundException(`Professor with ID '${dto.professorId}' not found`);
      }

      // Execute atomic transaction: update request + create internship
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedReq = await tx.internshipRequest.update({
          where: { id },
          data: { status: RequestStatus.APPROVED },
        });

        const newInternship = await tx.internship.create({
          data: {
            studentId: request.studentId,
            professorId: dto.professorId!,
            companyId: request.companyId,
            requestId: request.id,
            startDate: request.startDate,
            endDate: request.endDate,
            progressPercentage: 0,
            status: InternshipStatus.ACTIVE,
          },
          include: {
            student: { include: { user: true } },
            professor: { include: { user: true } },
            company: true,
          },
        });

        return { request: updatedReq, internship: newInternship };
      });

      // Automated Notifications
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

      // Automated Activity Log
      await this.activityLogsService.log({
        userId: adminUserId,
        action: `تأیید درخواست کارآموزی شماره ${request.id.slice(0, 8)} و انتصاب استاد ناظر`,
      });

      return result;
    } else if (dto.status === RequestStatus.REJECTED) {
      const updatedReq = await this.prisma.internshipRequest.update({
        where: { id },
        data: { status: RequestStatus.REJECTED },
      });

      // Automated Notification
      await this.notificationsService.create({
        userId: studentUserId,
        title: 'عدم تأیید درخواست کارآموزی',
        message: `درخواست کارآموزی شما برای شرکت ${request.company.name} مورد تأیید قرار نگرفت.`,
      });

      // Automated Activity Log
      await this.activityLogsService.log({
        userId: adminUserId,
        action: `رد درخواست کارآموزی شماره ${request.id.slice(0, 8)}`,
      });

      return updatedReq;
    }

    throw new BadRequestException('Invalid status transition');
  }
}
