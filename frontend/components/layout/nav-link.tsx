'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';

/** True when `href` matches the current path (section-aware for nested routes). */
export function useIsActiveRoute(href: string): boolean {
  const pathname = usePathname();
  const path = href.split('?')[0] ?? href;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  href: string;
}

/**
 * Header navigation link with an animated underline and active-route state.
 * The underline is a CSS transform (subtle, GPU-cheap, reduced-motion safe).
 */
function NavLink({ href, className, children, ...props }: NavLinkProps): React.ReactElement {
  const active = useIsActiveRoute(href);
  return (
    <Link
      href={href}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-muted-foreground hover:text-foreground data-[active=true]:text-foreground group relative inline-flex items-center py-1 text-sm font-medium transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className="bg-foreground pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 group-data-[active=true]:scale-x-100"
      />
    </Link>
  );
}

export { NavLink };
