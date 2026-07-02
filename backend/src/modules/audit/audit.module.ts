import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

/**
 * Audit module. Global so {@link AuditService} is injectable anywhere, and it
 * registers a global {@link AuditInterceptor} that auto-logs whitelisted admin
 * routes without modifying those feature modules.
 */
@Global()
@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditRepository,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService],
})
export class AuditModule {}
