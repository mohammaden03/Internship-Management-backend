import { Module } from '@nestjs/common';
import { WeeklyReportsService } from './weekly-reports.service';
import { WeeklyReportsController } from './weekly-reports.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [NotificationsModule, ActivityLogsModule],
  controllers: [WeeklyReportsController],
  providers: [WeeklyReportsService],
  exports: [WeeklyReportsService],
})
export class WeeklyReportsModule {}
