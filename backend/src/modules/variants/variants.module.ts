import { Module } from '@nestjs/common';

import { ProductVariantsController } from './product-variants.controller';
import { VariantsController } from './variants.controller';
import { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

/**
 * Product variant module (Product Catalog — Variant/SKU CRUD).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [VariantsController, ProductVariantsController],
  providers: [VariantsService, VariantsRepository],
  exports: [VariantsService],
})
export class VariantsModule {}
