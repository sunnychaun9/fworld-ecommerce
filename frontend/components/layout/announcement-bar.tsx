'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'fworld:announce-dismissed';
const MESSAGE = 'Complimentary shipping over ₹2,000 — easy 7-day returns';

/**
 * Slim promotional bar above the header. Dismissible, with the choice persisted
 * to localStorage. Collapses with a subtle height/opacity transition (disabled
 * under reduced-motion).
 */
function AnnouncementBar({ className }: { className?: string }): React.ReactElement | null {
  const [dismissed, setDismissed] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, '1');
  }, []);

  return (
    <AnimatePresence initial={false}>
      {!dismissed ? (
        <motion.div
          key="announcement"
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={cn('bg-foreground text-background overflow-hidden', className)}
        >
          <Container className="relative flex h-9 items-center justify-center">
            <p className="text-center text-xs font-medium tracking-wide">{MESSAGE}</p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className="focus-visible:ring-background absolute right-4 inline-flex size-6 items-center justify-center rounded-sm opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2"
            >
              <X className="size-3.5" />
            </button>
          </Container>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { AnnouncementBar };
