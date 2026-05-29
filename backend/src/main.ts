import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false,
        }),
    );
    app.use(cookieParser());

    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ limit: '10mb', extended: true }));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
        }),
    );

    app.enableCors({
        origin: (origin, callback) => {
            // Разрешаем localhost и любые локальные IP (192.168.x.x, 10.x.x.x)
            const allowed = !origin ||
                /^http:\/\/localhost(:\d+)?$/.test(origin) ||
                /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
                /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin);
            callback(null, allowed);
        },
        credentials: true,
    });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Rental API')
        .setDescription('REST API платформы аренды вещей')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
