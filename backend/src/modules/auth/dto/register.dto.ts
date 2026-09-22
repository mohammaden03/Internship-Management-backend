import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'محمد' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'رضایی' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'm.rezaei@student.ac.ir' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0020000001', description: 'کد ملی ده‌رقمی معتبر کاربر' })
  @IsString()
  @IsNotEmpty()
  nationalCode: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '09121234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  role: Role = Role.STUDENT;

  // Student-specific fields (if role === STUDENT)
  @ApiPropertyOptional({ example: '99123401' })
  @IsOptional()
  @IsString()
  studentNumber?: string;

  @ApiPropertyOptional({ example: 'دانشکده مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  faculty?: string;

  @ApiPropertyOptional({ example: 'مهندسی نرم‌افزار' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: 'کارشناسی' })
  @IsOptional()
  @IsString()
  degreeLevel?: string;

  // Professor-specific fields (if role === PROFESSOR)
  @ApiPropertyOptional({ example: 'مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'استادیار' })
  @IsOptional()
  @IsString()
  academicRank?: string;
}
