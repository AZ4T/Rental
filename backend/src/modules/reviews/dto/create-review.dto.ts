import { IsUUID, IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

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
    @MaxLength(2000)
    comment?: string;
}
