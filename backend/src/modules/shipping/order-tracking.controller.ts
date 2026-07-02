import { Controller, Get, Param } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { ShippingService } from './shipping.service';

/**
 * Customer order-tracking endpoint. Authenticated; scoped to the order owner.
 */
@Controller('orders')
export class OrderTrackingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get(':id/tracking')
  tracking(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.shipping.tracking(user.userId, id);
  }
}
