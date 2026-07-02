import { Module } from '@nestjs/common';

import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

/**
 * Product reviews module. Depends only on the global PrismaModule; independent of
 * other feature modules.
 */
@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService],
})
export class ReviewsModule {}
