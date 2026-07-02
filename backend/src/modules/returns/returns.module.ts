import { Module } from '@nestjs/common';

import { ReturnsController } from './returns.controller';
import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

/**
 * Returns & refunds module. Depends only on the global PrismaModule; independent
 * of other feature modules.
 */
@Module({
  controllers: [ReturnsController],
  providers: [ReturnsService, ReturnsRepository],
  exports: [ReturnsService],
})
export class ReturnsModule {}
