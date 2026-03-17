import { Module } from '@nestjs/common';
import { RentalRequestsService } from './rental-requests.service';
import { RentalRequestsController } from './rental-requests.controller';

@Module({
    providers: [RentalRequestsService],
    controllers: [RentalRequestsController],
})
export class RentalRequestsModule {}
