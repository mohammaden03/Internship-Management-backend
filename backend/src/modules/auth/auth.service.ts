import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
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

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const rawIdentifier = (dto.identifier || '').trim();

    if (!rawIdentifier) {
      throw new BadRequestException('شناسه ورود (کد ملی یا شماره دانشجویی) الزامی است.');
    }

    if (!dto.password) {
      throw new BadRequestException('رمز عبور الزامی است.');
    }

    // 1. Check by nationalCode
    let user = await this.prisma.user.findUnique({
      where: { nationalCode: rawIdentifier },
      include: {
        student: true,
        professor: true,
      },
    });

    // 2. Check by studentNumber
    if (!user) {
      const student = await this.prisma.student.findUnique({
        where: { studentNumber: rawIdentifier },
        include: {
          user: {
            include: {
              student: true,
              professor: true,
            },
          },
        },
      });

      if (student?.user) {
        user = student.user;
      }
    }

    // 3. Fallback: check by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
        include: {
          student: true,
          professor: true,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است. کاربری با این کد ملی یا شماره دانشجویی یافت نشد.');
    }

    if (user.role === Role.PROFESSOR || user.role === Role.ADMIN) {
      const matchedWithNationalCode = user.nationalCode === rawIdentifier;
      const matchedWithEmail = user.email.toLowerCase() === rawIdentifier.toLowerCase();
      if (!matchedWithNationalCode && !matchedWithEmail) {
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
      throw new UnauthorizedException('رمز عبور وارد شده نادرست است.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما توسط مدیر سامانه غیرفعال شده است.');
    }

    await this.activityLogsService.log({
      userId: user.id,
      action: `ورود موفقیت‌آمیز (${user.firstName} ${user.lastName} - کد ملی: ${user.nationalCode}) به سامانه با نقش ${user.role}`,
    });

    return this.generateTokens(user);
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super_refresh_jwt_key_university_internship_2026';
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new UnauthorizedException('Invalid refresh token subject');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          student: true,
          professor: true,
        },
      });

      if (!user || !user.isActive || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Refresh token is invalid or has expired');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const target = (dto.identifier || dto.email || '').trim();
    if (!target) {
      throw new BadRequestException('شناسه یا ایمیل جهت بازیابی رمز عبور الزامی است.');
    }

    // Intentionally do not reveal whether the user exists to prevent user enumeration
    return {
      accepted: true,
      message: 'در صورت وجود حساب کاربری با این مشخصات، دستورالعمل بازیابی رمز عبور ارسال خواهد شد.',
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.activityLogsService.log({
      userId,
      action: 'خروج کاربر از سامانه و ابطال توکن‌های فعال',
    });

    return { message: 'Logged out successfully, refresh token revoked' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      nationalCode: user.nationalCode,
      studentNumber: user.student?.studentNumber,
      role: user.role,
      studentId: user.student?.id ?? null,
      professorId: user.professor?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_university_internship_2026',
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super_refresh_jwt_key_university_internship_2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
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
