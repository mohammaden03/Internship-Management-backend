import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
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

    if (!user || !user.isActive || user.deletedAt !== null) {
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
