import { Module } from '@nestjs/common';

import { StorefrontController } from './storefront.controller';
import { StorefrontRepository } from './storefront.repository';
import { StorefrontService } from './storefront.service';

/**
 * Storefront module (public catalog read APIs).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService, StorefrontRepository],
  exports: [StorefrontService],
})
export class StorefrontModule {}
