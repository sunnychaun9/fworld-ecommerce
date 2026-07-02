import { describe, expect, it, vi } from 'vitest';

import { ProductSearchProvider } from './product-search.provider';
import { SearchService } from './search.service';

function makeService() {
  const provider: ProductSearchProvider = {
    search: vi.fn().mockResolvedValue({
      items: [{ id: 'p1' }],
      total: 45,
      facets: { brands: [], categories: [] },
    }),
  };
  return { service: new SearchService(provider), provider };
}

describe('SearchService', () => {
  it('normalizes booleans and paginates', async () => {
    const { service, provider } = makeService();
    const result = await service.search({
      q: '  shirt  ',
      featured: 'true',
      newArrival: 'false',
      page: 2,
      limit: 20,
    });

    const query = (provider.search as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(query).toMatchObject({
      q: 'shirt',
      featured: true,
      newArrival: false,
      page: 2,
      limit: 20,
    });
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
    expect(result.items).toHaveLength(1);
    expect(result.facets).toEqual({ brands: [], categories: [] });
  });

  it('treats an empty query string as no keyword', async () => {
    const { service, provider } = makeService();
    await service.search({ q: '   ' });
    const query = (provider.search as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(query.q).toBeUndefined();
  });
});
