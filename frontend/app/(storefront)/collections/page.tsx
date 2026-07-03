import type { Metadata } from 'next';
import { LayoutGrid } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Collections',
  description: 'Curated FWorld collections and seasonal edits.',
  path: ROUTES.collections,
});

export default function CollectionsPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Collections"
        description="Curated edits, seasonal drops and new arrivals."
      />
      <Section>
        <EmptyState
          icon={<LayoutGrid />}
          title="Collections coming soon"
          description="Curated collections will appear here once merchandising is built."
        />
      </Section>
    </>
  );
}
