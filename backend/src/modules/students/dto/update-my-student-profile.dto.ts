import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMyStudentProfileDto {
  @ApiPropertyOptional({ example: 'محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'احمدی' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: '09121234567' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'دانشکده مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  faculty?: string;

  @ApiPropertyOptional({ example: 'مهندسی نرم‌افزار' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  major?: string;

  @ApiPropertyOptional({ example: 'کارشناسی' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  degreeLevel?: string;
}
