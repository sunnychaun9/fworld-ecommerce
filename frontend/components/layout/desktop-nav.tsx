'use client';

import Link from 'next/link';
import * as React from 'react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { mainNav } from '@/config/navigation';
import { cn } from '@/lib/utils';

import { useIsActiveRoute } from './nav-link';

/**
 * Desktop primary navigation (lg+). Built on the accessible Radix
 * NavigationMenu: items with children open a keyboard-navigable mega panel;
 * flat items render as active-aware links.
 */
function DesktopNav({ className }: { className?: string }): React.ReactElement {
  return (
    <NavigationMenu className={cn('hidden lg:flex', className)}>
      <NavigationMenuList>
        {mainNav.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[30rem] grid-cols-2 gap-2 p-2">
                  <NavigationMenuLink asChild className="bg-muted/50 col-span-2 p-4">
                    <Link href={item.href}>
                      <span className="font-display text-foreground text-base font-medium">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </NavigationMenuLink>
                  {item.children.map((child) => (
                    <NavigationMenuLink asChild key={`${item.label}-${child.label}`}>
                      <Link href={child.href}>{child.label}</Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <FlatNavItem key={item.label} href={item.href} label={item.label} />
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function FlatNavItem({ href, label }: { href: string; label: string }): React.ReactElement {
  const active = useIsActiveRoute(href);
  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        asChild
        active={active}
        className={cn(
          navigationMenuTriggerStyle(),
          'text-muted-foreground data-[active=true]:text-foreground',
        )}
      >
        <Link href={href}>{label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

export { DesktopNav };
