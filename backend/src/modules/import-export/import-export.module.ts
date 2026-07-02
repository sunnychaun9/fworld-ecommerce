import { Module } from '@nestjs/common';

import { ImportExportController } from './import-export.controller';
import { ImportExportRepository } from './import-export.repository';
import { ImportExportService } from './import-export.service';

/**
 * Product import/export module. Depends only on the global PrismaModule;
 * independent of other feature modules.
 */
@Module({
  controllers: [ImportExportController],
  providers: [ImportExportService, ImportExportRepository],
  exports: [ImportExportService],
})
export class ImportExportModule {}
