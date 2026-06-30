import { Controller, Get, Inject } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';

import { BETTER_AUTH } from './auth.constants';
import type { Auth } from './auth.factory';
import { Public } from './decorators/public.decorator';

/**
 * Minimal verification endpoint (Milestone 2.1).
 *
 * `GET /api/v1/auth-status` proves the foundation is wired: the Better Auth
 * instance is constructed, the Prisma adapter is reachable (session lookup), and
 * cookie/session middleware is configured. It does **not** authenticate users —
 * with no session cookie it simply reports `authenticated: false`.
 *
 * Lives outside the `/api/v1/auth/*` namespace (owned by the Better Auth handler).
 */
@Controller('auth-status')
export class AuthStatusController {
  constructor(@Inject(BETTER_AUTH) private readonly auth: Auth) {}

  @Public()
  @Get()
  async status(
    @Req() req: Request,
  ): Promise<{ betterAuth: string; basePath: string; authenticated: boolean }> {
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return {
      betterAuth: 'mounted',
      basePath: '/api/v1/auth',
      authenticated: session !== null,
    };
  }
}
