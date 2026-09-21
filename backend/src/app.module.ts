import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// 12 Feature Modules
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
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
export class AppModule {}
