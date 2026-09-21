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
import { ProfessorsService } from './professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Professors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professors')
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin create a professor profile' })
  @ApiResponse({ status: 201, description: 'Professor profile created' })
  create(@Body() createProfessorDto: CreateProfessorDto) {
    return this.professorsService.create(createProfessorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Get all professors with search and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated professors' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.professorsService.findAll(query);
  }

  @Get('assigned-students')
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Professor view all internships and students assigned to them' })
  @ApiResponse({ status: 200, description: 'Assigned student internships' })
  getAssignedStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    if (!user.professorId) {
      throw new ForbiddenException('User is not associated with a professor profile');
    }
    return this.professorsService.findAssignedStudents(user.professorId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Get professor profile by ID' })
  @ApiResponse({ status: 200, description: 'Professor details' })
  findOne(@Param('id') id: string) {
    return this.professorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin update professor details' })
  @ApiResponse({ status: 200, description: 'Professor updated' })
  update(
    @Param('id') id: string,
    @Body() updateProfessorDto: UpdateProfessorDto,
  ) {
    return this.professorsService.update(id, updateProfessorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin delete professor profile' })
  @ApiResponse({ status: 200, description: 'Professor profile deleted' })
  remove(@Param('id') id: string) {
    return this.professorsService.remove(id);
  }
}
