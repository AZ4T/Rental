import { Type } from 'class-transformer';
import {
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
} from 'class-validator';

export class UpdateListingDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    deposit?: number;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsUUID()
    category_id?: string;

    @IsOptional()
    @IsString({ each: true })
    image_urls?: string[];
}
