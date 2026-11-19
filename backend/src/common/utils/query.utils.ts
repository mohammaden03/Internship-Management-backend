import { BadRequestException } from '@nestjs/common';

export function resolveOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedFields: readonly string[],
  defaultField = 'id',
  defaultOrder: 'asc' | 'desc' = 'desc',
): Record<string, 'asc' | 'desc'> {
  const direction: 'asc' | 'desc' = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : defaultOrder;
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: direction };
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
