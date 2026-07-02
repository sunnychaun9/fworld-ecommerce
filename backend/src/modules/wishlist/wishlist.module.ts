import { Module } from '@nestjs/common';

import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { WishlistService } from './wishlist.service';

/**
 * Wishlist module (authenticated). Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService],
})
export class WishlistModule {}
