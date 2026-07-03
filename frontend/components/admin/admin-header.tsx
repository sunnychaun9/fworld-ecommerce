'use client';

import { Bell, Menu, PanelLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems } from '@/config/admin-nav';
import { ROUTES } from '@/constants/routes';
import { useUnreadCount } from '@/features/notifications/use-notifications';

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = '';
  parts.forEach((part, index) => {
    href += `/${part}`;
    let label: string;
    if (index === 0) {
      label = 'Admin';
    } else if (part === 'new') {
      label = 'New';
    } else {
      const match = adminNavItems.find((item) => item.href === href);
      label = match ? match.label : `${part.slice(0, 8).toUpperCase()}`;
    }
    crumbs.push({ label, href });
  });
  return crumbs;
}

interface AdminHeaderProps {
  onMenu: () => void;
  onToggleCollapse: () => void;
}

function AdminHeader({ onMenu, onToggleCollapse }: AdminHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadCount();
  const [query, setQuery] = React.useState('');
  const crumbs = buildCrumbs(pathname);

  function onSearch(e: React.FormEvent): void {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`${ROUTES.adminProducts}?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={onMenu}
        className="lg:hidden"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={onToggleCollapse}
        className="hidden lg:inline-flex"
      >
        <PanelLeft className="size-5" />
      </Button>

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {last ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {last ? null : <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <form onSubmit={onSearch} className="hidden md:block">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-9 w-48 pl-8 lg:w-64"
            />
          </div>
        </form>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
          asChild
        >
          <Link href={ROUTES.accountNotifications} className="relative">
            <Bell className="size-5" />
            {unread > 0 ? (
              <span className="bg-brand absolute right-1.5 top-1.5 size-2 rounded-full" />
            ) : null}
          </Link>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}

export { AdminHeader };
