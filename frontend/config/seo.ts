import type { Metadata } from 'next';

import { appConfig } from './app';

/** Baseline SEO facts reused across metadata, Open Graph and JSON-LD. */
export const seoConfig = {
  name: appConfig.name,
  titleDefault: `${appConfig.name} — Premium Indian Fashion`,
  titleTemplate: `%s · ${appConfig.name}`,
  description:
    'FWorld is a premium Indian menswear label — considered, minimal, and built to last. Discover elevated essentials and seasonal collections.',
  url: appConfig.url,
  locale: 'en_IN',
  twitterHandle: '@fworld',
  ogImage: {
    url: `${appConfig.url}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${appConfig.name} — Premium Indian Fashion`,
  },
} as const;

/**
 * The root/default metadata. Route segments call {@link buildMetadata} to
 * override title/description/canonical while inheriting these defaults.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(seoConfig.url),
  title: {
    default: seoConfig.titleDefault,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.description,
  applicationName: seoConfig.name,
  authors: [{ name: seoConfig.name }],
  creator: seoConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    siteName: seoConfig.name,
    title: seoConfig.titleDefault,
    description: seoConfig.description,
    url: seoConfig.url,
    locale: seoConfig.locale,
    images: [seoConfig.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: seoConfig.titleDefault,
    description: seoConfig.description,
    site: seoConfig.twitterHandle,
    images: [seoConfig.ogImage.url],
  },
  alternates: { canonical: '/' },
};

/** Per-page metadata overrides, merged onto the site defaults. */
export interface PageSeo {
  title?: string;
  description?: string;
  /** Path relative to the site origin, e.g. `/collections/aw25`. */
  path?: string;
  images?: string[];
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  images,
  noIndex,
}: PageSeo = {}): Metadata {
  const canonical = path ?? '/';
  const desc = description ?? seoConfig.description;
  return {
    title,
    description: desc,
    alternates: { canonical },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: title ?? seoConfig.titleDefault,
      description: desc,
      url: canonical,
      ...(images ? { images } : {}),
    },
    twitter: {
      title: title ?? seoConfig.titleDefault,
      description: desc,
      ...(images ? { images } : {}),
    },
  };
}

/** Organization JSON-LD — foundation for richer structured data per page. */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: seoConfig.name,
  url: seoConfig.url,
  description: seoConfig.description,
} as const;
