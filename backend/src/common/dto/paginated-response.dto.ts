import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 25, description: 'Total matching items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current 1-based page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Page size (capped at 100)' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: 'software', nullable: true, required: false })
  searchTerm: string | null;

  @ApiProperty({ example: 'id', nullable: true, required: false })
  sortBy: string | null;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc', nullable: true, required: false })
  sortOrder: 'asc' | 'desc' | null;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: () => PaginationMetaDto, nullable: true })
  meta: PaginationMetaDto | null;
}

export interface CollectionQueryMeta {
  searchTerm?: string | null;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  queryMeta: CollectionQueryMeta = {},
): PaginatedResponseDto<T> {
  const safeLimit = Math.min(100, Math.max(1, limit || 10));
  const safePage = Math.max(1, page || 1);
  return {
    items,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      searchTerm: queryMeta.searchTerm ?? null,
      sortBy: queryMeta.sortBy ?? null,
      sortOrder: queryMeta.sortOrder ?? null,
    },
  };
}

export function buildCollectionResponse<T>(items: T[]): PaginatedResponseDto<T> {
  return {
    items,
    meta: null,
  };
}

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model?: TModel,
  options: { paginated?: boolean; description?: string } = {},
) => {
  const { paginated = true, description = 'Collection response with uniform { items, meta } shape' } =
    options;

  const itemsSchema = model
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { type: 'array', items: { type: 'object' } };

  const metaSchema = paginated
    ? { $ref: getSchemaPath(PaginationMetaDto), nullable: true }
    : { type: 'null', nullable: true, example: null };

  const extraModels: Type<any>[] = [PaginationMetaDto];
  if (model) {
    extraModels.push(model);
  }

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'OK' },
          data: {
            type: 'object',
            properties: {
              items: itemsSchema,
              meta: metaSchema,
            },
            required: ['items', 'meta'],
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
      },
    }),
  );
};
