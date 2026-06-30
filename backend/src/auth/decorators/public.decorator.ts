import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../principal';

/**
 * Marks a route (or controller) as public — AuthGuard skips authentication.
 * Deny-by-default: every route requires a session unless explicitly `@Public()`.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
