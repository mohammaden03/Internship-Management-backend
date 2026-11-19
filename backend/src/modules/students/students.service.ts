import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy } from '../../common/utils/query.utils';

const STUDENT_SORT_FIELDS = [
  'id',
  'studentNumber',
  'faculty',
  'major',
  'degreeLevel',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existingUserRecord = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!existingUserRecord) {
      throw new NotFoundException(`User with ID '${dto.userId}' not found`);
    }

    const existingStNo = await this.prisma.student.findUnique({
      where: { studentNumber: dto.studentNumber },
    });
    if (existingStNo) {
      throw new ConflictException('A student with this studentNumber already exists');
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { userId: dto.userId },
    });
    if (existingStudent) {
      throw new ConflictException('This user already has a student profile');
    }

    return this.prisma.student.create({
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
        { studentNumber: { contains: query.search, mode: 'insensitive' } },
        { major: { contains: query.search, mode: 'insensitive' } },
        { faculty: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, STUDENT_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: SAFE_USER_SELECT },
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

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: SAFE_USER_SELECT },
        requests: {
          include: { company: true },
        },
        internships: {
          include: {
            company: true,
            professor: {
              include: {
                user: { select: SAFE_USER_SELECT },
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

  async findByUserId(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
          include: {
            company: true,
            professor: {
              include: {
                user: { select: SAFE_USER_SELECT },
              },
            },
            weeklyReports: { orderBy: { weekNumber: 'asc' } },
            evaluation: true,
            documents: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student profile for user '${userId}' not found`);
    }

    return student;
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.student.delete({ where: { id } });
    return { message: `Student profile with ID '${id}' deleted` };
  }
}
