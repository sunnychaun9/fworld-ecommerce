import { Module } from '@nestjs/common';

import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';
import { VariantInventoryController } from './variant-inventory.controller';

/**
 * Inventory module (Product Catalog — Inventory CRUD + computed stock status).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [InventoryController, VariantInventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
