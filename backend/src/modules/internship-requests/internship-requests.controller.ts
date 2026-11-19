import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InternshipRequestsService } from './internship-requests.service';
import { CreateInternshipRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestWithContext } from '../../common/observability/request-context.middleware';
import { Role } from '@prisma/client';

@ApiTags('Internship Requests')
@ApiBearerAuth('JWT-auth')
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
  @ApiPaginatedResponse()
  findAll(@Query() query: PaginationQueryDto) {
    return this.requestsService.findAll(query);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student get own internship requests' })
  @ApiPaginatedResponse()
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
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const request = await this.requestsService.findOne(id);
    if (user.role === Role.STUDENT && request.studentId !== user.studentId) {
      throw new ForbiddenException('Students can only access their own internship requests');
    }
    return request;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin approve or reject request (Approving auto-creates active Internship and assigns supervising professor)' })
  @ApiResponse({ status: 200, description: 'Request status updated' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    return this.requestsService.updateStatus(id, dto, user.userId, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin soft-delete an internship request' })
  @ApiResponse({ status: 200, description: 'Request soft-deleted' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    return this.requestsService.remove(id, user.userId, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }
}
