import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findEntry: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listByProduct: ReturnType<typeof vi.fn>;
  listByUser: ReturnType<typeof vi.fn>;
  aggregate: ReturnType<typeof vi.fn>;
  hasPurchased: ReturnType<typeof vi.fn>;
}

const USER = 'user-1';
const PID = '01920000-0000-7000-8000-0000000000c1';
const RID = '01920000-0000-7000-8000-0000000000c2';

function makeService(): { service: ReviewsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: RID }),
    findById: vi.fn().mockResolvedValue({ id: RID, userId: USER }),
    findEntry: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({ id: RID }),
    delete: vi.fn(),
    listByProduct: vi.fn().mockResolvedValue([]),
    listByUser: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({ averageRating: 4.5, totalReviews: 2 }),
    hasPurchased: vi.fn().mockResolvedValue(true),
  };
  return { service: new ReviewsService(repo as unknown as ReviewsRepository), repo };
}

describe('ReviewsService', () => {
  it('creates a review for a purchased product', async () => {
    const { service, repo } = makeService();
    await service.create(USER, { productId: PID, rating: 5 });
    expect(repo.create).toHaveBeenCalled();
  });

  it('rejects reviewing an unpurchased product (422 PURCHASE_REQUIRED)', async () => {
    const { service, repo } = makeService();
    repo.hasPurchased.mockResolvedValue(false);
    await expect(service.create(USER, { productId: PID, rating: 5 })).rejects.toMatchObject({
      response: { code: 'PURCHASE_REQUIRED' },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a second review for the same product (409 ALREADY_REVIEWED)', async () => {
    const { service, repo } = makeService();
    repo.findEntry.mockResolvedValue({ id: 'existing' });
    await expect(service.create(USER, { productId: PID, rating: 4 })).rejects.toMatchObject({
      response: { code: 'ALREADY_REVIEWED' },
    });
  });

  it('maps a P2002 race to 409 ALREADY_REVIEWED', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(service.create(USER, { productId: PID, rating: 4 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects updating a review owned by another user (404)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(null);
    await expect(service.update(USER, RID, { rating: 3 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an owned review', async () => {
    const { service, repo } = makeService();
    await service.remove(USER, RID);
    expect(repo.delete).toHaveBeenCalledWith(RID);
  });

  it('returns aggregates with the product reviews', async () => {
    const { service, repo } = makeService();
    repo.listByProduct.mockResolvedValue([{ id: RID, rating: 5 }]);
    const result = await service.listByProduct(PID);
    expect(result).toMatchObject({ averageRating: 4.5, totalReviews: 2 });
    expect(result.reviews).toHaveLength(1);
  });

  it('returns 404 for a non-UUID review id', async () => {
    const { service, repo } = makeService();
    await expect(service.remove(USER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('CreateReviewDto', () => {
  it('rejects a rating outside 1–5', async () => {
    const dto = plainToInstance(CreateReviewDto, { productId: PID, rating: 6 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'rating')).toBe(true);
  });

  it('accepts a valid rating', async () => {
    const dto = plainToInstance(CreateReviewDto, { productId: PID, rating: 3 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
