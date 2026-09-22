import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'شناسه ورود: کد ملی (برای کلیه کاربران) یا شماره دانشجویی (مخصوص دانشجو) یا ایمیل',
    example: '0012345678',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    description: 'کد ملی ده‌رقمی (ورود دانشجو، استاد و مدیر سیستم)',
    example: '0012345678',
  })
  @IsOptional()
  @IsString()
  nationalCode?: string;

  @ApiPropertyOptional({
    description: 'شماره دانشجویی هشت‌رقمی (مخصوص ورود دانشجو)',
    example: '99123401',
  })
  @IsOptional()
  @IsString()
  studentNumber?: string;

  @ApiPropertyOptional({
    description: 'ایمیل دانشگاهی (پشتیبانی ثانویه)',
    example: 'admin@university.ac.ir',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'رمز عبور حساب کاربری',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
