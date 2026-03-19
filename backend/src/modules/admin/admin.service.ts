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
}
