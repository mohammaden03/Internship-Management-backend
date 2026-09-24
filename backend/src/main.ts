import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global API Route Prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global Validation Pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Static Assets for uploaded documents
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger OpenAPI 3.0 Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('University Internship Management System API')
    .setDescription(
      `سامانه جامع و یکپارچه مدیریت کارآموزی دانشگاه
      
Production-ready NestJS Backend with:
- JWT Authentication & Refresh Tokens
- Role-Based Access Control (ADMIN, PROFESSOR, STUDENT)
- PostgreSQL with Prisma ORM
- File Uploads with Multer & MIME validation
- Automated Notifications & Audit Activity Logs
- Pagination, Search, Sorting, and Status Filtering
- Seeded with authentic Persian academic & corporate entities`,
    )
    .setVersion('1.0.0')
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
    .addTag('Auth', 'Authentication, JWT login, registration, refresh-token and logout')
    .addTag('Users', 'User management, profile fetching, password changes and admin controls')
    .addTag('Students', 'Student academic profiles, majors, degree levels and personal dashboard')
    .addTag('Professors', 'Professor profiles, departments, academic ranks and assigned students')
    .addTag('Companies', 'Hosting corporate partners, industries, cities and company supervisors')
    .addTag('Internship Requests', 'Student internship application lifecycle and approval workflow')
    .addTag('Internships', 'Active internship supervision, progress tracking and status updates')
    .addTag('Weekly Reports', 'Weekly progress reporting, student submissions and professor reviews')
    .addTag('Documents', 'Multer file upload, introduction letters, contracts and download links')
    .addTag('Evaluations', 'Final academic evaluations, 5-criteria grading and scoring formulas')
    .addTag('Notifications', 'Automated system notifications and read receipts')
    .addTag('Activity Logs', 'System-wide audit trail and security event logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'University Internship API Docs',
  });

  const port = process.env.PORT;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚀 NestJS Backend running at: http://localhost:${port}/${globalPrefix}`);
  logger.log(`📚 Swagger Documentation at: http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
