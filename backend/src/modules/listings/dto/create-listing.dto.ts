import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateListingDto {
    @IsString()
    @MinLength(3)
    title: string;

    @IsString()
    @MinLength(10)
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
    city: string;

    @IsUUID()
    category_id: string;

    @IsString({ each: true })
    image_urls: string[];
}
