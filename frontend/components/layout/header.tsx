'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

import { CartButton } from './cart-button';
import { DesktopNav } from './desktop-nav';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';
import { ProfileMenu } from './profile-menu';
import { WishlistButton } from './wishlist-button';

// The search palette is interactive and rarely the first thing needed — load it
// on the client, outside the initial header bundle.
const SearchDialog = dynamic(() => import('./search-dialog').then((m) => m.SearchDialog));

const HIDE_THRESHOLD = 140;

/**
 * Sticky, scroll-aware application header.
 *
 * - Reveals on scroll-up, hides on scroll-down past a threshold (kept visible
 *   under reduced-motion).
 * - Gains a translucent blurred background + hairline border once scrolled.
 * - Responsive: mobile shows hamburger + logo + search + cart; desktop adds the
 *   full navigation, wishlist and account menu.
 */
function Header(): React.ReactElement {
  const [hidden, setHidden] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const lastY = React.useRef(0);

  React.useEffect(() => {
    function onScroll(): void {
      const y = window.scrollY;
      setScrolled(y > 4);
      if (!reduceMotion) {
        setHidden(y > lastY.current && y > HIDE_THRESHOLD);
      }
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduceMotion]);

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-md'
          : 'bg-background border-transparent',
      )}
    >
      <Container className="flex h-16 items-center gap-3">
        <div className="flex items-center gap-1 lg:gap-8">
          <MobileNav />
          <Logo />
          <DesktopNav />
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <SearchTrigger />
          <WishlistButton className="hidden sm:inline-flex" />
          <CartButton />
          <ProfileMenu className="hidden lg:inline-flex" />
        </div>
      </Container>

      <SearchDialog />
    </motion.header>
  );
}

/** Search entry point: an icon button on mobile, a labelled pill on desktop. */
function SearchTrigger(): React.ReactElement {
  const openSearch = useUiStore((s) => s.setSearchOpen);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => openSearch(true)}
        className="lg:hidden"
      >
        <Search className="size-5" />
      </Button>
      <button
        type="button"
        onClick={() => openSearch(true)}
        className="border-input text-muted-foreground hover:text-foreground focus-visible:ring-ring hidden items-center gap-2 rounded-md border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 lg:flex"
      >
        <Search className="size-4" />
        <span>Search</span>
        <kbd className="border-border bg-muted ml-6 inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
    </>
  );
}

export { Header };
