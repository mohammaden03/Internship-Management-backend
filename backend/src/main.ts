import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmetModule from 'helmet';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/config/env.validation';
import { buildSwaggerDocument } from './common/swagger/swagger.config';
import { initOptionalTelemetry } from './common/observability/telemetry';

const helmet = ((helmetModule as any).default ?? helmetModule) as typeof helmetModule.default;

function resolveNestLogLevels(level?: string): LogLevel[] {
  switch ((level || 'log').toLowerCase()) {
    case 'debug':
      return ['error', 'warn', 'log', 'debug', 'verbose'];
    case 'warn':
      return ['error', 'warn'];
    case 'error':
      return ['error'];
    default:
      return ['error', 'warn', 'log'];
  }
}

async function bootstrap() {
  initOptionalTelemetry();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: resolveNestLogLevels(process.env.LOG_LEVEL),
  });

  const configService = app.get(ConfigService);
  const globalPrefix = configService
    .get<string>('API_PREFIX', 'api')
    .replace(/^\/+|\/+$/g, '');
  const port = configService.get<number>('PORT', 3010);
  const corsOrigins = parseCorsOrigins(
    configService.get<string>(
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:3010,http://localhost:5173',
    ),
  );

  app.setGlobalPrefix(globalPrefix);

  // Security headers via Helmet with explicit CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // Explicit CORS allowlist with credentials support
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow non-browser / server-to-server / curl requests without Origin header
        return callback(null, true);
      }
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' is not allowed by CORS policy`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'Content-Disposition'],
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

  // Note: Static asset serving for /api/uploads/ is intentionally REMOVED.
  // All uploaded documents are served exclusively via authenticated GET /api/documents/download/:id.

  // Swagger OpenAPI 3.0 Documentation Setup
  const document = buildSwaggerDocument(app);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'University Internship API Docs',
  });

  // Enable graceful shutdown hooks (handles SIGTERM/SIGINT and closes Prisma cleanly)
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  const addressInfo = app.getHttpServer().address();
  const boundPort =
    typeof addressInfo === 'object' && addressInfo !== null ? addressInfo.port : port;
  const boundHost =
    typeof addressInfo === 'object' && addressInfo !== null
      ? addressInfo.address
      : '0.0.0.0';

  logger.log('=======================================================');
  logger.log(`NestJS Backend listening on ${boundHost}:${boundPort}`);
  logger.log(`API Base URL: http://localhost:${boundPort}/${globalPrefix}`);
  logger.log(`Swagger Docs: http://localhost:${boundPort}/${globalPrefix}/docs`);
  logger.log(`Liveness:     http://localhost:${boundPort}/${globalPrefix}/health`);
  logger.log(`Readiness:    http://localhost:${boundPort}/${globalPrefix}/health/ready`);
  logger.log(`CORS Allow:   ${corsOrigins.join(', ')}`);
  logger.log('=======================================================');
}

bootstrap();
