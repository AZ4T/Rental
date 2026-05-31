import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    private resend: Resend;
    private from: string;

    constructor(private config: ConfigService) {
        this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'));
        this.from = config.get('SMTP_FROM') ?? 'noreply@rental.bolatbekov.com';
    }

    async sendPasswordReset(to: string, token: string) {
        const appUrl = this.config.get('APP_URL') ?? 'http://localhost:3000';
        const link = `${appUrl}/auth/reset-password?token=${token}`;

        await this.resend.emails.send({
            from: this.from,
            to,
            subject: 'Сброс пароля',
            text: `Для сброса пароля перейдите по ссылке (действует 1 час):\n\n${link}\n\nЕсли вы не запрашивали сброс пароля — проигнорируйте это письмо.`,
            html: `
                <p>Для сброса пароля нажмите на кнопку ниже. Ссылка действует <strong>1 час</strong>.</p>
                <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Сбросить пароль</a></p>
                <p style="color:#888;font-size:13px">Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
            `,
        });

        this.logger.log(`password-reset email sent | to=${this.mask(to)}`);
    }

    /** Sent AFTER a password change so the account owner notices if it wasn't them. */
    async sendPasswordChangedNotice(to: string) {
        const appUrl = this.config.get('APP_URL') ?? 'http://localhost:3000';

        await this.resend.emails.send({
            from: this.from,
            to,
            subject: 'Пароль был изменён',
            text: `Пароль вашего аккаунта только что был изменён.\n\nЕсли это были вы — игнорируйте это письмо. Если нет — немедленно сбросьте пароль и обратитесь в поддержку:\n${appUrl}/auth/forgot-password`,
            html: `
                <p>Пароль вашего аккаунта только что был изменён.</p>
                <p>Если это были <strong>вы</strong> — просто проигнорируйте это письмо.</p>
                <p>Если <strong>не вы</strong> — немедленно сбросьте пароль:</p>
                <p><a href="${appUrl}/auth/forgot-password" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Сбросить пароль</a></p>
            `,
        });

        this.logger.log(`password-changed notice sent | to=${this.mask(to)}`);
    }

    private mask(email: string): string {
        const [local, domain] = email.split('@');
        return `${local[0]}***@${domain ?? '?'}`;
    }
}
