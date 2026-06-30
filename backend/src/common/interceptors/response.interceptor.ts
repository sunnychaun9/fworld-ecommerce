import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Wraps every successful controller return value in the standard envelope
 * `{ success, message, data, errors }` (TRD §11).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data): ApiResponse<T> => ({
        success: true,
        message: 'Success',
        data: data ?? null,
        errors: [],
      })),
    );
  }
}
