import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
    imports: [NotificationsModule, UploadsModule],
    providers: [DisputesService],
    controllers: [DisputesController],
})
export class DisputesModule {}
