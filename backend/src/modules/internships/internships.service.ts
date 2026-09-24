import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { Internship, InternshipStatus } from '@prisma/client';

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
        student: { include: { user: true } },
        professor: { include: { user: true } },
        company: true,
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status as InternshipStatus;
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

    const [items, totalItems] = await Promise.all([
      this.prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'startDate']: query.sortOrder || 'desc' },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true, role: true } },
            },
          },
          professor: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, role: true } },
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

  async findByStudent(studentId: string): Promise<Internship[]> {
    return this.prisma.internship.findMany({
      where: { studentId },
      include: {
        company: true,
        professor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
          },
        },
        weeklyReports: { orderBy: { weekNumber: 'asc' } },
        documents: true,
        evaluation: true,
      },
    });
  }

  async findByProfessor(professorId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professorId };
    if (query.status) {
      where.status = query.status as InternshipStatus;
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true, role: true } },
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

  async findOne(id: string): Promise<any> {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, role: true } },
          },
        },
        professor: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
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

  async update(id: string, dto: UpdateInternshipDto): Promise<Internship> {
    await this.findOne(id);
    return this.prisma.internship.update({
      where: { id },
      data: dto,
      include: {
        company: true,
        professor: { include: { user: true } },
      },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.internship.delete({ where: { id } });
    return { message: `Internship with ID '${id}' deleted` };
  }
}
