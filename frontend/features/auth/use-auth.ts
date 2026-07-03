'use client';

import { useSession } from '@/providers/session-provider';

/** Whether a user session is currently active. */
export function useIsAuthenticated(): boolean {
  const session = useSession();
  return Boolean(session.data?.user);
}

/** The current session user, or null when signed out. */
export function useCurrentUser() {
  const session = useSession();
  return session.data?.user ?? null;
}
