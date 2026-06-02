import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { QueryListingDto } from './dto/query-listing.dto';
import { Prisma } from '@prisma/client';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
    constructor(
        private prisma: PrismaService,
        private uploadsService: UploadsService,
    ) {}

    async findAll(query: QueryListingDto) {
        const {
            search,
            category_ids,
            city,
            price_min,
            price_max,
            page = 1,
            limit = 12,
            sortBy = 'created_at',
            sortOrder = 'desc',
        } = query;

        const where: Prisma.ListingWhereInput = {
            // Public catalog hides paused listings — owner still sees them in /listings/my
            is_hidden: false,
            ...(search && {
                title: { contains: search, mode: 'insensitive' },
            }),
            ...(category_ids &&
                category_ids.length > 0 && {
                    category_id: { in: category_ids },
                }),
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
            ...(price_min !== undefined || price_max !== undefined
                ? {
                      price: {
                          ...(price_min !== undefined && { gte: price_min }),
                          ...(price_max !== undefined && { lte: price_max }),
                      },
                  }
                : {}),
        };

        const order = (
            sortOrder === 'asc' ? 'asc' : 'desc'
        ) as Prisma.SortOrder;

        // Promoted listings float to the top of every catalog query —
        // sort by promoted_until DESC (nulls last) then by whatever the
        // user picked.
        const secondaryOrder: Prisma.ListingOrderByWithRelationInput =
            sortBy === 'rating_avg'
                ? { owner: { rating_avg: order } }
                : sortBy === 'price'
                  ? { price: order }
                  : sortBy === 'views_count'
                    ? { views_count: order }
                    : { created_at: order };

        const [data, total] = await this.prisma.$transaction([
            this.prisma.listing.findMany({
                where,
                include: {
                    images: true,
                    category: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            avatar_url: true,
                            rating_avg: true,
                            premium_until: true,
                        },
                    },
                },
                orderBy: [
                    { promoted_until: { sort: 'desc', nulls: 'last' } },
                    secondaryOrder,
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            data: data.map((l) => this.normalizeImages(l)),
            meta: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    private async fetchListing(id: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: {
                images: true,
                category: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                        rating_avg: true,
                        reviews_count: true,
                    },
                },
            },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');
        return listing;
    }

    // Public endpoint: increments view counter (not called by update/delete)
    async findOne(id: string) {
        const listing = await this.fetchListing(id);

        void this.prisma.listing.update({
            where: { id },
            data: { views_count: { increment: 1 } },
        }).catch(() => {});
        listing.views_count += 1;

        return this.normalizeImages(listing);
    }

    // Internal use only — no view increment
    async findOneInternal(id: string) {
        return this.normalizeImages(await this.fetchListing(id));
    }

    async getAnalytics(id: string, userId: string) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Объявление не найдено');
        if (listing.owner_id !== userId) throw new NotFoundException('Нет доступа');

        const rentalIds = await this.prisma.rentalRequest
            .findMany({ where: { listing_id: id }, select: { id: true } })
            .then((r) => r.map((x) => x.id));

        const [total, pending, approved, completed, rejected, revenue] =
            await this.prisma.$transaction([
                this.prisma.rentalRequest.count({ where: { listing_id: id } }),
                this.prisma.rentalRequest.count({ where: { listing_id: id, status: 'PENDING' } }),
                this.prisma.rentalRequest.count({ where: { listing_id: id, status: 'APPROVED' } }),
                this.prisma.rentalRequest.count({ where: { listing_id: id, status: 'COMPLETED' } }),
                this.prisma.rentalRequest.count({ where: { listing_id: id, status: 'REJECTED' } }),
                this.prisma.transaction.aggregate({
                    where: { rental_request_id: { in: rentalIds }, type: 'INCOME' },
                    _sum: { amount: true },
                }),
            ]);

        return {
            views_count: listing.views_count,
            total_requests: total,
            pending,
            approved,
            completed,
            rejected,
            revenue: Number(revenue._sum.amount ?? 0),
        };
    }

    async getAvailability(id: string) {
        const [requests, blocked] = await Promise.all([
            this.prisma.rentalRequest.findMany({
                where: {
                    listing_id: id,
                    status: { in: ['PENDING', 'APPROVED'] },
                },
                select: { start_date: true, end_date: true },
            }),
            this.prisma.blockedDate.findMany({
                where: { listing_id: id },
                select: { id: true, start_date: true, end_date: true, reason: true },
                orderBy: { start_date: 'asc' },
            }),
        ]);
        return { requests, blocked };
    }

    async blockDates(
        listingId: string,
        body: { start_date: string; end_date: string; reason?: string },
        userId: string,
    ) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            select: { owner_id: true },
        });
        if (!listing) throw new NotFoundException();
        if (listing.owner_id !== userId) throw new ForbiddenException();

        const start = new Date(body.start_date);
        const end = new Date(body.end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new BadRequestException('Invalid date');
        }
        if (end < start) {
            throw new BadRequestException('End date is before start date');
        }

        // Reject overlap with active rentals — owner shouldn't block dates that
        // are already booked.
        const conflict = await this.prisma.rentalRequest.findFirst({
            where: {
                listing_id: listingId,
                status: { in: ['PENDING', 'APPROVED'] },
                AND: [
                    { start_date: { lte: end } },
                    { end_date: { gte: start } },
                ],
            },
            select: { id: true },
        });
        if (conflict) {
            throw new BadRequestException('Dates overlap with an active rental');
        }

        return this.prisma.blockedDate.create({
            data: {
                listing_id: listingId,
                start_date: start,
                end_date: end,
                reason: body.reason?.trim() || null,
            },
        });
    }

    async unblockDates(listingId: string, blockId: string, userId: string) {
        const block = await this.prisma.blockedDate.findUnique({
            where: { id: blockId },
            include: { listing: { select: { owner_id: true } } },
        });
        if (!block || block.listing_id !== listingId) throw new NotFoundException();
        if (block.listing.owner_id !== userId) throw new ForbiddenException();
        await this.prisma.blockedDate.delete({ where: { id: blockId } });
        return { success: true };
    }

    async findMyListings(userId: string) {
        const data = await this.prisma.listing.findMany({
            where: { owner_id: userId },
            include: {
                images: true,
                category: true,
                owner: {
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

        return {
            data: data.map((l) => this.normalizeImages(l)),
            meta: { total: data.length },
        };
    }

    async findByUser(userId: string) {
        const data = await this.prisma.listing.findMany({
            where: { owner_id: userId },
            include: {
                images: true,
                category: true,
                owner: {
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
        return data.map((l) => this.normalizeImages(l));
    }

    async findSimilar(listingId: string, categoryId: string) {
        const listings = await this.prisma.listing.findMany({
            where: {
                category_id: categoryId,
                id: { not: listingId },
            },
            include: {
                images: true,
                category: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                        rating_avg: true,
                    },
                },
            },
            take: 4,
            orderBy: { created_at: 'desc' },
        });
        return listings.map((l) => this.normalizeImages(l));
    }

    private normalizeImages<T extends { images: { image_url: string }[] }>(
        listing: T,
    ): T {
        return {
            ...listing,
            images: listing.images.map((img) => ({
                ...img,
                image_url: this.uploadsService.normalizeUrl(img.image_url),
            })),
        };
    }

    async getPriceRange() {
        const result = await this.prisma.listing.aggregate({
            _min: { price: true },
            _max: { price: true },
        });
        return {
            min: Number(result._min.price ?? 0),
            max: Number(result._max.price ?? 100000),
        };
    }

    async create(dto: CreateListingDto, userId: string) {
        const { image_urls, ...rest } = dto;

        const prefix = this.uploadsService.getPublicPrefix();
        for (const url of image_urls) {
            if (!url.startsWith(prefix)) {
                throw new BadRequestException('Недопустимый URL изображения');
            }
        }

        return this.prisma.listing.create({
            data: {
                ...rest,
                owner_id: userId,
                images: {
                    create: image_urls.map((url) => ({ image_url: url })),
                },
            },
            include: { images: true },
        });
    }

    async update(id: string, dto: UpdateListingDto, userId: string) {
        const listing = await this.findOneInternal(id);
        if (listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }

        const { image_urls, ...rest } = dto;

        if (image_urls) {
            const toDelete = listing.images.filter(
                (img) => !image_urls.includes(img.image_url),
            );
            await Promise.all(
                toDelete.map((img) =>
                    this.uploadsService.deleteFile(img.image_url),
                ),
            );
        }

        return this.prisma.listing.update({
            where: { id },
            data: {
                ...rest,
                ...(image_urls && {
                    images: {
                        deleteMany: {},
                        create: image_urls.map((url) => ({ image_url: url })),
                    },
                }),
            },
            include: { images: true },
        });
    }

    async delete(id: string, userId: string) {
        const listing = await this.findOneInternal(id);
        if (listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }

        await Promise.all(
            listing.images.map((img) =>
                this.uploadsService.deleteFile(img.image_url),
            ),
        );
        return this.prisma.listing.delete({ where: { id } });
    }

    async setVisibility(id: string, hidden: boolean, userId: string) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Объявление не найдено');
        if (listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }
        return this.prisma.listing.update({
            where: { id },
            data: {
                is_hidden: hidden,
                hidden_at: hidden ? new Date() : null,
            },
        });
    }
}
