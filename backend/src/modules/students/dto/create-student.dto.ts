import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: '400105432' })
  @IsString()
  @IsNotEmpty()
  studentNumber: string;

  @ApiProperty({ example: 'دانشکده مهندسی کامپیوتر' })
  @IsString()
  @IsNotEmpty()
  faculty: string;

  @ApiProperty({ example: 'مهندسی نرم‌افزار' })
  @IsString()
  @IsNotEmpty()
  major: string;

  @ApiProperty({ example: 'کارشناسی' })
  @IsString()
  @IsNotEmpty()
  degreeLevel: string;
}
