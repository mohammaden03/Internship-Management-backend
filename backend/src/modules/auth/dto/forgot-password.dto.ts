import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'User identifier (email, national code, or student number)',
    example: 'm.ahmadi@semnan.ac.ir',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'm.ahmadi@semnan.ac.ir',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
