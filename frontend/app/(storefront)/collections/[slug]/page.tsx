import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ClientProductListing } from '@/components/catalog/client-product-listing';
import { Container } from '@/components/common/container';
import { PageHeader } from '@/components/layout/page-header';
import { buildMetadata } from '@/config/seo';
import { getCollection } from '@/features/catalog/server';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) return buildMetadata({ title: 'Collection', path: `/collections/${slug}` });
  return buildMetadata({
    title: data.collection.name,
    description: data.collection.seoDescription ?? data.collection.description ?? undefined,
    path: `/collections/${slug}`,
  });
}

export default async function CollectionPage({ params }: Params): Promise<React.ReactElement> {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title={data.collection.name}
        description={data.collection.description ?? undefined}
      />
      <section className="py-10 sm:py-14">
        <Container>
          <ClientProductListing products={data.products} />
        </Container>
      </section>
    </>
  );
}
