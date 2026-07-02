import { Module } from '@nestjs/common';

import { CouponsController } from './coupons.controller';
import { CouponsRepository } from './coupons.repository';
import { CouponsService } from './coupons.service';

/**
 * Coupons module (admin CRUD + public validation). Depends only on the global
 * PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [CouponsController],
  providers: [CouponsService, CouponsRepository],
  exports: [CouponsService],
})
export class CouponsModule {}
