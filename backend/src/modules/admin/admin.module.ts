import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PublicStatsController } from './public-stats.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
    imports: [UploadsModule],
    providers: [AdminService],
    controllers: [AdminController, PublicStatsController],
})
export class AdminModule {}
