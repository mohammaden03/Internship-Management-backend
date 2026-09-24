import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProfessorDto) {
    const existing = await this.prisma.professor.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('This user already has a professor profile');
    }

    return this.prisma.professor.create({
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
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

    const [items, totalItems] = await Promise.all([
      this.prisma.professor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { department: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true,
              isActive: true,
            },
          },
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

  async findOne(id: string) {
    const professor = await this.prisma.professor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
            isActive: true,
          },
        },
        internships: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true, role: true } },
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

  async findAssignedStudents(professorId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { professorId };
    if (query.status) {
      where.status = query.status as any;
    }

    const [internships, totalItems] = await Promise.all([
      this.prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true,
                  role: true,
                },
              },
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

  async update(id: string, dto: UpdateProfessorDto) {
    await this.findOne(id);
    return this.prisma.professor.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.professor.delete({ where: { id } });
    return { message: `Professor with ID '${id}' deleted` };
  }
}
