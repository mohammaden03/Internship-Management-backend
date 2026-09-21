import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin get all audit activity logs with pagination, user details, and search' })
  @ApiResponse({ status: 200, description: 'Paginated activity logs' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.activityLogsService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user personal activity logs' })
  @ApiResponse({ status: 200, description: 'Personal activity logs' })
  findMyLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.activityLogsService.findByUser(user.userId, query);
  }
}
