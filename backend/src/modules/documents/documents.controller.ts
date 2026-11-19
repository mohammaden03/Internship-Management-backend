import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ApiPaginatedResponse } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestWithContext } from '../../common/observability/request-context.middleware';
import {
  getMaxFileSizeBytesFromEnv,
  sanitizeDownloadFilename,
} from '../../common/storage/file-validation.utils';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({
    summary:
      'Upload an internship document (validated by extension, MIME type, magic bytes, and size limit; deduplicated per internship by SHA-256)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        internshipId: { type: 'integer', example: 1 },
        documentType: {
          type: 'string',
          enum: ['INTRODUCTION_LETTER', 'CONTRACT', 'START_FORM', 'FINAL_REPORT', 'OTHER'],
          example: 'INTRODUCTION_LETTER',
        },
      },
      required: ['file', 'internshipId', 'documentType'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: getMaxFileSizeBytesFromEnv(),
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.documentsService.saveDocument(file, dto, user, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }

  @Get('internship/:internshipId')
  @ApiOperation({ summary: 'Get all documents uploaded for an internship (scoped by role)' })
  @ApiPaginatedResponse(undefined, { paginated: false })
  findByInternship(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findByInternship(internshipId, user);
  }

  @Get('download/:id')
  @ApiOperation({
    summary: 'Download document binary file through authenticated, role-scoped endpoint',
  })
  @ApiResponse({ status: 200, description: 'Document binary stream' })
  @ApiResponse({ status: 404, description: 'Document metadata or backing file not found' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithContext,
    @Res() res: Response,
  ) {
    const { doc, buffer } = await this.documentsService.download(id, user, {
      ip: req.ip,
      requestId: req.requestId,
    });

    const { asciiFallback, utf8Encoded } = sanitizeDownloadFilename(
      doc.originalName || doc.fileName,
    );

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');

    return res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata by ID (scoped by role)' })
  @ApiResponse({ status: 200, description: 'Document metadata' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findOne(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a document (scoped by role)' })
  @ApiResponse({ status: 200, description: 'Document archived' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithContext,
  ) {
    return this.documentsService.delete(id, user, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }
}
