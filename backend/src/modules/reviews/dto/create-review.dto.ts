import { IsUUID, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsUUID()
    rental_request_id: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    listing_rating?: number;

    @IsOptional()
    @IsString()
    comment?: string;
}
