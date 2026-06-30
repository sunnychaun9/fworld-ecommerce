import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from './decorators/current-user.decorator';
import type { Principal } from './principal';

/**
 * Authenticated "who am I" endpoint (Milestone 2.2).
 *
 * `GET /api/v1/me` — protected by the global AuthGuard; returns the current
 * principal (userId, role, status) from the Better Auth session.
 *
 * Note: it is **not** mounted under `/api/v1/auth/*` because that namespace is
 * owned by the Better Auth handler (Q1). Better Auth's raw session endpoint
 * remains `GET /api/v1/auth/get-session`. (See deliverable note for review.)
 */
@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() principal: Principal): Principal {
    return principal;
  }
}
