import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';

/**
 * Background jobs module. Uses NestJS Schedule (no queue yet); {@link CacheService}
 * is injected from the global CacheModule.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [JobsService, JobsRepository],
  exports: [JobsService],
})
export class JobsModule {}
