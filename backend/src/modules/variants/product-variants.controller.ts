import { Controller, Get, Param } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { VariantsService } from './variants.service';

/**
 * Nested read endpoint: list the variants of a given product.
 * `GET /api/v1/products/:productId/variants` (public). Does not modify the
 * Product module — it is a variant-owned route under the products namespace.
 */
@Controller('products/:productId/variants')
export class ProductVariantsController {
  constructor(private readonly variants: VariantsService) {}

  @Public()
  @Get()
  listByProduct(@Param('productId') productId: string) {
    return this.variants.listByProduct(productId);
  }
}
