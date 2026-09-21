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
import { InternshipRequestsService } from './internship-requests.service';
import { CreateInternshipRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Internship Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('internship-requests')
export class InternshipRequestsController {
  constructor(private readonly requestsService: InternshipRequestsService) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student submit an internship request for a company' })
  @ApiResponse({ status: 201, description: 'Request created in PENDING state' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInternshipRequestDto,
  ) {
    if (!user.studentId) {
      throw new ForbiddenException('Only registered students can submit internship requests');
    }
    return this.requestsService.create(user.studentId, user.userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Admin or Professor get all requests with search, pagination and status filter' })
  @ApiResponse({ status: 200, description: 'Paginated requests' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.requestsService.findAll(query);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student get own internship requests' })
  @ApiResponse({ status: 200, description: 'List of student requests' })
  getMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    if (!user.studentId) {
      throw new ForbiddenException('Student profile not found');
    }
    return this.requestsService.findMyRequests(user.studentId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific internship request by ID' })
  @ApiResponse({ status: 200, description: 'Request details' })
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin approve or reject request (Approving auto-creates active Internship and assigns supervising professor)' })
  @ApiResponse({ status: 200, description: 'Request status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requestsService.updateStatus(id, dto, user.userId);
  }
}
