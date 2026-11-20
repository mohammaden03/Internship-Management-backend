import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWeeklyReportDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  internshipId: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
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

  // Required by the student report form too: at least 3 characters after trimming.
  @ApiProperty({ example: 'NestJS, Prisma ORM, JWT, Docker', minLength: 3 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'مهارت‌ها و آموخته‌های جدید باید حداقل ۳ کاراکتر باشد.' })
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
