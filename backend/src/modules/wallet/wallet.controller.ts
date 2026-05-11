import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, Min, Max } from 'class-validator';

class TopUpDto {
    @IsNumber()
    @Min(1)
    @Max(1_000_000)
    amount: number;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private walletService: WalletService) {}

    @Get()
    getWallet(@Request() req: { user: { userId: string } }) {
        return this.walletService.getWallet(req.user.userId);
    }

    @Post('top-up')
    topUp(
        @Body() dto: TopUpDto,
        @Request() req: { user: { userId: string } },
    ) {
        return this.walletService.topUp(req.user.userId, dto.amount);
    }

    @Post('pay/:rentalRequestId')
    pay(
        @Param('rentalRequestId') rentalRequestId: string,
        @Request() req: { user: { userId: string } },
    ) {
        return this.walletService.pay(rentalRequestId, req.user.userId);
    }
}
