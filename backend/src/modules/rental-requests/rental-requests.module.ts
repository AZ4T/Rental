import { Module } from '@nestjs/common';
import { RentalRequestsService } from './rental-requests.service';
import { RentalRequestsController } from './rental-requests.controller';
import { ChatsModule } from '../chats/chats.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [ChatsModule, NotificationsModule, WalletModule],
    providers: [RentalRequestsService],
    controllers: [RentalRequestsController],
})
export class RentalRequestsModule {}
