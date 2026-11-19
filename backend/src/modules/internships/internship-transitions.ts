import { ConflictException } from '@nestjs/common';
import { InternshipStatus, RequestStatus } from '@prisma/client';

export const ALLOWED_REQUEST_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [],
  [RequestStatus.REJECTED]: [],
};

export const ALLOWED_INTERNSHIP_TRANSITIONS: Record<InternshipStatus, readonly InternshipStatus[]> = {
  [InternshipStatus.PENDING]: [
    InternshipStatus.ACTIVE,
    InternshipStatus.REJECTED,
    InternshipStatus.CANCELLED,
  ],
  [InternshipStatus.ACTIVE]: [InternshipStatus.COMPLETED, InternshipStatus.CANCELLED],
  [InternshipStatus.COMPLETED]: [],
  [InternshipStatus.REJECTED]: [],
  [InternshipStatus.CANCELLED]: [],
};

export function assertValidRequestTransition(from: RequestStatus, to: RequestStatus): void {
  if (from === to) {
    throw new ConflictException(`Internship request is already in status '${from}'`);
  }
  const allowed = ALLOWED_REQUEST_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictException(
      `Invalid internship request status transition from '${from}' to '${to}'`,
    );
  }
}

export function assertValidInternshipTransition(
  from: InternshipStatus,
  to: InternshipStatus,
): void {
  if (from === to) {
    return;
  }
  const allowed = ALLOWED_INTERNSHIP_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictException(
      `Invalid internship status transition from '${from}' to '${to}'`,
    );
  }
}
