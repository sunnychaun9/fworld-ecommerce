import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { AdminInventoryRepository } from './admin-inventory.repository';
import { ListInventoryDto } from './dto/list-inventory.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

/**
 * Admin inventory operations: listing, low-stock reporting, and audited stock
 * adjustments that can never drive available stock negative. Holds business logic
 * only; every Prisma query is delegated to {@link AdminInventoryRepository}.
 */
@Injectable()
export class AdminInventoryService {
  constructor(private readonly repository: AdminInventoryRepository) {}

  async list(query: ListInventoryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.repository.list((page - 1) * pageSize, pageSize);
    return { items, total, page, pageSize };
  }

  lowStock() {
    return this.repository.lowStock();
  }

  async adjust(dto: StockAdjustmentDto, adjustedBy: string) {
    const inventory = await this.repository.findByVariantId(dto.variantId);
    if (!inventory) {
      throw new NotFoundException({
        code: 'INVENTORY_NOT_FOUND',
        message: 'No inventory exists for this variant',
      });
    }

    const delta = dto.type === 'INCREASE' ? dto.quantity : -dto.quantity;
    const newQuantity = inventory.availableStock + delta;
    if (newQuantity < 0) {
      throw new UnprocessableEntityException({
        code: 'NEGATIVE_STOCK',
        message: 'Adjustment would drive available stock below zero',
      });
    }

    return this.repository.applyAdjustment({
      inventoryId: inventory.id,
      variantId: dto.variantId,
      previousQuantity: inventory.availableStock,
      newQuantity,
      reason: dto.reason,
      adjustedBy,
    });
  }
}
