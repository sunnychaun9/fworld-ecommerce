import { Container } from '@/components/common/container';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { appConfig } from '@/config/app';

/**
 * Foundation landing surface. The storefront home page is built in a later
 * phase; this confirms the design system, theme and layout foundation are wired.
 */
export default function HomePage(): React.ReactElement {
  return (
    <Container className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 text-center">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
        {appConfig.name}
      </span>
      <h1 className="font-display text-foreground text-5xl font-medium tracking-tight sm:text-6xl">
        Premium Indian Fashion
      </h1>
      <p className="text-muted-foreground max-w-md text-balance text-sm leading-relaxed">
        The storefront foundation is ready — design system, theme, and layout are in place. Product
        experiences arrive in the next phases.
      </p>
      <ThemeToggle />
    </Container>
  );
}
