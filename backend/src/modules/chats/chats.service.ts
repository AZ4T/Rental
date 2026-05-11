import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatsService {
    constructor(private prisma: PrismaService) {}

    async findOrCreate(userAId: string, userBId: string) {
        const [p1, p2] = [userAId, userBId].sort();

        const existing = await this.prisma.chat.findUnique({
            where: { participant1_id_participant2_id: { participant1_id: p1, participant2_id: p2 } },
            include: this.chatInclude(userAId),
        });
        if (existing) return existing;

        return this.prisma.chat.create({
            data: { participant1_id: p1, participant2_id: p2 },
            include: this.chatInclude(userAId),
        });
    }

    async getMyChats(userId: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [{ participant1_id: userId }, { participant2_id: userId }],
            },
            include: this.chatInclude(userId),
            orderBy: { created_at: 'desc' },
        });

        return chats.sort((a, b) => {
            const aTime = a.messages[0]?.created_at.getTime() ?? a.created_at.getTime();
            const bTime = b.messages[0]?.created_at.getTime() ?? b.created_at.getTime();
            return bTime - aTime;
        });
    }

    async getMessages(chatId: string, userId: string) {
        await this.assertParticipant(chatId, userId);
        return this.prisma.message.findMany({
            where: { chat_id: chatId },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'asc' },
        });
    }

    async createMessage(chatId: string, senderId: string, content: string) {
        await this.assertParticipant(chatId, senderId);
        return this.prisma.message.create({
            data: { chat_id: chatId, sender_id: senderId, content },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
        });
    }

    async markAsRead(chatId: string, userId: string) {
        await this.assertParticipant(chatId, userId);
        await this.prisma.message.updateMany({
            where: { chat_id: chatId, sender_id: { not: userId }, is_read: false },
            data: { is_read: true },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.message.count({
            where: {
                is_read: false,
                sender_id: { not: userId },
                chat: {
                    OR: [{ participant1_id: userId }, { participant2_id: userId }],
                },
            },
        });
    }

    private async assertParticipant(chatId: string, userId: string) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) throw new NotFoundException('Чат не найден');
        if (chat.participant1_id !== userId && chat.participant2_id !== userId) {
            throw new ForbiddenException('Нет доступа к чату');
        }
        return chat;
    }

    private chatInclude(userId: string) {
        return {
            participant1: { select: { id: true, name: true, avatar_url: true } },
            participant2: { select: { id: true, name: true, avatar_url: true } },
            messages: {
                orderBy: { created_at: 'desc' as const },
                take: 1,
            },
            _count: {
                select: {
                    messages: {
                        where: { is_read: false, sender_id: { not: userId } },
                    },
                },
            },
        };
    }
}
