import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [NotificationsModule, ActivityLogsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
