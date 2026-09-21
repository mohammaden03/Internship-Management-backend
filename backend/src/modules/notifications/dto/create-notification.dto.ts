import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Target user ID', example: 'uuid-1234' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Notification title', example: 'تأیید درخواست کارآموزی' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message body', example: 'درخواست کارآموزی شما در شرکت دیجی‌کالا تأیید گردید.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
