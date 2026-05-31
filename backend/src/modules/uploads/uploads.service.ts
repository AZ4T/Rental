/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    CreateBucketCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);
    private s3: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor(private config: ConfigService) {
        const endpoint = config.getOrThrow('MINIO_ENDPOINT');
        this.s3 = new S3Client({
            endpoint,
            region: 'us-east-1',
            credentials: {
                accessKeyId: config.getOrThrow('MINIO_ACCESS_KEY'),
                secretAccessKey: config.getOrThrow('MINIO_SECRET_KEY'),
            },
            forcePathStyle: true,
        });

        this.bucket = config.getOrThrow('MINIO_BUCKET');
        this.publicUrl = config.get('MINIO_PUBLIC_URL') || endpoint;

        // Retry with backoff if MinIO is still warming up at app startup
        void this.ensureBucketWithRetry();
    }

    private async ensureBucketWithRetry(): Promise<void> {
        const delays = [1000, 2000, 5000, 10000, 20000];
        for (const delay of delays) {
            try {
                await this.ensureBucket();
                this.logger.log(`MinIO bucket "${this.bucket}" ready`);
                return;
            } catch (e) {
                this.logger.warn(
                    `MinIO not ready (${(e as Error).message}), retrying in ${delay}ms`,
                );
                await new Promise((r) => setTimeout(r, delay));
            }
        }
        this.logger.error('MinIO bucket initialization failed after retries — uploads will throw');
    }

    private async ensureBucket() {
        let bucketExists = false;
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
            bucketExists = true;
        } catch {
            await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        }

        // Skip re-applying the policy on every restart — only set it when we
        // actually create the bucket.
        if (!bucketExists) {
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: '*',
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucket}/*`],
                    },
                ],
            };
            await this.s3.send(
                new PutBucketPolicyCommand({
                    Bucket: this.bucket,
                    Policy: JSON.stringify(policy),
                }),
            );
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        // 1) Magic-byte sniff — client-supplied mimetype can lie. An attacker
        // can send a .exe with Content-Type: image/jpeg; this catches that.
        const detected = await fileTypeFromBuffer(file.buffer);
        const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!detected || !allowedMimes.has(detected.mime)) {
            throw new BadRequestException('Файл не является изображением (JPEG/PNG/WEBP)');
        }

        // 2) Re-encode with sharp — strips ALL metadata (incl. EXIF GPS),
        // normalizes the file, and clamps dimensions so we don't store a 50MP
        // photo that crashes phones when they try to render it.
        let processed: Buffer;
        let outMime: string;
        let outExt: string;
        try {
            const pipeline = sharp(file.buffer, { failOn: 'error' })
                .rotate() // honor EXIF orientation, then strip the rest
                .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });

            if (detected.mime === 'image/png') {
                processed = await pipeline.png({ compressionLevel: 8 }).toBuffer();
                outMime = 'image/png';
                outExt = '.png';
            } else if (detected.mime === 'image/webp') {
                processed = await pipeline.webp({ quality: 85 }).toBuffer();
                outMime = 'image/webp';
                outExt = '.webp';
            } else {
                processed = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
                outMime = 'image/jpeg';
                outExt = '.jpg';
            }
        } catch {
            throw new BadRequestException('Не удалось обработать изображение');
        }

        const key = `${randomUUID()}${outExt}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: processed,
                ContentType: outMime,
            }),
        );

        return `${this.publicUrl}/${this.bucket}/${key}`;
    }

    getPublicPrefix(): string {
        return `${this.publicUrl}/${this.bucket}/`;
    }

    normalizeUrl(url: string): string {
        const bucketPath = `/${this.bucket}/`;
        const idx = url.indexOf(bucketPath);
        if (idx === -1) return url;
        const key = url.slice(idx + bucketPath.length);
        return `${this.publicUrl}/${this.bucket}/${key}`;
    }

    async deleteFile(url: string): Promise<void> {
        const key = url.split(`/${this.bucket}/`)[1];
        if (!key) return;

        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
    }
}
