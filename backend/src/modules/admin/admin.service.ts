import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadsService,
    ) {}

    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                rating_avg: true,
                reviews_count: true,
                created_at: true,
                _count: { select: { listings: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async deleteUser(id: string, actingAdminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                listings: { include: { images: true } },
            },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');

        // Don't let the last admin nuke themselves (would lock everyone out of /admin)
        if (user.role === 'ADMIN') {
            const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                throw new BadRequestException('Нельзя удалить последнего администратора');
            }
            if (user.id === actingAdminId) {
                throw new ForbiddenException('Нельзя удалить самого себя через эту панель');
            }
        }

        // Best-effort MinIO cleanup BEFORE the DB cascade wipes the URLs.
        const urls: string[] = [];
        if (user.avatar_url) urls.push(user.avatar_url);
        for (const listing of user.listings) {
            for (const img of listing.images) urls.push(img.image_url);
        }
        await Promise.all(
            urls.map((url) => this.uploadService.deleteFile(url).catch(() => undefined)),
        );

        return this.prisma.user.delete({ where: { id } });
    }

    async deleteListing(id: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');

        await Promise.all(
            listing.images.map((img) =>
                this.uploadService.deleteFile(img.image_url).catch(() => undefined),
            ),
        );

        return this.prisma.listing.delete({ where: { id } });
    }

    async createCategory(dto: CreateCategoryDto) {
        try {
            return await this.prisma.category.create({ data: { name: dto.name } });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('Категория с таким названием уже существует');
            }
            throw e;
        }
    }

    async deleteCategory(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { listings: true } } },
        });
        if (!category) throw new NotFoundException('Категория не найдена');

        // Listing.category is RESTRICT by default — refuse upfront with a real
        // message instead of letting the DB throw a cryptic FK error.
        if (category._count.listings > 0) {
            throw new BadRequestException(
                `Категория содержит ${category._count.listings} объявлений. Сначала удалите или перенесите их.`,
            );
        }
        return this.prisma.category.delete({ where: { id } });
    }

    async getStats() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const [totalUsers, totalListings, totalRequests, revenueResult, topListings] =
            await this.prisma.$transaction([
                this.prisma.user.count(),
                this.prisma.listing.count(),
                this.prisma.rentalRequest.count(),
                this.prisma.transaction.aggregate({
                    where: { type: 'INCOME' },
                    _sum: { amount: true },
                }),
                // Top listings by rental count over the last 90 days — stops
                // ancient "champion" listings from dominating the table forever.
                this.prisma.listing.findMany({
                    take: 5,
                    orderBy: { rentalRequests: { _count: 'desc' } },
                    where: {
                        rentalRequests: {
                            some: {
                                created_at: {
                                    gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        title: true,
                        views_count: true,
                        _count: { select: { rentalRequests: true } },
                    },
                }),
            ]);

        // Single grouped query per series instead of 7 sequential round-trips.
        const [requestsRaw, usersRaw] = await Promise.all([
            this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
                SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
                FROM "RentalRequest"
                WHERE created_at >= ${weekAgo}
                GROUP BY day
                ORDER BY day ASC
            `,
            this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
                SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
                FROM "User"
                WHERE created_at >= ${weekAgo}
                GROUP BY day
                ORDER BY day ASC
            `,
        ]);

        const fillWeek = (raw: { day: Date; count: bigint }[]) => {
            const map = new Map(raw.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                d.setHours(0, 0, 0, 0);
                const key = d.toISOString().slice(0, 10);
                return {
                    date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                    count: map.get(key) ?? 0,
                };
            });
        };

        return {
            totalUsers,
            totalListings,
            totalRequests,
            totalRevenue: Number(revenueResult._sum.amount ?? 0),
            topListings,
            requestsByDay: fillWeek(requestsRaw),
            usersByDay: fillWeek(usersRaw),
        };
    }

    async getPlatformFinance() {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 29);
        monthAgo.setHours(0, 0, 0, 0);

        const [bySource, recent, byDayRaw, activePremium, activePromoted] =
            await Promise.all([
                this.prisma.platformIncome.groupBy({
                    by: ['source'],
                    _sum: { amount: true },
                    _count: { _all: true },
                }),
                this.prisma.platformIncome.findMany({
                    orderBy: { created_at: 'desc' },
                    take: 30,
                }),
                this.prisma.$queryRaw<
                    { day: Date; source: string; total: number }[]
                >`
                    SELECT
                        date_trunc('day', created_at) AS day,
                        source::text AS source,
                        SUM(amount)::float AS total
                    FROM "PlatformIncome"
                    WHERE created_at >= ${monthAgo}
                    GROUP BY day, source
                    ORDER BY day ASC
                `,
                this.prisma.user.count({
                    where: { premium_until: { gt: new Date() } },
                }),
                this.prisma.listing.count({
                    where: { promoted_until: { gt: new Date() } },
                }),
            ]);

        const totalAll = bySource.reduce(
            (sum, row) => sum + Number(row._sum.amount ?? 0),
            0,
        );

        const totals = {
            COMMISSION: 0,
            PROMOTION: 0,
            PREMIUM: 0,
        } as Record<string, number>;
        const counts = { COMMISSION: 0, PROMOTION: 0, PREMIUM: 0 } as Record<
            string,
            number
        >;
        for (const row of bySource) {
            totals[row.source] = Number(row._sum.amount ?? 0);
            counts[row.source] = row._count._all;
        }

        // Aggregate per day across all sources
        const dayMap = new Map<string, number>();
        for (const row of byDayRaw) {
            const key = row.day.toISOString().slice(0, 10);
            dayMap.set(key, (dayMap.get(key) ?? 0) + Number(row.total));
        }
        const byDay: { date: string; total: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().slice(0, 10);
            byDay.push({ date: key, total: dayMap.get(key) ?? 0 });
        }

        return {
            total: totalAll,
            totals,
            counts,
            activePremium,
            activePromoted,
            byDay,
            recent,
        };
    }
}
