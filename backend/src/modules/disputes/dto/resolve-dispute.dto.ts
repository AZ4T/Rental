import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class ResolveDisputeDto {
    @IsEnum(DisputeStatus)
    status: Exclude<DisputeStatus, 'OPEN'>;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    deposit_to_renter?: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    admin_note?: string;
}
