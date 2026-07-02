import { Module } from '@nestjs/common';

import { CollectionsController } from './collections.controller';
import { CollectionsRepository } from './collections.repository';
import { CollectionsService } from './collections.service';

/**
 * Collection module (Product Catalog — curated collections CRUD + membership).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsRepository],
  exports: [CollectionsService],
})
export class CollectionsModule {}
