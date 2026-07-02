import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { newId } from '../../common/utils/id.util';
import { CouponsRepository } from './coupons.repository';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  finalAmount: number;
  message: string;
}

/**
 * Coupon service: admin CRUD plus a public validation endpoint returning the
 * computed discount for an order amount (no order/redemption yet). Holds business
 * logic only; every Prisma query is delegated to {@link CouponsRepository}.
 */
@Injectable()
export class CouponsService {
  constructor(private readonly repository: CouponsRepository) {}

  async create(dto: CreateCouponDto) {
    try {
      return await this.repository.create({
        id: newId(),
        code: this.normalizeCode(dto.code),
        description: dto.description ?? null,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        perUserLimit: dto.perUserLimit ?? null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        active: dto.active ?? true,
      });
    } catch (error) {
      throw this.mapCodeConflict(error, dto.code);
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.getById(id);
    try {
      return await this.repository.update(id, {
        ...(dto.code !== undefined ? { code: this.normalizeCode(dto.code) } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.discountType !== undefined ? { discountType: dto.discountType } : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
        ...(dto.minOrderAmount !== undefined ? { minOrderAmount: dto.minOrderAmount } : {}),
        ...(dto.maxDiscount !== undefined ? { maxDiscount: dto.maxDiscount } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.perUserLimit !== undefined ? { perUserLimit: dto.perUserLimit } : {}),
        ...(dto.validFrom !== undefined ? { validFrom: new Date(dto.validFrom) } : {}),
        ...(dto.validTo !== undefined ? { validTo: new Date(dto.validTo) } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      });
    } catch (error) {
      throw this.mapCodeConflict(error, dto.code ?? '');
    }
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
    return { id };
  }

  listMine() {
    return this.repository.listActiveValid(new Date());
  }

  async validate(dto: ValidateCouponDto, userId?: string): Promise<CouponValidationResult> {
    const invalid = (message: string): CouponValidationResult => ({
      valid: false,
      discount: 0,
      finalAmount: dto.orderAmount,
      message,
    });

    const coupon = await this.repository.findByCode(this.normalizeCode(dto.code));
    if (!coupon) {
      return invalid('Invalid coupon code');
    }
    if (!coupon.active) {
      return invalid('Coupon is not active');
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return invalid('Coupon is not yet valid');
    }
    if (coupon.validTo && now > coupon.validTo) {
      return invalid('Coupon has expired');
    }
    const minOrderAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (dto.orderAmount < minOrderAmount) {
      return invalid(`Minimum order amount is ${minOrderAmount}`);
    }
    if (
      coupon.usageLimit !== null &&
      (await this.repository.countUsages(coupon.id)) >= coupon.usageLimit
    ) {
      return invalid('Coupon usage limit reached');
    }
    if (
      coupon.perUserLimit !== null &&
      userId &&
      (await this.repository.countUserUsages(coupon.id, userId)) >= coupon.perUserLimit
    ) {
      return invalid('Coupon usage limit reached for this account');
    }

    const discount = this.computeDiscount(
      coupon.discountType,
      Number(coupon.discountValue),
      dto.orderAmount,
      coupon.maxDiscount !== null ? Number(coupon.maxDiscount) : null,
    );
    return {
      valid: true,
      discount,
      finalAmount: this.round(dto.orderAmount - discount),
      message: 'Coupon applied',
    };
  }

  private computeDiscount(
    type: 'PERCENTAGE' | 'FLAT',
    value: number,
    orderAmount: number,
    maxDiscount: number | null,
  ): number {
    let discount = type === 'PERCENTAGE' ? (orderAmount * value) / 100 : value;
    if (maxDiscount !== null) {
      discount = Math.min(discount, maxDiscount);
    }
    discount = Math.min(discount, orderAmount);
    return this.round(discount);
  }

  private async getById(id: string) {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Coupon not found' });
    }
    return coupon;
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private mapCodeConflict(error: unknown, code: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException({
        code: 'COUPON_CODE_TAKEN',
        message: `Coupon code "${code}" is already in use`,
      });
    }
    return error;
  }
}
