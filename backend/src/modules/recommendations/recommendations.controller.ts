import { Controller, Get, Param } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { Principal } from '../../auth/principal';
import { RecommendationsService } from './recommendations.service';

/**
 * Recommendation endpoints. Product-page and home are public; for-you requires an
 * authenticated session (global AuthGuard).
 */
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Public()
  @Get('product/:productId')
  forProduct(@Param('productId') productId: string) {
    return this.recommendations.forProduct(productId);
  }

  @Public()
  @Get('home')
  home() {
    return this.recommendations.home();
  }

  @Get('for-you')
  forYou(@CurrentUser() user: Principal) {
    return this.recommendations.forYou(user.userId);
  }
}
