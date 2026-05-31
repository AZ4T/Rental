import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsNumber,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateListingDto {
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title: string;

    @IsString()
    @MinLength(10)
    @MaxLength(5000)
    description: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    deposit: number;

    @IsString()
    @MinLength(2)
    @MaxLength(255)
    city: string;

    @IsUUID()
    category_id: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'Добавьте хотя бы одну фотографию' })
    @ArrayMaxSize(5, { message: 'Максимум 5 фотографий' })
    @IsString({ each: true })
    image_urls: string[];
}
