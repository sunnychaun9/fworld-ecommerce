import type { Metadata } from 'next';
import * as React from 'react';

import { PaymentFailed } from '@/components/checkout/payment-failed';
import { Container } from '@/components/common/container';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Payment unsuccessful',
  description: 'Your payment could not be completed.',
  path: '/order/payment-failed',
  noIndex: true,
});

export default function PaymentFailedPage(): React.ReactElement {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <React.Suspense fallback={null}>
          <PaymentFailed />
        </React.Suspense>
      </Container>
    </section>
  );
}
