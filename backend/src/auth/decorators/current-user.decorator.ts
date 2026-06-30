import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import type { Principal, RequestWithPrincipal } from '../principal';

/**
 * Injects the authenticated `Principal` (set by AuthGuard) into a handler param.
 * Throws if used on a route that was not authenticated.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    if (!request.principal) {
      throw new UnauthorizedException('No authenticated principal on request');
    }
    return request.principal;
  },
);
