import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ImportExportService } from './import-export.service';

/**
 * Product import/export endpoints (ADMIN/SUPER_ADMIN). JSON today; the service is
 * format-agnostic so CSV/Excel adapters can be added without changing routes.
 */
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('import-export/products')
export class ImportExportController {
  constructor(private readonly importExport: ImportExportService) {}

  @Get('template')
  template() {
    return this.importExport.buildTemplate();
  }

  @Get('export')
  export() {
    return this.importExport.exportProducts();
  }

  // Raw body (unknown) so the global ValidationPipe does not transform the
  // untyped rows; the service validates the envelope and each row.
  @Post('import')
  @HttpCode(HttpStatus.OK)
  import(@Body() body: unknown) {
    return this.importExport.importProducts(body);
  }
}
