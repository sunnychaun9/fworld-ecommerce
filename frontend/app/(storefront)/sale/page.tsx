import type { Metadata } from 'next';
import { Percent } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

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
      <Section>
        <EmptyState
          icon={<Percent />}
          title="Sale coming soon"
          description="Reduced products will appear here once the catalog is built."
        />
      </Section>
    </>
  );
}
