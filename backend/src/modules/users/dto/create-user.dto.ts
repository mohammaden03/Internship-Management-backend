import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'علی' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'احمدی' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@university.ac.ir' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0012345678', description: 'کد ملی ده‌رقمی' })
  @IsString()
  @IsNotEmpty()
  nationalCode: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '09121112233' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  role: Role;
}
