import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { UpdateStatusDto } from './dto/update-rental-request.dto';
import { ChatsService } from '../chats/chats.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { WalletService } from '../wallet/wallet.service';
import { v4 as uuidv4 } from 'uuid';

const VALID_TRANSITIONS: Partial<Record<string, string[]>> = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['COMPLETED'],
};

@Injectable()
export class RentalRequestsService {
    constructor(
        private prisma: PrismaService,
        private chatsService: ChatsService,
        private notificationsGateway: NotificationsGateway,
        private walletService: WalletService,
        private config: ConfigService,
    ) {}

    async create(dto: CreateRentalRequestDto, renterId: string) {
        // Глобальный лимит активных заявок для арендатора
        const activeCount = await this.prisma.rentalRequest.count({
            where: {
                renter_id: renterId,
                status: { in: ['PENDING', 'APPROVED'] },
            },
        });
        if (activeCount >= 3) {
            throw new BadRequestException(
                'Нельзя иметь более 3 активных заявок одновременно',
            );
        }

        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listing_id },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');

        if (listing.owner_id === renterId) {
            throw new BadRequestException('Нельзя арендовать свое объявление');
        }

        const start = new Date(dto.start_date);
        const end = new Date(dto.end_date);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            throw new BadRequestException('Дата начала не может быть в прошлом');
        }

        if (end < start) {
            throw new BadRequestException(
                'Дата окончания не может быть раньше даты начала',
            );
        }

        // Проверка пересечения с собственными активными заявками
        const duplicate = await this.prisma.rentalRequest.findFirst({
            where: {
                listing_id: dto.listing_id,
                renter_id: renterId,
                status: { in: ['PENDING', 'APPROVED'] },
                AND: [
                    { start_date: { lte: end } },
                    { end_date: { gte: start } },
                ],
            },
        });
        if (duplicate) {
            throw new BadRequestException(
                'У вас уже есть активная заявка на эти даты',
            );
        }

        // Проверка пересечения дат с одобренными оплаченными заявками
        const conflict = await this.prisma.rentalRequest.findFirst({
            where: {
                listing_id: dto.listing_id,
                status: 'APPROVED',
                payment_status: 'PAID',
                AND: [
                    { start_date: { lte: end } },
                    { end_date: { gte: start } },
                ],
            },
        });
        if (conflict) {
            throw new BadRequestException(
                'Выбранные даты уже заняты. Пожалуйста, выберите другие даты',
            );
        }

        const diffMs = end.getTime() - start.getTime();
        const endHasTime = end.getHours() !== 0 || end.getMinutes() !== 0;
        let total_price: number;
        if (endHasTime) {
            // Hourly billing: use Decimal arithmetic to avoid float rounding errors
            const hours = Math.ceil(diffMs / (1000 * 60 * 60));
            total_price = Number(listing.price.mul(hours).div(24).toFixed(2));
        } else {
            const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            total_price = Number(listing.price.mul(days).toFixed(2));
        }

        const created = await this.prisma.rentalRequest.create({
            data: {
                listing_id: dto.listing_id,
                renter_id: renterId,
                start_date: start,
                end_date: end,
                total_price,
                deposit: listing.deposit,
            },
            include: { listing: true },
        });

        // Notify owner about new incoming request so badge updates in real-time
        this.notificationsGateway.sendToUser(listing.owner_id, 'incoming_rental', {
            message: `Новая заявка на "${listing.title}"`,
            rentalRequestId: created.id,
        });

        return created;
    }

    async findMyRequests(userId: string) {
        return this.prisma.rentalRequest.findMany({
            where: { renter_id: userId },
            include: {
                listing: {
                    include: { images: true },
                },
                reviews: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getNewIncomingCount(userId: string): Promise<{ count: number }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { last_seen_incoming_at: true },
        });
        const since = user?.last_seen_incoming_at ?? new Date(0);
        const count = await this.prisma.rentalRequest.count({
            where: {
                status: 'PENDING',
                listing: { owner_id: userId },
                created_at: { gt: since },
            },
        });
        return { count };
    }

    async markIncomingSeen(userId: string): Promise<{ ok: true }> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { last_seen_incoming_at: new Date() },
        });
        return { ok: true };
    }

    async findIncomingRequests(userId: string) {
        return this.prisma.rentalRequest.findMany({
            where: { listing: { owner_id: userId } },
            include: {
                listing: {
                    include: { images: true },
                },
                reviews: true,
                renter: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                        rating_avg: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
        const request = await this.prisma.rentalRequest.findUnique({
            where: { id },
            include: { listing: true },
        });

        if (!request) throw new NotFoundException('Заявка не найдена');

        if (request.listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }

        // State machine: only allow valid transitions
        if (!VALID_TRANSITIONS[request.status]?.includes(dto.status)) {
            throw new BadRequestException(
                `Недопустимый переход статуса: ${request.status} → ${dto.status}`,
            );
        }

        // Нельзя завершить неоплаченную аренду
        if (
            dto.status === 'COMPLETED' &&
            request.payment_status !== 'PAID'
        ) {
            throw new BadRequestException(
                'Нельзя завершить аренду без оплаты',
            );
        }

        // Нельзя завершить без фото возврата
        if (
            dto.status === 'COMPLETED' &&
            (!request.return_images || request.return_images.length === 0)
        ) {
            throw new BadRequestException(
                'Нельзя завершить аренду без фото возврата',
            );
        }

        const updated = await this.prisma.rentalRequest.update({
            where: { id },
            data: {
                status: dto.status,
                qr_token: dto.status === 'APPROVED' ? uuidv4() : undefined,
            },
            include: { listing: true },
        });

        // Создать чат и уведомить арендатора при одобрении
        if (dto.status === 'APPROVED') {
            await this.chatsService.findOrCreate(userId, request.renter_id);

            this.notificationsGateway.sendToUser(
                request.renter_id,
                'rental_status_changed',
                {
                    message: `Ваша заявка на "${request.listing.title}" одобрена! Теперь вы можете оплатить аренду.`,
                    rentalRequestId: id,
                    status: 'APPROVED',
                },
            );
        }

        // Вернуть депозит при завершении
        if (dto.status === 'COMPLETED') {
            await this.walletService.refundDeposit(
                request.renter_id,
                userId,
                Number(request.deposit),
                id,
                request.listing.title,
            );

            this.notificationsGateway.sendToUser(
                request.renter_id,
                'rental_status_changed',
                {
                    message: `Аренда "${request.listing.title}" завершена. Депозит возвращён на ваш кошелёк.`,
                    rentalRequestId: id,
                    status: 'COMPLETED',
                },
            );
        }

        if (dto.status === 'REJECTED') {
            this.notificationsGateway.sendToUser(
                request.renter_id,
                'rental_status_changed',
                {
                    message: `Ваша заявка на "${request.listing.title}" отклонена.`,
                    rentalRequestId: id,
                    status: 'REJECTED',
                },
            );
        }

        return updated;
    }

    async cancel(id: string, userId: string) {
        const request = await this.prisma.rentalRequest.findUnique({
            where: { id },
        });
        if (!request) throw new NotFoundException('Заявка не найдена');

        if (request.renter_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }
        if (request.status !== 'PENDING') {
            throw new BadRequestException(
                'Можно отменить только ожидающую заявку',
            );
        }
        return this.prisma.rentalRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }

    async getQrToken(id: string, ownerId: string) {
        const req = await this.prisma.rentalRequest.findUnique({
            where: { id },
            include: { listing: true },
        });
        if (!req) throw new NotFoundException('Заявка не найдена');
        if (req.listing.owner_id !== ownerId) throw new ForbiddenException('Нет доступа');
        if (req.status !== 'APPROVED') throw new BadRequestException('Заявка должна быть одобрена');
        return { token: req.qr_token };
    }

    async scanQr(token: string) {
        const req = await this.prisma.rentalRequest.findFirst({
            where: { qr_token: token, status: 'APPROVED', payment_status: 'UNPAID' },
            include: {
                listing: { include: { images: true } },
                renter: { select: { id: true, name: true, avatar_url: true } },
            },
        });
        if (!req) throw new NotFoundException('QR-код недействителен или аренда уже оплачена');
        return req;
    }

    async addReturnImages(id: string, userId: string, imageUrls: string[]) {
        const prefix = `${this.config.getOrThrow('MINIO_PUBLIC_URL')}/${this.config.getOrThrow('MINIO_BUCKET')}/`;
        for (const url of imageUrls) {
            if (!url.startsWith(prefix)) {
                throw new BadRequestException('Недопустимый URL изображения');
            }
        }

        const req = await this.prisma.rentalRequest.findUnique({ where: { id }, include: { listing: true } });
        if (!req) throw new NotFoundException('Заявка не найдена');
        if (req.renter_id !== userId && req.listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }
        return this.prisma.rentalRequest.update({
            where: { id },
            data: { return_images: imageUrls },
        });
    }
}
