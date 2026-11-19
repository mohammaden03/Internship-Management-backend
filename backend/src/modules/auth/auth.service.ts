import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../../common/mail/mail.service';
import { AuditLogsService } from '../../common/audit/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';

export interface RequestMeta {
  ip?: string | null;
  requestId?: string | null;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseDurationMs(expr: string, fallbackMs: number): number {
  const match = /^(\d+)\s*([smhd])$/i.exec((expr || '').trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[unit] || 1000);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getJwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private getJwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    // Public registration MUST always assign STUDENT role (never ADMIN or PROFESSOR)
    const assignedRole = Role.STUDENT;

    if (!dto.studentNumber || !dto.studentNumber.trim()) {
      throw new BadRequestException('studentNumber is required for STUDENT registration');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedNationalCode = dto.nationalCode.trim();
    const normalizedStudentNumber = dto.studentNumber.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { nationalCode: normalizedNationalCode },
        ],
      },
    });
    if (existing) {
      if (existing.email.toLowerCase() === normalizedEmail) {
        throw new ConflictException('ایمیل وارد شده قبلاً در سامانه ثبت شده است.');
      }
      throw new ConflictException('کد ملی وارد شده قبلاً در سامانه ثبت شده است.');
    }

    const existingStudent = await this.prisma.student.findUnique({
      where: { studentNumber: normalizedStudentNumber },
    });
    if (existingStudent) {
      throw new ConflictException('شماره دانشجویی وارد شده قبلاً در سامانه ثبت شده است.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: normalizedEmail,
          nationalCode: normalizedNationalCode,
          password: hashedPassword,
          phoneNumber: dto.phoneNumber,
          role: assignedRole,
        },
      });

      const createdStudent = await tx.student.create({
        data: {
          userId: createdUser.id,
          studentNumber: normalizedStudentNumber,
          faculty: dto.faculty || 'دانشکده مهندسی',
          major: dto.major || 'مهندسی کامپیوتر',
          degreeLevel: dto.degreeLevel || 'کارشناسی',
        },
      });

      return {
        ...createdUser,
        student: createdStudent,
        professor: null,
      };
    });

    await this.activityLogsService.log({
      userId: user.id,
      action: `ثبت نام کاربر جدید در سامانه (${user.firstName} ${user.lastName} - کد ملی: ${user.nationalCode}) با نقش ${user.role}`,
    });

    await this.notificationsService.create({
      userId: user.id,
      title: 'خوش‌آمدید به سامانه کارآموزی دانشگاه',
      message: 'حساب کاربری شما با موفقیت در سامانه ایجاد شد.',
    });

    await this.auditLogsService.record({
      actorId: user.id,
      event: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      ip: meta.ip,
      requestId: meta.requestId,
      metadata: { role: user.role },
    });

    return this.generateTokens(user);
  }

  private async findUserByIdentifier(rawIdentifier: string) {
    let user = await this.prisma.user.findUnique({
      where: { nationalCode: rawIdentifier },
      include: { student: true, professor: true },
    });

    if (!user) {
      const student = await this.prisma.student.findUnique({
        where: { studentNumber: rawIdentifier },
        include: {
          user: {
            include: { student: true, professor: true },
          },
        },
      });
      if (student?.user) {
        user = student.user;
      }
    }

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
        include: { student: true, professor: true },
      });
    }

    return user;
  }

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const rawIdentifier = (dto.identifier || '').trim();

    if (!rawIdentifier) {
      throw new BadRequestException('شناسه ورود (کد ملی یا شماره دانشجویی) الزامی است.');
    }

    if (!dto.password) {
      throw new BadRequestException('رمز عبور الزامی است.');
    }

    const user = await this.findUserByIdentifier(rawIdentifier);

    if (!user || user.deletedAt !== null) {
      await this.auditLogsService.record({
        actorId: null,
        event: 'LOGIN_FAILURE',
        entityType: 'User',
        ip: meta.ip,
        requestId: meta.requestId,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است. کاربری با این کد ملی یا شماره دانشجویی یافت نشد.');
    }

    if (user.role === Role.PROFESSOR || user.role === Role.ADMIN) {
      const matchedWithNationalCode = user.nationalCode === rawIdentifier;
      const matchedWithEmail = user.email.toLowerCase() === rawIdentifier.toLowerCase();
      if (!matchedWithNationalCode && !matchedWithEmail) {
        await this.auditLogsService.record({
          actorId: user.id,
          event: 'LOGIN_FAILURE',
          entityType: 'User',
          entityId: user.id,
          ip: meta.ip,
          requestId: meta.requestId,
          metadata: { reason: 'identifier_not_allowed_for_role' },
        });
        throw new UnauthorizedException('ورود استاد ناظر و مدیر سیستم منحصراً با کد ملی و رمز عبور امکان‌پذیر است.');
      }
    }

    if (user.role === Role.STUDENT) {
      const matchedWithNationalCode = user.nationalCode === rawIdentifier;
      const matchedWithStudentNumber = user.student?.studentNumber === rawIdentifier;
      const matchedWithEmail = user.email.toLowerCase() === rawIdentifier.toLowerCase();
      if (!matchedWithNationalCode && !matchedWithStudentNumber && !matchedWithEmail) {
        throw new UnauthorizedException('ورود دانشجو منحصراً با کد ملی یا شماره دانشجویی و رمز عبور مجاز می‌باشد.');
      }
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.auditLogsService.record({
        actorId: user.id,
        event: 'LOGIN_FAILURE',
        entityType: 'User',
        entityId: user.id,
        ip: meta.ip,
        requestId: meta.requestId,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('رمز عبور وارد شده نادرست است.');
    }

    if (!user.isActive) {
      await this.auditLogsService.record({
        actorId: user.id,
        event: 'LOGIN_FAILURE',
        entityType: 'User',
        entityId: user.id,
        ip: meta.ip,
        requestId: meta.requestId,
        metadata: { reason: 'inactive_account' },
      });
      throw new UnauthorizedException('حساب کاربری شما توسط مدیر سامانه غیرفعال شده است.');
    }

    await this.activityLogsService.log({
      userId: user.id,
      action: `ورود موفقیت‌آمیز (${user.firstName} ${user.lastName} - کد ملی: ${user.nationalCode}) به سامانه با نقش ${user.role}`,
    });

    await this.auditLogsService.record({
      actorId: user.id,
      event: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ip: meta.ip,
      requestId: meta.requestId,
      metadata: { role: user.role },
    });

    return this.generateTokens(user);
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        student: true,
        professor: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const { password, refreshToken, ...safeUser } = user;
    return {
      ...safeUser,
      studentId: user.student?.id ?? null,
      professorId: user.professor?.id ?? null,
    };
  }

  async refreshToken(dto: RefreshTokenDto, meta: RequestMeta = {}) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.getJwtRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid refresh token subject');
    }

    const tokenHash = sha256(dto.refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    // Reuse detection: valid signed token that was already revoked or unknown in DB
    if (!storedToken || storedToken.revokedAt !== null) {
      const now = new Date();
      if (storedToken?.familyId) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
      } else {
        await this.prisma.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: now },
        });
      }

      await this.auditLogsService.record({
        actorId: userId,
        event: 'REFRESH_REUSE_DETECTED',
        entityType: 'RefreshToken',
        entityId: storedToken?.familyId || String(userId),
        ip: meta.ip,
        requestId: meta.requestId,
      });

      throw new UnauthorizedException('Refresh token reuse detected; session revoked');
    }

    if (new Date(storedToken.expiresAt) <= new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { student: true, professor: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or unavailable');
    }

    // Rotate refresh token within the same family
    return this.generateTokens(user, storedToken.familyId, storedToken.id);
  }

  async forgotPassword(dto: ForgotPasswordDto, meta: RequestMeta = {}) {
    const target = (dto.identifier || dto.email || '').trim();
    if (!target) {
      throw new BadRequestException('شناسه یا ایمیل جهت بازیابی رمز عبور الزامی است.');
    }

    const user = await this.findUserByIdentifier(target);
    if (user && user.isActive && user.deletedAt === null) {
      const now = new Date();
      const ttlMinutes = Number(this.configService.get('PASSWORD_RESET_TTL_MINUTES') || 60);
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = sha256(rawToken);

      await this.prisma.$transaction(async (tx) => {
        // Invalidate prior unused tokens for this user
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: now },
        });

        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });
      });

      const frontendBase = (
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
      ).replace(/\/+$/, '');
      const resetUrl = `${frontendBase}/reset-password?token=${rawToken}`;

      await this.mailService.sendPasswordResetEmail({
        to: user.email,
        recipientName: `${user.firstName} ${user.lastName}`,
        resetUrl,
        expiresInMinutes: ttlMinutes,
        rawToken: process.env.NODE_ENV === 'test' ? rawToken : undefined,
      });

      await this.auditLogsService.record({
        actorId: user.id,
        event: 'PASSWORD_RESET_REQUEST',
        entityType: 'User',
        entityId: user.id,
        ip: meta.ip,
        requestId: meta.requestId,
      });
    }

    // Always identical response to prevent user enumeration
    return {
      accepted: true,
      message: 'در صورت وجود حساب کاربری با این مشخصات، دستورالعمل بازیابی رمز عبور ارسال خواهد شد.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta = {}) {
    const tokenHash = sha256(dto.token.trim());
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const now = new Date();
    if (
      !resetRecord ||
      resetRecord.usedAt !== null ||
      new Date(resetRecord.expiresAt) <= now ||
      !resetRecord.user ||
      !resetRecord.user.isActive ||
      resetRecord.user.deletedAt !== null
    ) {
      throw new BadRequestException('توکن بازیابی رمز عبور نامعتبر یا منقضی شده است.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      });

      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    await this.activityLogsService.log({
      userId: resetRecord.userId,
      action: 'تغییر موفق رمز عبور از طریق لینک بازیابی و ابطال تمامی نشست‌های فعال',
    });

    await this.auditLogsService.record({
      actorId: resetRecord.userId,
      event: 'PASSWORD_RESET_SUCCESS',
      entityType: 'User',
      entityId: resetRecord.userId,
      ip: meta.ip,
      requestId: meta.requestId,
    });

    return {
      message: 'رمز عبور با موفقیت تغییر یافت. لطفاً با رمز عبور جدید وارد شوید.',
    };
  }

  async logout(userId: number, meta: RequestMeta = {}) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    await this.activityLogsService.log({
      userId,
      action: 'خروج کاربر از سامانه و ابطال توکن‌های فعال',
    });

    await this.auditLogsService.record({
      actorId: userId,
      event: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      ip: meta.ip,
      requestId: meta.requestId,
    });

    return { message: 'Logged out successfully, refresh tokens revoked' };
  }

  private async generateTokens(
    user: any,
    existingFamilyId?: string,
    previousTokenId?: number,
  ) {
    const familyId = existingFamilyId || randomUUID();
    const jti = randomUUID();

    const payload = {
      sub: user.id,
      email: user.email,
      nationalCode: user.nationalCode,
      studentNumber: user.student?.studentNumber,
      role: user.role,
      studentId: user.student?.id ?? null,
      professorId: user.professor?.id ?? null,
      jti,
    };

    const accessExp = this.configService.get<string>('JWT_EXPIRATION', '1d');
    const refreshExp = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: accessExp,
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, familyId },
      {
        secret: this.getJwtRefreshSecret(),
        expiresIn: refreshExp,
      },
    );

    const newHash = sha256(refreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + parseDurationMs(refreshExp, 7 * 24 * 60 * 60 * 1000),
    );

    await this.prisma.$transaction(async (tx) => {
      if (previousTokenId) {
        await tx.refreshToken.update({
          where: { id: previousTokenId },
          data: {
            revokedAt: new Date(),
            replacedByHash: newHash,
          },
        });
      }

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId,
          tokenHash: newHash,
          expiresAt: refreshExpiresAt,
        },
      });
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      role: user.role,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        nationalCode: user.nationalCode,
        studentNumber: user.student?.studentNumber ?? null,
        role: user.role,
        studentId: user.student?.id ?? null,
        professorId: user.professor?.id ?? null,
      },
    };
  }
}
