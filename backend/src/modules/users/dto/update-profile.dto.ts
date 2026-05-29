import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false })
    avatar_url?: string;
}
