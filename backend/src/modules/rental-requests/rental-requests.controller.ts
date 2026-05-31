import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
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

    // Number of incoming requests created since the last time the user opened the page
    @Get('incoming/new-count')
    getNewIncomingCount(@Req() req: AuthRequest) {
        return this.rentalRequestsService.getNewIncomingCount(req.user.userId);
    }

    // Called when the user opens the incoming-requests page — clears the badge
    @Post('incoming/seen')
    markIncomingSeen(@Req() req: AuthRequest) {
        return this.rentalRequestsService.markIncomingSeen(req.user.userId);
    }

    // owner gets QR token for a rental request
    @Get(':id/qr')
    getQrToken(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
        return this.rentalRequestsService.getQrToken(id, req.user.userId);
    }

    // add return images (renter or owner)
    @Post(':id/return-images')
    addReturnImages(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { images: string[] },
        @Req() req: AuthRequest,
    ) {
        return this.rentalRequestsService.addReturnImages(id, req.user.userId, body.images);
    }

    // owner updates status
    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
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
    cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
        return this.rentalRequestsService.cancel(id, req.user.userId);
    }
}
