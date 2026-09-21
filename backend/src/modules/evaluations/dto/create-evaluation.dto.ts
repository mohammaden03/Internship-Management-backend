import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 'uuid-internship-id' })
  @IsUUID()
  @IsNotEmpty()
  internshipId: string;

  @ApiProperty({ example: 19.5, minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  technicalSkill: number;

  @ApiProperty({ example: 19.0, minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  responsibility: number;

  @ApiProperty({ example: 20.0, minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  discipline: number;

  @ApiProperty({ example: 18.5, minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  teamwork: number;

  @ApiProperty({ example: 20.0, minimum: 0, maximum: 20 })
  @IsNumber()
  @Min(0)
  @Max(20)
  attendance: number;

  @ApiProperty({
    example: 'دانشجو در طول دوره کارآموزی تعهد کاری بسیار بالا، انضباط حرفه‌ای و تسلط بر تکنولوژی‌های نوین از خود نشان داد.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
