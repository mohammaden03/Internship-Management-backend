import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AuditLogsService } from '../../common/audit/audit-logs.service';
import { STORAGE_DRIVER, StorageDriver } from '../../common/storage/storage-driver.interface';
import { validateUploadedFile } from '../../common/storage/file-validation.utils';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  buildCollectionResponse,
  PaginatedResponseDto,
} from '../../common/dto/paginated-response.dto';
import { Document, Role } from '@prisma/client';

interface DocumentAuditMeta {
  ip?: string;
  requestId?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private auditLogsService: AuditLogsService,
    @Inject(STORAGE_DRIVER) private storageDriver: StorageDriver,
  ) {}

  private buildDocumentResponse(doc: Document) {
    const apiPrefix = (process.env.API_PREFIX || 'api').replace(/^\/+|\/+$/g, '');

    return {
      id: doc.id,
      internshipId: doc.internshipId,
      fileName: doc.fileName,
      originalName: doc.originalName || doc.fileName,
      mimeType: doc.mimeType,
      size: doc.size,
      sha256: doc.sha256,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt,
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
    meta: DocumentAuditMeta = {},
  ) {
    const internship = await this.prisma.internship.findFirst({
      where: { id: dto.internshipId, deletedAt: null },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${dto.internshipId}' not found`);
    }

    this.assertInternshipAccess(internship, user, 'upload documents');

    const validated = validateUploadedFile(file);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    // [A8] Deduplicate identical file uploads per internship
    const existingDuplicate = await this.prisma.document.findFirst({
      where: {
        internshipId: dto.internshipId,
        sha256,
        deletedAt: null,
      },
    });
    if (existingDuplicate) {
      return {
        ...this.buildDocumentResponse(existingDuplicate),
        deduplicated: true,
      };
    }

    const storageKey = `${dto.internshipId}/${Date.now()}-${randomUUID()}${validated.extension}`;
    await this.storageDriver.save(storageKey, file.buffer);

    const doc = await this.prisma.document.create({
      data: {
        internshipId: dto.internshipId,
        fileName: file.originalname,
        originalName: file.originalname,
        filePath: storageKey,
        storageKey,
        mimeType: validated.detectedMime,
        size: file.buffer.length,
        sha256,
        documentType: dto.documentType,
      },
    });

    await this.activityLogsService.log({
      userId: user.userId,
      action: `بارگذاری فایل مدرک (${file.originalname}) از نوع ${dto.documentType} برای کارآموزی ${String(internship.id)}`,
    });

    await this.auditLogsService.record({
      actorId: user.userId,
      event: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc.id,
      ip: meta.ip,
      requestId: meta.requestId,
      metadata: {
        internshipId: dto.internshipId,
        documentType: dto.documentType,
        mimeType: validated.detectedMime,
        size: file.buffer.length,
        sha256,
      },
    });

    return {
      ...this.buildDocumentResponse(doc),
      deduplicated: false,
    };
  }

  async findByInternship(
    internshipId: number,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<any>> {
    const internship = await this.prisma.internship.findFirst({
      where: { id: internshipId, deletedAt: null },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with ID '${internshipId}' not found`);
    }

    this.assertInternshipAccess(internship, user, 'view documents');

    const docs = await this.prisma.document.findMany({
      where: { internshipId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
    });

    return buildCollectionResponse(docs.map((doc) => this.buildDocumentResponse(doc)));
  }

  private async findRawWithAccess(id: number, user: AuthenticatedUser) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        internship: {
          select: { id: true, studentId: true, professorId: true, deletedAt: true },
        },
      },
    });

    if (!doc || doc.internship?.deletedAt) {
      throw new NotFoundException(`Document with ID '${id}' not found`);
    }

    this.assertInternshipAccess(doc.internship, user, 'access documents');
    return doc;
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const doc = await this.findRawWithAccess(id, user);
    const { internship: _internship, ...plainDoc } = doc;
    return this.buildDocumentResponse(plainDoc);
  }

  async download(
    id: number,
    user: AuthenticatedUser,
    meta: DocumentAuditMeta = {},
  ): Promise<{ doc: Document; buffer: Buffer }> {
    const doc = await this.findRawWithAccess(id, user);
    const storageKey = doc.storageKey || doc.filePath.replace(/^\/+/, '');

    const exists = await this.storageDriver.exists(storageKey);
    if (!exists) {
      throw new NotFoundException(`Stored binary for document '${id}' is missing`);
    }

    const buffer = await this.storageDriver.read(storageKey);

    await this.auditLogsService.record({
      actorId: user.userId,
      event: 'DOCUMENT_DOWNLOADED',
      entityType: 'Document',
      entityId: doc.id,
      ip: meta.ip,
      requestId: meta.requestId,
      metadata: { internshipId: doc.internshipId },
    });

    const { internship: _internship, ...plainDoc } = doc;
    return { doc: plainDoc, buffer };
  }

  async delete(id: number, user: AuthenticatedUser, meta: DocumentAuditMeta = {}) {
    const doc = await this.findOne(id, user);
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogsService.log({
      userId: user.userId,
      action: `حذف فایل مدرک ${doc.fileName}`,
    });

    await this.auditLogsService.record({
      actorId: user.userId,
      event: 'DOCUMENT_DELETED',
      entityType: 'Document',
      entityId: id,
      ip: meta.ip,
      requestId: meta.requestId,
    });

    return { message: 'Document archived successfully' };
  }
}
