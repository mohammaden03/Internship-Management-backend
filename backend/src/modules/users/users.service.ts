import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../../common/audit/audit-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersQueryDto } from './dto/users-query.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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

  async findAll(query: UsersQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);

    const where: any = { deletedAt: null };
    if (searchTerm) {
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { nationalCode: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const roleFilter = query.role ?? validateEnumFilter(query.status, Role, 'role');
    if (roleFilter) {
      where.role = roleFilter;
    }

    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      USER_SORT_FIELDS,
      'id',
      'desc',
    );

    const [items, total] = await Promise.all([
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

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
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

  async updateMyProfile(userId: number, dto: UpdateMyProfileDto) {
    await this.findOne(userId);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber } : {}),
      },
      include: {
        student: true,
        professor: true,
      },
    });

    const { password, refreshToken, ...result } = updated;
    return {
      ...result,
      studentId: updated.student?.id ?? null,
      professorId: updated.professor?.id ?? null,
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId?: number,
    meta: { ip?: string | null; requestId?: string | null } = {},
  ) {
    const existing = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) {
      data.email = dto.email.toLowerCase();
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_USER_SELECT,
    });

    if (dto.role && dto.role !== existing.role) {
      await this.auditLogsService.record({
        actorId: actorId ?? null,
        event: 'ROLE_CHANGED',
        entityType: 'User',
        entityId: id,
        ip: meta.ip,
        requestId: meta.requestId,
        metadata: { from: existing.role, to: dto.role },
      });
    }

    return updated;
  }

  async remove(
    id: number,
    actorId?: number,
    meta: { ip?: string | null; requestId?: string | null } = {},
  ) {
    await this.findOne(id);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: now,
          isActive: false,
          refreshToken: null,
        },
      });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    await this.auditLogsService.record({
      actorId: actorId ?? null,
      event: 'USER_SOFT_DELETED',
      entityType: 'User',
      entityId: id,
      ip: meta.ip,
      requestId: meta.requestId,
    });

    return { message: `User with ID '${id}' successfully deactivated and soft-deleted` };
  }
}
