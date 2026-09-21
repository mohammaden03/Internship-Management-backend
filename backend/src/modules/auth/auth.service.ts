import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered in the system');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          phoneNumber: dto.phoneNumber,
          role: dto.role,
        },
      });

      if (dto.role === Role.STUDENT) {
        if (!dto.studentNumber) {
          throw new BadRequestException('studentNumber is required for STUDENT registration');
        }
        await tx.student.create({
          data: {
            userId: createdUser.id,
            studentNumber: dto.studentNumber,
            faculty: dto.faculty || 'دانشکده مهندسی',
            major: dto.major || 'مهندسی کامپیوتر',
            degreeLevel: dto.degreeLevel || 'کارشناسی',
          },
        });
      } else if (dto.role === Role.PROFESSOR) {
        await tx.professor.create({
          data: {
            userId: createdUser.id,
            department: dto.department || 'گروه مهندسی کامپیوتر',
            academicRank: dto.academicRank || 'استادیار',
          },
        });
      }

      return createdUser;
    });

    await this.activityLogsService.log({
      userId: user.id,
      action: `ثبت نام کاربر جدید در سامانه با نقش ${user.role}`,
    });

    await this.notificationsService.create({
      userId: user.id,
      title: 'خوش‌آمدید به سامانه کارآموزی دانشگاه',
      message: 'حساب کاربری شما با موفقیت در سامانه ایجاد شد.',
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        student: true,
        professor: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated by an administrator');
    }

    // Track activity log
    await this.activityLogsService.log({
      userId: user.id,
      action: `ورود موفقیت‌آمیز کاربر (${user.email}) به سامانه با نقش ${user.role}`,
    });

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super_refresh_jwt_key_university_internship_2026';
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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

  async logout(userId: string) {
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
      role: user.role,
      studentId: user.student?.id,
      professorId: user.professor?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_university_internship_2026',
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super_refresh_jwt_key_university_internship_2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    // Store refresh token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.student?.id,
        professorId: user.professor?.id,
      },
    };
  }
}
