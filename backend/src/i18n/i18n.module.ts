import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { I18nService } from './i18n.service';
import { I18nMiddleware } from './i18n.middleware';
import { I18nExceptionFilter } from './i18n-exception.filter';

// Global module so any provider can inject I18nService without importing
// I18nModule manually in feature modules.
@Global()
@Module({
    providers: [
        I18nService,
        { provide: APP_FILTER, useClass: I18nExceptionFilter },
    ],
    exports: [I18nService],
})
export class I18nModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Wildcard so Accept-Language is parsed on every HTTP route.
        consumer.apply(I18nMiddleware).forRoutes('*');
    }
}
