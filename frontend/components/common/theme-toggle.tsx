'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useMounted } from '@/hooks/use-mounted';

/**
 * Light/dark toggle. Renders a stable placeholder until mounted to avoid a
 * hydration mismatch (the resolved theme is unknown on the server).
 */
function ThemeToggle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick'>): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Toggle theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      {...props}
    >
      {mounted && isDark ? <Moon /> : <Sun />}
    </Button>
  );
}

export { ThemeToggle };
