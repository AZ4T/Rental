import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryListingDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID()
    category_id?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price_max?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 12;
}
