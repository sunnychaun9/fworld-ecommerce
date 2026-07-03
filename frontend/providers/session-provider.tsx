'use client';

import { createContext, useContext } from 'react';

import { useSession as useAuthSession } from '@/services/auth';

type SessionState = ReturnType<typeof useAuthSession>;

const SessionContext = createContext<SessionState | null>(null);

/**
 * Exposes the reactive Better Auth session (data / loading / error) to the whole
 * client tree through a single subscription, so components read session state
 * without each opening their own.
 */
export function SessionProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const session = useAuthSession();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** Read the current session state. Must be used within {@link SessionProvider}. */
export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
