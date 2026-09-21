import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateWeeklyReportDto {
  @ApiProperty({ example: 'uuid-internship-id' })
  @IsUUID()
  @IsNotEmpty()
  internshipId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  weekNumber: number;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2026-07-07T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ example: 'پیاده‌سازی احراز هویت با JWT و اتصال به دیتابیس پستگرس' })
  @IsString()
  @IsNotEmpty()
  activities: string;

  @ApiProperty({ example: 'NestJS, Prisma ORM, JWT, Docker' })
  @IsString()
  @IsNotEmpty()
  skillsLearned: string;

  @ApiPropertyOptional({ example: 'مدیریت مهاجرت‌های دیتابیس در محیط کانتینر' })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiProperty({ example: 'شرح جامع فعالیت‌های انجام شده در هفته اول' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
