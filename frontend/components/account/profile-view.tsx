'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/use-auth';
import { authClient } from '@/services/auth';

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '';
  if (!source) return 'U';
  const parts = source.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase() || source.charAt(0).toUpperCase();
}

/** Profile overview: user identity, session and sign-out. Editing is not yet
 * supported by the backend, so it is surfaced as a clearly-labelled placeholder. */
function ProfileView(): React.ReactElement {
  const user = useCurrentUser();
  const router = useRouter();

  if (!user) {
    return <Loading label="Loading profile" />;
  }

  async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="border-border rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="bg-muted text-foreground flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-medium"
          >
            {initials(user.name, user.email)}
          </span>
          <div className="min-w-0">
            <p className="text-foreground text-lg font-medium">{user.name ?? 'Your account'}</p>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          </div>
        </div>

        <dl className="border-border mt-6 space-y-3 border-t pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-foreground font-medium">{user.name ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-foreground font-medium">{user.email}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <Button variant="outline" onClick={() => toast('Profile editing is coming soon.')}>
            Edit profile
          </Button>
        </div>
      </section>

      <section className="border-border rounded-lg border p-6">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Session
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          You&apos;re currently signed in on this device. Sign out to end the session.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </section>
    </div>
  );
}

export { ProfileView };
