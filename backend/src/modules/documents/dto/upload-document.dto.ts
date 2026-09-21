import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ example: 'uuid-internship-id' })
  @IsUUID()
  @IsNotEmpty()
  internshipId: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.INTRODUCTION_LETTER,
    description: 'Category of document being submitted',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;
}
