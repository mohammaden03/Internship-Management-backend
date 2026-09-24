import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existingStNo = await this.prisma.student.findUnique({
      where: { studentNumber: dto.studentNumber },
    });
    if (existingStNo) {
      throw new ConflictException('A student with this studentNumber already exists');
    }

    const existingUser = await this.prisma.student.findUnique({
      where: { userId: dto.userId },
    });
    if (existingUser) {
      throw new ConflictException('This user already has a student profile');
    }

    return this.prisma.student.create({
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
        { studentNumber: { contains: query.search, mode: 'insensitive' } },
        { major: { contains: query.search, mode: 'insensitive' } },
        { faculty: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'studentNumber']: query.sortOrder || 'asc' },
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
            select: {
              id: true,
              status: true,
              progressPercentage: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
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
    const student = await this.prisma.student.findUnique({
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
        requests: {
          include: { company: true },
        },
        internships: {
          include: {
            company: true,
            professor: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, role: true } },
              },
            },
            weeklyReports: true,
            evaluation: true,
            documents: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    return student;
  }

  async findByUserId(userId: string) {
    return this.prisma.student.findUnique({
      where: { userId },
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
        internships: {
          include: {
            company: true,
            professor: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, role: true } },
              },
            },
            weeklyReports: { orderBy: { weekNumber: 'asc' } },
            evaluation: true,
            documents: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.student.delete({ where: { id } });
    return { message: `Student profile with ID '${id}' deleted` };
  }
}
