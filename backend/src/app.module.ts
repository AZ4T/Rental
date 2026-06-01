import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ListingsModule } from './modules/listings/listings.module';
import { RentalRequestsModule } from './modules/rental-requests/rental-requests.module';
import { AdminModule } from './modules/admin/admin.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ChatsModule } from './modules/chats/chats.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CallsModule } from './modules/calls/calls.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { I18nModule } from './i18n/i18n.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([
            { name: 'default', ttl: 60_000, limit: 100 },
        ]),
        I18nModule,
        PrismaModule,
        UsersModule,
        AuthModule,
        CategoriesModule,
        UploadsModule,
        ListingsModule,
        RentalRequestsModule,
        AdminModule,
        FavoritesModule,
        ReviewsModule,
        ChatsModule,
        WalletModule,
        NotificationsModule,
        CallsModule,
        ReportsModule,
        DisputesModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
