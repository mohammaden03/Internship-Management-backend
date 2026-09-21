import { Module } from '@nestjs/common';
import { InternshipRequestsService } from './internship-requests.service';
import { InternshipRequestsController } from './internship-requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [NotificationsModule, ActivityLogsModule],
  controllers: [InternshipRequestsController],
  providers: [InternshipRequestsService],
  exports: [InternshipRequestsService],
})
export class InternshipRequestsModule {}
