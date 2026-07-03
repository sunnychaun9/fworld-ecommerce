'use client';

import { LogOut, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Logo } from '@/components/layout/logo';
import { adminNav, isActiveAdminRoute } from '@/config/admin-nav';
import { ROUTES } from '@/constants/routes';
import { authClient } from '@/services/auth';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Admin navigation. Collapses to an icon rail on desktop; full on mobile drawer. */
function AdminSidebar({ collapsed = false, onNavigate }: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="bg-background flex h-full flex-col">
      <div
        className={cn(
          'border-border flex h-16 items-center border-b',
          collapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        {collapsed ? (
          <span className="text-foreground text-lg font-semibold">F</span>
        ) : (
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-muted-foreground border-border rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              Admin
            </span>
          </div>
        )}
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {adminNav.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label && !collapsed ? (
              <p className="text-muted-foreground mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.15em]">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActiveAdminRoute(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'focus-visible:ring-ring flex items-center gap-3 rounded-md px-2 py-2 text-sm outline-none transition-colors focus-visible:ring-2',
                        collapsed && 'justify-center',
                        active
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-border space-y-1 border-t p-3">
        <Link
          href={ROUTES.home}
          onClick={onNavigate}
          title={collapsed ? 'View store' : undefined}
          className={cn(
            'text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <Store className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed ? 'View store' : null}
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'text-muted-foreground hover:text-foreground flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed ? 'Sign out' : null}
        </button>
      </div>
    </div>
  );
}

export { AdminSidebar };
