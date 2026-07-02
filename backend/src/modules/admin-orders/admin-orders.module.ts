import { Module } from '@nestjs/common';

import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersService } from './admin-orders.service';

/**
 * Admin order management module. Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService, AdminOrdersRepository],
  exports: [AdminOrdersService],
})
export class AdminOrdersModule {}
