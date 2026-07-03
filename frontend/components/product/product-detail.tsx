'use client';

import { Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Container } from '@/components/common/container';
import { Price } from '@/components/common/price';
import { ProductBadge } from '@/components/common/product-badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { ProductDetail as ProductDetailType } from '@/types/catalog';

import { AddToCartButton } from './add-to-cart-button';
import { Gallery } from './gallery';
import { RelatedProducts } from './related-products';
import { ReviewsSection } from './reviews-section';
import { StickyCta } from './sticky-cta';
import { VariantSelector } from './variant-selector';
import { WishlistToggle } from './wishlist-toggle';

function StockStatus({ stock }: { stock: number | null }): React.ReactElement | null {
  if (stock === null) return null;
  if (stock <= 0) {
    return <p className="text-destructive text-sm font-medium">Out of stock</p>;
  }
  if (stock <= 5) {
    return <p className="text-brand text-sm font-medium">Only {stock} left</p>;
  }
  return <p className="text-success text-sm font-medium">In stock</p>;
}

function ProductDetail({ product }: { product: ProductDetailType }): React.ReactElement {
  const { variants } = product;
  const hasSizes = variants.some((v) => v.size);
  const hasColors = variants.some((v) => v.color);

  const initial = React.useMemo(() => {
    const preferred = variants.find((v) => (v.inventory?.availableStock ?? 0) > 0) ?? variants[0];
    return { size: preferred?.size ?? null, color: preferred?.color ?? null };
  }, [variants]);

  const [size, setSize] = React.useState<string | null>(initial.size);
  const [color, setColor] = React.useState<string | null>(initial.color);
  const [quantity, setQuantity] = React.useState(1);

  const selectedVariant =
    variants.find((v) => (!hasSizes || v.size === size) && (!hasColors || v.color === color)) ??
    null;
  const stock = selectedVariant ? (selectedVariant.inventory?.availableStock ?? 0) : null;
  const maxQty = Math.max(1, stock ?? 1);

  React.useEffect(() => {
    setQuantity((q) => Math.min(q, maxQty));
  }, [maxQty]);

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.home}>Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`${ROUTES.search}?category=${product.category.slug}`}>
                  {product.category.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Gallery images={product.images} name={product.name} />

          <div>
            {product.brand ? (
              <Link
                href={`/brands/${product.brand.slug}`}
                className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-[0.15em]"
              >
                {product.brand.name}
              </Link>
            ) : null}
            <h1 className="font-display text-foreground mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <Price
                amount={product.sellingPrice}
                compareAt={product.mrp}
                showDiscount
                className="text-lg"
              />
              {product.newArrival ? <ProductBadge kind="new" /> : null}
            </div>

            {product.shortDescription ? (
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {product.shortDescription}
              </p>
            ) : null}

            <div className="mt-8">
              <VariantSelector
                variants={variants}
                size={size}
                color={color}
                onSizeChange={setSize}
                onColorChange={setColor}
              />
            </div>

            <div className="mt-6">
              <StockStatus stock={stock} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="border-input flex items-center rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxQty}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <AddToCartButton
                productSlug={product.slug}
                variant={selectedVariant}
                quantity={quantity}
                className="flex-1 sm:flex-none"
              />
              <WishlistToggle productId={product.id} productSlug={product.slug} />
            </div>

            {product.description ? (
              <div className="border-border mt-10 border-t pt-8">
                <h2 className="text-foreground text-sm font-medium uppercase tracking-wide">
                  Description
                </h2>
                <p
                  className={cn(
                    'text-muted-foreground mt-3 whitespace-pre-line text-sm leading-relaxed',
                  )}
                >
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-16">
          <ReviewsSection productId={product.id} />
        </div>
      </Container>

      <RelatedProducts categoryId={product.categoryId} excludeId={product.id} />

      {/* Spacer so the sticky mobile bar never overlaps page content. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <StickyCta
        name={product.name}
        sellingPrice={product.sellingPrice}
        mrp={product.mrp}
        productSlug={product.slug}
        variant={selectedVariant}
      />
    </>
  );
}

export { ProductDetail };
