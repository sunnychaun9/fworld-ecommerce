import { Body, Controller, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Checkout preparation endpoint. Authenticated only (global AuthGuard); returns a
 * computed order summary without creating an order or processing payment.
 */
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  prepare(@CurrentUser() user: Principal, @Body() dto: CheckoutDto) {
    return this.checkout.prepare(user.userId, dto);
  }
}
