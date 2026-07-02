import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 * Checkout data-access layer. **All Prisma queries live here.** A single eager
 * query loads the user's cart with everything checkout needs (items, variants,
 * inventory, product, primary image) to avoid N+1.
 */
@Injectable()
export class CheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCartForCheckout(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            quantity: true,
            variant: {
              select: {
                id: true,
                sku: true,
                size: true,
                color: true,
                colorHex: true,
                priceOverride: true,
                inventory: { select: { availableStock: true } },
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    mrp: true,
                    sellingPrice: true,
                    images: {
                      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
