import { IsUUID, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsUUID()
    rental_request_id: string;

    @IsUUID()
    target_user_id: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;
}
