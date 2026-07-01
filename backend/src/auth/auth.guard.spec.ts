import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { AuthGuard } from './auth.guard';
import type { Auth } from './auth.factory';
import { IS_PUBLIC_KEY, ROLES_KEY, type RequestWithPrincipal } from './principal';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface GuardSetup {
  guard: AuthGuard;
  getSession: ReturnType<typeof vi.fn>;
  request: RequestWithPrincipal;
}

function setup(meta: { isPublic?: boolean; roles?: string[]; absoluteMaxMs?: number }): GuardSetup {
  const getSession = vi.fn();
  const auth = { api: { getSession } } as unknown as Auth;
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === IS_PUBLIC_KEY ? meta.isPublic : key === ROLES_KEY ? meta.roles : undefined,
    ),
  } as unknown as Reflector;
  const config = {
    get: vi.fn(() => meta.absoluteMaxMs ?? THIRTY_DAYS_MS),
  } as unknown as ConfigService;
  const guard = new AuthGuard(auth, reflector, config);
  const request = { headers: {} } as RequestWithPrincipal;
  return { guard, getSession, request };
}

function contextFor(request: RequestWithPrincipal): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** Extract the stable error `code` from a thrown HttpException. */
async function codeOfRejection(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (err) {
    if (err instanceof HttpException) {
      const res = err.getResponse() as { code?: string };
      return res.code;
    }
    return undefined;
  }
}

describe('AuthGuard', () => {
  it('allows @Public() routes without a session', async () => {
    const { guard, getSession, request } = setup({ isPublic: true });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('rejects requests without a session (401 UNAUTHENTICATED)', async () => {
    const { guard, getSession, request } = setup({});
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    getSession.mockResolvedValue(null);
    expect(await codeOfRejection(guard.canActivate(contextFor(request)))).toBe('UNAUTHENTICATED');
  });

  it('attaches the principal (userId, role, status) on a valid session', async () => {
    const { guard, getSession, request } = setup({});
    getSession.mockResolvedValue({
      session: { id: 's1' },
      user: { id: 'u1', role: 'CUSTOMER', status: 'ACTIVE' },
    });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.principal).toEqual({ userId: 'u1', role: 'CUSTOMER', status: 'ACTIVE' });
  });

  it('defaults role/status when absent on the session user', async () => {
    const { guard, getSession, request } = setup({});
    getSession.mockResolvedValue({ session: {}, user: { id: 'u2' } });
    await guard.canActivate(contextFor(request));
    expect(request.principal).toEqual({ userId: 'u2', role: 'CUSTOMER', status: 'ACTIVE' });
  });

  it('denies BLOCKED users (403 ACCOUNT_BLOCKED)', async () => {
    const { guard, getSession, request } = setup({});
    getSession.mockResolvedValue({ session: {}, user: { id: 'u3', status: 'BLOCKED' } });
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
    getSession.mockResolvedValue({ session: {}, user: { id: 'u3', status: 'BLOCKED' } });
    expect(await codeOfRejection(guard.canActivate(contextFor(request)))).toBe('ACCOUNT_BLOCKED');
  });

  it('rejects sessions older than the absolute maximum (401 SESSION_EXPIRED)', async () => {
    const { guard, getSession, request } = setup({ absoluteMaxMs: THIRTY_DAYS_MS });
    const createdAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days old
    getSession.mockResolvedValue({ session: { createdAt }, user: { id: 'u4', status: 'ACTIVE' } });
    expect(await codeOfRejection(guard.canActivate(contextFor(request)))).toBe('SESSION_EXPIRED');
  });

  it('allows sessions within the absolute maximum', async () => {
    const { guard, getSession, request } = setup({ absoluteMaxMs: THIRTY_DAYS_MS });
    const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days old
    getSession.mockResolvedValue({ session: { createdAt }, user: { id: 'u5', status: 'ACTIVE' } });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
  });

  it('enforces @Roles() (403 FORBIDDEN when role not permitted)', async () => {
    const { guard, getSession, request } = setup({ roles: ['ADMIN'] });
    getSession.mockResolvedValue({ session: {}, user: { id: 'u6', role: 'CUSTOMER' } });
    expect(await codeOfRejection(guard.canActivate(contextFor(request)))).toBe('FORBIDDEN');
  });

  it('permits @Roles() when the role matches', async () => {
    const { guard, getSession, request } = setup({ roles: ['ADMIN'] });
    getSession.mockResolvedValue({ session: {}, user: { id: 'u7', role: 'ADMIN' } });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
  });
});
