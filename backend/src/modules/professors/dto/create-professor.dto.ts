import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'مهندسی کامپیوتر و فناوری اطلاعات' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 'استاد تمام' })
  @IsString()
  @IsNotEmpty()
  academicRank: string;
}
