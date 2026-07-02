import { Controller, Get } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

/**
 * Admin dashboard endpoint. Restricted to ADMIN/SUPER_ADMIN.
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary() {
    return this.dashboard.summary();
  }
}
