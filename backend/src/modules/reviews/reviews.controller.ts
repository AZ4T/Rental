import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

type AuthRequest = Request & { user: { userId: string } };

@Controller('reviews')
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) {}

    // Отзывы о конкретном пользователе — публичный
    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.reviewsService.findByUser(userId);
    }

    // Оставить отзыв — только авторизованный
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateReviewDto, @Req() req: AuthRequest) {
        return this.reviewsService.create(dto, req.user.userId);
    }
}
