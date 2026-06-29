import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';

/**
 * Root application module.
 *
 * Only foundational, cross-cutting modules are wired here. Feature modules
 * (products, cart, orders, …) are added under `src/modules` in later phases
 * per docs/003_TRD.md §6.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [configuration],
    }),
    PrismaModule,
  ],
})
export class AppModule {}
