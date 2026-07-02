import { ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CreateVariantDto } from './dto/create-variant.dto';
import type { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  skuExists: ReturnType<typeof vi.fn>;
  barcodeExists: ReturnType<typeof vi.fn>;
  findDuplicate: ReturnType<typeof vi.fn>;
  productExists: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
}

function makeService(): { service: VariantsService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
    findById: vi.fn(),
    skuExists: vi.fn().mockResolvedValue(false),
    barcodeExists: vi.fn().mockResolvedValue(false),
    findDuplicate: vi.fn().mockResolvedValue(null),
    productExists: vi.fn().mockResolvedValue(true),
    update: vi.fn().mockResolvedValue({ id: 'x' }),
    delete: vi.fn(),
    listAndCount: vi.fn().mockResolvedValue([[], 0]),
  };
  return { service: new VariantsService(repo as unknown as VariantsRepository), repo };
}

const PID = '01920000-0000-7000-8000-0000000000d1';
const ID = '01920000-0000-7000-8000-0000000000e1';

function baseCreate(overrides: Record<string, unknown> = {}) {
  return { productId: PID, sku: 'TSHIRT-BLK-M', size: 'M', color: 'Black', ...overrides };
}

describe('VariantsService', () => {
  it('creates a variant with a generated UUID v7 id', async () => {
    const { service, repo } = makeService();
    await service.create(baseCreate());
    const arg = repo.create.mock.calls[0]?.[0] as { id: string; sku: string };
    expect(arg.sku).toBe('TSHIRT-BLK-M');
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
  });

  it('rejects a variant for a missing product (422 PRODUCT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.productExists.mockResolvedValue(false);
    await expect(service.create(baseCreate())).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
  });

  it('rejects a duplicate SKU (409 SKU_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.skuExists.mockResolvedValue(true);
    await expect(service.create(baseCreate())).rejects.toMatchObject({
      response: { code: 'SKU_TAKEN' },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate barcode (409 BARCODE_TAKEN)', async () => {
    const { service, repo } = makeService();
    repo.barcodeExists.mockResolvedValue(true);
    await expect(service.create(baseCreate({ barcode: '8901234567890' }))).rejects.toMatchObject({
      response: { code: 'BARCODE_TAKEN' },
    });
  });

  it('rejects a duplicate size/color for the same product (409 VARIANT_EXISTS)', async () => {
    const { service, repo } = makeService();
    repo.findDuplicate.mockResolvedValue({ id: 'other' });
    await expect(service.create(baseCreate())).rejects.toMatchObject({
      response: { code: 'VARIANT_EXISTS' },
    });
  });

  it('updates a variant', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID, productId: PID, sku: 'A', barcode: null });
    await service.update(ID, { colorHex: '#000000' });
    expect(repo.update).toHaveBeenCalledWith(ID, { colorHex: '#000000' });
  });

  it('rejects an update that duplicates another variant’s size/color (409)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID, productId: PID, size: 'M', color: 'Black' });
    repo.findDuplicate.mockResolvedValue({ id: 'other' });
    await expect(service.update(ID, { color: 'White' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes a variant', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue({ id: ID });
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('lists variants by product', async () => {
    const { service, repo } = makeService();
    await service.listByProduct(PID);
    expect(repo.listAndCount.mock.calls[0]?.[0]).toEqual({ productId: PID });
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('CreateVariantDto', () => {
  it('rejects a non-positive priceOverride', async () => {
    const dto = plainToInstance(CreateVariantDto, { productId: PID, sku: 'X', priceOverride: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'priceOverride')).toBe(true);
  });

  it('accepts a positive priceOverride', async () => {
    const dto = plainToInstance(CreateVariantDto, { productId: PID, sku: 'X', priceOverride: 999 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
