import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { appConfig } from '@/config/app';
import { footerNav, policyNav } from '@/config/navigation';

import { Logo } from './logo';
import { NewsletterForm } from './newsletter-form';

const SOCIALS = [
  { label: 'Instagram', icon: Instagram },
  { label: 'Twitter', icon: Twitter },
  { label: 'Facebook', icon: Facebook },
  { label: 'YouTube', icon: Youtube },
] as const;

const PAYMENTS = ['Visa', 'Mastercard', 'Amex', 'UPI', 'Rupay'] as const;

/**
 * Premium responsive footer: brand + newsletter, navigation groups, social
 * placeholders, and a base row with copyright, policies and payment marks.
 * No network calls.
 */
function Footer(): React.ReactElement {
  return (
    <footer className="border-border bg-background mt-auto border-t">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Premium Indian fashion — considered design, made to last. Join the list for new
              arrivals and private events.
            </p>
            <NewsletterForm />
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7"
          >
            {footerNav.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  {group.title}
                </h2>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={`${group.title}-${item.label}`}>
                      <Link
                        href={item.href}
                        className="text-foreground/80 hover:text-foreground text-sm transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-border mt-14 flex flex-col gap-6 border-t pt-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <ul className="flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href="#"
                    aria-label={label}
                    className="border-border text-muted-foreground hover:border-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-full border transition-colors"
                  >
                    <Icon className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payments">
              {PAYMENTS.map((label) => (
                <li
                  key={label}
                  className="border-border text-muted-foreground rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} {appConfig.name}. All rights reserved.
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {policyNav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export { Footer };
