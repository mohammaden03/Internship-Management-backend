import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WeeklyReportsService } from './weekly-reports.service';
import { CreateWeeklyReportDto } from './dto/create-report.dto';
import { ReviewWeeklyReportDto } from './dto/review-report.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Weekly Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('weekly-reports')
export class WeeklyReportsController {
  constructor(private readonly reportsService: WeeklyReportsService) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student submit a weekly report' })
  @ApiResponse({ status: 201, description: 'Weekly report submitted' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWeeklyReportDto,
  ) {
    if (!user.studentId) {
      throw new ForbiddenException('Only students can submit weekly reports');
    }
    return this.reportsService.create(user.studentId, user.userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.STUDENT)
  @ApiOperation({ summary: 'Get weekly reports scoped by role with status filter, pagination and search' })
  @ApiPaginatedResponse()
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.findAll(query, user);
  }

  @Get('internship/:internshipId')
  @ApiOperation({ summary: 'Get all weekly reports for an internship (scoped by role)' })
  @ApiPaginatedResponse(undefined, { paginated: false })
  findByInternship(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.findByInternship(internshipId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific weekly report details (scoped by role)' })
  @ApiResponse({ status: 200, description: 'Weekly report details' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.findOne(id, user);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Professor or Admin review a weekly report (APPROVED, REJECTED, or NEEDS_REVISION)' })
  @ApiResponse({ status: 200, description: 'Report reviewed' })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewWeeklyReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.review(
      id,
      dto,
      user.professorId ?? null,
      user.role,
      user.userId,
    );
  }
}
