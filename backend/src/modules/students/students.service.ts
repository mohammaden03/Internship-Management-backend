import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateMyStudentProfileDto } from './dto/update-my-student-profile.dto';
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
} from '../../common/utils/query.utils';

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
    const existingUserRecord = await this.prisma.user.findFirst({
      where: { id: dto.userId, deletedAt: null },
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

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);

    const where: any = { user: { deletedAt: null } };
    if (searchTerm) {
      where.OR = [
        { studentNumber: { contains: searchTerm, mode: 'insensitive' } },
        { major: { contains: searchTerm, mode: 'insensitive' } },
        { faculty: { contains: searchTerm, mode: 'insensitive' } },
        { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      STUDENT_SORT_FIELDS,
      'id',
      'desc',
    );

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: SAFE_USER_SELECT },
          internships: {
            where: { deletedAt: null },
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

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findFirst({
      where: { id, user: { deletedAt: null } },
      include: {
        user: { select: SAFE_USER_SELECT },
        requests: {
          where: { deletedAt: null },
          include: { company: true },
        },
        internships: {
          where: { deletedAt: null },
          include: {
            company: true,
            professor: {
              include: {
                user: { select: SAFE_USER_SELECT },
              },
            },
            weeklyReports: true,
            evaluation: true,
            documents: { where: { deletedAt: null } },
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
    const student = await this.prisma.student.findFirst({
      where: { userId, user: { deletedAt: null } },
      include: {
        user: { select: SAFE_USER_SELECT },
        internships: {
          where: { deletedAt: null },
          include: {
            company: true,
            professor: {
              include: {
                user: { select: SAFE_USER_SELECT },
              },
            },
            weeklyReports: { orderBy: { weekNumber: 'asc' } },
            evaluation: true,
            documents: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student profile for user '${userId}' not found`);
    }

    return student;
  }

  async updateMyProfile(userId: number, dto: UpdateMyStudentProfileDto) {
    const student = await this.findByUserId(userId);

    const userUpdates: Record<string, any> = {};
    if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) userUpdates.phoneNumber = dto.phoneNumber;

    const studentUpdates: Record<string, any> = {};
    if (dto.faculty !== undefined) studentUpdates.faculty = dto.faculty;
    if (dto.major !== undefined) studentUpdates.major = dto.major;
    if (dto.degreeLevel !== undefined) studentUpdates.degreeLevel = dto.degreeLevel;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userUpdates });
      }
      if (Object.keys(studentUpdates).length > 0) {
        await tx.student.update({ where: { id: student.id }, data: studentUpdates });
      }
    });

    return this.findByUserId(userId);
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
