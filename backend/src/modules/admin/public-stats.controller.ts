import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// Public landing page (/about) needs totals — no auth required.
// Lives next to the admin controller because the data is similar but
// must NOT inherit its JwtAuthGuard/RolesGuard.
@Controller('public-stats')
export class PublicStatsController {
    constructor(private prisma: PrismaService) {}

    @Get()
    async getStats() {
        const [totalListings, totalUsers] = await this.prisma.$transaction([
            this.prisma.listing.count({ where: { is_hidden: false } }),
            this.prisma.user.count(),
        ]);
        return { totalListings, totalUsers };
    }
}
