import type { Metadata } from 'next';

import { SaleListing } from '@/components/catalog/sale-listing';
import { Container } from '@/components/common/container';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = buildMetadata({
  title: 'Sale',
  description: 'Reduced FWorld essentials and seasonal markdowns.',
  path: ROUTES.sale,
});

export default function SalePage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Limited"
        title="Sale"
        description="Seasonal markdowns on selected essentials."
      />
      <section className="py-10 sm:py-14">
        <Container>
          <SaleListing />
        </Container>
      </section>
    </>
  );
}
