import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SAFE_USER_SELECT } from '../constants/user-select';
import {
  buildPaginatedResponse,
  PaginatedResponseDto,
} from '../dto/paginated-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  normalizePagination,
  normalizeSearchTerm,
  resolveSort,
} from '../utils/query.utils';

export interface AuditEventInput {
  actorId?: number | null;
  event: string;
  entityType?: string;
  entityId?: string | number;
  ip?: string | null;
  requestId?: string | null;
  metadata?: Record<string, any>;
}

const AUDIT_SORT_FIELDS = ['id', 'event', 'actorId', 'createdAt'] as const;

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEventInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          event: input.event,
          entityType: input.entityType ?? null,
          entityId: input.entityId !== undefined ? String(input.entityId) : null,
          ip: input.ip ?? null,
          requestId: input.requestId ?? null,
          metadata: input.metadata ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to persist audit event '${input.event}': ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);
    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      AUDIT_SORT_FIELDS,
      'id',
      'desc',
    );

    const where: any = {};
    if (query.status) {
      where.event = query.status;
    }
    if (searchTerm) {
      where.OR = [
        { event: { contains: searchTerm, mode: 'insensitive' } },
        { entityType: { contains: searchTerm, mode: 'insensitive' } },
        { requestId: { contains: searchTerm, mode: 'insensitive' } },
        { ip: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          actor: { select: SAFE_USER_SELECT },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }
}
