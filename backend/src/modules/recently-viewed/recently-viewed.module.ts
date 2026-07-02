import { Module } from '@nestjs/common';

import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedRepository } from './recently-viewed.repository';
import { RecentlyViewedService } from './recently-viewed.service';

/**
 * Recently-viewed products module (authenticated). Depends only on the global
 * PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService, RecentlyViewedRepository],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
