import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { CategoriesRepository } from './categories.repository';
import { CategoriesService, slugify } from './categories.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findBySlug: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  slugExists: ReturnType<typeof vi.fn>;
  getParentId: ReturnType<typeof vi.fn>;
  countChildren: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
}

function makeService(): { service: CategoriesService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    exists: vi.fn(),
    slugExists: vi.fn().mockResolvedValue(false),
    getParentId: vi.fn(),
    countChildren: vi.fn(),
    update: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn(),
    listAndCount: vi.fn(),
  };
  return { service: new CategoriesService(repo as unknown as CategoriesRepository), repo };
}

const ID = '01920000-0000-7000-8000-000000000001';
const PARENT = '01920000-0000-7000-8000-000000000002';

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Oversized  T-Shirts! ')).toBe('oversized-t-shirts');
  });
});

describe('CategoriesService', () => {
  it('derives a slug from the name and generates a UUID v7 id on create', async () => {
    const { service, repo } = makeService();
    await service.create({ name: 'Shirts' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string; id: string };
    expect(arg.slug).toBe('shirts');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('auto-suffixes a generated slug when the base is taken (shirts → shirts-2)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await service.create({ name: 'Shirts' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string };
    expect(arg.slug).toBe('shirts-2');
  });

  it('rejects an explicit slug that is already taken (409 SLUG_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValue(true);
    await expect(service.create({ name: 'Shirts', slug: 'shirts' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a create whose parent does not exist (404)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(false);
    await expect(service.create({ name: 'Child', parentId: PARENT })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps a P2002 unique violation to 409 SLUG_TAKEN (race backstop)', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(service.create({ name: 'Shirts' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
  });

  it('rejects setting a category as its own parent (422 CATEGORY_CYCLE)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    await expect(service.update(ID, { parentId: ID })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('rejects a re-parent onto a descendant (422 CATEGORY_CYCLE)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    // Walk ancestors of the proposed parent: PARENT → ID (the node being moved).
    repo.getParentId.mockResolvedValueOnce(ID);
    await expect(service.update(ID, { parentId: PARENT })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('blocks deleting a category that has children (409 CATEGORY_NOT_EMPTY)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    repo.countChildren.mockResolvedValue(2);
    await expect(service.remove(ID)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes a leaf category', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    repo.countChildren.mockResolvedValue(0);
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('not-a-uuid')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('returns a category by slug', async () => {
    const { service, repo } = makeService();
    repo.findBySlug.mockResolvedValue({ id: ID, slug: 'shirts' });
    await expect(service.getBySlug('shirts')).resolves.toMatchObject({ slug: 'shirts' });
  });
});
