import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
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
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(Role.PROFESSOR)
  @ApiOperation({
    summary: 'Professor submit final evaluation for an assigned internship (auto-calculates weighted score and completes internship)',
  })
  @ApiResponse({ status: 201, description: 'Evaluation created and internship completed' })
  create(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.professorId) {
      throw new ForbiddenException('Only supervising professors can submit final evaluations');
    }
    return this.evaluationsService.create(dto, user.professorId, user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.STUDENT)
  @ApiOperation({ summary: 'Get submitted evaluations scoped by role with pagination & search' })
  @ApiResponse({ status: 200, description: 'Paginated evaluations' })
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.findAll(query, user);
  }

  @Get('internship/:internshipId')
  @ApiOperation({ summary: 'Get evaluation for specific internship (scoped by role)' })
  @ApiResponse({ status: 200, description: 'Internship evaluation' })
  findByInternship(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.findByInternship(internshipId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evaluation details by evaluation ID (scoped by role)' })
  @ApiResponse({ status: 200, description: 'Evaluation details' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evaluationsService.findOne(id, user);
  }
}
