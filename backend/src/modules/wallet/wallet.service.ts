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
            select: { balance: true, deposit_balance: true },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');

        const transactions = await this.prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        return { balance: user.balance, deposit_balance: user.deposit_balance, transactions };
    }

    async topUp(userId: string, amount: number) {
        if (amount <= 0 || amount > 50_000) {
            throw new BadRequestException('Сумма должна быть от 1 до 50 000 ₸');
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Daily-limit check and balance increment must be atomic to prevent race
        await this.prisma.$transaction(async (tx) => {
            const todayTopUps = await tx.transaction.aggregate({
                where: { user_id: userId, type: 'DEPOSIT', created_at: { gte: todayStart } },
                _sum: { amount: true },
            });
            const usedToday = Number(todayTopUps._sum.amount ?? 0);
            if (usedToday + amount > 100_000) {
                throw new BadRequestException(
                    `Превышен дневной лимит пополнения 100 000 ₸ (использовано ${usedToday.toLocaleString()} ₸)`,
                );
            }

            await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } },
            });
            await tx.transaction.create({
                data: {
                    user_id: userId,
                    amount,
                    type: 'DEPOSIT',
                    description: `Пополнение кошелька на ${amount.toLocaleString()} ₸`,
                },
            });
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
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

        const rentalAmount = Number(request.total_price);
        const deposit = Number(request.deposit);
        const totalCharge = rentalAmount + deposit;
        const title = request.listing.title;
        const ownerId = request.listing.owner_id;

        await this.prisma.$transaction(async (tx) => {
            // Atomic check-and-decrement: only succeeds if balance is sufficient.
            // Using raw SQL so read + write happen in a single statement under row lock.
            const decremented = await tx.$executeRaw`
                UPDATE "User"
                SET balance = balance - ${totalCharge}
                WHERE id = ${renterId}::uuid
                  AND balance >= ${totalCharge}
            `;
            if (decremented === 0) {
                throw new BadRequestException(
                    `Недостаточно средств. Требуется ${totalCharge.toLocaleString()} ₸ (аренда ${rentalAmount.toLocaleString()} ₸ + депозит ${deposit.toLocaleString()} ₸)`,
                );
            }

            // Idempotency guard: flip to PAID only if still UNPAID.
            const markedPaid = await tx.$executeRaw`
                UPDATE "RentalRequest"
                SET payment_status = 'PAID'
                WHERE id = ${rentalRequestId}::uuid
                  AND payment_status = 'UNPAID'
            `;
            if (markedPaid === 0) {
                throw new BadRequestException('Заявка уже оплачена');
            }

            // Owner receives rental amount
            await tx.user.update({
                where: { id: ownerId },
                data: { balance: { increment: rentalAmount } },
            });
            // Deposit frozen in owner's deposit_balance
            if (deposit > 0) {
                await tx.user.update({
                    where: { id: ownerId },
                    data: { deposit_balance: { increment: deposit } },
                });
            }

            await tx.transaction.create({
                data: {
                    user_id: renterId,
                    amount: totalCharge,
                    type: 'PAYMENT',
                    description: deposit > 0
                        ? `Оплата аренды: ${title} (${rentalAmount.toLocaleString()} ₸ + залог ${deposit.toLocaleString()} ₸ заморожен)`
                        : `Оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            });
            await tx.transaction.create({
                data: {
                    user_id: ownerId,
                    amount: rentalAmount,
                    type: 'INCOME',
                    description: deposit > 0
                        ? `Получена оплата аренды: ${title} (залог ${deposit.toLocaleString()} ₸ заморожен до завершения)`
                        : `Получена оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            });
        });

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

        await this.prisma.$transaction(async (tx) => {
            // Atomic check-and-decrement: prevents deposit_balance going negative
            const decremented = await tx.$executeRaw`
                UPDATE "User"
                SET deposit_balance = deposit_balance - ${deposit}
                WHERE id = ${ownerId}::uuid
                  AND deposit_balance >= ${deposit}
            `;
            if (decremented === 0) {
                throw new BadRequestException('Недостаточно средств на депозитном счёте');
            }

            await tx.user.update({
                where: { id: renterId },
                data: { balance: { increment: deposit } },
            });
            await tx.transaction.create({
                data: {
                    user_id: renterId,
                    amount: deposit,
                    type: 'REFUND',
                    description: `Возврат залога: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            });
        });
    }
}
