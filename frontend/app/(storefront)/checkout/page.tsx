import type { Metadata } from 'next';
import * as React from 'react';

import { CheckoutView } from '@/components/checkout/checkout-view';
import { Container } from '@/components/common/container';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Checkout',
  description: 'Complete your purchase.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage(): React.ReactElement {
  return (
    <>
      <PageHeader eyebrow="Checkout" title="Checkout" />
      <section className="py-10 sm:py-14">
        <Container>
          <CheckoutView />
        </Container>
      </section>
    </>
  );
}
