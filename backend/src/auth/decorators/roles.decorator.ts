import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../principal';

/**
 * RBAC foundation: require the principal's role to be one of the given roles.
 * Enforced by AuthGuard when present. No permission matrix yet (Milestone 2.2).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
