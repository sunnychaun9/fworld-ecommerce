import { Inject, Injectable } from '@nestjs/common';

import { SearchProductsDto } from './dto/search-products.dto';
import {
  PRODUCT_SEARCH_PROVIDER,
  ProductSearchProvider,
  ProductSearchQuery,
} from './product-search.provider';

/**
 * Product search service. Normalizes the request into a provider-agnostic query,
 * delegates to the bound {@link ProductSearchProvider}, and shapes the standard
 * `{ items, pagination, facets }` response. No Prisma access here.
 */
@Injectable()
export class SearchService {
  constructor(@Inject(PRODUCT_SEARCH_PROVIDER) private readonly provider: ProductSearchProvider) {}

  async search(dto: SearchProductsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const query: ProductSearchQuery = {
      q: dto.q?.trim() || undefined,
      category: dto.category,
      brand: dto.brand,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      size: dto.size,
      color: dto.color,
      fit: dto.fit,
      fabric: dto.fabric,
      featured: this.toBool(dto.featured),
      bestSeller: this.toBool(dto.bestSeller),
      newArrival: this.toBool(dto.newArrival),
      page,
      limit,
      sort: dto.sort ?? 'relevance',
    };

    const result = await this.provider.search(query);
    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      facets: result.facets,
    };
  }

  private toBool(value?: string): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }
}
