import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InternshipStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy, validateEnumFilter } from '../../common/utils/query.utils';

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
    const existingUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
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

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { department: { contains: query.search, mode: 'insensitive' } },
        { academicRank: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, PROFESSOR_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
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

  async findByUserId(userId: number) {
    const professor = await this.prisma.professor.findUnique({
      where: { userId },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
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

  async findOne(id: number) {
    const professor = await this.prisma.professor.findUnique({
      where: { id },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
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

  async findAssignedStudents(professorId: number, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professorId };
    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, INTERNSHIP_SORT_FIELDS, 'id', 'desc');

    const [internships, totalItems] = await Promise.all([
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

    return {
      items: internships,
      meta: {
        totalItems,
        itemCount: internships.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
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
