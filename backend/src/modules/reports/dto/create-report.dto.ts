import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateReportDto {
    @IsString()
    @IsIn(['USER', 'LISTING', 'RENTAL'])
    type: string;

    @IsString()
    target_id: string;

    @IsString()
    @IsIn(['SPAM', 'FRAUD', 'INAPPROPRIATE', 'DAMAGE', 'OTHER'])
    reason: string;

    @IsOptional()
    @IsString()
    description?: string;
}
