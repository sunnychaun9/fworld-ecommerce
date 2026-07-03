import { AnnouncementBar, Footer, Header } from '@/components/layout';

/**
 * Storefront shell. Wraps every customer-facing route with the announcement bar,
 * sticky header, main landmark, and footer. Isolated in a route group so future
 * non-storefront surfaces (e.g. admin) can use a different shell without
 * duplicating this one.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
