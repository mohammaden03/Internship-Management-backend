import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_university_internship_2026',
    });
  }

  async validate(payload: JwtPayload) {
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid token subject');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        professor: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account not found, deactivated, or unauthorized');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.student?.id,
      professorId: user.professor?.id,
    };
  }
}
