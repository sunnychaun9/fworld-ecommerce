import type { Metadata } from 'next';
import * as React from 'react';

import { OrderSuccess } from '@/components/checkout/order-success';
import { Container } from '@/components/common/container';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Order confirmed',
  description: 'Your order has been placed.',
  path: '/order/success',
  noIndex: true,
});

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <OrderSuccess orderId={id} />
      </Container>
    </section>
  );
}
