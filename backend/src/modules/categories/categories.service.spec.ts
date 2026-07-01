import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../database/prisma.service';
import { CategoriesService, slugify } from './categories.service';

interface CategoryDelegate {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makeService(): { service: CategoriesService; category: CategoryDelegate } {
  const category: CategoryDelegate = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const prisma = {
    category,
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  } as unknown as PrismaService;
  return { service: new CategoriesService(prisma), category };
}

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Oversized  T-Shirts! ')).toBe('oversized-t-shirts');
  });
});

describe('CategoriesService', () => {
  it('derives a slug from the name and generates a UUID v7 id on create', async () => {
    const { service, category } = makeService();
    category.create.mockResolvedValue({ id: 'x', slug: 'shirts' });
    await service.create({ name: 'Shirts' });
    const arg = category.create.mock.calls[0]?.[0]?.data as { slug: string; id: string };
    expect(arg.slug).toBe('shirts');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('rejects a create whose parent does not exist (404)', async () => {
    const { service, category } = makeService();
    category.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Child', parentId: '00000000-0000-7000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a unique-slug violation to 409 SLUG_TAKEN', async () => {
    const { service, category } = makeService();
    category.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(service.create({ name: 'Shirts', slug: 'shirts' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
  });

  const ID = '01920000-0000-7000-8000-000000000001';

  it('rejects setting a category as its own parent (422 CATEGORY_CYCLE)', async () => {
    const { service, category } = makeService();
    category.findUnique.mockResolvedValue({ id: ID });
    await expect(service.update(ID, { parentId: ID })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('blocks deleting a category that has children (409 CATEGORY_NOT_EMPTY)', async () => {
    const { service, category } = makeService();
    category.findUnique.mockResolvedValue({ id: ID });
    category.count.mockResolvedValue(2);
    await expect(service.remove(ID)).rejects.toBeInstanceOf(ConflictException);
    expect(category.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, category } = makeService();
    await expect(service.getById('not-a-uuid')).rejects.toBeInstanceOf(NotFoundException);
    expect(category.findUnique).not.toHaveBeenCalled();
  });
});
