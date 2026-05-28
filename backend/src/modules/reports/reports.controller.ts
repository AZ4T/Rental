import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

type AuthRequest = Request & { user: { userId: string } };

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private reportsService: ReportsService) {}

    @Post()
    create(@Body() dto: CreateReportDto, @Req() req: AuthRequest) {
        return this.reportsService.create(dto, req.user.userId);
    }

    @UseGuards(RolesGuard)
    @Role('ADMIN')
    @Get()
    findAll() {
        return this.reportsService.findAll();
    }
}
