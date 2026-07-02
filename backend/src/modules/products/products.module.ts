import { Module } from '@nestjs/common';

import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

/**
 * Product module (Product Catalog — Product CRUD).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
