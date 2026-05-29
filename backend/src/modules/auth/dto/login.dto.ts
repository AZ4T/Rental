import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(64)
    device_id?: string;
}
