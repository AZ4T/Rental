import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private notificationsGateway: NotificationsGateway,
    ) {}

    async getWallet(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');

        const transactions = await this.prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        return { balance: user.balance, transactions };
    }

    async topUp(userId: string, amount: number) {
        if (amount <= 0 || amount > 1_000_000) {
            throw new BadRequestException('Сумма должна быть от 1 до 1 000 000 ₸');
        }

        const [user] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } },
                select: { balance: true },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: userId,
                    amount,
                    type: 'DEPOSIT',
                    description: `Пополнение кошелька на ${amount.toLocaleString()} ₸`,
                },
            }),
        ]);

        return user;
    }

    async pay(rentalRequestId: string, renterId: string) {
        const request = await this.prisma.rentalRequest.findUnique({
            where: { id: rentalRequestId },
            include: { listing: true },
        });

        if (!request) throw new NotFoundException('Заявка не найдена');
        if (request.renter_id !== renterId) throw new ForbiddenException('Нет доступа');
        if (request.status !== 'APPROVED') {
            throw new BadRequestException('Оплата доступна только для одобренных заявок');
        }
        if (request.payment_status === 'PAID') {
            throw new BadRequestException('Заявка уже оплачена');
        }

        // Нельзя оплачивать аренду с истёкшими датами
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(request.end_date) < today) {
            throw new BadRequestException(
                'Нельзя оплатить аренду с истёкшими датами',
            );
        }

        const renter = await this.prisma.user.findUnique({
            where: { id: renterId },
            select: { balance: true },
        });

        const rentalAmount = Number(request.total_price);
        const deposit = Number(request.listing.deposit);
        const totalCharge = rentalAmount + deposit;
        const title = request.listing.title;
        const ownerId = request.listing.owner_id;

        if (Number(renter!.balance) < totalCharge) {
            throw new BadRequestException(
                `Недостаточно средств. Требуется ${totalCharge.toLocaleString()} ₸ (аренда ${rentalAmount.toLocaleString()} ₸ + депозит ${deposit.toLocaleString()} ₸)`,
            );
        }

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: renterId },
                data: { balance: { decrement: totalCharge } },
            }),
            this.prisma.user.update({
                where: { id: ownerId },
                data: { balance: { increment: totalCharge } },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: renterId,
                    amount: totalCharge,
                    type: 'PAYMENT',
                    description: deposit > 0
                        ? `Оплата аренды: ${title} (${rentalAmount.toLocaleString()} ₸ + депозит ${deposit.toLocaleString()} ₸)`
                        : `Оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: ownerId,
                    amount: totalCharge,
                    type: 'INCOME',
                    description: deposit > 0
                        ? `Получена оплата аренды: ${title} (включая депозит ${deposit.toLocaleString()} ₸)`
                        : `Получена оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
            this.prisma.rentalRequest.update({
                where: { id: rentalRequestId },
                data: { payment_status: 'PAID' },
            }),
        ]);

        this.notificationsGateway.sendToUser(ownerId, 'payment_received', {
            message: `Получена оплата ${totalCharge.toLocaleString()} ₸ за аренду "${title}"`,
            rentalRequestId,
        });

        return { success: true };
    }

    async refundDeposit(
        renterId: string,
        ownerId: string,
        deposit: number,
        rentalRequestId: string,
        title: string,
    ) {
        if (deposit <= 0) return;

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: ownerId },
                data: { balance: { decrement: deposit } },
            }),
            this.prisma.user.update({
                where: { id: renterId },
                data: { balance: { increment: deposit } },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: ownerId,
                    amount: deposit,
                    type: 'REFUND',
                    description: `Возврат депозита арендатору: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: renterId,
                    amount: deposit,
                    type: 'REFUND',
                    description: `Возврат депозита: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
        ]);
    }
}
