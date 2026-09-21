import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewWeeklyReportDto {
  @ApiProperty({ enum: [ReportStatus.APPROVED, ReportStatus.REJECTED], example: ReportStatus.APPROVED })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @ApiPropertyOptional({ example: 'گزارش این هفته بررسی شد و تسلط دانشجو بر مباحث بسیار خوب ارزیابی می‌شود.' })
  @IsOptional()
  @IsString()
  professorComment?: string;
}
