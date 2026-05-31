import { IsString, IsIn, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
    @IsString()
    @IsIn(['USER', 'LISTING', 'RENTAL'])
    type: string;

    @IsUUID()
    target_id: string;

    @IsString()
    @IsIn(['SPAM', 'FRAUD', 'INAPPROPRIATE', 'DAMAGE', 'OTHER'])
    reason: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}

export class UpdateReportStatusDto {
    @IsString()
    @IsIn(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'])
    status: string;
}
