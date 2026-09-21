import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { Document, Role } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async saveDocument(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    userId: string,
    studentId?: string,
    userRole?: Role,
  ): Promise<Document & { downloadUrl: string }> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    if (userRole === Role.STUDENT && internship.studentId !== studentId) {
      throw new ForbiddenException('You can only upload documents for your own internship');
    }

    const relativePath = `/uploads/documents/${file.filename}`;

    const doc = await this.prisma.document.create({
      data: {
        internshipId: dto.internshipId,
        fileName: file.originalname,
        filePath: relativePath,
        documentType: dto.documentType,
      },
    });

    await this.activityLogsService.log({
      userId,
      action: `بارگذاری فایل مدرک (${file.originalname}) از نوع ${dto.documentType} برای کارآموزی ${internship.id.slice(0, 8)}`,
    });

    return {
      ...doc,
      downloadUrl: `/api/documents/download/${doc.id}`,
    };
  }

  async findByInternship(internshipId: string): Promise<any[]> {
    const docs = await this.prisma.document.findMany({
      where: { internshipId },
      orderBy: { uploadedAt: 'desc' },
    });

    return docs.map((doc) => ({
      ...doc,
      downloadUrl: `/api/documents/download/${doc.id}`,
    }));
  }

  async findOne(id: string): Promise<Document & { downloadUrl: string }> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID '${id}' not found`);
    }

    return {
      ...doc,
      downloadUrl: `/api/documents/download/${doc.id}`,
    };
  }

  async delete(id: string, userId: string) {
    const doc = await this.findOne(id);
    await this.prisma.document.delete({ where: { id } });

    await this.activityLogsService.log({
      userId,
      action: `حذف فایل مدرک ${doc.fileName}`,
    });

    return { message: 'Document deleted successfully' };
  }
}
