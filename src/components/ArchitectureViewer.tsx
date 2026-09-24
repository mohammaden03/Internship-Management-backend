import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  FolderTree,
  ShieldCheck,
  Server,
  Database,
  Container,
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('schema.prisma');
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<string, { label: string; lang: string; content: string }> = {
    'schema.prisma': {
      label: 'prisma/schema.prisma (پایگاه‌داده و مدل‌ها)',
      lang: 'prisma',
      content: `// Prisma Schema for University Internship Management System
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  PROFESSOR
  STUDENT
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

enum InternshipStatus {
  PENDING
  ACTIVE
  COMPLETED
  REJECTED
}

enum ReportStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

enum DocumentType {
  INTRODUCTION_LETTER
  CONTRACT
  START_FORM
  FINAL_REPORT
  OTHER
}

model User {
  id           Int           @id @default(autoincrement())
  firstName    String        @map("first_name")
  lastName     String        @map("last_name")
  email        String        @unique
  password     String
  phoneNumber  String?       @map("phone_number")
  role         Role          @default(STUDENT)
  isActive     Boolean       @default(true) @map("is_active")
  refreshToken String?       @map("refresh_token")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  student      Student?
  professor    Professor?
  activityLogs ActivityLog[]
  notifications Notification[]

  @@map("users")
}

model Student {
  id            Int      @id @default(autoincrement())
  studentNumber String   @unique @map("student_number")
  faculty       String
  major         String
  degreeLevel   String   @map("degree_level")
  userId        Int      @unique @map("user_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  requests      InternshipRequest[]
  internships   Internship[]

  @@map("students")
}

model Professor {
  id           Int      @id @default(autoincrement())
  department   String
  academicRank String   @map("academic_rank")
  userId       Int      @unique @map("user_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  internships  Internship[]

  @@map("professors")
}

model Company {
  id              Int      @id @default(autoincrement())
  name            String
  industry        String
  city            String
  address         String
  phone           String
  supervisorName  String   @map("supervisor_name")
  supervisorPhone String   @map("supervisor_phone")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  requests        InternshipRequest[]
  internships     Internship[]

  @@map("companies")
}

model InternshipRequest {
  id          Int           @id @default(autoincrement())
  studentId   Int           @map("student_id")
  companyId   Int           @map("company_id")
  title       String
  description String
  startDate   DateTime      @map("start_date")
  endDate     DateTime      @map("end_date")
  totalHours  Int           @default(240) @map("total_hours")
  status      RequestStatus @default(PENDING)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  student     Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  internship  Internship?

  @@map("internship_requests")
}

model Internship {
  id                 Int              @id @default(autoincrement())
  studentId          Int              @map("student_id")
  professorId        Int              @map("professor_id")
  companyId          Int              @map("company_id")
  requestId          Int              @unique @map("request_id")
  startDate          DateTime         @map("start_date")
  endDate            DateTime         @map("end_date")
  progressPercentage Int              @default(0) @map("progress_percentage")
  status             InternshipStatus @default(PENDING)
  createdAt          DateTime         @default(now()) @map("created_at")
  updatedAt          DateTime         @updatedAt @map("updated_at")

  student            Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  professor          Professor        @relation(fields: [professorId], references: [id], onDelete: Cascade)
  company            Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  request            InternshipRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  weeklyReports      WeeklyReport[]
  documents          Document[]
  evaluation         Evaluation?

  @@map("internships")
}

model WeeklyReport {
  id               Int          @id @default(autoincrement())
  internshipId     Int          @map("internship_id")
  weekNumber       Int          @map("week_number")
  startDate        DateTime     @map("start_date")
  endDate          DateTime     @map("end_date")
  activities       String
  skillsLearned    String       @map("skills_learned")
  challenges       String?
  description      String
  status           ReportStatus @default(DRAFT)
  professorComment String?      @map("professor_comment")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  internship       Internship   @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@unique([internshipId, weekNumber])
  @@map("weekly_reports")
}

model Document {
  id           Int          @id @default(autoincrement())
  internshipId Int          @map("internship_id")
  fileName     String       @map("file_name")
  filePath     String       @map("file_path")
  documentType DocumentType @map("document_type")
  uploadedAt   DateTime     @default(now()) @map("uploaded_at")

  internship   Internship   @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@map("documents")
}

model Evaluation {
  id             Int        @id @default(autoincrement())
  internshipId   Int        @unique @map("internship_id")
  technicalSkill Float      @map("technical_skill")
  responsibility Float
  discipline     Float
  teamwork       Float
  attendance     Float
  description    String
  finalScore     Float      @map("final_score")
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  internship     Internship @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@map("evaluations")
}

model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  title     String
  message   String
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model ActivityLog {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  action    String
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
}`,
    },
    'docker-compose.yml': {
      label: 'docker-compose.yml (کانتینرها و دیتابیس)',
      lang: 'yaml',
      content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: internship_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: internship_user
      POSTGRES_PASSWORD: internship_secret_password
      POSTGRES_DB: internship_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U internship_user -d internship_db']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - internship_network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: internship_backend
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://internship_user:internship_secret_password@postgres:5432/internship_db?schema=public
      JWT_SECRET: super_secure_university_internship_jwt_secret_key_2026
      JWT_EXPIRES_IN: 15m
      REFRESH_TOKEN_SECRET: super_secure_university_internship_refresh_secret_key_2026
      REFRESH_TOKEN_EXPIRES_IN: 7d
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploaded_documents:/app/uploads
    networks:
      - internship_network

volumes:
  postgres_data:
  uploaded_documents:

networks:
  internship_network:
    driver: bridge`,
    },
    'roles.guard.ts': {
      label: 'src/common/guards/roles.guard.ts (کنترل دسترسی RBAC)',
      lang: 'typescript',
      content: `import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User has no valid role');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException(
        \`Forbidden: Role '\${user.role}' lacks permission for this endpoint. Required: [\${requiredRoles.join(', ')}]\`,
      );
    }

    return true;
  }
}`,
    },
    'documents.controller.ts': {
      label: 'src/modules/documents/documents.controller.ts (Multer File Upload)',
      lang: 'typescript',
      content: `import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload an internship document (PDF, Word, or Image, max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, \`\${file.fieldname}-\${uniqueSuffix}\${extname(file.originalname)}\`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/msword', 'image/jpeg', 'image/png'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid format. Allowed: PDF, DOC, DOCX, JPG, PNG'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.documentsService.saveDocument(file, dto, user.userId, user.studentId, user.role);
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download document binary file directly' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    res.download(doc.filePath, doc.fileName);
  }
}`,
    },
    'evaluations.service.ts': {
      label: 'src/modules/evaluations/evaluations.service.ts (محاسبه نمره نهایی)',
      lang: 'typescript',
      content: `import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { InternshipStatus, Role } from '@prisma/client';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateEvaluationDto, professorId: string | null, userRole: Role, userId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: dto.internshipId },
      include: { student: { include: { user: true } }, company: true },
    });

    if (userRole === Role.PROFESSOR && internship.professorId !== professorId) {
      throw new ForbiddenException('You can only evaluate students assigned under your supervision');
    }

    // Formula: 5 criteria weighted average (out of 20)
    const finalScore = parseFloat(
      (
        dto.technicalSkill * 0.3 +
        dto.responsibility * 0.2 +
        dto.discipline * 0.15 +
        dto.teamwork * 0.15 +
        dto.attendance * 0.2
      ).toFixed(2),
    );

    // Save evaluation and mark internship COMPLETED with 100% progress
    const result = await this.prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.create({
        data: { ...dto, finalScore },
      });

      await tx.internship.update({
        where: { id: dto.internshipId },
        data: { status: InternshipStatus.COMPLETED, progressPercentage: 100 },
      });

      return evaluation;
    });

    // Notify student
    await this.notificationsService.create({
      userId: internship.student.user.id,
      title: 'ثبت ارزیابی نهایی دوره کارآموزی',
      message: \`نمره نهایی کارآموزی شما با نمره \${finalScore} از ۲۰ توسط استاد ناظر ثبت شد.\`,
    });

    return result;
  }
}`,
    },
  };

  const currentFile = files[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            مشاهده کدهای اصلی بک‌اند و معماری ماژولار (Clean Architecture Files)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بررسی فایل‌های پیاده‌سازی‌شده NestJS، تنظیمات کانتینر داکر، اسکیماهای Prisma و گاردها
          </p>
        </div>

        {/* File Tabs */}
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {Object.keys(files).map((fileKey) => (
            <button
              key={fileKey}
              onClick={() => setActiveFile(fileKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFile === fileKey
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {fileKey}
            </button>
          ))}
        </div>
      </div>

      {/* Code Window */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden" dir="ltr">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-2 text-xs font-mono text-slate-400">{currentFile.label}</span>
          </div>

          <button
            onClick={handleCopy}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> کپی شد
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> کپی کد
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 sm:p-6 text-slate-200 font-mono text-xs overflow-x-auto max-h-[560px] leading-relaxed select-text">
          {currentFile.content}
        </pre>
      </div>
    </div>
  );
};
