import type { Metadata } from 'next';
import { Store } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Brands',
  description: 'Discover the brands and labels available at FWorld.',
  path: ROUTES.brands,
});

export default function BrandsPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Brands"
        description="The labels and makers we carry, in one place."
      />
      <Section>
        <EmptyState
          icon={<Store />}
          title="Brands coming soon"
          description="Brand directory will appear here once the catalog is built."
        />
      </Section>
    </>
  );
}
