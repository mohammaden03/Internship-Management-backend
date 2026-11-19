import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
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
import { ActivityLog } from '@prisma/client';

const ACTIVITY_LOG_SORT_FIELDS = ['id', 'action', 'createdAt'] as const;

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateActivityLogDto): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
      },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      ACTIVITY_LOG_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { action: { contains: searchTerm, mode: 'insensitive' } },
        { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: SAFE_USER_SELECT },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findByUser(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ActivityLog>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      ACTIVITY_LOG_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = { userId };
    if (searchTerm) {
      where.action = { contains: searchTerm, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }
}
