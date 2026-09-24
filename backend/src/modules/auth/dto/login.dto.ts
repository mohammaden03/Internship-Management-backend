import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'شناسه ورود کاربر (کد ملی یا شماره دانشجویی)',
    example: '0012345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'شناسه ورود (identifier) الزامی است' })
  identifier: string;

  @ApiProperty({
    description: 'رمز عبور حساب کاربری',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور (password) الزامی است' })
  password: string;
}
