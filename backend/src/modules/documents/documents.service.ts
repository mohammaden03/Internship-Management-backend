import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Document, Role } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private buildDocumentResponse(doc: Document) {
    const apiPrefix = (process.env.API_PREFIX || 'api').replace(/^\/+|\/+$/g, '');
    const normalizedFilePath = doc.filePath.startsWith('/') ? doc.filePath : `/${doc.filePath}`;
    const fileUrl = normalizedFilePath.startsWith(`/${apiPrefix}/`)
      ? normalizedFilePath
      : `/${apiPrefix}${normalizedFilePath}`;

    return {
      ...doc,
      fileUrl,
      downloadUrl: `/${apiPrefix}/documents/download/${doc.id}`,
    };
  }

  private assertInternshipAccess(
    internship: { studentId: number; professorId: number },
    user: AuthenticatedUser,
    actionDescription: string,
  ) {
    if (user.role === Role.STUDENT && internship.studentId !== user.studentId) {
      throw new ForbiddenException(`You can only ${actionDescription} for your own internship`);
    }
    if (user.role === Role.PROFESSOR && internship.professorId !== user.professorId) {
      throw new ForbiddenException(
        `You can only ${actionDescription} for internships under your supervision`,
      );
    }
  }

  async saveDocument(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    user: AuthenticatedUser,
  ) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    this.assertInternshipAccess(internship, user, 'upload documents');

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
      userId: user.userId,
      action: `بارگذاری فایل مدرک (${file.originalname}) از نوع ${dto.documentType} برای کارآموزی ${String(internship.id)}`,
    });

    return this.buildDocumentResponse(doc);
  }

  async findByInternship(internshipId: number, user: AuthenticatedUser): Promise<any[]> {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${internshipId}' not found`);
    }

    this.assertInternshipAccess(internship, user, 'view documents');

    const docs = await this.prisma.document.findMany({
      where: { internshipId },
      orderBy: { uploadedAt: 'desc' },
    });

    return docs.map((doc) => this.buildDocumentResponse(doc));
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        internship: {
          select: { id: true, studentId: true, professorId: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID '${id}' not found`);
    }

    this.assertInternshipAccess(doc.internship, user, 'access documents');

    const { internship: _internship, ...plainDoc } = doc;
    return this.buildDocumentResponse(plainDoc);
  }

  async delete(id: number, user: AuthenticatedUser) {
    const doc = await this.findOne(id, user);
    await this.prisma.document.delete({ where: { id } });

    await this.activityLogsService.log({
      userId: user.userId,
      action: `حذف فایل مدرک ${doc.fileName}`,
    });

    return { message: 'Document deleted successfully' };
  }
}
