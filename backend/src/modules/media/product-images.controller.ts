import { Controller, Get, Param } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { MediaService } from './media.service';

/**
 * Nested read endpoint: the ordered images of a product.
 * `GET /api/v1/products/:productId/images` (public). Does not modify the Product
 * module — it is a media-owned route under the products namespace.
 */
@Controller('products/:productId/images')
export class ProductImagesController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Get()
  listByProduct(@Param('productId') productId: string) {
    return this.media.listByProduct(productId);
  }
}
