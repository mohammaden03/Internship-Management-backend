import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInternshipDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  professorId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestId: number;

  @ApiPropertyOptional({ example: 'تابستان ۱۴۰۳' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  academicTerm?: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2026-09-30T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number = 0;

  @ApiPropertyOptional({ enum: InternshipStatus, default: InternshipStatus.ACTIVE })
  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus = InternshipStatus.ACTIVE;
}
