import { Injectable } from '@nestjs/common';

import { newId } from '../../common/utils/id.util';
import { PrismaService } from '../../database/prisma.service';

const VARIANT_INCLUDE = {
  variant: {
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      product: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

/**
 * Admin inventory data-access layer. **All Prisma queries live here**; the
 * service holds business logic only.
 */
@Injectable()
export class AdminInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventory.findMany({
        orderBy: { availableStock: 'asc' },
        skip,
        take,
        include: VARIANT_INCLUDE,
      }),
      this.prisma.inventory.count(),
    ]);
    return { items, total };
  }

  findByVariantId(variantId: string) {
    return this.prisma.inventory.findUnique({ where: { variantId } });
  }

  lowStock() {
    return this.prisma.inventory.findMany({
      where: { availableStock: { lte: this.prisma.inventory.fields.lowStockAlert } },
      orderBy: { availableStock: 'asc' },
      include: VARIANT_INCLUDE,
    });
  }

  /** Apply the new available quantity and record the adjustment atomically. */
  applyAdjustment(params: {
    inventoryId: string;
    variantId: string;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    adjustedBy: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.update({
        where: { id: params.inventoryId },
        data: { availableStock: params.newQuantity },
      });
      const adjustment = await tx.stockAdjustment.create({
        data: {
          id: newId(),
          variantId: params.variantId,
          reason: params.reason,
          previousQuantity: params.previousQuantity,
          newQuantity: params.newQuantity,
          adjustedBy: params.adjustedBy,
        },
      });
      return { inventory, adjustment };
    });
  }
}
