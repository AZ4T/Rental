import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class UpdateListingDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(5000)
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
    @MinLength(2)
    @MaxLength(255)
    city?: string;

    @IsOptional()
    @IsUUID()
    category_id?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1, { message: 'Добавьте хотя бы одну фотографию' })
    @ArrayMaxSize(5, { message: 'Максимум 5 фотографий' })
    @IsString({ each: true })
    image_urls?: string[];
}
