import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Service liveness probe' })
  @ApiResponse({ status: 200, description: 'Service process is alive' })
  check() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Service readiness probe verifying database connectivity (SELECT 1)' })
  @ApiResponse({ status: 200, description: 'Service and database are ready' })
  @ApiResponse({ status: 503, description: 'Database connectivity check failed' })
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'up',
      };
    } catch {
      throw new ServiceUnavailableException('Database readiness check failed');
    }
  }
}
