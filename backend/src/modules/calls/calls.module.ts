import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CallsGateway } from './calls.gateway';
import { IceServersController } from './ice-servers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow('JWT_SECRET'),
            }),
        }),
    ],
    providers: [CallsGateway],
    controllers: [IceServersController],
})
export class CallsModule {}
