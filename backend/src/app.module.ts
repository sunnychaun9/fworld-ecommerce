import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MediaModule } from './modules/media/media.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ProductsModule } from './modules/products/products.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { VariantsModule } from './modules/variants/variants.module';

/**
 * Root application module.
 *
 * Sprint 1 wires only **shared infrastructure**: validated configuration, global
 * response envelope, exception handling, request logging, rate limiting, the
 * database client, and health checks. Business feature modules (auth, catalog,
 * cart, orders, …) are registered in their respective feature sprints.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
      load: [configuration],
    }),
    // Global rate limiting (TRD §14 / 005_API.md: 100 req/min default).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    VariantsModule,
    InventoryModule,
    MediaModule,
    CollectionsModule,
    StorefrontModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    AddressesModule,
    WishlistModule,
    CouponsModule,
    ReviewsModule,
    RecentlyViewedModule,
    RecommendationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
