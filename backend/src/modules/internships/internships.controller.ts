import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Internships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('internships')
export class InternshipsController {
  constructor(private readonly internshipsService: InternshipsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin manually create an internship' })
  @ApiResponse({ status: 201, description: 'Internship created' })
  create(@Body() dto: CreateInternshipDto) {
    return this.internshipsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor get all internships with search, pagination, and status filter' })
  @ApiResponse({ status: 200, description: 'Paginated internships' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.internshipsService.findAll(query);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student view own internship records with reports, documents, and evaluation' })
  @ApiResponse({ status: 200, description: 'List of student internships' })
  getMyInternships(@CurrentUser() user: AuthenticatedUser) {
    if (!user.studentId) {
      throw new ForbiddenException('Student profile not found for user');
    }
    return this.internshipsService.findByStudent(user.studentId);
  }

  @Get('supervised')
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Professor view all internships under their academic supervision' })
  @ApiResponse({ status: 200, description: 'Supervised internships' })
  getSupervisedInternships(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    if (!user.professorId) {
      throw new ForbiddenException('Professor profile not found');
    }
    return this.internshipsService.findByProfessor(user.professorId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full internship details by ID' })
  @ApiResponse({ status: 200, description: 'Internship details' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const internship = await this.internshipsService.findOne(id);
    if (user.role === Role.STUDENT && internship.studentId !== user.studentId) {
      throw new ForbiddenException('Students can only access their own internship details');
    }
    if (user.role === Role.PROFESSOR && internship.professorId !== user.professorId) {
      throw new ForbiddenException('Professors can only access internships assigned to them');
    }
    return internship;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor update progress percentage or status' })
  @ApiResponse({ status: 200, description: 'Internship updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInternshipDto,
  ) {
    return this.internshipsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin delete an internship record' })
  @ApiResponse({ status: 200, description: 'Internship deleted' })
  remove(@Param('id') id: string) {
    return this.internshipsService.remove(id);
  }
}
