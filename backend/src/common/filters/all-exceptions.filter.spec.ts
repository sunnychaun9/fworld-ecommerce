import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AllExceptionsFilter } from './all-exceptions.filter';

function mockHost(): {
  host: ArgumentsHost;
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
} {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/x' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('maps an HttpException to a structured error with a status-derived code', () => {
    const { host, json, status } = mockHost();

    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
      data: null,
      errors: [{ code: 'NOT_FOUND', message: 'Not found' }],
    });
  });

  it('honours a custom error code carried by the exception (e.g. ACCOUNT_BLOCKED)', () => {
    const { host, json } = mockHost();

    filter.catch(
      new ForbiddenException({ code: 'ACCOUNT_BLOCKED', message: 'Account is blocked' }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Account is blocked',
        errors: [{ code: 'ACCOUNT_BLOCKED', message: 'Account is blocked' }],
      }),
    );
  });

  it('produces per-field VALIDATION_ERROR entries from a BadRequestException', () => {
    const { host, json } = mockHost();

    filter.catch(new BadRequestException(['name must be a string']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: [{ code: 'VALIDATION_ERROR', message: 'name must be a string' }],
      }),
    );
  });

  it('does not leak internal details and returns 500 INTERNAL_ERROR for unknown errors', () => {
    const { host, json, status } = mockHost();

    filter.catch(new Error('secret db detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        errors: expect.arrayContaining([expect.objectContaining({ code: 'INTERNAL_ERROR' })]),
      }),
    );
  });
});
