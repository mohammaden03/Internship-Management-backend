import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
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
import { assertValidInternshipTransition } from './internship-transitions';
import { Internship, InternshipStatus, Role } from '@prisma/client';

const INTERNSHIP_SORT_FIELDS = [
  'id',
  'academicTerm',
  'startDate',
  'endDate',
  'progressPercentage',
  'status',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class InternshipsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async create(dto: CreateInternshipDto): Promise<Internship> {
    const existing = await this.prisma.internship.findUnique({
      where: { requestId: dto.requestId },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('An internship for this request ID already exists');
    }

    const academicTerm =
      dto.academicTerm?.trim() || (await this.settingsService.getCurrentAcademicTerm());
    const targetStatus = dto.status ?? InternshipStatus.ACTIVE;

    if (targetStatus === InternshipStatus.ACTIVE) {
      const existingActive = await this.prisma.internship.findFirst({
        where: {
          studentId: dto.studentId,
          academicTerm,
          status: InternshipStatus.ACTIVE,
          deletedAt: null,
        },
      });
      if (existingActive) {
        throw new ConflictException(
          `Student already has an ACTIVE internship in academic term '${academicTerm}'`,
        );
      }
    }

    return this.prisma.internship.create({
      data: {
        ...dto,
        academicTerm,
        status: targetStatus,
      },
      include: {
        student: { include: { user: { select: SAFE_USER_SELECT } } },
        professor: { include: { user: { select: SAFE_USER_SELECT } } },
        company: true,
      },
    });
  }

  async findAll(
    query: PaginationQueryDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      INTERNSHIP_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = { deletedAt: null };
    if (user?.role === Role.PROFESSOR) {
      if (!user.professorId) {
        return buildPaginatedResponse([], 0, page, limit, {
          searchTerm,
          sortBy,
          sortOrder,
        });
      }
      where.professorId = user.professorId;
    }

    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchTerm) {
      where.OR = [
        { academicTerm: { contains: searchTerm, mode: 'insensitive' } },
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: searchTerm, mode: 'insensitive' } } },
        { professor: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.internship.findMany({
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
          professor: {
            include: {
              user: { select: SAFE_USER_SELECT },
            },
          },
          company: true,
          _count: {
            select: {
              weeklyReports: true,
              documents: true,
            },
          },
          evaluation: {
            select: { finalScore: true },
          },
        },
      }),
      this.prisma.internship.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findByStudent(studentId: number): Promise<PaginatedResponseDto<any>> {
    const items = await this.prisma.internship.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { id: 'desc' },
      include: {
        company: true,
        professor: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
        weeklyReports: { orderBy: { weekNumber: 'asc' } },
        documents: { where: { deletedAt: null } },
        evaluation: true,
      },
    });
    return buildCollectionResponse(items);
  }

  async findByProfessor(
    professorId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      INTERNSHIP_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = { professorId, deletedAt: null };
    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchTerm) {
      where.OR = [
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.internship.findMany({
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
          weeklyReports: { orderBy: { weekNumber: 'desc' } },
          evaluation: true,
          documents: { where: { deletedAt: null } },
        },
      }),
      this.prisma.internship.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: number): Promise<any> {
    const internship = await this.prisma.internship.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
        professor: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
        company: true,
        request: true,
        weeklyReports: {
          orderBy: { weekNumber: 'asc' },
        },
        documents: { where: { deletedAt: null } },
        evaluation: true,
      },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${id}' not found`);
    }

    return internship;
  }

  async update(
    id: number,
    dto: UpdateInternshipDto,
    user?: AuthenticatedUser,
  ): Promise<Internship> {
    const existing = await this.findOne(id);
    if (user?.role === Role.PROFESSOR && existing.professorId !== user.professorId) {
      throw new ForbiddenException('Professors can only update internships assigned to them');
    }

    if (dto.status && dto.status !== existing.status) {
      assertValidInternshipTransition(existing.status, dto.status);
      if (dto.status === InternshipStatus.ACTIVE) {
        const anotherActive = await this.prisma.internship.findFirst({
          where: {
            id: { not: id },
            studentId: existing.studentId,
            academicTerm: existing.academicTerm,
            status: InternshipStatus.ACTIVE,
            deletedAt: null,
          },
        });
        if (anotherActive) {
          throw new ConflictException(
            `Student already has an ACTIVE internship in academic term '${existing.academicTerm}'`,
          );
        }
      }
    }

    return this.prisma.internship.update({
      where: { id },
      data: dto,
      include: {
        company: true,
        professor: { include: { user: { select: SAFE_USER_SELECT } } },
        student: { include: { user: { select: SAFE_USER_SELECT } } },
      },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.internship.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Internship with ID '${id}' archived` };
  }
}
