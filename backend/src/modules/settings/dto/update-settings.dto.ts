import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'دانشگاه سمنان' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  universityName?: string;

  @ApiPropertyOptional({ example: 'تابستان ۱۴۰۳' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  academicTerm?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  registrationStart?: string;

  @ApiPropertyOptional({ example: '2024-10-15' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  registrationEnd?: string;

  @ApiPropertyOptional({ example: '2024-11-01' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  letterDeadline?: string;

  @ApiPropertyOptional({ example: '2025-01-20' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gradingDeadline?: string;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  minHours?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  maxWeeklyHours?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoIssueLetter?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  insuranceEnabled?: boolean;
}
