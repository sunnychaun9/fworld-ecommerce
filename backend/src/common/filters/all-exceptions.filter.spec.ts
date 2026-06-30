import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
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

  it('formats an HttpException into the error envelope', () => {
    const { host, json, status } = mockHost();

    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
      data: null,
      errors: [],
    });
  });

  it('collects validation messages from a BadRequestException', () => {
    const { host, json } = mockHost();

    filter.catch(new BadRequestException(['name must be a string']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errors: ['name must be a string'] }),
    );
  });

  it('does not leak internal details and returns 500 for unknown errors', () => {
    const { host, json, status } = mockHost();

    filter.catch(new Error('secret db detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, data: null }));
  });
});
