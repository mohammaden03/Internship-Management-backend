import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateInternshipDto {
  @ApiProperty({ example: 'uuid-student-id' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 'uuid-professor-id' })
  @IsUUID()
  @IsNotEmpty()
  professorId: string;

  @ApiProperty({ example: 'uuid-company-id' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'uuid-request-id' })
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

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
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number = 0;

  @ApiPropertyOptional({ enum: InternshipStatus, default: InternshipStatus.ACTIVE })
  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus = InternshipStatus.ACTIVE;
}
