import { Module } from '@nestjs/common';

import { CheckoutController } from './checkout.controller';
import { CheckoutRepository } from './checkout.repository';
import { CheckoutService } from './checkout.service';

/**
 * Checkout module (authenticated, stateless preparation). Depends only on the
 * global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutRepository],
  exports: [CheckoutService],
})
export class CheckoutModule {}
