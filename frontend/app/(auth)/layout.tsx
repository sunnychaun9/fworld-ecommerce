import Link from 'next/link';

import { Logo } from '@/components/layout/logo';
import { ROUTES } from '@/constants/routes';

/** Minimal centered layout for authentication pages (no storefront shell). */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      <Link href={ROUTES.home} className="mb-10">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
