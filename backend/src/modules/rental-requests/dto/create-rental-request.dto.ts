import { IsDateString, IsUUID } from 'class-validator';

export class CreateRentalRequestDto {
    @IsUUID()
    listing_id: string;

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;
}
