import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewWeeklyReportDto {
  @ApiProperty({
    enum: [ReportStatus.APPROVED, ReportStatus.REJECTED, ReportStatus.NEEDS_REVISION],
    example: ReportStatus.APPROVED,
  })
  @IsIn([ReportStatus.APPROVED, ReportStatus.REJECTED, ReportStatus.NEEDS_REVISION])
  @IsNotEmpty()
  status: ReportStatus;

  @ApiPropertyOptional({
    example: 'گزارش این هفته بررسی شد و تسلط دانشجو بر مباحث بسیار خوب ارزیابی می‌شود.',
  })
  @IsOptional()
  @IsString()
  professorComment?: string;
}
