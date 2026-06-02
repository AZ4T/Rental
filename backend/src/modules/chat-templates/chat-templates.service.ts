import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const DEFAULT_TEMPLATES = [
    'Здравствуйте! Спасибо за интерес.',
    'Доступно в эти даты.',
    'Залог обязателен и возвращается после успешного завершения аренды.',
    'Где удобнее встретиться для передачи?',
    'Хорошо, договорились!',
];

@Injectable()
export class ChatTemplatesService {
    constructor(private prisma: PrismaService) {}

    async list(userId: string) {
        const existing = await this.prisma.chatTemplate.findMany({
            where: { user_id: userId },
            orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
        });
        if (existing.length > 0) return existing;

        // Seed defaults on first access
        await this.prisma.chatTemplate.createMany({
            data: DEFAULT_TEMPLATES.map((text, i) => ({
                user_id: userId,
                text,
                position: i,
            })),
        });
        return this.prisma.chatTemplate.findMany({
            where: { user_id: userId },
            orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
        });
    }

    async create(userId: string, text: string) {
        const trimmed = text?.trim();
        if (!trimmed) throw new BadRequestException('Empty text');
        if (trimmed.length > 500) throw new BadRequestException('Text too long');

        const last = await this.prisma.chatTemplate.findFirst({
            where: { user_id: userId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        const position = (last?.position ?? -1) + 1;

        return this.prisma.chatTemplate.create({
            data: { user_id: userId, text: trimmed, position },
        });
    }

    async update(userId: string, id: string, text: string) {
        const trimmed = text?.trim();
        if (!trimmed) throw new BadRequestException('Empty text');
        if (trimmed.length > 500) throw new BadRequestException('Text too long');

        const tpl = await this.prisma.chatTemplate.findUnique({ where: { id } });
        if (!tpl) throw new NotFoundException();
        if (tpl.user_id !== userId) throw new ForbiddenException();

        return this.prisma.chatTemplate.update({
            where: { id },
            data: { text: trimmed },
        });
    }

    async delete(userId: string, id: string) {
        const tpl = await this.prisma.chatTemplate.findUnique({ where: { id } });
        if (!tpl) throw new NotFoundException();
        if (tpl.user_id !== userId) throw new ForbiddenException();
        await this.prisma.chatTemplate.delete({ where: { id } });
        return { success: true };
    }

    async reorder(userId: string, ids: string[]) {
        // Set positions to match the order of `ids`. Ignores any ids not owned
        // by this user so a bad payload can't corrupt other users' templates.
        const owned = await this.prisma.chatTemplate.findMany({
            where: { user_id: userId, id: { in: ids } },
            select: { id: true },
        });
        const ownedSet = new Set(owned.map((t) => t.id));
        const filtered = ids.filter((id) => ownedSet.has(id));

        await this.prisma.$transaction(
            filtered.map((id, position) =>
                this.prisma.chatTemplate.update({
                    where: { id },
                    data: { position },
                }),
            ),
        );
        return this.list(userId);
    }
}
