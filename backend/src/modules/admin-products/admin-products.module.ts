import { Module } from '@nestjs/common';

import { AdminProductsController } from './admin-products.controller';
import { AdminProductsRepository } from './admin-products.repository';
import { AdminProductsService } from './admin-products.service';

/**
 * Bulk product operations module. Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [AdminProductsController],
  providers: [AdminProductsService, AdminProductsRepository],
  exports: [AdminProductsService],
})
export class AdminProductsModule {}
