import { Controller, Get, Param } from '@nestjs/common';
import { RentalRequestsService } from './rental-requests.service';

@Controller('rental-requests')
export class RentalScanController {
    constructor(private rentalRequestsService: RentalRequestsService) {}

    // Public endpoint — no JwtAuthGuard
    @Get('scan/:token')
    scanQr(@Param('token') token: string) {
        return this.rentalRequestsService.scanQr(token);
    }
}
