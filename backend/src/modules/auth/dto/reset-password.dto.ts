import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from './register.dto';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'One-time password reset token delivered via email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty({ message: 'توکن بازیابی رمز عبور الزامی است' })
  @MaxLength(256)
  token: string;

  @ApiProperty({
    description: PASSWORD_POLICY_MESSAGE,
    example: 'NewStrongPass123@',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8, { message: PASSWORD_POLICY_MESSAGE })
  @MaxLength(72, { message: 'رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد' })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  newPassword: string;
}
