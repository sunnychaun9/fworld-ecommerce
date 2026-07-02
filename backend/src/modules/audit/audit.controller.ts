import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { ListAuditDto } from './dto/list-audit.dto';

/**
 * Admin audit-log endpoint (ADMIN/SUPER_ADMIN).
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: ListAuditDto) {
    return this.audit.list(query);
  }
}
