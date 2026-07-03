'use client';

import { Eye, Heart, Star } from 'lucide-react';
import * as React from 'react';

import { MediaImage } from '@/components/common/media-image';
import { Price } from '@/components/common/price';
import { ProductBadge, type ProductBadgeKind } from '@/components/common/product-badge';
import type { ProductCard as ProductCardType } from '@/types/catalog';
import { cn } from '@/lib/utils';

const CARD_SIZES = '(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 75vw';

/** Choose the single most relevant merchandising badge for a card. */
function primaryBadge(product: ProductCardType): ProductBadgeKind | null {
  if (!product.inStock) return 'sold-out';
  if (product.discountPercentage > 0) return 'sale';
  if (product.newArrival) return 'new';
  if (product.bestSeller) return 'bestseller';
  return null;
}

interface ProductCardProps {
  product: ProductCardType;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * The single, reusable storefront product card. Presentational for this phase —
 * the wishlist and quick-view controls are UI-only affordances (no navigation to
 * the product page, which is built in a later phase).
 */
function ProductCard({
  product,
  priority,
  sizes = CARD_SIZES,
  className,
}: ProductCardProps): React.ReactElement {
  const [wished, setWished] = React.useState(false);

  const primary = product.images[0];
  const secondary = product.images[1];
  const badge = primaryBadge(product);
  const alt = primary?.altText ?? product.name;

  return (
    <article className={cn('group flex flex-col', className)}>
      <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-md">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <MediaImage src={primary?.url} alt={alt} sizes={sizes} priority={priority} />
        </div>
        {secondary ? (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
            <MediaImage src={secondary.url} alt={secondary.altText ?? product.name} sizes={sizes} />
          </div>
        ) : null}

        {badge ? (
          <div className="absolute left-3 top-3">
            <ProductBadge kind={badge} />
          </div>
        ) : null}

        <button
          type="button"
          aria-pressed={wished}
          aria-label={
            wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          onClick={() => setWished((v) => !v)}
          className="bg-background/80 text-foreground hover:bg-background focus-visible:ring-ring absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full opacity-0 outline-none backdrop-blur transition-opacity duration-200 focus-visible:opacity-100 focus-visible:ring-2 group-hover:opacity-100 max-sm:opacity-100"
        >
          <Heart className={cn('size-4', wished && 'fill-brand text-brand')} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
          <button
            type="button"
            aria-label={`Quick view ${product.name}`}
            className="bg-background/90 text-foreground hover:bg-background focus-visible:ring-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-medium outline-none backdrop-blur transition-colors focus-visible:ring-2"
          >
            <Eye className="size-4" />
            Quick view
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <RatingPlaceholder />
        {product.brand ? (
          <span className="text-muted-foreground text-xs uppercase tracking-wide">
            {product.brand.name}
          </span>
        ) : null}
        <h3 className="text-foreground line-clamp-1 text-sm font-medium">{product.name}</h3>
        <Price
          amount={product.sellingPrice}
          compareAt={product.mrp}
          showDiscount
          className="mt-0.5"
        />
      </div>
    </article>
  );
}

/** Decorative rating placeholder — real ratings arrive with reviews integration. */
function RatingPlaceholder(): React.ReactElement {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label="Ratings coming soon">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="text-muted-foreground/30 size-3" aria-hidden="true" />
      ))}
    </span>
  );
}

export { ProductCard };
