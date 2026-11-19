import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateInternshipRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId: number;

  @ApiProperty({ example: 'کارآموزی توسعه بک‌اند با NestJS و میکروسرویس‌ها' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'درخواست رسمی گذراندن دوره کارآموزی تابستانه جهت فراگیری توسعه نرم‌افزارهای مقیاس‌پذیر' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2026-09-30T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiPropertyOptional({ example: 240, default: 240 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  totalHours?: number = 240;

  @ApiPropertyOptional({
    example: 'تابستان ۱۴۰۳',
    description: 'Academic term; defaults to the configured active term from settings',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  academicTerm?: string;
}
