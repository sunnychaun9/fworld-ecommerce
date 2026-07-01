import { Module } from '@nestjs/common';

import { VariantsController } from './variants.controller';
import { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

/** Product variant module (Product Catalog foundation — scaffold, no CRUD yet). */
@Module({
  controllers: [VariantsController],
  providers: [VariantsService, VariantsRepository],
  exports: [VariantsService],
})
export class VariantsModule {}
