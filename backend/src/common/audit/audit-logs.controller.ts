import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ApiPaginatedResponse } from '../dto/paginated-response.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Admin query structured security audit logs (login, password reset, role changes, approvals, document access)',
  })
  @ApiPaginatedResponse(undefined, { paginated: true })
  findAll(@Query() query: PaginationQueryDto) {
    return this.auditLogsService.findAll(query);
  }
}
