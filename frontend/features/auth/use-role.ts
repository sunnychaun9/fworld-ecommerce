'use client';

import { useCurrentUser } from './use-auth';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

const ADMIN_ROLES = new Set<string>(['ADMIN', 'SUPER_ADMIN']);

/**
 * The current user's role. Better Auth sends `role` on the session user, but the
 * browser client doesn't infer additional fields into the type — so read it via
 * a narrow cast rather than widening the shared `SessionUser`.
 */
export function useUserRole(): string | undefined {
  const user = useCurrentUser();
  return (user as { role?: string } | null)?.role;
}

/** Whether the current user is an admin (ADMIN or SUPER_ADMIN). */
export function useIsAdmin(): boolean {
  const role = useUserRole();
  return role !== undefined && ADMIN_ROLES.has(role);
}
