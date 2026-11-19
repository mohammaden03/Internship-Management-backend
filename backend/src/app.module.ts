import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateEnv } from './common/config/env.validation';
import { MailModule } from './common/mail/mail.module';
import { StorageModule } from './common/storage/storage.module';
import { AuditLogsModule } from './common/audit/audit-logs.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { RequestContextMiddleware } from './common/observability/request-context.middleware';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { ProfessorsModule } from './modules/professors/professors.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { InternshipRequestsModule } from './modules/internship-requests/internship-requests.module';
import { InternshipsModule } from './modules/internships/internships.module';
import { WeeklyReportsModule } from './modules/weekly-reports/weekly-reports.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL_MS', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 120),
        },
      ],
    }),
    PrismaModule,
    MailModule,
    StorageModule,
    AuditLogsModule,
    ObservabilityModule,
    HealthModule,
    DashboardModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    ProfessorsModule,
    CompaniesModule,
    InternshipRequestsModule,
    InternshipsModule,
    WeeklyReportsModule,
    DocumentsModule,
    EvaluationsModule,
    NotificationsModule,
    ActivityLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
