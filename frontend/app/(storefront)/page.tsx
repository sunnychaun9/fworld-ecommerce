import type { Metadata } from 'next';

import { BrandStory } from '@/components/home/brand-story';
import { CategoryGrid } from '@/components/home/category-grid';
import { Hero } from '@/components/home/hero';
import { HomeSections } from '@/components/home/home-sections';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/config/seo';

export const metadata: Metadata = buildMetadata({ path: '/' });

/**
 * Storefront homepage. Static sections (hero, categories, brand story,
 * newsletter) are Server Components; the data-driven middle (`HomeSections`)
 * is a client island that consumes `GET /store/home` via TanStack Query.
 */
export default function HomePage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <CategoryGrid />
      <HomeSections />
      <BrandStory />
      <NewsletterSection />
    </>
  );
}
