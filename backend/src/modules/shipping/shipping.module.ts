import { Module } from '@nestjs/common';

import { OrderTrackingController } from './order-tracking.controller';
import { ShippingController } from './shipping.controller';
import { ShippingRepository } from './shipping.repository';
import { ShippingService } from './shipping.service';

/**
 * Shipping module: admin shipment management plus a customer tracking endpoint.
 * Depends only on the global PrismaModule.
 */
@Module({
  controllers: [ShippingController, OrderTrackingController],
  providers: [ShippingService, ShippingRepository],
  exports: [ShippingService],
})
export class ShippingModule {}
