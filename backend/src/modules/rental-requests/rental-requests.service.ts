import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { UpdateStatusDto } from './dto/update-rental-request.dto';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class RentalRequestsService {
    constructor(
        private prisma: PrismaService,
        private chatsService: ChatsService,
    ) {}

    async create(dto: CreateRentalRequestDto, renterId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listing_id },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');

        if (listing.owner_id === renterId) {
            throw new BadRequestException('Нельзя арендовать свое объявление');
        }

        const start = new Date(dto.start_date);
        const end = new Date(dto.end_date);

        if (end <= start) {
            throw new BadRequestException(
                'Дата окончания должна быть позже даты начала',
            );
        }

        const days = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        const total_price = Number(listing.price) * days;

        return this.prisma.rentalRequest.create({
            data: {
                listing_id: dto.listing_id,
                renter_id: renterId,
                start_date: start,
                end_date: end,
                total_price,
            },
            include: { listing: true },
        });
    }

    async findMyRequests(userId: string) {
        return this.prisma.rentalRequest.findMany({
            where: { renter_id: userId },
            include: {
                listing: {
                    include: { images: true },
                },
                review: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findIncomingRequests(userId: string) {
        return this.prisma.rentalRequest.findMany({
            where: { listing: { owner_id: userId } },
            include: {
                listing: {
                    include: { images: true },
                },
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

        const updated = await this.prisma.rentalRequest.update({
            where: { id },
            data: { status: dto.status },
            include: { listing: true },
        });

        if (dto.status === 'APPROVED') {
            await this.chatsService.findOrCreate(userId, request.listing.owner_id === userId ? request.renter_id : request.listing.owner_id);
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
}
