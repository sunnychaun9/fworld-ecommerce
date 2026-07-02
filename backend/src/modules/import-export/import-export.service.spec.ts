import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ImportExportRepository } from './import-export.repository';
import { ImportExportService } from './import-export.service';

interface RepoMock {
  exportProducts: ReturnType<typeof vi.fn>;
  categoryExists: ReturnType<typeof vi.fn>;
  brandExists: ReturnType<typeof vi.fn>;
  slugExists: ReturnType<typeof vi.fn>;
  createProductGraph: ReturnType<typeof vi.fn>;
}

const CID = '01920000-0000-7000-8000-0000000000c1';

function makeService(): { service: ImportExportService; repo: RepoMock } {
  const repo: RepoMock = {
    exportProducts: vi.fn().mockResolvedValue([]),
    categoryExists: vi.fn().mockResolvedValue(true),
    brandExists: vi.fn().mockResolvedValue(true),
    slugExists: vi.fn().mockResolvedValue(false),
    createProductGraph: vi.fn().mockResolvedValue({ id: 'p1' }),
  };
  return { service: new ImportExportService(repo as unknown as ImportExportRepository), repo };
}

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Shirt',
    slug: `shirt-${Math.round(Number.parseInt(CID.slice(-4), 16))}`,
    categoryId: CID,
    mrp: 1000,
    sellingPrice: 800,
    variants: [{ sku: 'SKU-1', size: 'M', availableStock: 5 }],
    ...overrides,
  };
}

describe('ImportExportService.buildTemplate', () => {
  it('describes product and variant fields with an example', () => {
    const { service } = makeService();
    const template = service.buildTemplate();
    expect(template.fields).toHaveProperty('name');
    expect(template.variantFields).toHaveProperty('sku');
    expect(template.example.products.length).toBeGreaterThan(0);
  });
});

describe('ImportExportService.exportProducts', () => {
  it('maps products, variants and inventory into flat rows', async () => {
    const { service, repo } = makeService();
    repo.exportProducts.mockResolvedValue([
      {
        id: 'p1',
        name: 'Shirt',
        slug: 'shirt',
        description: null,
        categoryId: CID,
        brandId: null,
        mrp: new Prisma.Decimal('1000.00'),
        sellingPrice: new Prisma.Decimal('800.00'),
        status: 'ACTIVE',
        featured: false,
        newArrival: false,
        bestSeller: false,
        variants: [
          {
            sku: 'SKU-1',
            size: 'M',
            color: null,
            colorHex: null,
            priceOverride: null,
            inventory: { availableStock: 5, reservedStock: 1, lowStockAlert: 2 },
          },
        ],
      },
    ]);
    const result = await service.exportProducts();
    expect(result.count).toBe(1);
    expect(result.products[0]?.mrp).toBe(1000);
    expect(result.products[0]?.variants[0]).toMatchObject({ availableStock: 5, reservedStock: 1 });
  });
});

describe('ImportExportService.importProducts', () => {
  it('imports a valid row', async () => {
    const { service, repo } = makeService();
    const result = await service.importProducts({ products: [validRow()] });
    expect(result).toMatchObject({ imported: 1, failed: 0 });
    expect(repo.createProductGraph).toHaveBeenCalled();
  });

  it('collects row errors and continues processing (missing name)', async () => {
    const { service } = makeService();
    const result = await service.importProducts({ products: [validRow(), validRow({ name: '' })] });
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.row).toBe(1);
  });

  it('rejects a row where sellingPrice exceeds mrp', async () => {
    const { service } = makeService();
    const result = await service.importProducts({
      products: [validRow({ mrp: 500, sellingPrice: 900 })],
    });
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.errors).toContain('sellingPrice cannot exceed mrp');
  });

  it('rejects a row with a non-existent category', async () => {
    const { service, repo } = makeService();
    repo.categoryExists.mockResolvedValue(false);
    const result = await service.importProducts({ products: [validRow()] });
    expect(result.errors[0]?.errors).toContain('categoryId does not exist');
  });

  it('rejects a duplicate slug', async () => {
    const { service, repo } = makeService();
    repo.slugExists.mockResolvedValue(true);
    const result = await service.importProducts({ products: [validRow()] });
    expect(result.errors[0]?.errors).toContain('slug already exists');
  });

  it('rejects a variant missing a SKU', async () => {
    const { service } = makeService();
    const result = await service.importProducts({
      products: [validRow({ variants: [{ size: 'M' }] })],
    });
    expect(result.failed).toBe(1);
    expect((result.errors[0]?.errors ?? []).some((e) => e.includes('sku is required'))).toBe(true);
  });

  it('maps a create-time unique violation to a row error', async () => {
    const { service, repo } = makeService();
    repo.createProductGraph.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const result = await service.importProducts({ products: [validRow()] });
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.errors[0]).toMatch(/already exists/);
  });
});
