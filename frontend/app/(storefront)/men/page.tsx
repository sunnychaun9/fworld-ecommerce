import type { Metadata } from 'next';
import { Shirt } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Men',
  description: 'Menswear — considered essentials and seasonal edits from FWorld.',
  path: ROUTES.men,
});

export default function MenPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Men"
        description="Considered essentials and seasonal edits, built to last."
      />
      <Section>
        <EmptyState
          icon={<Shirt />}
          title="Catalog coming soon"
          description="Men's products will appear here once the catalog experience is built."
        />
      </Section>
    </>
  );
}
