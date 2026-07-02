import { Module } from '@nestjs/common';

import { AdminInventoryController } from './admin-inventory.controller';
import { AdminInventoryRepository } from './admin-inventory.repository';
import { AdminInventoryService } from './admin-inventory.service';

/**
 * Admin inventory operations module. Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [AdminInventoryController],
  providers: [AdminInventoryService, AdminInventoryRepository],
  exports: [AdminInventoryService],
})
export class AdminInventoryModule {}
