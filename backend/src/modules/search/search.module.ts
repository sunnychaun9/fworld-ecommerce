import { Module } from '@nestjs/common';

import { PostgresSearchRepository } from './postgres-search.repository';
import { PRODUCT_SEARCH_PROVIDER } from './product-search.provider';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

/**
 * Product search module. Binds the PostgreSQL backend to the
 * {@link PRODUCT_SEARCH_PROVIDER} token — swap this binding to migrate to a
 * search engine without changing the controller or service.
 */
@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    PostgresSearchRepository,
    { provide: PRODUCT_SEARCH_PROVIDER, useExisting: PostgresSearchRepository },
  ],
  exports: [SearchService],
})
export class SearchModule {}
