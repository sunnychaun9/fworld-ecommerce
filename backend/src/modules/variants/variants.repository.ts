import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { VariantSort } from './dto/list-variants-query.dto';

/** Allow-listed filters for the variant list. */
export interface VariantListFilters {
  productId?: string;
  size?: string;
  color?: string;
}

/**
 * Variant data-access layer. **All Prisma queries for variants live here**; the
 * service holds business logic only.
 */
@Injectable()
export class VariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductVariantUncheckedCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  findById(id: string) {
    return this.prisma.productVariant.findUnique({ where: { id } });
  }

  async skuExists(sku: string): Promise<boolean> {
    const found = await this.prisma.productVariant.findUnique({
      where: { sku },
      select: { id: true },
    });
    return found !== null;
  }

  async barcodeExists(barcode: string): Promise<boolean> {
    const found = await this.prisma.productVariant.findUnique({
      where: { barcode },
      select: { id: true },
    });
    return found !== null;
  }

  /** An existing variant with the same (product, size, color) combination, if any. */
  findDuplicate(
    productId: string,
    size: string | null,
    color: string | null,
  ): Promise<{ id: string } | null> {
    return this.prisma.productVariant.findFirst({
      where: { productId, size, color },
      select: { id: true },
    });
  }

  async productExists(productId: string): Promise<boolean> {
    const found = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    return found !== null;
  }

  update(id: string, data: Prisma.ProductVariantUncheckedUpdateInput) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id } });
  }

  listAndCount(filters: VariantListFilters, sort: VariantSort, skip: number, take: number) {
    const where: Prisma.ProductVariantWhereInput = {};
    if (filters.productId !== undefined) {
      where.productId = filters.productId;
    }
    if (filters.size !== undefined) {
      where.size = filters.size;
    }
    if (filters.color !== undefined) {
      where.color = filters.color;
    }

    const orderBy: Prisma.ProductVariantOrderByWithRelationInput[] =
      sort === 'sku' ? [{ sku: 'asc' }] : [{ createdAt: 'desc' }, { id: 'desc' }];

    return this.prisma.$transaction([
      this.prisma.productVariant.findMany({ where, orderBy, skip, take }),
      this.prisma.productVariant.count({ where }),
    ]);
  }
}
