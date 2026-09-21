import { ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateInternshipDto {
  @ApiPropertyOptional({ example: 'uuid-professor-id' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @ApiPropertyOptional({ enum: InternshipStatus })
  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus;
}
