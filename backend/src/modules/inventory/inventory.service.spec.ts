import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CreateInventoryDto } from './dto/create-inventory.dto';
import type { InventoryRepository } from './inventory.repository';
import { computeStockStatus, InventoryService } from './inventory.service';

interface RepoMock {
  create: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByVariant: ReturnType<typeof vi.fn>;
  variantExists: ReturnType<typeof vi.fn>;
  existsForVariant: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  listAndCount: ReturnType<typeof vi.fn>;
}

function inventory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv',
    variantId: VID,
    availableStock: 10,
    reservedStock: 0,
    lowStockAlert: 3,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

function makeService(): { service: InventoryService; repo: RepoMock } {
  const repo: RepoMock = {
    create: vi.fn().mockResolvedValue(inventory()),
    findById: vi.fn(),
    findByVariant: vi.fn(),
    variantExists: vi.fn().mockResolvedValue(true),
    existsForVariant: vi.fn().mockResolvedValue(false),
    update: vi.fn().mockResolvedValue(inventory()),
    delete: vi.fn(),
    listAndCount: vi.fn().mockResolvedValue([[], 0]),
  };
  return { service: new InventoryService(repo as unknown as InventoryRepository), repo };
}

const VID = '01920000-0000-7000-8000-0000000000f1';
const ID = '01920000-0000-7000-8000-0000000000f2';

describe('computeStockStatus', () => {
  it('returns OUT_OF_STOCK when availableStock is 0', () => {
    expect(computeStockStatus(0, 5)).toBe('OUT_OF_STOCK');
    expect(computeStockStatus(0, 0)).toBe('OUT_OF_STOCK');
  });
  it('returns LOW_STOCK when availableStock <= lowStockAlert', () => {
    expect(computeStockStatus(3, 5)).toBe('LOW_STOCK');
    expect(computeStockStatus(5, 5)).toBe('LOW_STOCK');
  });
  it('returns IN_STOCK otherwise', () => {
    expect(computeStockStatus(10, 5)).toBe('IN_STOCK');
    expect(computeStockStatus(1, 0)).toBe('IN_STOCK');
  });
});

describe('InventoryService', () => {
  it('creates inventory with a UUID v7 id and returns computed status', async () => {
    const { service, repo } = makeService();
    repo.create.mockResolvedValue(inventory({ availableStock: 3, lowStockAlert: 5 }));
    const result = await service.create({ variantId: VID, availableStock: 3, lowStockAlert: 5 });
    const arg = repo.create.mock.calls[0]?.[0] as { id: string };
    expect(arg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/i);
    expect(result.stockStatus).toBe('LOW_STOCK');
  });

  it('rejects inventory for a missing variant (422 VARIANT_NOT_FOUND)', async () => {
    const { service, repo } = makeService();
    repo.variantExists.mockResolvedValue(false);
    await expect(service.create({ variantId: VID })).rejects.toMatchObject({
      response: { code: 'VARIANT_NOT_FOUND' },
    });
  });

  it('rejects a duplicate inventory for a variant (409 INVENTORY_EXISTS)', async () => {
    const { service, repo } = makeService();
    repo.existsForVariant.mockResolvedValue(true);
    await expect(service.create({ variantId: VID })).rejects.toMatchObject({
      response: { code: 'INVENTORY_EXISTS' },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects reservedStock greater than availableStock (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create({ variantId: VID, availableStock: 5, reservedStock: 10 }),
    ).rejects.toMatchObject({ response: { code: 'RESERVED_EXCEEDS_AVAILABLE' } });
  });

  it('updates inventory and returns computed status', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(inventory({ availableStock: 10, lowStockAlert: 3 }));
    repo.update.mockResolvedValue(inventory({ availableStock: 0, lowStockAlert: 3 }));
    const result = await service.update(ID, { availableStock: 0 });
    expect(repo.update).toHaveBeenCalledWith(ID, { availableStock: 0 });
    expect(result.stockStatus).toBe('OUT_OF_STOCK');
  });

  it('rejects an update where reservedStock exceeds availableStock (422)', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(inventory({ availableStock: 10, reservedStock: 0 }));
    await expect(service.update(ID, { reservedStock: 50 })).rejects.toMatchObject({
      response: { code: 'RESERVED_EXCEEDS_AVAILABLE' },
    });
  });

  it('deletes inventory', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(inventory());
    await expect(service.remove(ID)).resolves.toEqual({ id: ID });
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });

  it('lists inventory filtered by variant', async () => {
    const { service, repo } = makeService();
    await service.list({ variantId: VID });
    expect(repo.listAndCount.mock.calls[0]?.[0]).toEqual({ variantId: VID });
  });

  it('returns 404 for a non-UUID id without hitting the database', async () => {
    const { service, repo } = makeService();
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('CreateInventoryDto', () => {
  it('rejects negative stock', async () => {
    const dto = plainToInstance(CreateInventoryDto, { variantId: VID, availableStock: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'availableStock')).toBe(true);
  });

  it('accepts non-negative stock', async () => {
    const dto = plainToInstance(CreateInventoryDto, {
      variantId: VID,
      availableStock: 0,
      reservedStock: 0,
      lowStockAlert: 0,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
