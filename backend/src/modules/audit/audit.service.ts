import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { AuditRepository } from './audit.repository';
import { ListAuditDto } from './dto/list-audit.dto';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
}

/**
 * Audit service. `record` is best-effort — it never throws, so auditing can never
 * break the audited operation. Listing is admin-facing. Every Prisma query is
 * delegated to {@link AuditRepository}.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly repository: AuditRepository) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      const data: Prisma.AuditLogUncheckedCreateInput = {
        id: newId(),
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
      };
      if (entry.metadata !== undefined && entry.metadata !== null) {
        data.metadata = entry.metadata as Prisma.InputJsonValue;
      }
      await this.repository.create(data);
    } catch (error) {
      this.logger.warn(`Failed to record audit log (${entry.action}): ${String(error)}`);
    }
  }

  async list(query: ListAuditDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.actorId) where.actorId = query.actorId;

    const { items, total } = await this.repository.list(where, (page - 1) * pageSize, pageSize);
    return { items, total, page, pageSize };
  }
}
