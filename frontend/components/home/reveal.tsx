'use client';

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
}

/**
 * Subtle fade-up on scroll into view (once). Under reduced-motion it renders the
 * children immediately with no transform. Children are server-rendered and
 * passed through, so wrapping does not add hydration cost of its own.
 */
function Reveal({ children, className, delay = 0 }: RevealProps): React.ReactElement {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export { Reveal };
