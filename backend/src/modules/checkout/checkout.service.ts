import { Injectable, UnprocessableEntityException } from '@nestjs/common';

import { CheckoutRepository } from './checkout.repository';
import { CheckoutDto } from './dto/checkout.dto';

type CartForCheckout = NonNullable<Awaited<ReturnType<CheckoutRepository['findCartForCheckout']>>>;
type CheckoutItemRow = CartForCheckout['items'][number];

/**
 * Checkout preparation service — stateless. Validates the authenticated user's
 * cart and computes the order summary; it never processes payments, applies
 * coupons, or creates orders. Holds business logic only; the single Prisma query
 * is delegated to {@link CheckoutRepository}.
 */
@Injectable()
export class CheckoutService {
  constructor(private readonly repository: CheckoutRepository) {}

  async prepare(userId: string, _dto: CheckoutDto) {
    const cart = await this.repository.findCartForCheckout(userId);
    if (!cart || cart.items.length === 0) {
      throw this.unprocessable('EMPTY_CART', 'Cart is empty');
    }

    const items = cart.items.map((item) => this.validateAndMap(item));

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const shipping = 0;
    const tax = 0;
    const discount = 0;
    const grandTotal = subtotal + shipping + tax - discount;

    return { items, subtotal, shipping, tax, discount, grandTotal };
  }

  private validateAndMap(item: CheckoutItemRow) {
    const { variant } = item;
    const product = variant.product;

    if (product.status !== 'ACTIVE') {
      throw this.unprocessable('PRODUCT_NOT_ACTIVE', `Product "${product.name}" is not available`);
    }
    if (!variant.inventory) {
      throw this.unprocessable('INVENTORY_NOT_FOUND', `Variant "${variant.sku}" has no inventory`);
    }
    if (item.quantity > variant.inventory.availableStock) {
      throw this.unprocessable(
        'INSUFFICIENT_STOCK',
        `Requested quantity for "${variant.sku}" exceeds available stock`,
      );
    }

    const unitPrice = Number(variant.priceOverride ?? product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;

    return {
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      product: { id: product.id, name: product.name, slug: product.slug },
      variant: {
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex,
      },
      image: product.images[0] ?? null,
    };
  }

  private unprocessable(code: string, message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({ code, message });
  }
}
