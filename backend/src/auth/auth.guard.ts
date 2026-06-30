import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';

import { BETTER_AUTH } from './auth.constants';
import type { Auth } from './auth.factory';
import { IS_PUBLIC_KEY, ROLES_KEY, type Principal, type RequestWithPrincipal } from './principal';

/**
 * Global authentication guard (deny-by-default).
 *
 * - `@Public()` routes bypass authentication entirely.
 * - Otherwise the Better Auth session is resolved from the request cookies; on
 *   failure a `401` is thrown.
 * - On success the `Principal` (userId, role, status) is attached to the request.
 * - RBAC foundation: if `@Roles()` is present, the principal's role must match
 *   (a `403` otherwise). No permission matrix yet.
 *
 * Authentication logic is **not** duplicated — session validation is delegated to
 * Better Auth's `getSession` API.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(BETTER_AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
  ) {}

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
      throw new UnauthorizedException('Authentication required');
    }

    const user = result.user as unknown as { id: string; role?: string; status?: string };
    const principal: Principal = {
      userId: user.id,
      role: user.role ?? 'CUSTOMER',
      status: user.status ?? 'ACTIVE',
    };
    request.principal = principal;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(principal.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
