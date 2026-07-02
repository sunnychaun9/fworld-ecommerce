import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ListStoreProductsDto } from './dto/list-store-products.dto';
import {
  StorefrontComputed,
  StorefrontProductCard,
  StorefrontProductDetails,
} from './dto/product-details.dto';
import {
  STORE_CARD_INCLUDE,
  STORE_DETAIL_INCLUDE,
  StoreProductFilters,
  StorefrontRepository,
} from './storefront.repository';

type CardRow = Prisma.ProductGetPayload<{ include: typeof STORE_CARD_INCLUDE }>;
type DetailRow = Prisma.ProductGetPayload<{ include: typeof STORE_DETAIL_INCLUDE }>;

const HOME_SECTION_LIMIT = 12;

/** Compute the discount percentage from list price and selling price. */
export function discountPercentage(
  mrp: Prisma.Decimal | number,
  sellingPrice: Prisma.Decimal | number,
): number {
  const list = Number(mrp);
  const selling = Number(sellingPrice);
  if (!(list > 0) || selling >= list) {
    return 0;
  }
  return Math.round(((list - selling) / list) * 100);
}

/** In stock when at least one variant has available stock. */
export function computeInStock(
  variants: { inventory: { availableStock: number } | null }[],
): boolean {
  return variants.some((variant) => (variant.inventory?.availableStock ?? 0) > 0);
}

/**
 * Storefront read service. Returns only ACTIVE catalog data with computed
 * `inStock` / `discountPercentage`. Holds business logic only; every Prisma query
 * is delegated to {@link StorefrontRepository}.
 */
@Injectable()
export class StorefrontService {
  constructor(private readonly repository: StorefrontRepository) {}

  async getHome() {
    const [featured, newArrivals, bestSellers, collections] = await Promise.all([
      this.repository.listFeatured(HOME_SECTION_LIMIT),
      this.repository.listNewArrivals(HOME_SECTION_LIMIT),
      this.repository.listBestSellers(HOME_SECTION_LIMIT),
      this.repository.listActiveCollections(HOME_SECTION_LIMIT),
    ]);
    return {
      featured: featured.map((product) => this.toCard(product)),
      newArrivals: newArrivals.map((product) => this.toCard(product)),
      bestSellers: bestSellers.map((product) => this.toCard(product)),
      collections,
    };
  }

  async listProducts(query: ListStoreProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.repository.listAndCount(
      this.toFilters(query),
      query.sort ?? 'newest',
      (page - 1) * limit,
      limit,
    );

    return {
      items: items.map((product) => this.toCard(product)),
      pageInfo: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async getProductBySlug(slug: string): Promise<StorefrontProductDetails> {
    const product = await this.repository.findActiveProductBySlug(slug);
    if (!product) {
      throw this.notFound('Product not found');
    }
    return this.toDetails(product);
  }

  async getCollectionBySlug(slug: string) {
    const collection = await this.repository.findCollectionBySlug(slug);
    if (!collection) {
      throw this.notFound('Collection not found');
    }
    const products = await this.repository.listCollectionActiveProducts(collection.id);
    return { collection, products: products.map((product) => this.toCard(product)) };
  }

  async getCategoryBySlug(slug: string, query: ListStoreProductsDto) {
    const category = await this.repository.findCategoryBySlug(slug);
    if (!category) {
      throw this.notFound('Category not found');
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.repository.listAndCount(
      { ...this.toFilters(query), categoryId: category.id },
      query.sort ?? 'newest',
      (page - 1) * limit,
      limit,
    );
    return {
      category,
      products: items.map((product) => this.toCard(product)),
      pageInfo: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  private toCard(product: CardRow): StorefrontProductCard {
    const { variants, ...rest } = product;
    return {
      ...rest,
      ...this.computed(product.mrp, product.sellingPrice, variants),
    };
  }

  private toDetails(product: DetailRow): StorefrontProductDetails {
    const { collections, ...rest } = product;
    return {
      ...rest,
      collections: collections.map((link) => link.collection),
      ...this.computed(product.mrp, product.sellingPrice, product.variants),
    };
  }

  private computed(
    mrp: Prisma.Decimal,
    sellingPrice: Prisma.Decimal,
    variants: { inventory: { availableStock: number } | null }[],
  ): StorefrontComputed {
    return {
      inStock: computeInStock(variants),
      discountPercentage: discountPercentage(mrp, sellingPrice),
    };
  }

  private toFilters(query: ListStoreProductsDto): StoreProductFilters {
    const filters: StoreProductFilters = {};
    if (query.categoryId) filters.categoryId = query.categoryId;
    if (query.brandId) filters.brandId = query.brandId;
    if (query.priceMin !== undefined) filters.priceMin = query.priceMin;
    if (query.priceMax !== undefined) filters.priceMax = query.priceMax;
    if (query.featured !== undefined) filters.featured = query.featured === 'true';
    if (query.newArrival !== undefined) filters.newArrival = query.newArrival === 'true';
    if (query.bestSeller !== undefined) filters.bestSeller = query.bestSeller === 'true';
    if (query.inStock !== undefined) filters.inStock = query.inStock === 'true';
    if (query.fit !== undefined) filters.fit = query.fit;
    if (query.fabric !== undefined) filters.fabric = query.fabric;
    if (query.sleeveLength !== undefined) filters.sleeveLength = query.sleeveLength;
    if (query.pattern !== undefined) filters.pattern = query.pattern;
    if (query.neckType !== undefined) filters.neckType = query.neckType;
    if (query.occasion !== undefined) filters.occasion = query.occasion;
    if (query.color !== undefined) filters.color = query.color;
    if (query.size !== undefined) filters.size = query.size;
    return filters;
  }

  private notFound(message: string): NotFoundException {
    return new NotFoundException({ code: 'NOT_FOUND', message });
  }
}
