import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ImportProductRow, MAX_IMPORT_ROWS, UUID_PATTERN } from './dto/import-products.dto';
import {
  ImportExportRepository,
  ImportProductInput,
  ImportVariantInput,
} from './import-export.repository';

export interface RowError {
  row: number;
  errors: string[];
}

interface ParsedRow {
  errors: string[];
  value: ImportProductInput | null;
}

/**
 * Product import/export service. Export/import are JSON today but the service is
 * format-agnostic (row objects in, row objects out) so CSV/Excel adapters can be
 * layered on without changing the API. Import validates every row, collects
 * per-row errors, and processes each product independently (no whole-file
 * transaction). Prisma queries live in the repository.
 */
@Injectable()
export class ImportExportService {
  constructor(private readonly repository: ImportExportRepository) {}

  buildTemplate() {
    return {
      format: 'json',
      note: 'POST this shape to /import-export/products/import as { "products": [ ... ] }.',
      fields: {
        name: 'string (required)',
        slug: 'string (required, unique)',
        categoryId: 'uuid (required, must exist)',
        brandId: 'uuid (optional, must exist)',
        mrp: 'number (required)',
        sellingPrice: 'number (required, must be <= mrp)',
        status: 'ACTIVE | DRAFT | ARCHIVED (optional, default DRAFT)',
        description: 'string (optional)',
        variants: 'array (optional)',
      },
      variantFields: {
        sku: 'string (required, unique)',
        size: 'string (optional)',
        color: 'string (optional)',
        colorHex: 'string (optional)',
        priceOverride: 'number (optional)',
        availableStock: 'integer >= 0 (optional, default 0)',
        lowStockAlert: 'integer >= 0 (optional, default 0)',
      },
      example: {
        products: [
          {
            name: 'Classic Oxford Shirt',
            slug: 'classic-oxford-shirt',
            categoryId: '00000000-0000-7000-8000-000000000000',
            mrp: 2999,
            sellingPrice: 1999,
            status: 'ACTIVE',
            variants: [{ sku: 'OX-BLU-M', size: 'M', color: 'Blue', availableStock: 25 }],
          },
        ],
      },
    };
  }

  async exportProducts() {
    const products = await this.repository.exportProducts();
    return {
      count: products.length,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        brandId: product.brandId,
        mrp: Number(product.mrp),
        sellingPrice: Number(product.sellingPrice),
        status: product.status,
        featured: product.featured,
        newArrival: product.newArrival,
        bestSeller: product.bestSeller,
        variants: product.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          priceOverride: variant.priceOverride !== null ? Number(variant.priceOverride) : null,
          availableStock: variant.inventory?.availableStock ?? 0,
          reservedStock: variant.inventory?.reservedStock ?? 0,
          lowStockAlert: variant.inventory?.lowStockAlert ?? 0,
        })),
      })),
    };
  }

  async importProducts(payload: unknown) {
    const rows = this.extractRows(payload);
    let imported = 0;
    let failed = 0;
    const errors: RowError[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const parsed = await this.parseRow(rows[index]);
      if (!parsed.value) {
        failed += 1;
        errors.push({ row: index, errors: parsed.errors });
        continue;
      }
      try {
        await this.repository.createProductGraph(parsed.value);
        imported += 1;
      } catch (error) {
        failed += 1;
        errors.push({ row: index, errors: [this.mapCreateError(error)] });
      }
    }

    return { imported, failed, errors };
  }

  private extractRows(payload: unknown): unknown[] {
    const products =
      typeof payload === 'object' && payload !== null
        ? (payload as { products?: unknown }).products
        : undefined;
    if (!Array.isArray(products)) {
      throw new BadRequestException({
        code: 'INVALID_IMPORT_PAYLOAD',
        message: 'Request body must be { "products": [ ... ] }',
      });
    }
    if (products.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException({
        code: 'TOO_MANY_ROWS',
        message: `A maximum of ${MAX_IMPORT_ROWS} products can be imported per request`,
      });
    }
    return products;
  }

  private async parseRow(raw: unknown): Promise<ParsedRow> {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return { errors: ['Row must be an object'], value: null };
    }

    const instance = plainToInstance(ImportProductRow, raw);
    const errors: string[] = [];
    for (const failure of await validate(instance, { whitelist: false })) {
      errors.push(...Object.values(failure.constraints ?? {}));
    }

    if (
      typeof instance.mrp === 'number' &&
      typeof instance.sellingPrice === 'number' &&
      instance.sellingPrice > instance.mrp
    ) {
      errors.push('sellingPrice cannot exceed mrp');
    }
    if (
      typeof instance.categoryId === 'string' &&
      UUID_PATTERN.test(instance.categoryId) &&
      !(await this.repository.categoryExists(instance.categoryId))
    ) {
      errors.push('categoryId does not exist');
    }
    if (
      typeof instance.brandId === 'string' &&
      UUID_PATTERN.test(instance.brandId) &&
      !(await this.repository.brandExists(instance.brandId))
    ) {
      errors.push('brandId does not exist');
    }
    if (typeof instance.slug === 'string' && (await this.repository.slugExists(instance.slug))) {
      errors.push('slug already exists');
    }

    const variants = this.parseVariants(instance.variants, errors);
    if (errors.length > 0) {
      return { errors, value: null };
    }

    return {
      errors: [],
      value: {
        name: instance.name,
        slug: instance.slug,
        description: instance.description ?? null,
        categoryId: instance.categoryId,
        brandId: instance.brandId ?? null,
        mrp: instance.mrp,
        sellingPrice: instance.sellingPrice,
        status: instance.status ?? 'DRAFT',
        variants,
      },
    };
  }

  private parseVariants(raw: unknown, errors: string[]): ImportVariantInput[] {
    if (raw === undefined) {
      return [];
    }
    if (!Array.isArray(raw)) {
      errors.push('variants must be an array');
      return [];
    }

    const variants: ImportVariantInput[] = [];
    raw.forEach((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        errors.push(`variants[${index}] must be an object`);
        return;
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.sku !== 'string' || record.sku.length === 0) {
        errors.push(`variants[${index}].sku is required`);
        return;
      }
      if (!this.isNonNegativeIntOrUndefined(record.availableStock)) {
        errors.push(`variants[${index}].availableStock must be a non-negative integer`);
        return;
      }
      if (!this.isNonNegativeIntOrUndefined(record.lowStockAlert)) {
        errors.push(`variants[${index}].lowStockAlert must be a non-negative integer`);
        return;
      }
      variants.push({
        sku: record.sku,
        size: typeof record.size === 'string' ? record.size : null,
        color: typeof record.color === 'string' ? record.color : null,
        colorHex: typeof record.colorHex === 'string' ? record.colorHex : null,
        priceOverride: typeof record.priceOverride === 'number' ? record.priceOverride : null,
        availableStock: typeof record.availableStock === 'number' ? record.availableStock : 0,
        lowStockAlert: typeof record.lowStockAlert === 'number' ? record.lowStockAlert : 0,
      });
    });
    return variants;
  }

  private isNonNegativeIntOrUndefined(value: unknown): boolean {
    return value === undefined || (Number.isInteger(value) && (value as number) >= 0);
  }

  private mapCreateError(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'A product slug or variant SKU in this row already exists';
    }
    return 'Failed to create product';
  }
}
