import { Controller, Get, Param } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { InventoryService } from './inventory.service';

/**
 * Nested read endpoint: the inventory record for a given variant.
 * `GET /api/v1/variants/:variantId/inventory` (public). Does not modify the
 * Variant module — it is an inventory-owned route under the variants namespace.
 */
@Controller('variants/:variantId/inventory')
export class VariantInventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Public()
  @Get()
  getByVariant(@Param('variantId') variantId: string) {
    return this.inventory.getByVariant(variantId);
  }
}
