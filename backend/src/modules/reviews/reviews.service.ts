import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateReviewDto, authorId: string) {
        const rentalRequest = await this.prisma.rentalRequest.findUnique({
            where: { id: dto.rental_request_id },
            include: { listing: true },
        });

        if (!rentalRequest) {
            throw new NotFoundException('Заявка на аренду не найдена');
        }

        const isRenter = rentalRequest.renter_id === authorId;
        const isOwner = rentalRequest.listing.owner_id === authorId;

        if (!isRenter && !isOwner) {
            throw new ForbiddenException('Нет доступа к этой аренде');
        }

        if (rentalRequest.status !== 'COMPLETED') {
            throw new BadRequestException(
                'Можно оставить отзыв только после завершения аренды',
            );
        }
        if (rentalRequest.payment_status !== 'PAID') {
            throw new BadRequestException(
                'Можно оставить отзыв только после оплаченной аренды',
            );
        }

        // Проверяем что этот автор ещё не оставлял отзыв по этой заявке
        const exists = await this.prisma.review.findUnique({
            where: {
                rental_request_id_author_id: {
                    rental_request_id: dto.rental_request_id,
                    author_id: authorId,
                },
            },
        });
        if (exists) throw new BadRequestException('Вы уже оставили отзыв');

        // Создаём отзыв
        const review = await this.prisma.review.create({
            data: {
                author_id: authorId,
                target_user_id: dto.target_user_id,
                rental_request_id: dto.rental_request_id,
                rating: dto.rating,
                comment: dto.comment,
            },
        });

        // Обновляем рейтинг пользователя
        await this.updateUserRating(dto.target_user_id);

        return review;
    }

    async findByUser(userId: string) {
        return this.prisma.review.findMany({
            where: { target_user_id: userId },
            include: {
                author: {
                    select: { id: true, name: true, avatar_url: true },
                },
                rentalRequest: {
                    include: {
                        listing: {
                            include: { images: true },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    // Пересчитываем рейтинг пользователя
    private async updateUserRating(userId: string) {
        const result = await this.prisma.review.aggregate({
            where: { target_user_id: userId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                rating_avg: result._avg.rating ?? 0,
                reviews_count: result._count.rating,
            },
        });
    }
}
