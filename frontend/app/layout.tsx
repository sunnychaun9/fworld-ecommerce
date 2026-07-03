import type { Metadata, Viewport } from 'next';

import { SkipLink } from '@/components/common/skip-link';
import { defaultMetadata } from '@/config/seo';
import { AppProviders } from '@/providers';
import { fontVariables } from '@/styles/fonts';

import './globals.css';

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        <AppProviders>
          <SkipLink />
          <div className="flex min-h-dvh flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
