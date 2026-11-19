import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMyProfessorProfileDto {
  @ApiPropertyOptional({ example: 'محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'رضایی' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: '09127894561' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional({ example: 'دانشیار' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  academicRank?: string;
}
