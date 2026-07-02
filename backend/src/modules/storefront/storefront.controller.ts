import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { ListStoreProductsDto } from './dto/list-store-products.dto';
import { StorefrontService } from './storefront.service';

/**
 * Public storefront read APIs. All endpoints are `@Public()` and return only
 * ACTIVE catalog data with computed `inStock` / `discountPercentage`.
 */
@Public()
@Controller('store')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get('home')
  home() {
    return this.storefront.getHome();
  }

  @Get('products')
  listProducts(@Query() query: ListStoreProductsDto) {
    return this.storefront.listProducts(query);
  }

  @Get('products/:slug')
  productBySlug(@Param('slug') slug: string) {
    return this.storefront.getProductBySlug(slug);
  }

  @Get('collections/:slug')
  collectionBySlug(@Param('slug') slug: string) {
    return this.storefront.getCollectionBySlug(slug);
  }

  @Get('categories/:slug')
  categoryBySlug(@Param('slug') slug: string, @Query() query: ListStoreProductsDto) {
    return this.storefront.getCategoryBySlug(slug, query);
  }
}
