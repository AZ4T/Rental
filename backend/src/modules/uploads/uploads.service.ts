/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    CreateBucketCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class UploadsService {
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

        void this.ensureBucket();
    }

    private async ensureBucket() {
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
        } catch {
            await this.s3.send(
                new CreateBucketCommand({ Bucket: this.bucket }),
            );
        }

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

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const ext = extname(file.originalname);
        const key = `${randomUUID()}${ext}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );

        return `${this.publicUrl}/${this.bucket}/${key}`;
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
