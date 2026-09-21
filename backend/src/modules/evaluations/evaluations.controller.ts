import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Evaluations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Professor or Admin submit final evaluation for an internship (auto-calculates final score, completes internship, notifies student)' })
  @ApiResponse({ status: 201, description: 'Evaluation created and internship completed' })
  create(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.create(
      dto,
      user.professorId || null,
      user.role,
      user.userId,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor get all submitted evaluations with pagination & search' })
  @ApiResponse({ status: 200, description: 'Paginated evaluations' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.evaluationsService.findAll(query);
  }

  @Get('internship/:internshipId')
  @ApiOperation({ summary: 'Get evaluation for specific internship (Students can view own evaluation)' })
  @ApiResponse({ status: 200, description: 'Internship evaluation' })
  findByInternship(@Param('internshipId') internshipId: string) {
    return this.evaluationsService.findByInternship(internshipId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evaluation details by evaluation ID' })
  @ApiResponse({ status: 200, description: 'Evaluation details' })
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }
}
