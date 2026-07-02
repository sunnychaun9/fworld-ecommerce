import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CreateImageDto } from './dto/create-image.dto';
import type { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByProduct: ReturnType<typeof vi.fn>;
  productExists: ReturnType<typeof vi.fn>;
  getVariantProductId: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makeService(): { service: MediaService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    findById: vi.fn(),
    findByProduct: vi.fn(),
    productExists: vi.fn().mockResolvedValue(true),
    getVariantProductId: vi.fn().mockResolvedValue(PID),
    update: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn(),
  };
  return { service: new MediaService(repo as unknown as MediaRepository), repo };
}

const PID = '01920000-0000-7000-8000-00000000a001';
const OTHER_PID = '01920000-0000-7000-8000-00000000a002';
const VID = '01920000-0000-7000-8000-00000000b001';
const ID = '01920000-0000-7000-8000-00000000c001';
const URL = 'https://cdn.example.com/a.jpg';

describe('MediaService', () => {
  it('creates an image with a UUID v7 id and default sortOrder 0', async () => {
    const { service, repo } = makeService();
    await service.create({ productId: PID, url: URL });
    const arg = repo.create.mock.calls[0]?.[0] as { id: string; sortOrder: number };
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
    expect(arg.sortOrder).toBe(0);
  });

  it('rejects an image for a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.productExists.mockResolvedValue(false);
    await expect(service.create({ productId: PID, url: URL })).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
  });

  it('rejects a missing variant (422 VARIANT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.getVariantProductId.mockResolvedValue(null);
    await expect(
      service.create({ productId: PID, url: URL, variantId: VID }),
    ).rejects.toMatchObject({
      response: { code: 'VARIANT_NOT_FOUND' },
    });
  });

  it('rejects a variant that belongs to another product (422 VARIANT_PRODUCT_MISMATCH)', async () => {
    const { service, repo } = makeService();
    repo.getVariantProductId.mockResolvedValue(OTHER_PID);
    await expect(
      service.create({ productId: PID, url: URL, variantId: VID }),
    ).rejects.toMatchObject({
      response: { code: 'VARIANT_PRODUCT_MISMATCH' },
    });
  });

  it('updates an image', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID, productId: PID });
    await service.update(ID, { altText: 'Front view' });
    expect(repo.update).toHaveBeenCalledWith(ID, { altText: 'Front view' });
  });

  it('validates variant/product on update (422 VARIANT_PRODUCT_MISMATCH)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID, productId: PID });
    repo.getVariantProductId.mockResolvedValue(OTHER_PID);
    await expect(service.update(ID, { variantId: VID })).rejects.toMatchObject({
      response: { code: 'VARIANT_PRODUCT_MISMATCH' },
    });
  });

  it('deletes an image', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID });
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('lists images by product (delegates to the ordered repository query)', async () => {
    const { service, repo } = makeService();
    const ordered = [{ id: '1', sortOrder: 0 }];
    repo.findByProduct.mockResolvedValue(ordered);
    await expect(service.listByProduct(PID)).resolves.toBe(ordered);
    expect(repo.findByProduct).toHaveBeenCalledWith(PID);
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('CreateImageDto', () => {
  it('rejects an invalid URL', async () => {
    const dto = plainToInstance(CreateImageDto, { productId: PID, url: 'not a url' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'url')).toBe(true);
  });

  it('rejects altText longer than 200 chars', async () => {
    const dto = plainToInstance(CreateImageDto, {
      productId: PID,
      url: URL,
      altText: 'a'.repeat(201),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'altText')).toBe(true);
  });

  it('accepts a valid image payload', async () => {
    const dto = plainToInstance(CreateImageDto, { productId: PID, url: URL, sortOrder: 0 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
