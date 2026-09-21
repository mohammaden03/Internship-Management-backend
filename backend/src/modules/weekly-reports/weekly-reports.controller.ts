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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WeeklyReportsService } from './weekly-reports.service';
import { CreateWeeklyReportDto } from './dto/create-report.dto';
import { ReviewWeeklyReportDto } from './dto/review-report.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Weekly Reports')
@ApiBearerAuth()
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
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor get all weekly reports with status filter (e.g. GET /weekly-reports?status=APPROVED), pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated weekly reports' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Get('internship/:internshipId')
  @ApiOperation({ summary: 'Get all weekly reports for an internship' })
  @ApiResponse({ status: 200, description: 'Reports list' })
  findByInternship(@Param('internshipId') internshipId: string) {
    return this.reportsService.findByInternship(internshipId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific weekly report details' })
  @ApiResponse({ status: 200, description: 'Weekly report details' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Professor or Admin approve or reject a weekly report (triggers notification & updates progress)' })
  @ApiResponse({ status: 200, description: 'Report reviewed' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewWeeklyReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.review(
      id,
      dto,
      user.professorId || null,
      user.role,
      user.userId,
    );
  }
}
