import type { Metadata } from 'next';
import { Shirt } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Women',
  description: 'Womenswear — refined silhouettes and modern staples from FWorld.',
  path: ROUTES.women,
});

export default function WomenPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Women"
        description="Refined silhouettes and modern staples for every day."
      />
      <Section>
        <EmptyState
          icon={<Shirt />}
          title="Catalog coming soon"
          description="Women's products will appear here once the catalog experience is built."
        />
      </Section>
    </>
  );
}
