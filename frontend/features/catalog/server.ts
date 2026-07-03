import 'server-only';

import { cache } from 'react';

import { fetchBrandBySlug, fetchCollectionBySlug, fetchProductBySlug } from '@/services/catalog';

/** Request-deduplicated server fetchers (shared by generateMetadata + page). */
export const getProduct = cache(fetchProductBySlug);
export const getCollection = cache(fetchCollectionBySlug);
export const getBrand = cache(fetchBrandBySlug);
