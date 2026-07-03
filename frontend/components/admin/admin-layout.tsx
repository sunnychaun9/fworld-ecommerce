'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Loading } from '@/components/common/loading';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useIsAdmin } from '@/features/auth/use-role';
import { useSession } from '@/providers/session-provider';
import { cn } from '@/lib/utils';

import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

/**
 * Admin shell. Guards the area for ADMIN/SUPER_ADMIN only — signed-out users go
 * to sign-in, non-admins are redirected to the homepage. Collapsible sidebar on
 * desktop, drawer on mobile.
 */
function AdminLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const session = useSession();
  const authenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (session.isPending) return;
    if (!authenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!isAdmin) {
      router.replace('/');
    }
  }, [session.isPending, authenticated, isAdmin, pathname, router]);

  if (session.isPending) {
    return <Loading fullScreen label="Loading admin" />;
  }
  if (!authenticated || !isAdmin) {
    return <Loading fullScreen label="Redirecting" />;
  }

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          'border-border hidden shrink-0 border-r transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="sticky top-0 h-dvh">
          <AdminSidebar collapsed={collapsed} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin menu</SheetTitle>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onMenu={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main className="bg-muted/20 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export { AdminLayout };
