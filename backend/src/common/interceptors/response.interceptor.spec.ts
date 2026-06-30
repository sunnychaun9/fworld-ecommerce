import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { ResponseInterceptor } from './response.interceptor';

const context = {} as unknown as ExecutionContext;

describe('ResponseInterceptor', () => {
  it('wraps a payload in the standard envelope', async () => {
    const interceptor = new ResponseInterceptor<{ id: number }>();
    const next: CallHandler<{ id: number }> = { handle: () => of({ id: 1 }) };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: { id: 1 },
      errors: [],
    });
  });

  it('maps an undefined return value to null data', async () => {
    const interceptor = new ResponseInterceptor<undefined>();
    const next: CallHandler<undefined> = { handle: () => of(undefined) };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result.data).toBeNull();
  });
});
