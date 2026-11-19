import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestWithContext } from '../../common/observability/request-context.middleware';

const AUTH_THROTTLE_LIMIT = Number(process.env.THROTTLE_AUTH_LIMIT || '10');
const AUTH_THROTTLE_TTL_MS = Number(process.env.THROTTLE_AUTH_TTL_MS || '60000');

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Public student self-registration (always assigns STUDENT role)' })
  @ApiResponse({ status: 201, description: 'Student successfully registered and tokens returned' })
  @ApiResponse({ status: 409, description: 'Email, nationalCode, or studentNumber already exists' })
  register(@Body() dto: RegisterDto, @Req() req: RequestWithContext) {
    return this.authService.register(dto, { ip: req.ip, requestId: req.requestId });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Authenticate user with identifier & password, obtain JWT Access & Refresh tokens' })
  @ApiResponse({ status: 200, description: 'Login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  login(@Body() dto: LoginDto, @Req() req: RequestWithContext) {
    return this.authService.login(dto, { ip: req.ip, requestId: req.requestId });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile including student/professor details' })
  @ApiResponse({ status: 200, description: 'Current authenticated user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Rotate refresh token and renew JWT access token (revokes family on reuse)' })
  @ApiResponse({ status: 200, description: 'Tokens renewed and rotated' })
  @ApiResponse({ status: 401, description: 'Refresh token expired, invalid, or reused' })
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: RequestWithContext) {
    return this.authService.refreshToken(dto, { ip: req.ip, requestId: req.requestId });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Alias of /auth/refresh-token to renew and rotate JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens renewed and rotated' })
  @ApiResponse({ status: 401, description: 'Refresh token expired, invalid, or reused' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: RequestWithContext) {
    return this.authService.refreshToken(dto, { ip: req.ip, requestId: req.requestId });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Initiate password recovery flow (always returns 202 without user enumeration)' })
  @ApiResponse({ status: 202, description: 'Recovery request accepted' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: RequestWithContext) {
    return this.authService.forgotPassword(dto, { ip: req.ip, requestId: req.requestId });
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: AUTH_THROTTLE_TTL_MS } })
  @ApiOperation({ summary: 'Reset password using a valid one-time reset token and revoke all active sessions' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid, used, or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: RequestWithContext) {
    return this.authService.resetPassword(dto, { ip: req.ip, requestId: req.requestId });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active refresh tokens and log out current user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout(@CurrentUser() user: AuthenticatedUser, @Req() req: RequestWithContext) {
    return this.authService.logout(user.userId, { ip: req.ip, requestId: req.requestId });
  }
}
