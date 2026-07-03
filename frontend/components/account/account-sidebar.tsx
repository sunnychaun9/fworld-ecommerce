'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { accountNav, isActiveAccountRoute } from '@/config/account-nav';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useUnreadCount } from '@/features/notifications/use-notifications';
import { authClient } from '@/services/auth';
import { cn } from '@/lib/utils';

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '';
  if (!source) return 'U';
  const parts = source.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase() || source.charAt(0).toUpperCase();
}

/** Persistent account navigation for desktop (hidden below lg). */
function AccountSidebar(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const unread = useUnreadCount();

  async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
        >
          {initials(user?.name, user?.email)}
        </span>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-medium">
            {user?.name ?? 'Your account'}
          </p>
          {user?.email ? (
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {accountNav.map((item) => {
          const active = isActiveAccountRoute(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-visible:ring-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2',
                  active
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge === 'notifications' && unread > 0 ? (
                  <Badge variant="brand" className="h-5 min-w-5 justify-center px-1 tabular-nums">
                    {unread > 99 ? '99+' : unread}
                  </Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground justify-start px-3"
        onClick={() => void signOut()}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </nav>
  );
}

export { AccountSidebar };
