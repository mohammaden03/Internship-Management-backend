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
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { ApiPaginatedResponse } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestWithContext } from '../../common/observability/request-context.middleware';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin create a new user (Student, Professor, or Admin)' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin get all active users with search, pagination, sorting and role filter' })
  @ApiPaginatedResponse(undefined, { paginated: true })
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current logged-in user profile details' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOne(user.userId);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update own editable user profile fields (firstName, lastName, phoneNumber only)' })
  @ApiResponse({ status: 200, description: 'Updated own profile' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin update user details, role or active status' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    return this.usersService.update(id, updateUserDto, actor.userId, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin soft-delete a user (preserves historical records)' })
  @ApiResponse({ status: 200, description: 'User soft-deleted' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    return this.usersService.remove(id, actor.userId, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }
}
