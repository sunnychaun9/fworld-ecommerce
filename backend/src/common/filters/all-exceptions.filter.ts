import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ApiError, ApiResponse } from '../interfaces/api-response.interface';

/** HTTP status → stable error code (API D4 taxonomy). */
const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

function codeForStatus(status: number): string {
  return STATUS_TO_CODE[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}

/**
 * Global exception filter. Converts any thrown error into the standard error
 * envelope with **structured, machine-readable errors** (API D4): every error
 * carries a stable `code`. Preserves HTTP status codes, surfaces validation
 * messages, honours a custom `code` provided by a thrown `HttpException`, and
 * never leaks internal error details or stack traces in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: ApiError[] = [];

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const fallbackCode = codeForStatus(status);

      if (typeof res === 'string') {
        message = res;
        errors = [{ code: fallbackCode, message: res }];
      } else if (typeof res === 'object' && res !== null) {
        const body = res as {
          message?: string | string[];
          error?: string;
          code?: string;
          field?: string;
        };
        const code = typeof body.code === 'string' ? body.code : fallbackCode;

        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = body.message.map((entry) => ({
            code: 'VALIDATION_ERROR',
            message: String(entry),
          }));
        } else if (typeof body.message === 'string') {
          message = body.message;
          errors = [{ code, ...(body.field ? { field: body.field } : {}), message: body.message }];
        } else {
          message = body.error ?? message;
          errors = [{ code, message }];
        }
      }
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
      errors = [{ code: 'INTERNAL_ERROR', message }];
    } else {
      errors = [{ code: codeForStatus(status), message }];
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const payload: ApiResponse<null> = { success: false, message, data: null, errors };
    response.status(status).json(payload);
  }
}
