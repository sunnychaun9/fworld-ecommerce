'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { accountMobileNav, isActiveAccountRoute } from '@/config/account-nav';
import { useUnreadCount } from '@/features/notifications/use-notifications';
import { cn } from '@/lib/utils';

/** Fixed bottom navigation for the account area on mobile (hidden at lg+). */
function AccountMobileNav(): React.ReactElement {
  const pathname = usePathname();
  const unread = useUnreadCount();

  return (
    <nav
      aria-label="Account"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {accountMobileNav.map((item) => {
          const active = isActiveAccountRoute(pathname, item);
          const Icon = item.icon;
          const showBadge = item.badge === 'notifications' && unread > 0;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {showBadge ? (
                    <span
                      aria-hidden="true"
                      className="bg-brand absolute -right-1.5 -top-1 size-2 rounded-full"
                    />
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { AccountMobileNav };
