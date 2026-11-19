import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

const TEST_JWT_SECRET = 'unit_test_jwt_secret_key_with_at_least_32_chars_a';
const TEST_REFRESH_SECRET = 'unit_test_refresh_secret_key_with_at_least_32_chars_b';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;
  let configService: ConfigService;
  let activityLogsService: any;
  let notificationsService: any;
  let mailService: any;
  let auditLogsService: any;

  const storedRefreshTokens = new Map<string, any>();
  const storedResetTokens = new Map<string, any>();

  beforeEach(() => {
    storedRefreshTokens.clear();
    storedResetTokens.clear();

    jwtService = new JwtService({});
    configService = new ConfigService({
      JWT_SECRET: TEST_JWT_SECRET,
      JWT_REFRESH_SECRET: TEST_REFRESH_SECRET,
      JWT_EXPIRATION: '1h',
      JWT_REFRESH_EXPIRATION: '7d',
      FRONTEND_URL: 'http://localhost:5173',
      PASSWORD_RESET_TTL_MINUTES: 60,
    });

    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(async ({ data }: any) => {
          const rec = { id: storedRefreshTokens.size + 1, revokedAt: null, ...data };
          storedRefreshTokens.set(rec.tokenHash, rec);
          return rec;
        }),
        findUnique: jest.fn(async ({ where }: any) => storedRefreshTokens.get(where.tokenHash) ?? null),
        update: jest.fn(async ({ where, data }: any) => {
          for (const rec of storedRefreshTokens.values()) {
            if (rec.id === where.id) {
              Object.assign(rec, data);
              return rec;
            }
          }
          return null;
        }),
        updateMany: jest.fn(async ({ where, data }: any) => {
          let count = 0;
          for (const rec of storedRefreshTokens.values()) {
            const matchFamily = !where.familyId || rec.familyId === where.familyId;
            const matchUser = !where.userId || rec.userId === where.userId;
            const matchRevoked = where.revokedAt === undefined || rec.revokedAt === where.revokedAt;
            if (matchFamily && matchUser && matchRevoked) {
              Object.assign(rec, data);
              count += 1;
            }
          }
          return { count };
        }),
      },
      passwordResetToken: {
        create: jest.fn(async ({ data }: any) => {
          const rec = { id: storedResetTokens.size + 1, usedAt: null, ...data };
          storedResetTokens.set(rec.tokenHash, rec);
          return rec;
        }),
        findUnique: jest.fn(async ({ where }: any) => storedResetTokens.get(where.tokenHash) ?? null),
        update: jest.fn(async ({ where, data }: any) => {
          for (const rec of storedResetTokens.values()) {
            if (rec.id === where.id) {
              Object.assign(rec, data);
              return rec;
            }
          }
          return null;
        }),
        updateMany: jest.fn(async ({ where, data }: any) => {
          let count = 0;
          for (const rec of storedResetTokens.values()) {
            if (rec.userId === where.userId && rec.usedAt === null) {
              Object.assign(rec, data);
              count += 1;
            }
          }
          return { count };
        }),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    activityLogsService = { log: jest.fn().mockResolvedValue(undefined) };
    notificationsService = { create: jest.fn().mockResolvedValue(undefined) };
    mailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) };
    auditLogsService = { record: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      prisma,
      jwtService,
      configService,
      activityLogsService,
      notificationsService,
      mailService,
      auditLogsService,
    );
  });

  it('register forces STUDENT role even when caller supplies ADMIN and stores hashed refresh token', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.student.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({ id: 10, ...data }));
    prisma.student.create.mockImplementation(async ({ data }: any) => ({ id: 100, ...data }));

    const result = await service.register({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test@semnan.ac.ir',
      nationalCode: '0011122233',
      password: 'Password123@',
      role: Role.ADMIN,
      studentNumber: '402111222',
    });

    expect(result.role).toBe(Role.STUDENT);
    expect(result.user.role).toBe(Role.STUDENT);
    expect(storedRefreshTokens.size).toBe(1);
    const savedHash = Array.from(storedRefreshTokens.keys())[0];
    expect(savedHash).toBe(createHash('sha256').update(result.refreshToken).digest('hex'));
  });

  it('login succeeds for valid credentials and records LOGIN_SUCCESS audit event', async () => {
    const hash = await bcrypt.hash('Password123@', 10);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@semnan.ac.ir',
      nationalCode: '0098765432',
      password: hash,
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
      student: null,
      professor: null,
    });

    const res = await service.login(
      { identifier: '0098765432', password: 'Password123@' },
      { ip: '127.0.0.1', requestId: 'req-1' },
    );
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'LOGIN_SUCCESS', actorId: 1 }),
    );
  });

  it('refreshToken rotates token and revokes entire family on replay detection', async () => {
    const hash = await bcrypt.hash('Password123@', 10);
    const mockUser = {
      id: 2,
      firstName: 'Ali',
      lastName: 'Student',
      email: 'ali@semnan.ac.ir',
      nationalCode: '0021345678',
      password: hash,
      role: Role.STUDENT,
      isActive: true,
      deletedAt: null,
      student: { id: 5, studentNumber: '400105432' },
      professor: null,
    };

    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    const loginRes = await service.login({ identifier: '0021345678', password: 'Password123@' });

    prisma.user.findFirst.mockResolvedValue(mockUser);
    const rotated = await service.refreshToken({ refreshToken: loginRes.refreshToken });
    expect(rotated.refreshToken).not.toBe(loginRes.refreshToken);

    // Replay old token -> throws 401 and revokes entire token family
    await expect(service.refreshToken({ refreshToken: loginRes.refreshToken })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'REFRESH_REUSE_DETECTED' }),
    );

    // Even the rotated token must now fail because its family was revoked
    await expect(service.refreshToken({ refreshToken: rotated.refreshToken })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('forgotPassword creates hashed token, sends mail, and resetPassword updates password & revokes sessions', async () => {
    const mockUser = {
      id: 5,
      firstName: 'Sara',
      lastName: 'M',
      email: 'sara@semnan.ac.ir',
      nationalCode: '0032145698',
      isActive: true,
      deletedAt: null,
      student: null,
      professor: null,
    };
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);

    process.env.NODE_ENV = 'test';
    const forgotRes = await service.forgotPassword({ identifier: '0032145698' });
    expect(forgotRes.accepted).toBe(true);
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const { rawToken } = mailService.sendPasswordResetEmail.mock.calls[0][0];
    expect(rawToken).toBeDefined();

    // Attach user to stored reset record as Prisma include would
    const hash = createHash('sha256').update(rawToken).digest('hex');
    storedResetTokens.get(hash).user = mockUser;
    prisma.user.update.mockResolvedValue({});

    const resetRes = await service.resetPassword({
      token: rawToken,
      newPassword: 'StrongNewPassword99!',
    });
    expect(resetRes.message).toBeDefined();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } }),
    );

    // Reusing the reset token throws 400 BadRequestException
    await expect(
      service.resetPassword({ token: rawToken, newPassword: 'AnotherStrong99!' }),
    ).rejects.toThrow(BadRequestException);
  });
});
