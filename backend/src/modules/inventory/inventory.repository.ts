import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { StockStatus } from './dto/create-inventory.dto';
import { InventorySort } from './dto/list-inventory-query.dto';

/** Allow-listed filters for the inventory list. */
export interface InventoryListFilters {
  variantId?: string;
  stockStatus?: StockStatus;
}

/**
 * Inventory data-access layer. **All Prisma queries for inventory live here**;
 * the service holds business logic only.
 */
@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InventoryUncheckedCreateInput) {
    return this.prisma.inventory.create({ data });
  }

  findById(id: string) {
    return this.prisma.inventory.findUnique({ where: { id } });
  }

  findByVariant(variantId: string) {
    return this.prisma.inventory.findUnique({ where: { variantId } });
  }

  async variantExists(variantId: string): Promise<boolean> {
    const found = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    return found !== null;
  }

  async existsForVariant(variantId: string): Promise<boolean> {
    const found = await this.prisma.inventory.findUnique({
      where: { variantId },
      select: { id: true },
    });
    return found !== null;
  }

  update(id: string, data: Prisma.InventoryUncheckedUpdateInput) {
    return this.prisma.inventory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inventory.delete({ where: { id } });
  }

  listAndCount(filters: InventoryListFilters, sort: InventorySort, skip: number, take: number) {
    let where: Prisma.InventoryWhereInput = {};
    if (filters.variantId !== undefined) {
      where.variantId = filters.variantId;
    }
    if (filters.stockStatus !== undefined) {
      where = { ...where, ...this.stockStatusWhere(filters.stockStatus) };
    }

    const orderBy: Prisma.InventoryOrderByWithRelationInput[] =
      sort === 'availableStock'
        ? [{ availableStock: 'asc' }, { id: 'asc' }]
        : [{ createdAt: 'desc' }, { id: 'desc' }];

    return this.prisma.$transaction([
      this.prisma.inventory.findMany({ where, orderBy, skip, take }),
      this.prisma.inventory.count({ where }),
    ]);
  }

  /**
   * Translate a computed stock status into a `where` clause. LOW/IN compare
   * `availableStock` against the `lowStockAlert` column via a Prisma field ref.
   */
  private stockStatusWhere(status: StockStatus): Prisma.InventoryWhereInput {
    const lowStockAlertRef = this.prisma.inventory.fields.lowStockAlert;
    if (status === 'OUT_OF_STOCK') {
      return { availableStock: 0 };
    }
    if (status === 'LOW_STOCK') {
      return { availableStock: { gt: 0, lte: lowStockAlertRef } };
    }
    return { availableStock: { gt: lowStockAlertRef } };
  }
}
