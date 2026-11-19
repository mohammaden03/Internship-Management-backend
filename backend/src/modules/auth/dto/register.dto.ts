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

  @ApiProperty({ example: 'm.rezaei@semnan.ac.ir' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0020000001', description: 'کد ملی ده‌رقمی معتبر کاربر' })
  @IsString()
  @IsNotEmpty()
  nationalCode: string;

  @ApiProperty({ example: 'Password123@' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '09121234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.STUDENT,
    description: 'Public registration always assigns STUDENT role regardless of input',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: '401123456' })
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
}
