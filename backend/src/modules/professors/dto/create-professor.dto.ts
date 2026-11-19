import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 'مهندسی کامپیوتر و فناوری اطلاعات' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 'استاد تمام' })
  @IsString()
  @IsNotEmpty()
  academicRank: string;
}
