import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CacheService } from '../cache/cache.service';
import { JobsRepository } from './jobs.repository';

const DAY_MS = 24 * 60 * 60 * 1000;
const ABANDONED_CART_DAYS = 30;
const NOTIFICATION_RETENTION_DAYS = 30;
const PENDING_PAYMENT_HOURS = 24;

/**
 * Scheduled maintenance jobs (NestJS Schedule; no queue yet). Each job is guarded
 * by `JOBS_ENABLED` and delegates persistence to {@link JobsRepository}, so
 * BullMQ can wrap these later without changing the cleanup logic.
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly enabled: boolean;

  constructor(
    config: ConfigService,
    private readonly repository: JobsRepository,
    private readonly cache: CacheService,
  ) {
    this.enabled = config.get<{ enabled: boolean }>('jobs')?.enabled ?? true;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredCoupons(): Promise<number> {
    if (!this.enabled) return 0;
    const count = await this.repository.deleteExpiredCoupons(new Date());
    this.log('cleanupExpiredCoupons', count);
    return count;
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async cleanupExpiredNotifications(): Promise<number> {
    if (!this.enabled) return 0;
    const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * DAY_MS);
    const count = await this.repository.deleteExpiredNotifications(cutoff);
    this.log('cleanupExpiredNotifications', count);
    return count;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async recomputeRecommendationCaches(): Promise<void> {
    if (!this.enabled) return;
    // Recommendations derive from product data; clearing the product/home caches
    // forces them to be recomputed on the next request.
    await this.cache.invalidateProducts();
    this.logger.log('Job recomputeRecommendationCaches: recommendation caches cleared');
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupAbandonedCarts(): Promise<number> {
    if (!this.enabled) return 0;
    const cutoff = new Date(Date.now() - ABANDONED_CART_DAYS * DAY_MS);
    const count = await this.repository.deleteAbandonedCarts(cutoff);
    this.log('cleanupAbandonedCarts', count);
    return count;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredPendingPayments(): Promise<number> {
    if (!this.enabled) return 0;
    const cutoff = new Date(Date.now() - PENDING_PAYMENT_HOURS * 60 * 60 * 1000);
    const count = await this.repository.deleteExpiredPendingPayments(cutoff);
    this.log('deleteExpiredPendingPayments', count);
    return count;
  }

  private log(job: string, count: number): void {
    this.logger.log(`Job ${job}: removed ${count} record(s)`);
  }
}
