import { Module } from '@nestjs/common';

import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

/**
 * Shopping-cart module (authenticated). Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService],
})
export class CartModule {}
