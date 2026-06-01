import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {}

    private allowedAvatarPrefix(): string {
        const publicUrl = this.config.getOrThrow<string>('MINIO_PUBLIC_URL');
        const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
        return `${publicUrl}/${bucket}/`;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
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
                premium_until: true,
                created_at: true,
            },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');
        const isPremium =
            !!user.premium_until && user.premium_until.getTime() > Date.now();
        return { ...user, is_premium: isPremium };
    }

    async updateProfile(id: string, dto: UpdateProfileDto) {
        // Empty string means "clear avatar"; a non-empty value must come from our storage
        if (dto.avatar_url && !dto.avatar_url.startsWith(this.allowedAvatarPrefix())) {
            throw new BadRequestException('avatar_url must point to application storage');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.avatar_url !== undefined && {
                    avatar_url: dto.avatar_url || null,
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

    async blockUser(blockerId: string, blockedId: string) {
        if (blockerId === blockedId) {
            throw new BadRequestException('Нельзя заблокировать самого себя');
        }
        const target = await this.prisma.user.findUnique({ where: { id: blockedId } });
        if (!target) throw new NotFoundException('Пользователь не найден');

        try {
            await this.prisma.userBlock.create({
                data: { blocker_id: blockerId, blocked_id: blockedId },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('Уже заблокирован');
            }
            throw e;
        }
        return { ok: true };
    }

    async unblockUser(blockerId: string, blockedId: string) {
        const block = await this.prisma.userBlock.findUnique({
            where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId } },
        });
        if (!block) throw new NotFoundException('Пользователь не заблокирован');

        await this.prisma.userBlock.delete({
            where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId } },
        });
        return { ok: true };
    }

    async getBlockedUsers(userId: string) {
        return this.prisma.userBlock.findMany({
            where: { blocker_id: userId },
            include: {
                blocked: {
                    select: { id: true, name: true, avatar_url: true, email: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Returns true when EITHER side has blocked the other — used to gate
     * interactions (chat, calls, rentals). Symmetric: if A blocks B, B also
     * can't initiate with A.
     */
    async isBlockedEitherWay(userAId: string, userBId: string): Promise<boolean> {
        if (userAId === userBId) return false;
        const block = await this.prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blocker_id: userAId, blocked_id: userBId },
                    { blocker_id: userBId, blocked_id: userAId },
                ],
            },
            select: { id: true },
        });
        return !!block;
    }
}
