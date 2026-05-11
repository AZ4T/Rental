import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { QueryListingDto } from './dto/query-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { Request } from 'express';
import { UpdateListingDto } from './dto/update-listing.dto';

@Controller('listings')
export class ListingsController {
    constructor(private listingsService: ListingsService) {}

    @Get()
    findAll(@Query() query: QueryListingDto) {
        return this.listingsService.findAll(query);
    }

    @Get('price-range')
    getPriceRange() {
        return this.listingsService.getPriceRange();
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    getMyListings(@Req() req: Request & { user: { userId: string } }) {
        return this.listingsService.findMyListings(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @Get(':id/similar')
    getSimilar(
        @Param('id') id: string,
        @Query('category_id') categoryId: string,
    ) {
        return this.listingsService.findSimilar(id, categoryId);
    }

    @Get(':id/availability')
    getAvailability(@Param('id') id: string) {
        return this.listingsService.getAvailability(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/analytics')
    getAnalytics(
        @Param('id') id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.listingsService.getAnalytics(id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(
        @Body() dto: CreateListingDto,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.listingsService.create(dto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateListingDto,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.listingsService.update(id, dto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(
        @Param('id') id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.listingsService.delete(id, req.user.userId);
    }
}
