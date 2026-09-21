import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({ description: 'User ID responsible for action', example: 'uuid-1234' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Description of the performed action', example: 'ورود کاربر به سامانه' })
  @IsString()
  @IsNotEmpty()
  action: string;
}
