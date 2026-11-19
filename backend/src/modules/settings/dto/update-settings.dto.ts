import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: '۱۴۰۳-۱۴۰۴ نیمسال دوم' })
  @IsOptional()
  @IsString()
  academicTerm?: string;

  @ApiPropertyOptional({ example: '2025-02-01' })
  @IsOptional()
  @IsString()
  registrationStart?: string;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsString()
  registrationEnd?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @IsString()
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
