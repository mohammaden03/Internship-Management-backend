import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateInternshipRequestDto {
  @ApiProperty({ example: 'uuid-company-id' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'کارآموزی توسعه بک‌اند با NestJS و میکروسرویس‌ها' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'درخواست رسمی گذراندن دوره کارآموزی تابستانه جهت فراگیری توسعه نرم‌افزارهای مقیاس‌پذیر' })
  @IsString()
  @IsNotEmpty()
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
  @IsInt()
  @Min(100)
  totalHours?: number = 240;
}
