import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy, validateEnumFilter } from '../../common/utils/query.utils';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const USER_SORT_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'nationalCode',
  'role',
  'isActive',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { nationalCode: dto.nationalCode },
        ],
      },
    });
    if (existing) {
      if (existing.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException('کاربری با این ایمیل قبلاً ثبت شده است');
      }
      throw new ConflictException('کاربری با این کد ملی قبلاً ثبت شده است');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        nationalCode: dto.nationalCode,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        role: dto.role,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async findAll(query: UsersQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { nationalCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const roleFilter = query.role ?? validateEnumFilter(query.status, Role, 'role');
    if (roleFilter) {
      where.role = roleFilter;
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, USER_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          ...SAFE_USER_SELECT,
          student: {
            select: { id: true, studentNumber: true, major: true, faculty: true },
          },
          professor: {
            select: { id: true, department: true, academicRank: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        professor: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const { password, refreshToken, ...result } = user;
    return {
      ...result,
      studentId: user.student?.id ?? null,
      professorId: user.professor?.id ?? null,
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) {
      data.email = dto.email.toLowerCase();
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_USER_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User with ID '${id}' successfully deleted` };
  }
}
