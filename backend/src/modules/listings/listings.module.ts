import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

@Module({
    imports: [UploadsModule],
    providers: [ListingsService],
    controllers: [ListingsController],
    exports: [ListingsService],
})
export class ListingsModule {}
