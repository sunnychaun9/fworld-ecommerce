import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { AuthGuard } from './auth.guard';
import type { Auth } from './auth.factory';
import { IS_PUBLIC_KEY, ROLES_KEY, type RequestWithPrincipal } from './principal';

interface GuardSetup {
  guard: AuthGuard;
  getSession: ReturnType<typeof vi.fn>;
  request: RequestWithPrincipal;
}

function setup(meta: { isPublic?: boolean; roles?: string[] }): GuardSetup {
  const getSession = vi.fn();
  const auth = { api: { getSession } } as unknown as Auth;
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === IS_PUBLIC_KEY ? meta.isPublic : key === ROLES_KEY ? meta.roles : undefined,
    ),
  } as unknown as Reflector;
  const guard = new AuthGuard(auth, reflector);
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

describe('AuthGuard', () => {
  it('allows @Public() routes without a session', async () => {
    const { guard, getSession, request } = setup({ isPublic: true });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('rejects requests without a session (401)', async () => {
    const { guard, getSession, request } = setup({});
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
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

  it('enforces @Roles() (403 when role not permitted)', async () => {
    const { guard, getSession, request } = setup({ roles: ['ADMIN'] });
    getSession.mockResolvedValue({ session: {}, user: { id: 'u3', role: 'CUSTOMER' } });
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permits @Roles() when the role matches', async () => {
    const { guard, getSession, request } = setup({ roles: ['ADMIN'] });
    getSession.mockResolvedValue({ session: {}, user: { id: 'u4', role: 'ADMIN' } });
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
  });
});
