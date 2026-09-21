import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'دیجی‌کالا' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'تجارت الکترونیک و توسعه نرم‌افزار' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ example: 'تهران' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'تهران، خیابان گاندی، خیابان بیست و یکم، پلاک ۲۸' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '02161930000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'مهندس سعید پورعلی' })
  @IsString()
  @IsNotEmpty()
  supervisorName: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  supervisorPhone: string;
}
