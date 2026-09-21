import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '99123401' })
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
