import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'دیجی‌کالا' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'تجارت الکترونیک و پردازش ابری' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'آدرس جدید شرکت' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '02161930000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'سرپرست جدید' })
  @IsOptional()
  @IsString()
  supervisorName?: string;

  @ApiPropertyOptional({ example: '09120000000' })
  @IsOptional()
  @IsString()
  supervisorPhone?: string;
}
