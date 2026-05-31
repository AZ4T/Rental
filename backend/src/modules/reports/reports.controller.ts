import {
    Body,
    Controller,
    Get,
    Patch,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/create-report.dto';
import type { Request } from 'express';

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

    @UseGuards(RolesGuard)
    @Role('ADMIN')
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
        return this.reportsService.updateStatus(id, dto.status);
    }
}
