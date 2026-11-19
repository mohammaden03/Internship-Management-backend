import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'University Internship Management System API')
    .setDescription(
      process.env.APP_DESCRIPTION ||
        `سامانه جامع و یکپارچه مدیریت کارآموزی دانشگاه

Production-hardened NestJS Backend with:
- JWT Access & Rotating Hashed Refresh Tokens with Reuse Detection
- Complete Password Reset Flow (POST /api/auth/forgot-password & POST /api/auth/reset-password)
- Role-Based Access Control (ADMIN, PROFESSOR, STUDENT)
- PostgreSQL with Prisma ORM, Auto-increment Integer IDs, and Soft Deletes
- Uniform Collection Contract: { items: T[], meta: PaginationMeta | null }
- Authenticated Document Pipeline with Magic-Byte Validation & SHA-256 Deduplication
- Workflow State-Transition Integrity Rules & Academic Term Guards
- Audit Logs, Metrics, Health/Readiness Probes & Request-ID Correlation`,
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token (Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Liveness (/health) and database readiness (/health/ready) probes')
    .addTag('Auth', 'Authentication, JWT login, registration, rotating refresh tokens, password reset, me and logout')
    .addTag('Dashboard', 'Admin system statistics and counts')
    .addTag('Settings', 'Persistent university and academic-term settings')
    .addTag('Users', 'User management, self-profile updates and admin controls')
    .addTag('Students', 'Student academic profiles, self-profile updates and personal dashboard')
    .addTag('Professors', 'Professor profiles, self-profile updates and assigned students')
    .addTag('Companies', 'Hosting corporate partners, industries, cities and company supervisors')
    .addTag('Internship Requests', 'Student internship application lifecycle and approval workflow')
    .addTag('Internships', 'Active internship supervision, progress tracking and state transitions')
    .addTag('Weekly Reports', 'Weekly progress reporting, student submissions and professor reviews')
    .addTag('Documents', 'Authenticated document upload/download with magic-byte validation and deduplication')
    .addTag('Evaluations', 'Final academic evaluations, 5-criteria grading and weighted scoring formulas')
    .addTag('Notifications', 'Automated system notifications and read receipts')
    .addTag('Activity Logs', 'Application activity history')
    .addTag('Audit Logs', 'Security & governance audit trail (ADMIN)')
    .addTag('Observability', 'In-process request/latency/status metrics (ADMIN)')
    .build();

  return SwaggerModule.createDocument(app, config);
}
