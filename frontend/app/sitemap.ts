import type { MetadataRoute } from 'next';

import { appConfig } from '@/config/app';

/**
 * Sitemap foundation. Static routes only for now; catalog/collection URLs are
 * appended as those routes are built.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appConfig.url,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
