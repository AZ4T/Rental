import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private prisma: PrismaService) {}

    async getMyFavorites(userId: string) {
        return this.prisma.favorite.findMany({
            where: { user_id: userId },
            include: {
                listing: {
                    include: {
                        images: true,
                        category: true,
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async add(userId: string, listingId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');

        // Idempotent: if already in favorites, return the existing row instead of
        // racing two clients into a P2002. UI just toggles "in favorites" — no
        // reason to treat a second click as an error.
        return this.prisma.favorite.upsert({
            where: { user_id_listing_id: { user_id: userId, listing_id: listingId } },
            update: {},
            create: { user_id: userId, listing_id: listingId },
        });
    }

    async remove(userId: string, listingId: string) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                user_id_listing_id: {
                    user_id: userId,
                    listing_id: listingId,
                },
            },
        });
        if (!favorite) throw new NotFoundException('Не найдено в избранном');

        return this.prisma.favorite.delete({
            where: {
                user_id_listing_id: {
                    user_id: userId,
                    listing_id: listingId,
                },
            },
        });
    }
}
