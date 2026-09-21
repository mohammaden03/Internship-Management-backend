import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new Student or Professor' })
  @ApiResponse({ status: 201, description: 'User successfully registered and tokens returned' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email & password, obtain JWT Access & Refresh tokens' })
  @ApiResponse({ status: 200, description: 'Login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired JWT access token using valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renewed' })
  @ApiResponse({ status: 401, description: 'Refresh token expired or invalid' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active refresh token and log out current user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.userId);
  }
}
