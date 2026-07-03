import type { Metadata } from 'next';

import { CartView } from '@/components/cart/cart-view';
import { Container } from '@/components/common/container';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your bag',
  description: 'Review the items in your shopping bag.',
  path: '/cart',
  noIndex: true,
});

export default function CartPage(): React.ReactElement {
  return (
    <>
      <PageHeader eyebrow="Bag" title="Your bag" />
      <section className="py-10 sm:py-14">
        <Container>
          <CartView />
        </Container>
      </section>
    </>
  );
}
