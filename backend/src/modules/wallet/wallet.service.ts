import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const PROMOTION_PRICE = 500;
const PROMOTION_DAYS = 7;
const PREMIUM_PRICE = 2000;
const PREMIUM_DAYS = 30;

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private notificationsGateway: NotificationsGateway,
        private config: ConfigService,
    ) {}

    private get feeRate(): number {
        const raw = this.config.get<string>('PLATFORM_FEE_RATE');
        const n = raw ? Number(raw) : 0.05;
        if (Number.isNaN(n) || n < 0 || n >= 1) return 0.05;
        return n;
    }

    private async isPremium(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { premium_until: true },
        });
        return !!user?.premium_until && user.premium_until.getTime() > Date.now();
    }

    async getWallet(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true, deposit_balance: true, premium_until: true },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');

        const transactions = await this.prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        const isPremium =
            !!user.premium_until && user.premium_until.getTime() > Date.now();

        return {
            balance: user.balance,
            deposit_balance: user.deposit_balance,
            premium_until: user.premium_until,
            is_premium: isPremium,
            transactions,
        };
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

        // Platform commission — skipped when the owner has an active Premium
        // subscription. Computed at pay-time so the active fee rate is locked
        // in even if it changes later.
        const ownerIsPremium = await this.isPremium(ownerId);
        const feeRate = ownerIsPremium ? 0 : this.feeRate;
        const platformFee = Math.round(rentalAmount * feeRate * 100) / 100;
        const ownerEarnings = rentalAmount - platformFee;

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

            // Owner receives rental minus platform fee
            await tx.user.update({
                where: { id: ownerId },
                data: { balance: { increment: ownerEarnings } },
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
                    amount: ownerEarnings,
                    type: 'INCOME',
                    description: platformFee > 0
                        ? `Получена оплата аренды: ${title} (комиссия платформы ${platformFee.toLocaleString()} ₸ удержана${deposit > 0 ? `, залог ${deposit.toLocaleString()} ₸ заморожен` : ''})`
                        : deposit > 0
                            ? `Получена оплата аренды: ${title} (залог ${deposit.toLocaleString()} ₸ заморожен до завершения)`
                            : `Получена оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            });

            if (platformFee > 0) {
                await tx.transaction.create({
                    data: {
                        user_id: ownerId,
                        amount: platformFee,
                        type: 'PLATFORM_FEE',
                        description: `Комиссия платформы (${(feeRate * 100).toFixed(0)}%) за аренду: ${title}`,
                        rental_request_id: rentalRequestId,
                    },
                });
                await tx.platformIncome.create({
                    data: {
                        amount: platformFee,
                        source: 'COMMISSION',
                        user_id: ownerId,
                        rental_request_id: rentalRequestId,
                        listing_id: request.listing.id,
                        description: `Комиссия за аренду: ${title}`,
                    },
                });
            }
        });

        this.notificationsGateway.sendToUser(ownerId, 'payment_received', {
            message: platformFee > 0
                ? `Получена оплата ${ownerEarnings.toLocaleString()} ₸ за "${title}" (комиссия ${platformFee.toLocaleString()} ₸ удержана)`
                : `Получена оплата ${ownerEarnings.toLocaleString()} ₸ за аренду "${title}"`,
            rentalRequestId,
        });

        return { success: true, ownerEarnings, platformFee };
    }

    async promoteListing(listingId: string, userId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            select: { id: true, owner_id: true, title: true },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');
        if (listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }

        // Extend from current promoted_until if still active, else start today
        const newUntil = await this.prisma.$transaction(async (tx) => {
            const decremented = await tx.$executeRaw`
                UPDATE "User"
                SET balance = balance - ${PROMOTION_PRICE}
                WHERE id = ${userId}::uuid
                  AND balance >= ${PROMOTION_PRICE}
            `;
            if (decremented === 0) {
                throw new BadRequestException(
                    `Недостаточно средств. Требуется ${PROMOTION_PRICE.toLocaleString()} ₸`,
                );
            }

            const fresh = await tx.listing.findUnique({
                where: { id: listingId },
                select: { promoted_until: true },
            });
            const base =
                fresh?.promoted_until && fresh.promoted_until.getTime() > Date.now()
                    ? fresh.promoted_until.getTime()
                    : Date.now();
            const until = new Date(base + PROMOTION_DAYS * 24 * 60 * 60 * 1000);

            await tx.listing.update({
                where: { id: listingId },
                data: { promoted_until: until },
            });

            await tx.transaction.create({
                data: {
                    user_id: userId,
                    amount: PROMOTION_PRICE,
                    type: 'PROMOTION',
                    description: `Продвижение объявления: ${listing.title} (${PROMOTION_DAYS} дн.)`,
                },
            });
            await tx.platformIncome.create({
                data: {
                    amount: PROMOTION_PRICE,
                    source: 'PROMOTION',
                    user_id: userId,
                    listing_id: listingId,
                    description: `Продвижение: ${listing.title}`,
                },
            });

            return until;
        });

        return { promoted_until: newUntil, price: PROMOTION_PRICE };
    }

    async subscribePremium(userId: string) {
        const newUntil = await this.prisma.$transaction(async (tx) => {
            const decremented = await tx.$executeRaw`
                UPDATE "User"
                SET balance = balance - ${PREMIUM_PRICE}
                WHERE id = ${userId}::uuid
                  AND balance >= ${PREMIUM_PRICE}
            `;
            if (decremented === 0) {
                throw new BadRequestException(
                    `Недостаточно средств. Требуется ${PREMIUM_PRICE.toLocaleString()} ₸`,
                );
            }

            const fresh = await tx.user.findUnique({
                where: { id: userId },
                select: { premium_until: true },
            });
            const base =
                fresh?.premium_until && fresh.premium_until.getTime() > Date.now()
                    ? fresh.premium_until.getTime()
                    : Date.now();
            const until = new Date(base + PREMIUM_DAYS * 24 * 60 * 60 * 1000);

            await tx.user.update({
                where: { id: userId },
                data: { premium_until: until },
            });
            await tx.transaction.create({
                data: {
                    user_id: userId,
                    amount: PREMIUM_PRICE,
                    type: 'PREMIUM',
                    description: `Premium-подписка на ${PREMIUM_DAYS} дн.`,
                },
            });
            await tx.platformIncome.create({
                data: {
                    amount: PREMIUM_PRICE,
                    source: 'PREMIUM',
                    user_id: userId,
                    description: `Premium-подписка пользователя`,
                },
            });

            return until;
        });

        return { premium_until: newUntil, price: PREMIUM_PRICE };
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
