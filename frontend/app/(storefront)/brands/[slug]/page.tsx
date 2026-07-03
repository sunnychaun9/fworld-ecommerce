import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ServerProductListing } from '@/components/catalog/server-product-listing';
import { Container } from '@/components/common/container';
import { Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { getBrand } from '@/features/catalog/server';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug).catch(() => null);
  if (!brand) return buildMetadata({ title: 'Brand', path: `/brands/${slug}` });
  return buildMetadata({
    title: brand.name,
    description: brand.seoDescription ?? brand.description ?? `Shop ${brand.name} at FWorld.`,
    path: `/brands/${slug}`,
  });
}

export default async function BrandPage({ params }: Params): Promise<React.ReactElement> {
  const { slug } = await params;
  const brand = await getBrand(slug).catch(() => null);
  if (!brand) notFound();

  return (
    <>
      <PageHeader eyebrow="Brand" title={brand.name} description={brand.description ?? undefined} />
      <section className="py-10 sm:py-14">
        <Container>
          <Suspense fallback={<Loading />}>
            <ServerProductListing brandSlug={slug} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
