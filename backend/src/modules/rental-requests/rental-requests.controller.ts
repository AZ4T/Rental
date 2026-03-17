import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RentalRequestsService } from './rental-requests.service';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { UpdateStatusDto } from './dto/update-rental-request.dto';

type AuthRequest = Request & { user: { userId: string } };

@UseGuards(JwtAuthGuard)
@Controller('rental-requests')
export class RentalRequestsController {
    constructor(private rentalRequestsService: RentalRequestsService) {}

    @Post()
    create(@Body() dto: CreateRentalRequestDto, @Req() req: AuthRequest) {
        return this.rentalRequestsService.create(dto, req.user.userId);
    }

    // my requests as renter
    @Get('my')
    findMyRequests(@Req() req: AuthRequest) {
        return this.rentalRequestsService.findMyRequests(req.user.userId);
    }

    // incoming requests for my listings
    @Get('incoming')
    findIncomingRequests(@Req() req: AuthRequest) {
        return this.rentalRequestsService.findIncomingRequests(req.user.userId);
    }

    // owner cancels status
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
        @Req() req: AuthRequest,
    ) {
        return this.rentalRequestsService.updateStatus(
            id,
            dto,
            req.user.userId,
        );
    }

    // renter cancels
    @Patch(':id/cancel')
    cancel(@Param('id') id: string, @Req() req: AuthRequest) {
        return this.rentalRequestsService.cancel(id, req.user.userId);
    }
}
