import { HttpException, HttpStatus } from '@nestjs/common';
import { MessageKey } from './messages';

// Marker exception — services throw this with just a key + params.
// A global filter resolves the key against the current request's
// language and produces the actual error response. This keeps service
// signatures untouched (no lang threaded through everywhere).
export class I18nException extends HttpException {
    constructor(
        public readonly messageKey: MessageKey,
        statusCode: HttpStatus,
        public readonly params?: Record<string, string | number>,
    ) {
        super({ messageKey, params }, statusCode);
    }
}

export class I18nBadRequest extends I18nException {
    constructor(
        messageKey: MessageKey,
        params?: Record<string, string | number>,
    ) {
        super(messageKey, HttpStatus.BAD_REQUEST, params);
    }
}

export class I18nForbidden extends I18nException {
    constructor(
        messageKey: MessageKey,
        params?: Record<string, string | number>,
    ) {
        super(messageKey, HttpStatus.FORBIDDEN, params);
    }
}

export class I18nNotFound extends I18nException {
    constructor(
        messageKey: MessageKey,
        params?: Record<string, string | number>,
    ) {
        super(messageKey, HttpStatus.NOT_FOUND, params);
    }
}

export class I18nUnauthorized extends I18nException {
    constructor(
        messageKey: MessageKey,
        params?: Record<string, string | number>,
    ) {
        super(messageKey, HttpStatus.UNAUTHORIZED, params);
    }
}

export class I18nConflict extends I18nException {
    constructor(
        messageKey: MessageKey,
        params?: Record<string, string | number>,
    ) {
        super(messageKey, HttpStatus.CONFLICT, params);
    }
}
