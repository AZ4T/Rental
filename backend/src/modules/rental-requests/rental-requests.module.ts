import { Module } from '@nestjs/common';
import { RentalRequestsService } from './rental-requests.service';
import { RentalRequestsController } from './rental-requests.controller';
import { ChatsModule } from '../chats/chats.module';

@Module({
    imports: [ChatsModule],
    providers: [RentalRequestsService],
    controllers: [RentalRequestsController],
})
export class RentalRequestsModule {}
