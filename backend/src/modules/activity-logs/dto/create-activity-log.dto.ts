import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({ description: 'User ID responsible for action', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Description of the performed action', example: 'ورود کاربر به سامانه' })
  @IsString()
  @IsNotEmpty()
  action: string;
}
