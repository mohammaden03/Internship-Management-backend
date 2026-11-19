import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InternshipStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { UpdateMyProfessorProfileDto } from './dto/update-my-professor-profile.dto';
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

const PROFESSOR_SORT_FIELDS = [
  'id',
  'department',
  'academicRank',
  'createdAt',
  'updatedAt',
] as const;

const INTERNSHIP_SORT_FIELDS = [
  'id',
  'startDate',
  'endDate',
  'progressPercentage',
  'status',
  'createdAt',
] as const;

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProfessorDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id: dto.userId, deletedAt: null },
    });
    if (!existingUser) {
      throw new NotFoundException(`User with ID '${dto.userId}' not found`);
    }

    const existing = await this.prisma.professor.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('This user already has a professor profile');
    }

    return this.prisma.professor.create({
      data: dto,
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);

    const where: any = { user: { deletedAt: null } };
    if (searchTerm) {
      where.OR = [
        { department: { contains: searchTerm, mode: 'insensitive' } },
        { academicRank: { contains: searchTerm, mode: 'insensitive' } },
        { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      PROFESSOR_SORT_FIELDS,
      'id',
      'desc',
    );

    const [items, total] = await Promise.all([
      this.prisma.professor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: SAFE_USER_SELECT },
          _count: {
            select: { internships: true },
          },
        },
      }),
      this.prisma.professor.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findByUserId(userId: number) {
    const professor = await this.prisma.professor.findFirst({
      where: { userId, user: { deletedAt: null } },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                user: { select: SAFE_USER_SELECT },
              },
            },
            company: true,
            weeklyReports: {
              orderBy: { weekNumber: 'desc' },
            },
            evaluation: true,
          },
        },
      },
    });

    if (!professor) {
      throw new NotFoundException(`Professor profile for user '${userId}' not found`);
    }

    return professor;
  }

  async updateMyProfile(userId: number, dto: UpdateMyProfessorProfileDto) {
    const professor = await this.findByUserId(userId);

    const userUpdates: Record<string, any> = {};
    if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) userUpdates.phoneNumber = dto.phoneNumber;

    const profUpdates: Record<string, any> = {};
    if (dto.department !== undefined) profUpdates.department = dto.department;
    if (dto.academicRank !== undefined) profUpdates.academicRank = dto.academicRank;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userUpdates });
      }
      if (Object.keys(profUpdates).length > 0) {
        await tx.professor.update({ where: { id: professor.id }, data: profUpdates });
      }
    });

    return this.findByUserId(userId);
  }

  async findOne(id: number) {
    const professor = await this.prisma.professor.findFirst({
      where: { id, user: { deletedAt: null } },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                user: { select: SAFE_USER_SELECT },
              },
            },
            company: true,
            weeklyReports: {
              orderBy: { weekNumber: 'desc' },
            },
            evaluation: true,
          },
        },
      },
    });

    if (!professor) {
      throw new NotFoundException(`Professor with ID '${id}' not found`);
    }

    return professor;
  }

  async findAssignedStudents(
    professorId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);

    const where: any = { professorId, deletedAt: null };
    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchTerm) {
      where.OR = [
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { studentNumber: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      INTERNSHIP_SORT_FIELDS,
      'id',
      'desc',
    );

    const [internships, total] = await Promise.all([
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
          weeklyReports: {
            select: {
              id: true,
              weekNumber: true,
              status: true,
              createdAt: true,
            },
          },
          evaluation: true,
        },
      }),
      this.prisma.internship.count({ where }),
    ]);

    return buildPaginatedResponse(internships, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async update(id: number, dto: UpdateProfessorDto) {
    await this.findOne(id);
    return this.prisma.professor.update({
      where: { id },
      data: dto,
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.professor.delete({ where: { id } });
    return { message: `Professor with ID '${id}' deleted` };
  }
}
