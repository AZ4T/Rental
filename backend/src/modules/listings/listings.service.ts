import {
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
        } = query;

        const where: Prisma.ListingWhereInput = {
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
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
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

    async create(dto: CreateListingDto, userId: string) {
        const { image_urls, ...rest } = dto;
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
        const listing = await this.findOne(id);
        if (listing.owner_id !== userId) {
            throw new ForbiddenException('Нет доступа');
        }

        const { image_urls, ...rest } = dto;

        if (image_urls) {
            await Promise.all(
                listing.images.map((img) =>
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
        const listing = await this.findOne(id);
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
}
