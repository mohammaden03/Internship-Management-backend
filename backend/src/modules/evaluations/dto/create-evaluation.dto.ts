import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  internshipId: number;

  @ApiProperty({ example: 19.5, minimum: 0, maximum: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  technicalSkill: number;

  @ApiProperty({ example: 19.0, minimum: 0, maximum: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  responsibility: number;

  @ApiProperty({ example: 20.0, minimum: 0, maximum: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  discipline: number;

  @ApiProperty({ example: 18.5, minimum: 0, maximum: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  teamwork: number;

  @ApiProperty({ example: 20.0, minimum: 0, maximum: 20 })
  @Type(() => Number)
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
