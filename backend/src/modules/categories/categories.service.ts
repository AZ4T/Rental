import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) throw new NotFoundException('Категория не найдена');
        return category;
    }

    async create(dto: CreateCategoryDto) {
        const exists = await this.prisma.category.findUnique({
            where: { name: dto.name },
        });
        if (exists) throw new ConflictException('Категория уже существует');

        return this.prisma.category.create({
            data: { name: dto.name },
        });
    }

    async delete(id: string) {
        await this.findOne(id);
        return this.prisma.category.delete({
            where: { id },
        });
    }
}
