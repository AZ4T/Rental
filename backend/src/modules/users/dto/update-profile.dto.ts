import { IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    // Allow null/empty string to clear the avatar; otherwise must be valid URL
    @IsOptional()
    @ValidateIf((_o, v) => v !== null && v !== '')
    @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false })
    avatar_url?: string | null;
}
