import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'شناسه ورود کاربر (کد ملی، شماره دانشجویی یا ایمیل)',
    example: '0021345678',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'شناسه ورود (identifier) الزامی است' })
  @MaxLength(128, { message: 'شناسه ورود نباید بیشتر از ۱۲۸ کاراکتر باشد' })
  identifier: string;

  @ApiProperty({
    description: 'رمز عبور حساب کاربری',
    example: 'Password123@',
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور (password) الزامی است' })
  @MaxLength(72, { message: 'رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد' })
  password: string;
}
