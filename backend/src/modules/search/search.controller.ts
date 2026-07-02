import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { SearchProductsDto } from './dto/search-products.dto';
import { SearchService } from './search.service';

/**
 * Public product search endpoint.
 */
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get('products')
  searchProducts(@Query() query: SearchProductsDto) {
    return this.search.search(query);
  }
}
