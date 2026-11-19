import { BadRequestException } from '@nestjs/common';

export interface ResolvedSort {
  orderBy: Record<string, 'asc' | 'desc'>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function resolveSort(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedFields: readonly string[],
  defaultField = 'id',
  defaultOrder: 'asc' | 'desc' = 'desc',
): ResolvedSort {
  const direction: 'asc' | 'desc' =
    sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : defaultOrder;
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  return {
    orderBy: { [field]: direction },
    sortBy: field,
    sortOrder: direction,
  };
}

export function resolveOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedFields: readonly string[],
  defaultField = 'id',
  defaultOrder: 'asc' | 'desc' = 'desc',
): Record<string, 'asc' | 'desc'> {
  return resolveSort(sortBy, sortOrder, allowedFields, defaultField, defaultOrder).orderBy;
}

export function normalizePagination(page?: number, limit?: number) {
  const safePage = Math.max(1, Number.isInteger(page) ? Number(page) : 1);
  const safeLimit = Math.min(100, Math.max(1, Number.isInteger(limit) ? Number(limit) : 10));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
}

export function normalizeSearchTerm(search?: string): string | null {
  if (!search) return null;
  const trimmed = search.trim().slice(0, 100);
  return trimmed.length > 0 ? trimmed : null;
}

export function validateEnumFilter<T extends Record<string, string>>(
  value: string | undefined,
  enumObject: T,
  fieldName = 'status',
): T[keyof T] | undefined {
  if (!value) {
    return undefined;
  }
  const allowedValues = Object.values(enumObject);
  if (!allowedValues.includes(value)) {
    throw new BadRequestException(
      `Invalid ${fieldName} '${value}'. Allowed values: ${allowedValues.join(', ')}`,
    );
  }
  return value as T[keyof T];
}
