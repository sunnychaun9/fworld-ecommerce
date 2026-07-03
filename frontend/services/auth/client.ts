import { createAuthClient } from 'better-auth/react';

import { appConfig } from '@/config/app';

/**
 * Better Auth browser client, pointed at the backend's auth mount
 * (`/api/v1/auth`). `credentials: 'include'` ensures the session cookie is sent
 * and stored on cross-origin requests (storefront → API). The server owns
 * session lifecycle and cookie refresh; this client exposes the flows and the
 * reactive session hook.
 */
export const authClient = createAuthClient({
  baseURL: appConfig.authUrl,
  fetchOptions: { credentials: 'include' },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = Session['user'];
