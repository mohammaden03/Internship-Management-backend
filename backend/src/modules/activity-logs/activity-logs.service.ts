import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import { resolveOrderBy } from '../../common/utils/query.utils';
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

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, ACTIVITY_LOG_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
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

  async findByUser(userId: number, query: PaginationQueryDto): Promise<PaginatedResult<ActivityLog>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.search) {
      where.action = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, ACTIVITY_LOG_SORT_FIELDS, 'id', 'desc');

    const [items, totalItems] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.activityLog.count({ where }),
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
}
