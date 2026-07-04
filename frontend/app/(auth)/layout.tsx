import { Logo } from '@/components/layout/logo';

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
      {/* Logo already links home — don't wrap it in another anchor. */}
      <Logo className="mb-10" />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
