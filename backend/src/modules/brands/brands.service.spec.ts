import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import type { BrandsRepository } from './brands.repository';
import { BrandsService, slugify } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findBySlug: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  slugExists: ReturnType<typeof vi.fn>;
  countProducts: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
}

function makeService(): { service: BrandsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    exists: vi.fn(),
    slugExists: vi.fn().mockResolvedValue(false),
    countProducts: vi.fn().mockResolvedValue(0),
    update: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn(),
    listAndCount: vi.fn(),
  };
  return { service: new BrandsService(repo as unknown as BrandsRepository), repo };
}

const ID = '01920000-0000-7000-8000-0000000000aa';

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Another  Nike! ')).toBe('another-nike');
  });
});

describe('BrandsService', () => {
  it('derives a slug from the name and generates a UUID v7 id on create', async () => {
    const { service, repo } = makeService();
    await service.create({ name: 'Nike' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string; id: string };
    expect(arg.slug).toBe('nike');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('auto-suffixes a generated slug when the base is taken (nike → nike-2)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await service.create({ name: 'Nike' });
    const arg = repo.create.mock.calls[0]?.[0] as { slug: string };
    expect(arg.slug).toBe('nike-2');
  });

  it('rejects an explicit slug that is already taken (409 SLUG_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValue(true);
    await expect(service.create({ name: 'Nike', slug: 'nike' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('maps a P2002 unique violation to 409 SLUG_TAKEN (race backstop)', async () => {
    const { service, repo } = makeService();
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    await expect(service.create({ name: 'Nike' })).rejects.toMatchObject({
      response: { code: 'SLUG_TAKEN' },
    });
  });

  it('rejects an update slug taken by a different brand (409 SLUG_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    repo.findBySlug.mockResolvedValue({ id: 'other-id' });
    await expect(service.update(ID, { slug: 'nike' })).rejects.toBeInstanceOf(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates a brand', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    await service.update(ID, { description: 'Just do it' });
    expect(repo.update).toHaveBeenCalledWith(ID, { description: 'Just do it' });
  });

  it('blocks deleting a brand referenced by products (409 BRAND_IN_USE)', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    repo.countProducts.mockResolvedValue(3);
    await expect(service.remove(ID)).rejects.toMatchObject({ response: { code: 'BRAND_IN_USE' } });
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes an unreferenced brand', async () => {
    const { service, repo } = makeService();
    repo.exists.mockResolvedValue(true);
    repo.countProducts.mockResolvedValue(0);
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('not-a-uuid')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('returns a brand by slug', async () => {
    const { service, repo } = makeService();
    repo.findBySlug.mockResolvedValue({ id: ID, slug: 'nike' });
    await expect(service.getBySlug('nike')).resolves.toMatchObject({ slug: 'nike' });
  });
});

describe('CreateBrandDto', () => {
  it('rejects an invalid website URL', async () => {
    const dto = plainToInstance(CreateBrandDto, { name: 'Nike', website: 'not a url' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'website')).toBe(true);
  });

  it('accepts a valid website URL', async () => {
    const dto = plainToInstance(CreateBrandDto, { name: 'Nike', website: 'https://nike.com' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
