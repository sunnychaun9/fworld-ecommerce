import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Principal } from '../../auth/principal';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentVerificationService } from './payment-verification.service';
import { PaymentsService } from './payments.service';

/**
 * Payment endpoints. Authenticated only (global AuthGuard); every operation is
 * scoped to the current user's orders.
 */
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly verification: PaymentVerificationService,
  ) {}

  @Post('create-order')
  createOrder(@CurrentUser() user: Principal, @Body() dto: CreatePaymentDto) {
    return this.payments.createPaymentOrder(user.userId, dto);
  }

  @Post('verify')
  verify(@CurrentUser() user: Principal, @Body() dto: VerifyPaymentDto) {
    return this.verification.verify(user.userId, dto);
  }

  @Get(':id')
  getById(@CurrentUser() user: Principal, @Param('id') id: string) {
    return this.payments.getById(user.userId, id);
  }
}
