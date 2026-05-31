import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateReportDto, reporterId: string) {
        // Verify target exists to prevent phantom reports
        const exists = await this.targetExists(dto.type, dto.target_id);
        if (!exists) throw new NotFoundException('Объект жалобы не найден');

        if (dto.type === 'USER' && dto.target_id === reporterId) {
            throw new BadRequestException('Нельзя жаловаться на себя');
        }

        return this.prisma.report.create({
            data: {
                reporter_id: reporterId,
                type: dto.type,
                target_id: dto.target_id,
                reason: dto.reason,
                description: dto.description,
            },
        });
    }

    private async targetExists(type: string, id: string): Promise<boolean> {
        if (type === 'USER') {
            return !!(await this.prisma.user.findUnique({ where: { id } }));
        }
        if (type === 'LISTING') {
            return !!(await this.prisma.listing.findUnique({ where: { id } }));
        }
        if (type === 'RENTAL') {
            return !!(await this.prisma.rentalRequest.findUnique({ where: { id } }));
        }
        return false;
    }

    async findAll() {
        return this.prisma.report.findMany({
            include: {
                reporter: {
                    select: { id: true, name: true, email: true, avatar_url: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.report.update({
            where: { id },
            data: { status },
            include: {
                reporter: {
                    select: { id: true, name: true, email: true, avatar_url: true },
                },
            },
        });
    }
}
