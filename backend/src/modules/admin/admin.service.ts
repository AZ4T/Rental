import { Injectable, NotFoundException } from '@nestjs/common';
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
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async deleteUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Пользователь не найден');
        return this.prisma.user.delete({ where: { id } });
    }

    async deleteListing(id: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!listing) throw new NotFoundException('Объявление не найдено');

        // Удаляем фото из MinIO
        await Promise.all(
            listing.images.map((img) =>
                this.uploadService.deleteFile(img.image_url),
            ),
        );

        return this.prisma.listing.delete({ where: { id } });
    }

    async createCategory(dto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: { name: dto.name },
        });
    }

    async deleteCategory(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) throw new NotFoundException('Категория не найдена');
        return this.prisma.category.delete({ where: { id } });
    }

    async getStats() {
        const [totalUsers, totalListings, totalRequests, revenueResult, topListings] =
            await this.prisma.$transaction([
                this.prisma.user.count(),
                this.prisma.listing.count(),
                this.prisma.rentalRequest.count(),
                this.prisma.transaction.aggregate({
                    where: { type: 'INCOME' },
                    _sum: { amount: true },
                }),
                this.prisma.listing.findMany({
                    take: 5,
                    orderBy: { rentalRequests: { _count: 'desc' } },
                    select: {
                        id: true,
                        title: true,
                        views_count: true,
                        _count: { select: { rentalRequests: true } },
                    },
                }),
            ]);

        // Заявки за последние 7 дней
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        const requestsByDay = await Promise.all(
            days.map(async (day) => {
                const next = new Date(day);
                next.setDate(next.getDate() + 1);
                const count = await this.prisma.rentalRequest.count({
                    where: { created_at: { gte: day, lt: next } },
                });
                return {
                    date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                    count,
                };
            }),
        );

        // Новые пользователи за 7 дней
        const usersByDay = await Promise.all(
            days.map(async (day) => {
                const next = new Date(day);
                next.setDate(next.getDate() + 1);
                const count = await this.prisma.user.count({
                    where: { created_at: { gte: day, lt: next } },
                });
                return {
                    date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                    count,
                };
            }),
        );

        return {
            totalUsers,
            totalListings,
            totalRequests,
            totalRevenue: Number(revenueResult._sum.amount ?? 0),
            topListings,
            requestsByDay,
            usersByDay,
        };
    }
}
