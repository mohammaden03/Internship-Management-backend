import { ConflictException } from '@nestjs/common';
import { InternshipStatus, RequestStatus } from '@prisma/client';
import {
  assertValidInternshipTransition,
  assertValidRequestTransition,
} from './internship-transitions';

describe('Workflow State Transitions ([A4])', () => {
  describe('InternshipRequest transitions', () => {
    it('allows PENDING -> APPROVED and PENDING -> REJECTED', () => {
      expect(() =>
        assertValidRequestTransition(RequestStatus.PENDING, RequestStatus.APPROVED),
      ).not.toThrow();
      expect(() =>
        assertValidRequestTransition(RequestStatus.PENDING, RequestStatus.REJECTED),
      ).not.toThrow();
    });

    it('rejects any transition out of APPROVED or REJECTED with 409 Conflict', () => {
      expect(() =>
        assertValidRequestTransition(RequestStatus.APPROVED, RequestStatus.REJECTED),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidRequestTransition(RequestStatus.APPROVED, RequestStatus.PENDING),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidRequestTransition(RequestStatus.REJECTED, RequestStatus.APPROVED),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidRequestTransition(RequestStatus.PENDING, RequestStatus.PENDING),
      ).toThrow(ConflictException);
    });
  });

  describe('Internship transitions', () => {
    it('allows documented lifecycle transitions', () => {
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.PENDING, InternshipStatus.ACTIVE),
      ).not.toThrow();
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.PENDING, InternshipStatus.REJECTED),
      ).not.toThrow();
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.PENDING, InternshipStatus.CANCELLED),
      ).not.toThrow();
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.ACTIVE, InternshipStatus.COMPLETED),
      ).not.toThrow();
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.ACTIVE, InternshipStatus.CANCELLED),
      ).not.toThrow();
      // Same-status idempotent update is permitted
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.ACTIVE, InternshipStatus.ACTIVE),
      ).not.toThrow();
    });

    it('rejects illegal or terminal transitions with 409 Conflict', () => {
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.COMPLETED, InternshipStatus.ACTIVE),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.CANCELLED, InternshipStatus.ACTIVE),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.REJECTED, InternshipStatus.ACTIVE),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.PENDING, InternshipStatus.COMPLETED),
      ).toThrow(ConflictException);
      expect(() =>
        assertValidInternshipTransition(InternshipStatus.ACTIVE, InternshipStatus.PENDING),
      ).toThrow(ConflictException);
    });
  });
});
