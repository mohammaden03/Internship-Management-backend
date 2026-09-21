import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user notifications with pagination & search' })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
  getMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.findUserNotifications(user.userId, query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin create custom notification for a user' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications of current user as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
