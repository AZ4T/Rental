import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { DisputeStatus } from '@prisma/client';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { OpenDisputeDto, AddEvidenceDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

type AuthRequest = Request & { user: { userId: string } };

@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
    constructor(private disputesService: DisputesService) {}

    @Post()
    open(@Body() dto: OpenDisputeDto, @Req() req: AuthRequest) {
        return this.disputesService.open(dto, req.user.userId);
    }

    @Get('my')
    getMine(@Req() req: AuthRequest) {
        return this.disputesService.getMine(req.user.userId);
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
        return this.disputesService.getOne(id, req.user.userId);
    }

    @Post(':id/evidence')
    addEvidence(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AddEvidenceDto,
        @Req() req: AuthRequest,
    ) {
        return this.disputesService.addEvidence(id, dto, req.user.userId);
    }

    // Admin endpoints

    @UseGuards(RolesGuard)
    @Role('ADMIN')
    @Get('admin/all')
    listAll(@Query('status') status?: DisputeStatus) {
        return this.disputesService.listAll(status);
    }

    @UseGuards(RolesGuard)
    @Role('ADMIN')
    @Patch('admin/:id/resolve')
    resolve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveDisputeDto) {
        return this.disputesService.resolve(id, dto);
    }
}
