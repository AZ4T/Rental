import {
    BadRequestException,
    Controller,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private uploadsService: UploadsService) {}

    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                if (allowed.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException('Только jpeg, png, webp'),
                        false,
                    );
                }
            },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Файл не прикреплен');
        const url = await this.uploadsService.uploadFile(file);
        return { url };
    }
}
