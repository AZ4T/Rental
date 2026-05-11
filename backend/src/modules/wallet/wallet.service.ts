import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) {}

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

        const renter = await this.prisma.user.findUnique({
            where: { id: renterId },
            select: { balance: true },
        });

        const amount = Number(request.total_price);
        if (Number(renter!.balance) < amount) {
            throw new BadRequestException('Недостаточно средств на кошельке');
        }

        const ownerId = request.listing.owner_id;
        const title = request.listing.title;

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: renterId },
                data: { balance: { decrement: amount } },
            }),
            this.prisma.user.update({
                where: { id: ownerId },
                data: { balance: { increment: amount } },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: renterId,
                    amount,
                    type: 'PAYMENT',
                    description: `Оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
            this.prisma.transaction.create({
                data: {
                    user_id: ownerId,
                    amount,
                    type: 'INCOME',
                    description: `Получена оплата аренды: ${title}`,
                    rental_request_id: rentalRequestId,
                },
            }),
            this.prisma.rentalRequest.update({
                where: { id: rentalRequestId },
                data: { payment_status: 'PAID' },
            }),
        ]);

        return { success: true };
    }
}
