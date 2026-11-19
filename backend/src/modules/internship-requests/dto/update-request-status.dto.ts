import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ApiPropertyOptional({
    description: 'Assigned supervising professor ID (required when status is APPROVED)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  professorId?: number;

  @ApiPropertyOptional({
    description: 'Optional rejection reason when status is REJECTED',
    example: 'ظرفیت پذیرش شرکت تکمیل شده است',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
