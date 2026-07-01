import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

/**
 * Category taxonomy module (Milestone 3 — first catalog slice).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
