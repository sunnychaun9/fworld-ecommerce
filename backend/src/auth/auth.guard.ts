import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';

import { BETTER_AUTH } from './auth.constants';
import type { Auth } from './auth.factory';
import { IS_PUBLIC_KEY, ROLES_KEY, type Principal, type RequestWithPrincipal } from './principal';

const DEFAULT_ABSOLUTE_MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Global authentication guard (deny-by-default).
 *
 * - `@Public()` routes bypass authentication entirely.
 * - The Better Auth session is resolved from the request cookies; on failure a
 *   `401 UNAUTHENTICATED` is thrown.
 * - **Absolute session lifetime** is enforced (on top of Better Auth's sliding
 *   expiry): sessions older than the configured maximum are rejected
 *   (`401 SESSION_EXPIRED`).
 * - **Blocked users** are denied (`403 ACCOUNT_BLOCKED`).
 * - On success the `Principal` (userId, role, status) is attached to the request.
 * - RBAC foundation: if `@Roles()` is present, the principal's role must match
 *   (`403 FORBIDDEN`). No permission matrix yet.
 *
 * Errors are thrown with stable machine-readable codes (API D4).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly absoluteMaxMs: number;

  constructor(
    @Inject(BETTER_AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.absoluteMaxMs =
      config.get<number>('auth.session.absoluteMaxMs') ?? DEFAULT_ABSOLUTE_MAX_MS;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    const result = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!result) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      });
    }

    // Absolute session-lifetime enforcement (M6).
    const session = result.session as unknown as { createdAt?: Date | string };
    if (session.createdAt) {
      const createdAtMs = new Date(session.createdAt).getTime();
      if (Number.isFinite(createdAtMs) && Date.now() - createdAtMs > this.absoluteMaxMs) {
        throw new UnauthorizedException({
          code: 'SESSION_EXPIRED',
          message: 'Session has reached its maximum lifetime',
        });
      }
    }

    const user = result.user as unknown as { id: string; role?: string; status?: string };
    const principal: Principal = {
      userId: user.id,
      role: user.role ?? 'CUSTOMER',
      status: user.status ?? 'ACTIVE',
    };

    // Blocked-user enforcement (M3).
    if (principal.status === 'BLOCKED') {
      throw new ForbiddenException({ code: 'ACCOUNT_BLOCKED', message: 'Account is blocked' });
    }

    request.principal = principal;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(principal.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient role' });
    }

    return true;
  }
}
