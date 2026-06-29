import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Global database module exposing the Prisma client to the whole app.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
