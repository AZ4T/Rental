import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return this.prisma.user.create({ data });
    }

    async getProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                role: true,
                rating_avg: true,
                reviews_count: true,
                created_at: true,
            },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');
        return user;
    }

    async updateProfile(id: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.avatar_url !== undefined && {
                    avatar_url: dto.avatar_url,
                }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                role: true,
                rating_avg: true,
                reviews_count: true,
                created_at: true,
            },
        });
    }
}
