'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Loading } from '@/components/common/loading';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useSession } from '@/providers/session-provider';

import { AccountMobileNav } from './account-mobile-nav';
import { AccountSidebar } from './account-sidebar';

/**
 * Shell for every account page: a persistent sidebar on desktop and a bottom
 * nav on mobile. Guards the whole area — unauthenticated users are redirected
 * to sign-in with a return path (there is no server session to gate on).
 */
function AccountLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const session = useSession();
  const authenticated = useIsAuthenticated();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!session.isPending && !authenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [session.isPending, authenticated, pathname, router]);

  if (session.isPending) {
    return <Loading fullScreen label="Loading your account" />;
  }
  if (!authenticated) {
    return <Loading fullScreen label="Redirecting to sign in" />;
  }

  return (
    <>
      <Container className="py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AccountSidebar />
            </div>
          </aside>
          <div className="min-w-0 pb-24 lg:pb-0">{children}</div>
        </div>
      </Container>
      <AccountMobileNav />
    </>
  );
}

export { AccountLayout };
