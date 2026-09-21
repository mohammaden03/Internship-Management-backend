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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin create a student profile' })
  @ApiResponse({ status: 201, description: 'Student created' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor get all students with pagination, search, and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated students list' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student get own full academic profile and internship status' })
  @ApiResponse({ status: 200, description: 'Own student profile' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findByUserId(user.userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.STUDENT)
  @ApiOperation({ summary: 'Get student details by ID (Student can only access own profile)' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.STUDENT && user.studentId !== id) {
      throw new ForbiddenException('Students can only access their own profile');
    }
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin update student details' })
  @ApiResponse({ status: 200, description: 'Updated student' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin delete student profile' })
  @ApiResponse({ status: 200, description: 'Student profile deleted' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
