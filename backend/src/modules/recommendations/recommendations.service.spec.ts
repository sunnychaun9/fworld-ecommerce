import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { RecommendationsRepository } from './recommendations.repository';
import { RecommendationsService } from './recommendations.service';

interface RepoMock {
  findProductBasic: ReturnType<typeof vi.fn>;
  byCategory: ReturnType<typeof vi.fn>;
  byBrand: ReturnType<typeof vi.fn>;
  byPriceRange: ReturnType<typeof vi.fn>;
  byCategories: ReturnType<typeof vi.fn>;
  featured: ReturnType<typeof vi.fn>;
  trending: ReturnType<typeof vi.fn>;
  newArrivals: ReturnType<typeof vi.fn>;
  bestSellers: ReturnType<typeof vi.fn>;
  userCategoryIds: ReturnType<typeof vi.fn>;
}

const PID = '01920000-0000-7000-8000-0000000000e1';

function card(id: string) {
  return { id };
}

function makeService(): { service: RecommendationsService; repo: RepoMock } {
  const repo: RepoMock = {
    findProductBasic: vi.fn().mockResolvedValue({
      id: PID,
      categoryId: 'cat1',
      brandId: 'brand1',
      sellingPrice: 1000,
      status: 'ACTIVE',
    }),
    byCategory: vi.fn().mockResolvedValue([]),
    byBrand: vi.fn().mockResolvedValue([]),
    byPriceRange: vi.fn().mockResolvedValue([]),
    byCategories: vi.fn().mockResolvedValue([]),
    featured: vi.fn().mockResolvedValue([]),
    trending: vi.fn().mockResolvedValue([]),
    newArrivals: vi.fn().mockResolvedValue([]),
    bestSellers: vi.fn().mockResolvedValue([]),
    userCategoryIds: vi.fn().mockResolvedValue([]),
  };
  return {
    service: new RecommendationsService(repo as unknown as RecommendationsRepository),
    repo,
  };
}

describe('RecommendationsService.forProduct', () => {
  it('returns 404 for a missing product', async () => {
    const { service, repo } = makeService();
    repo.findProductBasic.mockResolvedValue(null);
    await expect(service.forProduct(PID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prioritises same-category and skips fallbacks when full', async () => {
    const { service, repo } = makeService();
    repo.byCategory.mockResolvedValue(Array.from({ length: 12 }, (_v, i) => card(`c${i}`)));
    const result = await service.forProduct(PID);
    expect(result).toHaveLength(12);
    expect(repo.byBrand).not.toHaveBeenCalled();
    expect(repo.byPriceRange).not.toHaveBeenCalled();
    expect(repo.featured).not.toHaveBeenCalled();
  });

  it('falls back through brand, price band, then featured; dedupes and excludes self', async () => {
    const { service, repo } = makeService();
    repo.byCategory.mockResolvedValue([card('a')]);
    repo.byBrand.mockResolvedValue([card('a'), card('b')]); // 'a' deduped
    repo.byPriceRange.mockResolvedValue([card('c')]);
    repo.featured.mockResolvedValue([card('d')]);
    const result = await service.forProduct(PID);
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(repo.byBrand).toHaveBeenCalled();
    expect(repo.byPriceRange).toHaveBeenCalled();
    expect(repo.featured).toHaveBeenCalled();
  });
});

describe('RecommendationsService.home', () => {
  it('returns trending, new arrivals and best sellers', async () => {
    const { service, repo } = makeService();
    repo.trending.mockResolvedValue([card('t')]);
    repo.newArrivals.mockResolvedValue([card('n')]);
    repo.bestSellers.mockResolvedValue([card('b')]);
    const result = await service.home();
    expect(result.trending).toHaveLength(1);
    expect(result.newArrivals).toHaveLength(1);
    expect(result.bestSellers).toHaveLength(1);
  });
});

describe('RecommendationsService.forYou', () => {
  it('recommends from the user categories', async () => {
    const { service, repo } = makeService();
    repo.userCategoryIds.mockResolvedValue(['cat1']);
    repo.byCategories.mockResolvedValue([card('x')]);
    const result = await service.forYou('user-1');
    expect(repo.byCategories).toHaveBeenCalledWith(['cat1'], [], 12);
    expect(result.map((r) => r.id)).toContain('x');
  });

  it('falls back to new arrivals when the user has no category signals', async () => {
    const { service, repo } = makeService();
    repo.userCategoryIds.mockResolvedValue([]);
    repo.newArrivals.mockResolvedValue([card('n')]);
    const result = await service.forYou('user-1');
    expect(repo.byCategories).not.toHaveBeenCalled();
    expect(result.map((r) => r.id)).toContain('n');
  });
});
