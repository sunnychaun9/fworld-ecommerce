import type { Metadata } from 'next';
import { Search } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { ROUTES } from '@/constants/routes';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search FWorld products, collections and brands.',
  path: ROUTES.search,
  noIndex: true,
});

export default function SearchPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        eyebrow="Find"
        title="Search"
        description="Search products, collections and brands."
      />
      <Section>
        <EmptyState
          icon={<Search />}
          title="Start a search"
          description="Press ⌘K (Ctrl K on Windows) or tap the search icon in the header. Full search connects in a later phase."
        />
      </Section>
    </>
  );
}
