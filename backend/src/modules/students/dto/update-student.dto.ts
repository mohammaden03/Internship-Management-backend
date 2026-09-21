import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: '99123401' })
  @IsOptional()
  @IsString()
  studentNumber?: string;

  @ApiPropertyOptional({ example: 'دانشکده مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  faculty?: string;

  @ApiPropertyOptional({ example: 'مهندسی هوش مصنوعی' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: 'کارشناسی ارشد' })
  @IsOptional()
  @IsString()
  degreeLevel?: string;
}
