import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { MailerService } from './mailer.service';
import { CsrfGuard } from './guards/csrf.guard';

@Module({
    imports: [UsersModule, JwtModule.register({})],
    providers: [AuthService, JwtStrategy, MailerService, CsrfGuard],
    controllers: [AuthController],
})
export class AuthModule {}
