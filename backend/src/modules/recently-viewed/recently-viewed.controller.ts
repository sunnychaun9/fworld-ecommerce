import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { RecentlyViewedService } from './recently-viewed.service';

/**
 * Recently-viewed endpoints. Authenticated only (global AuthGuard); scoped to the
 * current user.
 */
@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private readonly recentlyViewed: RecentlyViewedService) {}

  @Get()
  list(@CurrentUser() user: Principal) {
    return this.recentlyViewed.list(user.userId);
  }

  @Post(':productId')
  record(@CurrentUser() user: Principal, @Param('productId') productId: string) {
    return this.recentlyViewed.record(user.userId, productId);
  }

  @Delete()
  clear(@CurrentUser() user: Principal) {
    return this.recentlyViewed.clear(user.userId);
  }
}
