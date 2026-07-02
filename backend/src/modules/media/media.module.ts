import { Module } from '@nestjs/common';

import { ImagesController } from './images.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { ProductImagesController } from './product-images.controller';

/**
 * Product media module (Product Catalog — image URL CRUD).
 * Depends only on the global PrismaModule; independent of other feature modules.
 */
@Module({
  controllers: [ImagesController, ProductImagesController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService],
})
export class MediaModule {}
