import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateReportDto, reporterId: string) {
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
}
