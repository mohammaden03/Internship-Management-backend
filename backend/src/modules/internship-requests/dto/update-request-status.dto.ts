import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ApiPropertyOptional({
    description: 'Assigned supervising professor ID (required when status is APPROVED)',
    example: 'uuid-professor-id',
  })
  @IsOptional()
  @IsUUID()
  professorId?: string;
}
