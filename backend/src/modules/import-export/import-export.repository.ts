import { Injectable } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

export interface ImportVariantInput {
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceOverride: number | null;
  availableStock: number;
  lowStockAlert: number;
}

export interface ImportProductInput {
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  mrp: number;
  sellingPrice: number;
  status: string;
  variants: ImportVariantInput[];
}

/**
 * Import/export data-access layer. **All Prisma queries live here**; the service
 * holds mapping and validation logic only.
 */
@Injectable()
export class ImportExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  exportProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: { variants: { include: { inventory: true }, orderBy: { createdAt: 'asc' } } },
    });
  }

  async categoryExists(id: string): Promise<boolean> {
    return (await this.prisma.category.count({ where: { id } })) > 0;
  }

  async brandExists(id: string): Promise<boolean> {
    return (await this.prisma.brand.count({ where: { id } })) > 0;
  }

  async slugExists(slug: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { slug } })) > 0;
  }

  /** Create a product with its variants and inventory rows atomically. */
  createProductGraph(input: ImportProductInput) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          id: newId(),
          name: input.name,
          slug: input.slug,
          description: input.description,
          categoryId: input.categoryId,
          brandId: input.brandId,
          mrp: input.mrp,
          sellingPrice: input.sellingPrice,
          status: input.status,
        },
      });
      for (const variant of input.variants) {
        const created = await tx.productVariant.create({
          data: {
            id: newId(),
            productId: product.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            priceOverride: variant.priceOverride,
          },
        });
        await tx.inventory.create({
          data: {
            id: newId(),
            variantId: created.id,
            availableStock: variant.availableStock,
            lowStockAlert: variant.lowStockAlert,
          },
        });
      }
      return product;
    });
  }
}
