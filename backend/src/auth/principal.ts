import type { Request } from 'express';

/**
 * The authenticated principal extracted from a Better Auth session by AuthGuard.
 * RBAC foundation only — `role`/`status` are surfaced; no permission matrix yet.
 */
export interface Principal {
  userId: string;
  role: string;
  status: string;
}

/** Express request augmented with the resolved principal. */
export interface RequestWithPrincipal extends Request {
  principal?: Principal;
}

/** Metadata keys for the auth decorators. */
export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';
