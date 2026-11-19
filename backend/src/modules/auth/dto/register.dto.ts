import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const PASSWORD_POLICY_MESSAGE =
  'رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ، حروف کوچک، عدد و کاراکتر ویژه باشد.';

export class RegisterDto {
  @ApiProperty({ example: 'محمد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'رضایی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: 'm.rezaei@semnan.ac.ir' })
  @IsEmail()
  @MaxLength(128)
  email: string;

  @ApiProperty({ example: '0020000001', description: 'کد ملی ده‌رقمی معتبر کاربر' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nationalCode: string;

  @ApiProperty({
    example: 'Password123@',
    minLength: 8,
    maxLength: 72,
    description: PASSWORD_POLICY_MESSAGE,
  })
  @IsString()
  @MinLength(8, { message: PASSWORD_POLICY_MESSAGE })
  @MaxLength(72, { message: 'رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد' })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password: string;

  @ApiPropertyOptional({ example: '09121234567' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
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
  @MaxLength(32)
  studentNumber?: string;

  @ApiPropertyOptional({ example: 'دانشکده مهندسی کامپیوتر' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  faculty?: string;

  @ApiPropertyOptional({ example: 'مهندسی نرم‌افزار' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  major?: string;

  @ApiPropertyOptional({ example: 'کارشناسی' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  degreeLevel?: string;
}
