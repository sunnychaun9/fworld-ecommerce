import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Product image data-access layer. **All Prisma queries for images live here**;
 * the service holds business logic only.
 */
@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductImageUncheckedCreateInput) {
    return this.prisma.productImage.create({ data });
  }

  findById(id: string) {
    return this.prisma.productImage.findUnique({ where: { id } });
  }

  findByProduct(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async productExists(productId: string): Promise<boolean> {
    const found = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    return found !== null;
  }

  /** The owning product id of a variant, or null when the variant is missing. */
  async getVariantProductId(variantId: string): Promise<string | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    return variant?.productId ?? null;
  }

  update(id: string, data: Prisma.ProductImageUncheckedUpdateInput) {
    return this.prisma.productImage.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productImage.delete({ where: { id } });
  }
}
