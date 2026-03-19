import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
        CategoriesModule,
        UploadsModule,
        ListingsModule,
        RentalRequestsModule,
        AdminModule,
        FavoritesModule,
    ],
})
export class AppModule {}
