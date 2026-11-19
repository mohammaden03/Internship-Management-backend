import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy, validateEnumFilter } from '../../common/utils/query.utils';
import { Internship, InternshipStatus, Role } from '@prisma/client';

const INTERNSHIP_SORT_FIELDS = [
  'id',
  'startDate',
  'endDate',
  'progressPercentage',
  'status',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class InternshipsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInternshipDto): Promise<Internship> {
    const existing = await this.prisma.internship.findUnique({
      where: { requestId: dto.requestId },
    });
    if (existing) {
      throw new ConflictException('An internship for this request ID already exists');
    }

    return this.prisma.internship.create({
      data: dto,
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
  ): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (user?.role === Role.PROFESSOR) {
      if (!user.professorId) {
        return {
          items: [],
          meta: { totalItems: 0, itemCount: 0, itemsPerPage: limit, totalPages: 0, currentPage: page },
        };
      }
      where.professorId = user.professorId;
    }

    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (query.search) {
      where.OR = [
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
        { student: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: query.search, mode: 'insensitive' } } },
        { professor: { user: { lastName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, INTERNSHIP_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
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

  async findByStudent(studentId: number): Promise<Internship[]> {
    return this.prisma.internship.findMany({
      where: { studentId },
      orderBy: { id: 'desc' },
      include: {
        company: true,
        professor: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
        weeklyReports: { orderBy: { weekNumber: 'asc' } },
        documents: true,
        evaluation: true,
      },
    });
  }

  async findByProfessor(professorId: number, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professorId };
    const statusFilter = validateEnumFilter(query.status, InternshipStatus, 'status');
    if (statusFilter) {
      where.status = statusFilter;
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, INTERNSHIP_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
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
          documents: true,
        },
      }),
      this.prisma.internship.count({ where }),
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

  async findOne(id: number): Promise<any> {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
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
        documents: true,
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
    await this.prisma.internship.delete({ where: { id } });
    return { message: `Internship with ID '${id}' deleted` };
  }
}
