import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class OpenDisputeDto {
    @IsUUID()
    rental_request_id: string;

    @IsString()
    @MinLength(3)
    @MaxLength(255)
    reason: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    evidence?: string[];
}

export class AddEvidenceDto {
    @IsArray()
    @IsString({ each: true })
    images: string[];
}
