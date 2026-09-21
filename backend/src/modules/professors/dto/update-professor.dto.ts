import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfessorDto {
  @ApiPropertyOptional({ example: 'مهندسی کامپیوتر و هوش مصنوعی' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'استاد تمام' })
  @IsOptional()
  @IsString()
  academicRank?: string;
}
