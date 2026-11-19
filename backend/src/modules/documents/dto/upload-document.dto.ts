import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  internshipId: number;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.INTRODUCTION_LETTER,
    description: 'Category of document being submitted',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;
}
