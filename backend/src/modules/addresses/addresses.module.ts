import { Module } from '@nestjs/common';

import { AddressesController } from './addresses.controller';
import { AddressesRepository } from './addresses.repository';
import { AddressesService } from './addresses.service';

/**
 * Customer addresses module (authenticated). Depends only on the global
 * PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [AddressesController],
  providers: [AddressesService, AddressesRepository],
  exports: [AddressesService],
})
export class AddressesModule {}
