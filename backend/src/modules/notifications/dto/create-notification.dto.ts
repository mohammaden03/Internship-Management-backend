import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Target user ID', example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Notification title', example: 'تأیید درخواست کارآموزی' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message body', example: 'درخواست کارآموزی شما در شرکت فناوران هوشمند تأیید گردید.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
