import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nService } from './i18n.service';
import { I18nException } from './i18n.exception';
import { DEFAULT_LANG } from './types';

// Resolves the message key against the request's language and produces
// the same JSON shape NestJS uses for HttpException (so the frontend's
// existing error-extraction code in api.ts keeps working).
@Catch(I18nException)
export class I18nExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) {}

    catch(exception: I18nException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();
        const lang = req.lang ?? DEFAULT_LANG;

        const message = this.i18n.t(
            exception.messageKey,
            lang,
            exception.params,
        );
        const status = exception.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;

        res.status(status).json({
            statusCode: status,
            message,
            error: defaultErrorName(status),
        });
    }
}

function defaultErrorName(status: number): string {
    switch (status) {
        case HttpStatus.BAD_REQUEST:
            return 'Bad Request';
        case HttpStatus.UNAUTHORIZED:
            return 'Unauthorized';
        case HttpStatus.FORBIDDEN:
            return 'Forbidden';
        case HttpStatus.NOT_FOUND:
            return 'Not Found';
        case HttpStatus.CONFLICT:
            return 'Conflict';
        default:
            return 'Error';
    }
}
