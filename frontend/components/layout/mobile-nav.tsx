'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { NavItem } from '@/config/navigation';
import { mainNav } from '@/config/navigation';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

import { Logo } from './logo';

/**
 * Mobile navigation drawer (below lg). A left Sheet with expandable sections,
 * a search entry point, and account/theme controls. Focus-trapping and ESC are
 * handled by the underlying dialog; navigation closes the drawer.
 */
function MobileNav({ className }: { className?: string }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const openSearch = useUiStore((s) => s.setSearchOpen);

  const close = React.useCallback(() => setOpen(false), []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className={cn('lg:hidden', className)}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(20rem,88vw)] gap-0 p-0">
        <SheetHeader className="border-border flex-row items-center justify-between border-b px-5 py-4">
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-4 py-4">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSearch(true);
              }}
              className="border-input text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2"
            >
              <Search className="size-4" />
              Search
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-col px-2">
            {mainNav.map((item) =>
              item.children && item.children.length > 0 ? (
                <MobileNavGroup key={item.label} item={item} onNavigate={close} />
              ) : (
                <MobileNavLink key={item.label} href={item.href} onNavigate={close}>
                  {item.label}
                </MobileNavLink>
              ),
            )}
          </nav>
        </div>

        <div className="border-border mt-auto flex items-center justify-between gap-3 border-t px-5 py-4">
          <div className="flex items-center gap-1">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="ghost" size="sm">
                Register
              </Button>
            </SheetClose>
          </div>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="text-foreground hover:bg-accent focus-visible:bg-accent rounded-md px-3 py-3 text-base font-medium outline-none transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavGroup({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = `mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
        className="text-foreground hover:bg-accent focus-visible:bg-accent flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-medium outline-none transition-colors"
      >
        {item.label}
        <ChevronDown
          className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={panelId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col py-1 pl-4">
              <Link
                href={item.href}
                onClick={onNavigate}
                className="text-muted-foreground hover:text-foreground focus-visible:text-foreground rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
              >
                All {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={`${item.label}-${child.label}`}
                  href={child.href}
                  onClick={onNavigate}
                  className="text-muted-foreground hover:text-foreground focus-visible:text-foreground rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export { MobileNav };
