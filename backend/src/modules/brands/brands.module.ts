import { Module } from '@nestjs/common';

import { BrandsController } from './brands.controller';
import { BrandsRepository } from './brands.repository';
import { BrandsService } from './brands.service';

/** Brand module (Product Catalog foundation — scaffold, no CRUD yet). */
@Module({
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepository],
  exports: [BrandsService],
})
export class BrandsModule {}
