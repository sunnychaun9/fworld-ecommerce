import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ListVariantsQueryDto } from './dto/list-variants-query.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantsService } from './variants.service';

/**
 * Variant endpoints.
 * - Reads are `@Public()` (storefront browsing).
 * - Writes require `ADMIN`/`SUPER_ADMIN` (enforced by the global AuthGuard).
 */
@Controller('variants')
export class VariantsController {
  constructor(private readonly variants: VariantsService) {}

  @Public()
  @Get()
  list(@Query() query: ListVariantsQueryDto) {
    return this.variants.list(query);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.variants.getById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateVariantDto) {
    return this.variants.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.variants.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variants.remove(id);
  }
}
