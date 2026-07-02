import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { MediaService } from './media.service';

/**
 * Image endpoints.
 * - Reads are `@Public()` (storefront media).
 * - Writes require `ADMIN`/`SUPER_ADMIN` (enforced by the global AuthGuard).
 */
@Controller('images')
export class ImagesController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.media.getById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() dto: CreateImageDto) {
    return this.media.create(dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) {
    return this.media.update(id, dto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}
