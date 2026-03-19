import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

type AuthRequest = Request & { user: { userId: string } };

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
    constructor(private favoritesService: FavoritesService) {}

    @Get()
    getMyFavorites(@Req() req: AuthRequest) {
        return this.favoritesService.getMyFavorites(req.user.userId);
    }

    @Post(':listingId')
    add(@Param('listingId') listingId: string, @Req() req: AuthRequest) {
        return this.favoritesService.add(req.user.userId, listingId);
    }

    @Delete(':listingId')
    remove(@Param('listingId') listingId: string, @Req() req: AuthRequest) {
        return this.favoritesService.remove(req.user.userId, listingId);
    }
}
